import styles from "./MOQProgress.module.css";
export default function MOQProgress({
	paid,
	moq
}: {
	paid: number;
	moq: number;
}): React.ReactElement {
	const percent = Math.min(100, Math.round((paid / moq) * 100));
	return (
		<div className={styles.wrap}>
			<div className={styles.copy}>
				<span>{paid} paid</span>
				<strong>{paid >= moq ? "MOQ reached" : `${moq - paid} to unlock`}</strong>
			</div>
			<div
				className={styles.track}
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={moq}
				aria-valuenow={paid}
			>
				<span
					className={
						styles[`width${Math.round(percent / 10) * 10}`] ?? styles.width100
					}
				/>
			</div>
		</div>
	);
}
