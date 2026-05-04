"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./login.module.css";

import InputField from "@/components/shared/input-field/input-field";
import Circle from "@/components/shared/circle/circle";
import Rectangle from "@/components/shared/rectangle/rectangle";
import Triangle from "@/components/shared/triangle/triangle";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });

    const validateForm = () => {
        const newErrors = {
            email: "",
            password: "",
        };

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!password.trim()) {
            newErrors.password = "Password is required";
        } else if (password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        setErrors(newErrors);

        return !newErrors.email && !newErrors.password;
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) return;

        console.log({ email, password });
    };

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

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <InputField
                            label="Email Address"
                            type="email"
                            value={email}
                            errorMessage={errors.email}
                            placeholder="your.email@graduate.utm.my"
                            onChange={(value) => {
                                setEmail(value);
                                setErrors((prev) => ({ ...prev, email: "" }));
                            }}
                        />

                        <div className={styles.passwordWrapper}>
                            <InputField
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                errorMessage={errors.password}
                                placeholder="Enter your password"
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
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <a href="#" className={styles.forgotLink}>
                            Forgot Password?
                        </a>

                        <button type="submit" className={styles.submitButton}>
                            Sign In
                        </button>
                    </form>

                    <p className={styles.signupText}>
                        Don&apos;t have an account? <a href="/auth/signup">Sign Up</a>
                    </p>
                </div>
            </section>

            <section className={styles.rightPanel}>
                <Rectangle

                    style={{
                        width: "190px",
                        height: "150px",
                        top: "150px",
                        right: "140px",
                        transform: "rotate(5deg)",
                        background: "#3f73d8"
                    }}
                />

                <Triangle

                    style={{
                        left: "70px",
                        top: "335px",
                        transform: "rotate(14deg)",
                        color: "#F4C200"
                    }}
                />

                <Circle
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
                    <p>Your gateway to KTR&apos;s vibrant community events</p>
                </div>
            </section>
        </main>
    );
}