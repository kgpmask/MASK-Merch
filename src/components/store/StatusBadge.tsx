import type { CampaignStatus, OrderStatus, PaymentStatus } from "@/types/store";
import styles from "./StatusBadge.module.css";
export default function StatusBadge({ status }: { status: CampaignStatus | OrderStatus | PaymentStatus }): React.ReactElement { return <span className={`${styles.badge} ${styles[status] ?? ""}`}>{status.replaceAll("_", " ")}</span>; }
