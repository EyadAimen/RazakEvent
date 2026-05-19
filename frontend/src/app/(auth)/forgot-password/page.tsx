"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./forgot-password.module.css";
import InputField from "@/components/shared/input-field/input-field";
import Alert from "@/components/shared/alertComponent/alert";
import { apiFetch, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");

  const validate = () => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]*utm\.my$/.test(email.trim())) {
      setEmailError("Email must end with utm.my");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: email.trim() }) });
      setSubmitted(true);
    } catch (err) {
      setAlertError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: email.trim() }) });
      setResendStatus("sent");
    } catch {
      setResendStatus("error");
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
              <button className={styles.resendButton} onClick={handleResend} disabled={loading}>
                Resend reset link
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
            <p className={styles.subtitle}>Enter your email and we&apos;ll send you a reset link.</p>
            <form className={styles.form} onSubmit={handleSubmit}>
              <InputField
                label="Email Address"
                type="email"
                value={email}
                errorMessage={emailError}
                placeholder="your.email@graduate.utm.my"
                onChange={(v) => { setEmail(v); setEmailError(""); }}
              />
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <div className={styles.backLink}>
              <Link href="/login">Back to Login</Link>
            </div>
          </>
        )}
      </div>

      <Alert variant="loading" isOpen={loading} onClose={() => {}} message="Sending reset link…" />
      <Alert variant="error" isOpen={alertError !== null} message={alertError ?? ""} onClose={() => setAlertError(null)} />
    </main>
  );
}
