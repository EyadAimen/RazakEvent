import styles from "./floatingObjects.module.css";

type Props = {
  style?: React.CSSProperties;
  color?: String;
};

export default function FloatingTriangle({style }: Props) {
  return (
    <div
      className={`${styles.shape} ${styles.triangle}`}
      style={ style}
    />
  );
}