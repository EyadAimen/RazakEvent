import { signup, login } from "./auth.service.mjs"

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
        res.status(200).json({ token: result.token, user: result.user });

    } catch(err) {
        next(err)
    }
    
}