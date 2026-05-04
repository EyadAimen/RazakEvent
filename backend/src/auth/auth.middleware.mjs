import { Router } from 'express'
import * as authController from './auth.controller.mjs'
import { ForbiddenError, UnauthenticatedError } from '../shared/errors.mjs'
import jwt from "jsonwebtoken";
import envVars from '../../config/envConfig.mjs';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new UnauthenticatedError("No token provided"))
    }

    const token = authHeader.split(' ')[1]
    
    try {
        const decoded = jwt.verify(token, envVars.jwtSecret)
        req.user = decoded
        next()
    } catch (err) {
        return next(new UnauthenticatedError("Inavlid or expired token"))
    }
}

export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if(!req.user) {
            return next(new UnauthenticatedError())
        }
        if(!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError("Insufficient permissions"))
        }
        next()
    }
}
