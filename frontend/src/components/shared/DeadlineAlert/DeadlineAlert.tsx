import { TriangleAlert } from "lucide-react";
import styles from "./DeadlineAlert.module.css";

type Props = {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export default function DeadlineAlert({ message, ctaLabel, onCta }: Props) {
  return (
    <div className={styles.alert} role="alert">
      <span className={styles.icon}>
        <TriangleAlert size={16} />
      </span>
      <p className={styles.message}>{message}</p>
      {ctaLabel && (
        <button className={styles.cta} onClick={onCta}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
