import styles from "./button.module.css";

export type ButtonVariant = "default" | "primary" | "red";

export type ButtonProps = {
  /** The content rendered inside the button (text, icon, or any React node). */
  children: React.ReactNode;
  /** Controls the visual style. Defaults to "default" (neutral). */
  variant?: ButtonVariant;
  /** Click handler called when the button is pressed. */
  onClick?: () => void;
  /** Disables interaction and dims the button when true. */
  disabled?: boolean;
  /** HTML button type. Use "submit" inside forms, "button" otherwise. Defaults to "button". */
  type?: "button" | "submit" | "reset";
  /** Optional extra class name for one-off style overrides from the call site. */
  className?: string;
};

export default function Button({
  children,
  variant = "default",
  onClick,
  disabled = false,
  type = "button",
  className,
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}
