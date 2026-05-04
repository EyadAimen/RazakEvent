import appDataSource from "../../config/dbConfig.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UnauthenticatedError, ForbiddenError, ConflictError, ValidationError } from "../shared/errors.mjs";
import envVars from "../../config/envConfig.mjs";

const userRepo = () => appDataSource.getRepository(UserEntity)
const matricPattern = /^[A-Z]\d{2}[A-Z]{2}\d{4}$/i

export const signup = async (name, email, password, matricNumber, role) => {
    if(role==="admin") {
        throw new ForbiddenError("Registering as Admin is not allowed")
    }

    if (!matricPattern.test(matricNumber)) {
        throw new ValidationError("Invalid matric number format")
    }

    const existingEmail = await userRepo().findOne({ where: { email }})
    if(existingEmail) throw new ConflictError("Email already registered")
    
    const existingMatric = await userRepo().findOne({ where: { matricNumber }})
    if(existingMatric) throw new ConflictError("Matric Number already registered")

    const passwordHash = await bcrypt.hash(password, 10)
    const isApproved = role === "student"

    const user = userRepo().create( {name, email, passwordHash, matricNumber, role, isApproved })
    await userRepo().save(user)

    const { passwordHash: _, ...safeUser } = user
    return safeUser
}

export const login = async (email, password) => {
    const user = await userRepo().findOne({ where: { email }})
    if(!user) throw new UnauthenticatedError("Invalid credentials")

    const match = await bcrypt.compare(password, user.passwordHash)
    if(!match) throw new UnauthenticatedError("Invalid credentials")

    if(!user.isApproved) throw new ForbiddenError('Account pending approval')

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
