import styles from "./floatingObjects.module.css";

type Props = {
    style?: React.CSSProperties;
};

export default function FloatingCircle({ style }: Props) {
    return (
        <div className={`${styles.shape} ${styles.circle}`}
            style={style}></div>
    );
}