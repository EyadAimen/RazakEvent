"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import styles from "./reset-password.module.css";
import InputField from "@/components/shared/input-field/input-field";
import Alert from "@/components/shared/alertComponent/alert";
import { apiFetch, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/auth";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({ newPassword: "", confirmPassword: "" });

  const validate = () => {
    const next = { newPassword: "", confirmPassword: "" };
    if (!newPassword.trim()) next.newPassword = "Password is required";
    else if (newPassword.length < 8) next.newPassword = "Password must be at least 8 characters";
    if (!confirmPassword.trim()) next.confirmPassword = "Please confirm your password";
    else if (newPassword !== confirmPassword) next.confirmPassword = "Passwords do not match";
    setErrors(next);
    return !next.newPassword && !next.confirmPassword;
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) { setAlertError("Invalid or missing reset token."); return; }

    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword }) });
      clearSession();
      setSuccess(true);
      setTimeout(() => router.replace("/login"), 2000);
    } catch (err) {
      setAlertError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.brand}>RazakEvent</h1>

        {success ? (
          <div className={styles.successBox}>
            <h2 className={styles.heading}>Password Reset</h2>
            <p className={styles.message}>Your password has been updated. You can now sign in.</p>
            <Link href="/login" className={styles.link}>Go to Login →</Link>
          </div>
        ) : (
          <>
            <p className={styles.subtitle}>Enter your new password below.</p>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.passwordWrapper}>
                <InputField label="New Password" type={showNew ? "text" : "password"} value={newPassword}
                  errorMessage={errors.newPassword} placeholder="At least 8 characters"
                  onChange={(v) => { setNewPassword(v); setErrors((p) => ({ ...p, newPassword: "" })); }} />
                <button type="button" className={styles.eyeButton} onClick={() => setShowNew((p) => !p)}
                  aria-label={showNew ? "Hide password" : "Show password"}>
                  {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className={styles.passwordWrapper}>
                <InputField label="Confirm Password" type={showConfirm ? "text" : "password"} value={confirmPassword}
                  errorMessage={errors.confirmPassword} placeholder="Repeat your new password"
                  onChange={(v) => { setConfirmPassword(v); setErrors((p) => ({ ...p, confirmPassword: "" })); }} />
                <button type="button" className={styles.eyeButton} onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}>
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>

      <Alert variant="loading" isOpen={loading} onClose={() => {}} message="Resetting your password…" />
      <Alert variant="error" isOpen={alertError !== null} message={alertError ?? ""} onClose={() => setAlertError(null)} />
    </main>
  );
}
