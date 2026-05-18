"use client";

import { useRouter } from "next/navigation";
import styles from "./not-found.module.css";

import Circle from "@/components/shared/circle/circle";
import Rectangle from "@/components/shared/rectangle/rectangle";
import Triangle from "@/components/shared/triangle/triangle";

export default function NotFound() {
    const router = useRouter();

    const handleGoBack = () => {
        router.back();
    };

    return (
        <main className={styles.centeredPageWrapper}>
            <Triangle
                style={{
                    width: "140px",
                    height: "200px",
                    top: "10vh",
                    right: "15vw",
                    transform: "rotate(-18deg)",
                    color: "var(--color-secondary-500)",
                    opacity: 0.8
                }}
            />
            <Rectangle
                style={{
                    width: "180px",
                    height: "100px",
                    top: "20vh",
                    left: "10vw",
                    transform: "rotate(25deg)",
                    background: "var(--color-ktr-navy)",
                    opacity: 0.6
                }}
            />
            <Circle
                style={{
                    width: "160px",
                    height: "160px",
                    bottom: "15vh",
                    left: "18vw",
                    transform: "rotate(8deg)",
                    background: "var(--color-semantic-red)",
                    opacity: 0.7
                }}
            />
            <Rectangle
                style={{
                    width: "150px",
                    height: "150px",
                    bottom: "12vh",
                    right: "12vw",
                    transform: "rotate(-10deg)",
                    background: "var(--color-ktr-blue)",
                    opacity: 0.5
                }}
            />

            <div className={styles.hugeDisplayCodeWrap}>
                <div className={styles.errorBox}>
                    <span className={styles.systemTitle}>RazakEvent</span>

                    <div className={styles.badge}>Error 404</div>
                    <h1 className={styles.title}>Page Not Found</h1>

                    <p className={styles.description}>
                        We can't seem to find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
                    </p>
                    <button type="button" onClick={handleGoBack} className={styles.actionButton}>
                        Go Back to Previous Page
                    </button>
                </div>
                <div className={styles.hugeDisplayCode}>
                    <span>404</span>
                </div>
            </div>
        </main>
    );
}