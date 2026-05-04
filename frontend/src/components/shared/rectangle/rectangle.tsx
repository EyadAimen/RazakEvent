import styles from "./rectangle.module.css";

type Props = {
  style?: React.CSSProperties;
};

export default function Rectangle({ style}: Props) {
  return (
    <div
      className={`${styles.shape} ${styles.rectangle}`}
      style={style}
    />
  );
}