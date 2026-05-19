"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./verify-email.module.css";
import { apiFetch, ApiError } from "@/lib/api";
import { resendVerificationEmail, getRefreshToken } from "@/lib/auth";

type Status = "idle" | "loading" | "success" | "error";
type ResendStatus = "idle" | "loading" | "sent" | "error";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<Status>("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const [resendEmail, setResendEmail] = useState("");
    const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");

    useEffect(() => {
        if (getRefreshToken()) {
            router.replace("/dashboard");
            return;
        }
        if (!token) {
            setErrorMessage("No verification token provided.");
            setStatus("error");
        }
    }, [token, router]);

    const handleVerify = () => {
        setStatus("loading");
        apiFetch(`/auth/verify-email?token=${token}`)
            .then(() => setStatus("success"))
            .catch((err) => {
                setErrorMessage(
                    err instanceof ApiError ? err.message : "Something went wrong. Please try again."
                );
                setStatus("error");
            });
    };

    const handleResend = async () => {
        if (!resendEmail.trim()) return;
        setResendStatus("loading");
        try {
            await resendVerificationEmail(resendEmail.trim());
            setResendStatus("sent");
        } catch {
            setResendStatus("error");
        }
    };

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <h1 className={styles.brand}>RazakEvent</h1>

                {status === "idle" && (
                    <>
                        <h2 className={styles.heading}>Verify your email</h2>
                        <p className={styles.message}>Click the button below to confirm your email address.</p>
                        <button className={styles.button} onClick={handleVerify}>
                            Verify my email
                        </button>
                    </>
                )}

                {status === "loading" && (
                    <>
                        <h2 className={styles.heading}>Verifying your email...</h2>
                        <p className={styles.message}>Please wait a moment.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <h2 className={styles.heading}>Email Verified</h2>
                        <p className={styles.message}>Your account is ready. You can now sign in.</p>
                        <Link href="/login" className={styles.link}>Go to Login →</Link>
                    </>
                )}

                {status === "error" && (
                    <>
                        <h2 className={styles.heading}>Verification Failed</h2>
                        <p className={styles.message}>{errorMessage}</p>

                        <div className={styles.resendSection}>
                            <p className={styles.resendLabel}>Need a new link? Enter your email:</p>
                            <input
                                type="email"
                                className={styles.input}
                                placeholder="your.email@graduate.utm.my"
                                value={resendEmail}
                                onChange={(e) => {
                                    setResendEmail(e.target.value);
                                    if (resendStatus !== "idle") setResendStatus("idle");
                                }}
                            />
                            {resendStatus === "sent" ? (
                                <p className={styles.successText}>A new verification link has been sent!</p>
                            ) : (
                                <button
                                    className={styles.button}
                                    onClick={handleResend}
                                    disabled={resendStatus === "loading" || !resendEmail.trim()}
                                >
                                    {resendStatus === "loading" ? "Sending..." : "Resend verification email"}
                                </button>
                            )}
                            {resendStatus === "error" && (
                                <p className={styles.errorText}>Something went wrong. Please try again.</p>
                            )}
                        </div>

                        <Link href="/login" className={styles.link}>Back to Login →</Link>
                    </>
                )}
            </div>
        </main>
    );
}
