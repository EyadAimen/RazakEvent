import styles from "./circle.module.css";

type Props = {
    style?: React.CSSProperties;
};

export default function Circle({ style }: Props) {
    return (
        <div className={`${styles.shape} ${styles.circle}`}
            style={style}></div>
    );
}