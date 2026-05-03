import styles from "./floatingObjects.module.css";

type Props = {
  style?: React.CSSProperties;
};

export default function FloatingRectangle({ style}: Props) {
  return (
    <div
      className={`${styles.shape} ${styles.rectangle}`}
      style={style}
    />
  );
}