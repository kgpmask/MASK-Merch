import Link from "next/link";
import styles from "@/styles/Footer.module.css";
export default function Footer(): React.ReactElement {
	return (
		<footer className={styles.footer}>
			<div>
				<strong>MASK Merch</strong>
				<p>An unofficial community merch project.</p>
			</div>
			<nav aria-label="Footer">
				<Link href="/store/policies">Policies</Link>
				<Link href="/store/contact">Contact</Link>
				<a href="https://kgpmask.com">MASK reference site</a>
			</nav>
			<small>Not an official IIT Kharagpur storefront.</small>
		</footer>
	);
}
