import appDataSource from "../../config/dbConfig.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import { MembershipRequestEntity } from "../requests/membership_requests.entity.mjs";
import { ClubEntity } from "../clubs/clubs.entity.mjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UnauthenticatedError, ForbiddenError, ConflictError, ValidationError, NotFoundError } from "../shared/errors.mjs";
import { sendVerificationEmail, sendPasswordResetEmail } from "../shared/mailer.mjs";
import envVars from "../../config/envConfig.mjs";

const userRepo = () => appDataSource.getRepository(UserEntity)
const clubRepo = () => appDataSource.getRepository(ClubEntity)
const matricPattern = /^[A-Z]\d{2}[A-Z]{2}\d{4}$/i

export const signup = async (name, email, password, matricNumber, role, clubId) => {
    if (role === "admin" || role === "lead") {
        throw new ForbiddenError("Registering as Admin or Lead is not allowed")
    }

    if (!matricPattern.test(matricNumber)) {
        throw new ValidationError("Invalid matric number format")
    }

    if (role === "member" && !clubId) {
        throw new ValidationError("clubId is required when registering as a member")
    }

    const existingEmail = await userRepo().findOne({ where: { email }})
    if(existingEmail) throw new ConflictError("Email already registered")

    const existingMatric = await userRepo().findOne({ where: { staffOrMatricId: matricNumber }})
    if(existingMatric) throw new ConflictError("Matric Number already registered")

    if (role === "member") {
        const club = await clubRepo().findOne({ where: { id: clubId } })
        if (!club) throw new NotFoundError("Club not found")
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const rawToken = crypto.randomBytes(32).toString('hex')
    const emailVerifyToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    if (role === "member") {
        const queryRunner = appDataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()
        try {
            const user = queryRunner.manager.create(UserEntity, {
                fullName: name, email, passwordHash, staffOrMatricId: matricNumber,
                role: "student", emailVerifyToken, emailVerifyExpiry,
            })
            const savedUser = await queryRunner.manager.save(UserEntity, user)

            const request = queryRunner.manager.create(MembershipRequestEntity, {
                studentId: savedUser.id,
                clubId,
                status: "pending",
            })
            const savedRequest = await queryRunner.manager.save(MembershipRequestEntity, request)

            await queryRunner.commitTransaction()
            await sendVerificationEmail(email, rawToken)

            const { passwordHash: _, emailVerifyToken: __, emailVerifyExpiry: ___, ...safeUser } = savedUser
            return { user: safeUser, requestId: savedRequest.id }
        } catch (err) {
            await queryRunner.rollbackTransaction()
            throw err
        } finally {
            await queryRunner.release()
        }
    }

    const user = userRepo().create({
        fullName: name, email, passwordHash, staffOrMatricId: matricNumber, role,
        emailVerifyToken, emailVerifyExpiry,
    })
    await userRepo().save(user)
    await sendVerificationEmail(email, rawToken)

    const { passwordHash: _, emailVerifyToken: __, emailVerifyExpiry: ___, ...safeUser } = user
    return { user: safeUser }
}

export const login = async (email, password) => {
    const user = await userRepo().findOne({ where: { email }})
    if(!user) throw new UnauthenticatedError("Invalid credentials")

    const match = await bcrypt.compare(password, user.passwordHash)
    if(!match) throw new UnauthenticatedError("Invalid credentials")

    if(!user.isEmailVerified) throw new ForbiddenError("Please verify your email before logging in")

    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        envVars.jwtSecret,
        { expiresIn: "15m" }
    )

    const refreshToken = crypto.randomBytes(32).toString('hex')
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await userRepo().update(user.id, { refreshTokenHash, refreshTokenExpiry })

    const { passwordHash: _, refreshTokenHash: __, refreshTokenExpiry: ___, ...safeUser } = user
    return { accessToken, refreshToken, user: safeUser }
}

export const refresh = async (refreshToken) => {
    if (!refreshToken) throw new UnauthenticatedError("No refresh token provided")

    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const user = await userRepo().findOne({ where: { refreshTokenHash: hash } })

    if (!user) throw new UnauthenticatedError("Invalid refresh token")
    if (user.refreshTokenExpiry < new Date()) throw new UnauthenticatedError("Refresh token expired")

    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        envVars.jwtSecret,
        { expiresIn: "15m" }
    )

    return { accessToken }
}

export const logout = async (userId) => {
    await userRepo().update(userId, { refreshTokenHash: null, refreshTokenExpiry: null })
}

export const verifyEmail = async (rawToken) => {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const user = await userRepo().findOne({ where: { emailVerifyToken: hash } })

    if (!user) throw new ValidationError("Invalid or expired verification link")
    if (user.emailVerifyExpiry < new Date()) throw new ValidationError("Verification link has expired")

    await userRepo().update(user.id, {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
    })
}

export const forgotPassword = async (email) => {
    const user = await userRepo().findOne({ where: { email } })
    // Always return silently to avoid revealing whether the email exists
    if (!user) return

    const rawToken = crypto.randomBytes(32).toString('hex')
    const passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await userRepo().update(user.id, { passwordResetToken, passwordResetExpiry })
    await sendPasswordResetEmail(email, rawToken)
}

export const resendVerification = async (email) => {
    const user = await userRepo().findOne({ where: { email } })
    // Silent no-op to avoid revealing whether email exists or is already verified
    if (!user || user.isEmailVerified) return

    const rawToken = crypto.randomBytes(32).toString('hex')
    const emailVerifyToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await userRepo().update(user.id, { emailVerifyToken, emailVerifyExpiry })
    await sendVerificationEmail(email, rawToken)
}

export const resetPassword = async (rawToken, newPassword) => {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const user = await userRepo().findOne({ where: { passwordResetToken: hash } })

    if (!user) throw new ValidationError("Invalid or expired reset link")
    if (user.passwordResetExpiry < new Date()) throw new ValidationError("Reset link has expired")

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await userRepo().update(user.id, {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
    })
}
