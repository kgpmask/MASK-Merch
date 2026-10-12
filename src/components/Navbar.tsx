"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/store/CartProvider";
import styles from "@/styles/Navbar.module.css";

type Props = { user: { name: string; email: string; isAdmin: boolean } | null };
export default function Navbar({ user }: Props): React.ReactElement {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);
	const { itemCount } = useCart();
	useEffect(() => {
		document.body.style.overflow = menuOpen ? "hidden" : "auto";
		const closeOnEscape = (event: KeyboardEvent): void => {
			if (event.key === "Escape") setMenuOpen(false);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => {
			document.body.style.overflow = "auto";
			window.removeEventListener("keydown", closeOnEscape);
		};
	}, [menuOpen]);
	const items = [
		{ name: "Store", href: "/store" },
		{ name: "Products", href: "/store/products" },
		{ name: "Orders", href: "/store/orders" },
		...(user?.isAdmin ? [{ name: "Admin", href: "/store/admin" }] : [])
	];
	return (
		<>
			<nav
				className={styles.navbarFull}
				aria-label="Main navigation"
			>
				<div className={styles.inner}>
					<Link
						href="/store"
						className={styles.logo}
					>
						<Image
							height={48}
							width={48}
							src="/assets/logo.jpeg"
							alt="MASK"
							className={styles.navbarLogo}
						/>
						<span>
							MASK <b>MERCH</b>
						</span>
					</Link>
					<div className={styles.navbarContainer}>
						<a
							href="https://kgpmask.com"
							className={styles.link}
						>
							MASK home ↗
						</a>
						{items.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`${styles.link} ${pathname === item.href ? styles.active : ""}`}
								aria-current={pathname === item.href ? "page" : undefined}
							>
								{item.name}
							</Link>
						))}
					</div>
					<Link
						href="/store/cart"
						className={styles.cart}
					>
						Cart <span>{itemCount}</span>
					</Link>
					<button
						type="button"
						className={styles.burger}
						onClick={() => setMenuOpen((value) => !value)}
						aria-expanded={menuOpen}
						aria-label="Toggle navigation"
					>
						<span />
					</button>
				</div>
			</nav>
			<div
				className={`${styles.slidingMenu} ${menuOpen ? styles.menuOpen : ""}`}
				inert={!menuOpen}
			>
				<a
					href="https://kgpmask.com"
					className={styles.menuLink}
				>
					MASK home ↗
				</a>
				{items.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={styles.menuLink}
						onClick={() => setMenuOpen(false)}
					>
						{item.name}
					</Link>
				))}
				<Link
					href="/store/cart"
					className={styles.menuLink}
					onClick={() => setMenuOpen(false)}
				>
					Cart ({itemCount})
				</Link>
				{user && (
					<span className={styles.signedIn}>
						{user.name}
						<small>{user.email}</small>
					</span>
				)}
			</div>
		</>
	);
}
