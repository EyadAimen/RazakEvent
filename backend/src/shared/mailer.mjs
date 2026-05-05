import nodemailer from 'nodemailer'
import envVars from '../../config/envConfig.mjs'

const transporter = nodemailer.createTransport({
    host: envVars.mailHost,
    port: envVars.mailPort,
    secure: false,        // false for port 587 (STARTTLS), true for 465
    auth: {
        user: envVars.mailUser,
        pass: envVars.mailPass,
    }
})

export const sendMail = async (to, subject, html) => {
    await transporter.sendMail({
        from: `"RazakEvent" <${envVars.mailFrom}>`,
        to,
        subject,
        html,
    })
}
