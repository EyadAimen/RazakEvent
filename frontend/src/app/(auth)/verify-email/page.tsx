"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./verify-email.module.css";
import { apiFetch, ApiError } from "@/lib/api";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<Status>("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setErrorMessage("No verification token provided.");
            setStatus("error");
            return;
        }

        apiFetch(`/auth/verify-email?token=${token}`)
            .then(() => setStatus("success"))
            .catch((err) => {
                setErrorMessage(
                    err instanceof ApiError ? err.message : "Something went wrong. Please try again."
                );
                setStatus("error");
            });
    }, [token]);

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <h1 className={styles.brand}>RazakEvent</h1>

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
                        <Link href="/login" className={styles.link}>Back to Login →</Link>
                    </>
                )}
            </div>
        </main>
    );
}
