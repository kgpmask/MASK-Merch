import type { ProductStatus, OrderStatus, PaymentStatus } from "@/types/store";
import styles from "./StatusBadge.module.css";
export default function StatusBadge({
	status
}: {
	status: ProductStatus | OrderStatus | PaymentStatus;
}): React.ReactElement {
	const labels: Partial<
		Record<ProductStatus | OrderStatus | PaymentStatus, string>
	> = {
		open: "Available",
		closed: "Unavailable",
		confirmed: "Payment verified"
	};
	console.log(status);
	return (
		<span className={`${styles.badge} ${styles[status] ?? ""}`}>
			{labels[status] ?? status.replaceAll("_", " ")}
		</span>
	);
}
