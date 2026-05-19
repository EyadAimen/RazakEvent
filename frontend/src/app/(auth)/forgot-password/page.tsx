"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./forgot-password.module.css";
import InputField from "@/components/shared/input-field/input-field";
import { apiFetch, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

    const validate = () => {
        if (!email.trim()) {
            setEmailError("Email is required");
            return false;
        }
        setEmailError("");
        return true;
    };

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        setApiError("");
        if (!validate()) return;

        setLoading(true);
        try {
            await apiFetch("/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            setSubmitted(true);
        } catch (err) {
            setApiError(
                err instanceof ApiError ? err.message : "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <h1 className={styles.brand}>RazakEvent</h1>

                {submitted ? (
                    <div className={styles.successBox}>
                        <h2 className={styles.heading}>Check your email</h2>
                        <p className={styles.message}>
                            If that email is registered, a password reset link has been sent.
                        </p>
                        {resendStatus === "sent" ? (
                            <p className={styles.resendSuccess}>Reset link resent!</p>
                        ) : (
                            <button
                                className={styles.resendButton}
                                onClick={async () => {
                                    setResendStatus("loading");
                                    try {
                                        await apiFetch("/auth/forgot-password", {
                                            method: "POST",
                                            body: JSON.stringify({ email }),
                                        });
                                        setResendStatus("sent");
                                    } catch {
                                        setResendStatus("error");
                                    }
                                }}
                                disabled={resendStatus === "loading"}
                            >
                                {resendStatus === "loading" ? "Sending..." : "Resend reset link"}
                            </button>
                        )}
                        {resendStatus === "error" && (
                            <p className={styles.resendError}>Something went wrong. Please try again.</p>
                        )}
                        <div className={styles.backLink}>
                            <Link href="/login">Back to Login</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className={styles.subtitle}>
                            Enter your email and we&apos;ll send you a reset link.
                        </p>

                        {apiError && <p className={styles.apiError}>{apiError}</p>}

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <InputField
                                label="Email Address"
                                type="email"
                                value={email}
                                errorMessage={emailError}
                                placeholder="your.email@graduate.utm.my"
                                onChange={(value) => {
                                    setEmail(value);
                                    setEmailError("");
                                    setApiError("");
                                }}
                            />

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={loading}
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>

                        <div className={styles.backLink}>
                            <Link href="/login">Back to Login</Link>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
