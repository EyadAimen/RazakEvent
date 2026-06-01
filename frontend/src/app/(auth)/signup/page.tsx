"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";

import InputField from "@/components/shared/input-field/input-field";
import Rectangle from "@/components/shared/rectangle/rectangle";
import Triangle from "@/components/shared/triangle/triangle";
import Alert from "@/components/shared/alertComponent/alert";
import { signupUser, UserRole } from "@/lib/auth";
import { ApiError } from "@/lib/api";

const MATRIC_REGEX = /^[A-Za-z]\d{2}[A-Za-z]{2}\d{4}$/;

export default function Signup() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role] = useState<UserRole>("student");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    fullName: "", studentId: "", email: "", password: "", confirmPassword: "",
  });

  const validateForm = () => {
    const next = { fullName: "", studentId: "", email: "", password: "", confirmPassword: "" };
    if (!fullName.trim()) next.fullName = "Full name is required";
    if (!studentId.trim()) next.studentId = "Student/Staff ID is required";
    else if (!MATRIC_REGEX.test(studentId.trim())) next.studentId = "Invalid format — use e.g. A23CS3025";
    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]*utm\.my$/.test(email.trim())) next.email = "Email must end with utm.my";
    if (!password) next.password = "Password is required";
    else if (password.length < 8) next.password = "Password must be at least 8 characters";
    if (!confirmPassword) next.confirmPassword = "Confirm password is required";
    else if (password !== confirmPassword) next.confirmPassword = "Passwords do not match";
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { user } = await signupUser({
        name: fullName.trim(),
        email: email.trim(),
        password,
        matricNumber: studentId.trim().toUpperCase(),
        role,
      });
      setSuccessMessage(
        user.isEmailVerified
          ? "Your account is ready. You can sign in now."
          : "Your account is pending approval. You can sign in once an administrator approves it."
      );
    } catch (err) {
      setAlertError(err instanceof ApiError ? err.message : "Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.topSection}>
        <h1 className={styles.logo}>RazakEvent</h1>
      </section>

      <section className={styles.bottomSection}>
        <Triangle style={{ left: "115px", top: "60px", transform: "rotate(14deg)", color: "#f4c400" }} />
        <Rectangle style={{ width: "140px", height: "105px", right: "125px", top: "150px", transform: "rotate(-17deg)", background: "#c9362b", borderRadius: "14px" }} />

        <div className={styles.card}>
          <h2>Create Your Account</h2>
          <p>Join the KTR community and start exploring events</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.twoCols}>
              <InputField label="Full Name" type="text" value={fullName} errorMessage={errors.fullName} placeholder="E.g. Ahmed Ali"
                onChange={(v) => { setFullName(v); setErrors((p) => ({ ...p, fullName: "" })); }} />
              <InputField label="Student/Staff ID" type="text" value={studentId} errorMessage={errors.studentId} placeholder="E.g. A21CS1234"
                onChange={(v) => { setStudentId(v); setErrors((p) => ({ ...p, studentId: "" })); }} />
            </div>

            <InputField label="Email Address" type="email" value={email} errorMessage={errors.email} placeholder="ABCD@graduate.utm.my"
              onChange={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: "" })); }} />

            <div className={styles.twoCols}>
              <div className={styles.passwordWrapper}>
                <InputField label="Password" type={showPassword ? "text" : "password"} value={password} errorMessage={errors.password} placeholder="Enter password"
                  onChange={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: "" })); }} />
                <button type="button" className={styles.eyeButton} onClick={() => setShowPassword((p) => !p)} aria-label={showPassword ? "Hide" : "Show"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className={styles.passwordWrapper}>
                <InputField label="Confirm Password" type={showConfirm ? "text" : "password"} value={confirmPassword} errorMessage={errors.confirmPassword} placeholder="Confirm password"
                  onChange={(v) => { setConfirmPassword(v); setErrors((p) => ({ ...p, confirmPassword: "" })); }} />
                <button type="button" className={styles.eyeButton} onClick={() => setShowConfirm((p) => !p)} aria-label={showConfirm ? "Hide" : "Show"}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <p className={styles.signinText}>
            Already have an account? <Link href="/login">Sign In</Link>
          </p>
        </div>
      </section>

      <Alert variant="loading" isOpen={loading} onClose={() => {}} message="Creating your account…" />
      <Alert variant="error" isOpen={alertError !== null} message={alertError ?? ""} onClose={() => setAlertError(null)} />
      <Alert variant="success" isOpen={successMessage !== null} message={successMessage ?? ""}
        onClose={() => { setSuccessMessage(null); router.push("/login"); }} />
    </main>
  );
}
