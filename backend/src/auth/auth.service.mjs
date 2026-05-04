import appDataSource from "../../config/dbConfig.mjs";
import { UserEntity } from "../users/users.entity.mjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
    
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        envVars.jwtSecret,
        { expiresIn: "1d"}
    ) 

    const { passwordHash: _, ...safeUser } = user
    return { token, user: safeUser}
}
