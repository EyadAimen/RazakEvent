import dotenv from 'dotenv'
dotenv.config()

const envVars = {
    host: process.env.HOST,
    dbPort: process.env.DB_PORT,
    dbUsername: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.PORT,
}

export default envVars;