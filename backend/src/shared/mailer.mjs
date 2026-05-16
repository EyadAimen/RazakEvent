import { Resend } from 'resend'
import envVars from '../../config/envConfig.mjs'

const resend = new Resend(envVars.resendApiKey)

const sendMail = async (to, subject, html) => {
    await resend.emails.send({
        from: `RazakEvent <${envVars.mailFrom}>`,
        to,
        subject,
        html,
    })
}

export const sendVerificationEmail = async (to, token) => {
    const link = `${envVars.frontendUrl}/verify-email?token=${token}`
    await sendMail(to, 'Verify your RazakEvent account', `
        <p>Welcome to RazakEvent!</p>
        <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
        <a href="${link}">${link}</a>
        <p>If you did not create an account, you can ignore this email.</p>
    `)
}

export const sendPasswordResetEmail = async (to, token) => {
    const link = `${envVars.frontendUrl}/reset-password?token=${token}`
    await sendMail(to, 'Reset your RazakEvent password', `
        <p>You requested a password reset for your RazakEvent account.</p>
        <p>Click the link below to set a new password. This link expires in 1 hour.</p>
        <a href="${link}">${link}</a>
        <p>If you did not request this, you can ignore this email.</p>
    `)
}
