import type { SizeChart } from "@/types/store";
import styles from "./ProductSizeChart.module.css";

export default function ProductSizeChart({
	chart,
	title
}: {
	chart?: SizeChart | null;
	title: string;
}): React.ReactElement {
	const hasTable = Boolean(chart?.columns.length && chart?.rows.length);
	return (
		<section
			className={styles.section}
			aria-labelledby="size-chart-title"
			id="size-chart"
		>
			<header>
				<h2 id="size-chart-title">Size guide</h2>
				<p>Check your measurements before choosing a size.</p>
			</header>
			{chart?.image && (
				<a
					className={styles.imageLink}
					href={chart.image}
					target="_blank"
					rel="noreferrer"
					aria-label={`Open ${title} size chart at full size`}
				>
					<img
						src={chart.image}
						alt={`${title} size chart`}
						loading="lazy"
					/>
				</a>
			)}
			{hasTable && chart && (
				<div
					className={styles.tableScroll}
					role="region"
					aria-label={`${title} size measurements`}
					tabIndex={0}
				>
					<table>
						<caption>{title} measurements</caption>
						<thead>
							<tr>
								{chart.columns.map((column, index) => (
									<th
										key={index}
										scope="col"
									>
										{column}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{chart.rows.map((row, rowIndex) => (
								<tr key={rowIndex}>
									{row.map((cell, index) =>
										index === 0 ? (
											<th
												key={index}
												scope="row"
											>
												{cell}
											</th>
										) : (
											<td key={index}>{cell}</td>
										)
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			{!chart?.image && !hasTable && (
				<div className={styles.empty}>
					Size measurements will be published here once confirmed.
				</div>
			)}
			{chart?.note && <p className={styles.note}>{chart.note}</p>}
		</section>
	);
}
