"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import styles from "./signup.module.css";

import FloatingRectangle from "@/components/shared/floating_objects/FloatingRectangle";
import FloatingTriangle from "@/components/shared/floating_objects/FloatingTriangle";

export default function signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const form = e.currentTarget;

    const fullName = (form.elements.namedItem("fullName") as HTMLInputElement).value.trim();
    const studentId = (form.elements.namedItem("studentId") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    if (!fullName || !studentId || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // fake success (you said skip backend)
    setTimeout(() => {
      setLoading(false);
      console.log("Form valid");
    }, 800);
  };

  return (
    <main className={styles.page}>
      <section className={styles.topSection}>
        <h1 className={styles.logo}>RazakEvent</h1>
      </section>

      <section className={styles.bottomSection}>
        <FloatingTriangle
          style={{
            left: "115px",
            top: "60px",
            transform: "rotate(14deg)",
            color: "#f4c400",
          }}
        />

        <FloatingRectangle
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
              <div>
                <label>Full Name</label>
                <input type="text" placeholder="E.g. Ahmed Ali" required/>
              </div>

              <div>
                <label>Student/Staff ID</label>
                <input type="text" placeholder="E.g. A21CS1234" required/>
              </div>
            </div>

            <label>Email Address</label>
            <input type="email" placeholder="ABCD@graduate.utm.my" required/>

            <div className={styles.twoCols}>
              <div>
                <label>Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label>Confirm Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowConfirm((prev) => !prev)}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </button>
            {error && <p className={styles.errorText}>{error}</p>}
          </form>

          <p className={styles.signinText}>
            Already have an account? <Link href="/auth/login">Sign In</Link>
          </p>
        </div>
      </section>
    </main>
  );
}