import Link from "next/link";
import { guardAdminPage } from "@/lib/store/admin";
import styles from "@/styles/Admin.module.css";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
	children
}: {
	children: React.ReactNode;
}): Promise<React.ReactElement> {
	await guardAdminPage();
	return (
		<>
			<nav className={styles.nav}>
				<Link href="/store/admin">Dashboard</Link>
				<Link href="/store/admin/products">Products</Link>
				<Link href="/store/admin/campaigns">Campaigns</Link>
				<Link href="/store/admin/orders">Orders</Link>
				<a href="/api/store/admin/export/vendor">Vendor CSV</a>
				<a href="/api/store/admin/export/pickup">Pickup CSV</a>
			</nav>
			{children}
		</>
	);
}
