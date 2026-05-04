import styles from "./triangle.module.css";

type Props = {
  style?: React.CSSProperties;
  color?: String;
};

export default function Triangle({style }: Props) {
  return (
    <div
      className={`${styles.shape} ${styles.triangle}`}
      style={ style}
    />
  );
}