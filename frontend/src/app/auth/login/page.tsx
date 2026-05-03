"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./login.module.css";

import FloatingCircle from "@/components/shared/floating_objects/FloatingCircle";
import FloatingRectangle from "@/components/shared/floating_objects/FloatingRectangle";
import FloatingTriangle from "@/components/shared/floating_objects/FloatingTriangle";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <main className={styles.mainPage}>
            <section className={styles.leftPanel}>
                <div className={styles.loginBox}>
                    <h1 className={styles.title}>RazakEvent</h1>

                    <div className={styles.logoRow}>
                        <div className={styles.logoPlaceholder}>KTR</div>
                        <div className={styles.logoDivider}></div>
                        <div className={styles.logoPlaceholder}>UTM</div>
                    </div>

                    <form className={styles.form}>
                        <label>Email Address</label>
                        <input type="email" placeholder="your.email@graduate.utm.my" />

                        <label>Password</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                            />

                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <a href="#" className={styles.forgotLink}>
                            Forgot Password?
                        </a>

                        <button type="submit">Sign In</button>
                    </form>

                    <p className={styles.signupText}>
                        Don&apos;t have an account? <a href="/auth/signup">Sign Up</a>
                    </p>
                </div>
            </section>

            <section className={styles.rightPanel}>
                <FloatingRectangle

                    style={{
                        width: "160px",
                        height: "220px",
                        top: "60px",
                        right: "70px",
                        transform: "rotate(-8deg)",
                        background: "#1f3476"
                    }}
                />

                <FloatingRectangle

                    style={{
                        width: "190px",
                        height: "150px",
                        top: "150px",
                        right: "140px",
                        transform: "rotate(5deg)",
                        background: "#3f73d8"
                    }}
                />

                <FloatingTriangle

                    style={{
                        left: "70px",
                        top: "335px",
                        transform: "rotate(14deg)",
                        color: "#F4C200"
                    }}
                />

                <FloatingCircle
                    style={{
                        width: "120px",
                        height: "120px",
                        right: "90px",
                        bottom: "90px",
                        background: "#c9362b"
                    }}
                />
                <div className={styles.tagline}>
                    <h2>Connect. Create. Celebrate.</h2>
                    <p>Your gateway to KTR's vibrant community events</p>
                </div>
            </section>
        </main>
    );
}