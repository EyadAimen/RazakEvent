"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./verify-pending.module.css";
import { resendVerificationEmail, getRefreshToken } from "@/lib/auth";

type ResendStatus = "idle" | "loading" | "sent" | "error";

export default function VerifyPendingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const emailFromParam = searchParams.get("email") ?? "";

    const [email, setEmail] = useState(emailFromParam);
    const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");

    useEffect(() => {
        if (getRefreshToken()) {
            router.replace("/dashboard");
        }
    }, [router]);

    const handleResend = async () => {
        if (!email.trim()) return;
        setResendStatus("loading");
        try {
            await resendVerificationEmail(email.trim());
            setResendStatus("sent");
        } catch {
            setResendStatus("error");
        }
    };

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <h1 className={styles.brand}>RazakEvent</h1>
                <h2 className={styles.heading}>Check your inbox</h2>
                <p className={styles.message}>
                    {emailFromParam
                        ? <>We sent a verification link to <strong>{emailFromParam}</strong>. Click it to activate your account.</>
                        : "Enter your email below and we'll resend your verification link."}
                </p>

                {!emailFromParam && (
                    <input
                        type="email"
                        className={styles.input}
                        placeholder="your.email@graduate.utm.my"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (resendStatus !== "idle") setResendStatus("idle");
                        }}
                    />
                )}

                {resendStatus === "sent" ? (
                    <p className={styles.successText}>A new verification link has been sent!</p>
                ) : (
                    <button
                        className={styles.button}
                        onClick={handleResend}
                        disabled={resendStatus === "loading" || !email.trim()}
                    >
                        {resendStatus === "loading" ? "Sending..." : "Resend verification email"}
                    </button>
                )}

                {resendStatus === "error" && (
                    <p className={styles.errorText}>Something went wrong. Please try again.</p>
                )}

                <Link href="/login" className={styles.link}>Back to Login →</Link>
            </div>
        </main>
    );
}
