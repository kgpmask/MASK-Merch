import { storeConfig } from "@/lib/store/config";
import styles from "@/styles/StorePage.module.css";
export default function ContactPage(): React.ReactElement {
	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<p className={styles.kicker}>Need a human?</p>
				<h1>Contact the store team.</h1>
				<p>
					For payment reviews, refunds and order questions, include your order
					number. Do not send sensitive bank credentials.
				</p>
			</header>
			<div className={styles.policyCopy}>
				<section>
					<h2>Phone</h2>
					<p>
						{storeConfig.contactPhone ? (
							<a href={`tel:${storeConfig.contactPhone.replace(/[^\d+]/g, "")}`}>
								{storeConfig.contactPhone}
							</a>
						) : (
							"Phone number to be confirmed."
						)}
					</p>
				</section>
				<section>
					<h2>Community reference</h2>
					<p>
						<a href={storeConfig.contactInstagram}>@maskiitkgp</a>
					</p>
				</section>
			</div>
		</div>
	);
}
