import styles from "./button.module.css";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  isLoading?: boolean;
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  isLoading = false,
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      type={type}
    >
      {isLoading ? "..." : children}
    </button>
  );
}
