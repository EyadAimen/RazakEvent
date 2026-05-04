export class NotFoundError extends Error {
    constructor(message = "Resource not found") {
        super(message)
        this.name= "NotFoundError"
        this.statusCode = 404
    }
}

export class UnauthenticatedError extends Error {
    constructor(message = "Invalid or missing credentials") {
        super(message)
        this.name= "UnauthenticatedError"
        this.statusCode = 401
    }
}

export class ForbiddenError extends Error {
    constructor(message = "Unauthorized Access") {
        super(message)
        this.name= "ForbiddenError"
        this.statusCode = 403
    }
}

export class ConflictError extends Error {
    constructor(message = "Resource already exist") {
        super(message)
        this.name= "ConflictError"
        this.statusCode = 409
    }
}

export class ValidationError extends Error {
    constructor(message = "Invalid input") {
        super(message)
        this.name = "ValidationError"
        this.statusCode = 400
    }
}