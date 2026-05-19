import dotenv from 'dotenv'
dotenv.config()

const envVars = {
    host: process.env.HOST,
    dbPort: process.env.DB_PORT,
    dbUsername: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.PORT,
    jwtSecret: process.env.JWT_SECRET,
    resendApiKey: process.env.RESEND_API_KEY,
    mailFrom: process.env.MAIL_FROM,
    frontendUrl: process.env.FRONTEND_URL,
}

export default envVars;