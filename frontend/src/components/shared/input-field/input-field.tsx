import styles from "./input-field.module.css";

type InputFieldProps = {
  label: string;
  type: string;
  value: string;
  errorMessage?: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export default function InputField({
  label,
  type,
  value,
  errorMessage,
  placeholder,
  onChange,
}: InputFieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>

      <input
        className={`${styles.input} ${errorMessage ? styles.inputError : ""}`}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />

      <p className={styles.errorText}>{errorMessage || ""}</p>
    </div>
  );
}