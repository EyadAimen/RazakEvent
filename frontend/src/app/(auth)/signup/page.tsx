"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import styles from "./signup.module.css";

import InputField from "@/components/shared/input-field/input-field";
import Rectangle from "@/components/shared/rectangle/rectangle";
import Triangle from "@/components/shared/triangle/triangle";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    fullName: "",
    studentId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateForm = () => {
    const newErrors = {
      fullName: "",
      studentId: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!studentId.trim()) {
      newErrors.studentId = "Student/Staff ID is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      console.log({
        fullName,
        studentId,
        email,
        password,
      });
    }, 800);
  };

  return (
    <main className={styles.page}>
      <section className={styles.topSection}>
        <h1 className={styles.logo}>RazakEvent</h1>
      </section>

      <section className={styles.bottomSection}>
        <Triangle
          style={{
            left: "115px",
            top: "60px",
            transform: "rotate(14deg)",
            color: "#f4c400",
          }}
        />

        <Rectangle
          style={{
            width: "140px",
            height: "105px",
            right: "125px",
            top: "150px",
            transform: "rotate(-17deg)",
            background: "#c9362b",
            borderRadius: "14px",
          }}
        />

        <div className={styles.card}>
          <h2>Create Your Account</h2>
          <p>Join the KTR community and start exploring events</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.twoCols}>
              <InputField
                label="Full Name"
                type="text"
                value={fullName}
                errorMessage={errors.fullName}
                placeholder="E.g. Ahmed Ali"
                onChange={(value) => {
                  setFullName(value);
                  setErrors((prev) => ({ ...prev, fullName: "" }));
                }}
              />

              <InputField
                label="Student/Staff ID"
                type="text"
                value={studentId}
                errorMessage={errors.studentId}
                placeholder="E.g. A21CS1234"
                onChange={(value) => {
                  setStudentId(value);
                  setErrors((prev) => ({ ...prev, studentId: "" }));
                }}
              />
            </div>

            <InputField
              label="Email Address"
              type="email"
              value={email}
              errorMessage={errors.email}
              placeholder="ABCD@graduate.utm.my"
              onChange={(value) => {
                setEmail(value);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
            />

            <div className={styles.twoCols}>
              <div className={styles.passwordWrapper}>
                <InputField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  errorMessage={errors.password}
                  placeholder="Enter password"
                  onChange={(value) => {
                    setPassword(value);
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                />

                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className={styles.passwordWrapper}>
                <InputField
                  label="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  errorMessage={errors.confirmPassword}
                  placeholder="Confirm password"
                  onChange={(value) => {
                    setConfirmPassword(value);
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                />

                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
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
    </main>
  );
}