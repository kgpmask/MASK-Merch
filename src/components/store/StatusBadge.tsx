import type { CampaignStatus, OrderStatus, PaymentStatus } from "@/types/store";
import styles from "./StatusBadge.module.css";
export default function StatusBadge({
	status
}: {
	status: CampaignStatus | OrderStatus | PaymentStatus;
}): React.ReactElement {
	const labels: Partial<
		Record<CampaignStatus | OrderStatus | PaymentStatus, string>
	> = {
		open: "Available",
		paid_waiting_moq: "Payment verified",
		MOQ_met: "Confirmed",
		MOQ_failed: "Unavailable"
	};
	return (
		<span className={`${styles.badge} ${styles[status] ?? ""}`}>
			{labels[status] ?? status.replaceAll("_", " ")}
		</span>
	);
}
