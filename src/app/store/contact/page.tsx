import { storeConfig } from "@/lib/store/config";
import styles from "@/styles/StorePage.module.css";
export default function ContactPage(): React.ReactElement {
	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<p className={styles.kicker}>Need a human?</p>
				<h1>Contact the store team.</h1>
				<p>
					For payment reviews, refunds and pickup, include your order number. Do not
					send sensitive bank credentials.
				</p>
			</header>
			<div className={styles.policyCopy}>
				<section>
					<h2>Email</h2>
					<p>
						<a href={`mailto:${storeConfig.contactEmail}`}>
							{storeConfig.contactEmail}
						</a>{" "}
						— replace with the confirmed merch contact before launch.
					</p>
				</section>
				<section>
					<h2>Community reference</h2>
					<p>
						<a href={storeConfig.contactInstagram}>@maskiitkgp</a>
					</p>
				</section>
				<section>
					<h2>Pickup location</h2>
					<p>
						The store team will share collection details when your order is ready.
					</p>
				</section>
			</div>
		</div>
	);
}
