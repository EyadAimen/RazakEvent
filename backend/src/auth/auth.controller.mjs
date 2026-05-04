import { signup, login, refresh, logout } from "./auth.service.mjs"
import { authenticate } from "./auth.middleware.mjs"

export const signupHandler = async (req, res, next) => {
    const { name, email, password, matricNumber, role } = req.body;

    try {
        const result = await signup(name, email, password, matricNumber, role);
        res.status(201).json({ user: result });
    } catch(err) {
        next(err)
    }
}

export const loginHandler = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const result = await login(email, password);
        res.status(200).json(result);
    } catch(err) {
        next(err)
    }
}

export const refreshHandler = async (req, res, next) => {
    const { refreshToken } = req.body;

    try {
        const result = await refresh(refreshToken);
        res.status(200).json(result);
    } catch(err) {
        next(err)
    }
}

export const logoutHandler = [
    authenticate,
    async (req, res, next) => {
        try {
            await logout(req.user.userId);
            res.status(200).json({ message: "Logged out" });
        } catch(err) {
            next(err)
        }
    }
]