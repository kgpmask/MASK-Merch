import { auth, signIn } from "@/auth";
import CheckoutClient from "@/components/store/CheckoutClient";
import { storeConfig } from "@/lib/store/config";
import styles from "@/styles/StorePage.module.css";
export const dynamic = "force-dynamic";
export default async function CheckoutPage(): Promise<React.ReactElement> {
	const session = await auth();
	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<p className={styles.kicker}>Authenticated checkout</p>
				<h1>Pay by UPI.</h1>
				<p>
					Order creation and totals happen on the server. Payment remains unverified
					until an authorised MASK admin checks the actual receiving account.
				</p>
			</header>
			{session?.user?.email ? (
				<CheckoutClient
					upiId={storeConfig.upiId}
					recipient={storeConfig.upiRecipientName}
					qrUrl={storeConfig.upiQrImageUrl}
				/>
			) : (
				<div className={styles.empty}>
					<h2>Google sign-in is required before checkout.</h2>
					<p>Your browser cart will still be here after sign-in.</p>
					<form
						action={async () => {
							"use server";
							await signIn("google", { redirectTo: "/store/checkout" });
						}}
					>
						<button
							className={styles.primary}
							type="submit"
						>
							Continue with Google
						</button>
					</form>
				</div>
			)}
		</div>
	);
}
