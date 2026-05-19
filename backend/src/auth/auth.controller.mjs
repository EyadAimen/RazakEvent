import { signup, login, refresh, logout, verifyEmail, forgotPassword, resetPassword, resendVerification } from "./auth.service.mjs"
import { authenticate } from "./auth.middleware.mjs"

export const signupHandler = async (req, res, next) => {
    const { name, email, password, matricNumber, role, clubId } = req.body;

    try {
        const result = await signup(name, email, password, matricNumber, role, clubId);
        res.status(201).json(result);
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

export const verifyEmailHandler = async (req, res, next) => {
    const { token } = req.query;
    try {
        await verifyEmail(token);
        res.status(200).json({ message: "Email verified successfully" });
    } catch(err) {
        next(err)
    }
}

export const forgotPasswordHandler = async (req, res, next) => {
    const { email } = req.body;
    try {
        await forgotPassword(email);
        res.status(200).json({ message: "If that email exists, a reset link has been sent" });
    } catch(err) {
        next(err)
    }
}

export const resendVerificationHandler = async (req, res, next) => {
    const { email } = req.body;
    try {
        await resendVerification(email);
        res.status(200).json({ message: "If your email is registered and unverified, a new link has been sent" });
    } catch(err) {
        next(err)
    }
}

export const resetPasswordHandler = async (req, res, next) => {
    const { token, newPassword } = req.body;
    try {
        await resetPassword(token, newPassword);
        res.status(200).json({ message: "Password reset successfully" });
    } catch(err) {
        next(err)
    }
}