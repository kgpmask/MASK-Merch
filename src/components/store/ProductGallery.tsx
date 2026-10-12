"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ProductGallery.module.css";

export default function ProductGallery({
	images,
	title
}: {
	images: string[];
	title: string;
}): React.ReactElement {
	const [selected, setSelected] = useState(0);
	const viewportRef = useRef<HTMLDivElement>(null);
	const current = images[selected] ?? images[0];
	function selectImage(index: number): void {
		setSelected(index);
		const viewport = viewportRef.current;
		viewport?.scrollTo?.({ left: index * viewport.clientWidth });
	}
	useEffect(() => {
		function alignSlide(): void {
			const viewport = viewportRef.current;
			viewport?.scrollTo?.({
				left: selected * viewport.clientWidth,
				behavior: "instant"
			});
		}
		window.addEventListener("resize", alignSlide);
		return () => window.removeEventListener("resize", alignSlide);
	}, [selected]);
	return (
		<section
			className={styles.gallery}
			aria-label={`${title} images`}
			aria-roledescription="carousel"
		>
			<div className={styles.main}>
				{current ? (
					<div
						ref={viewportRef}
						className={styles.viewport}
						role="group"
						aria-label="Product image slides"
						onScrollEnd={() => {
							const viewport = viewportRef.current;
							if (viewport && viewport.clientWidth > 0)
								setSelected(
									Math.max(
										0,
										Math.min(
											images.length - 1,
											Math.round(viewport.scrollLeft / viewport.clientWidth)
										)
									)
								);
						}}
					>
						{images.map((image, index) => (
							<a
								key={image}
								className={styles.slide}
								href={image}
								target="_blank"
								rel="noreferrer"
								aria-label={`Open ${title} image ${index + 1} at full size`}
								aria-hidden={selected !== index}
								tabIndex={selected === index ? 0 : -1}
							>
								<img
									src={image}
									alt={`${title} — view ${index + 1}`}
								/>
							</a>
						))}
					</div>
				) : (
					<p>Artwork coming soon</p>
				)}
				{images.length > 1 && (
					<>
						<button
							type="button"
							className={`${styles.arrow} ${styles.previous}`}
							aria-label="Previous image"
							onClick={() =>
								selectImage((selected - 1 + images.length) % images.length)
							}
						>
							<span aria-hidden="true">{"<"}</span>
						</button>
						<button
							type="button"
							className={`${styles.arrow} ${styles.next}`}
							aria-label="Next image"
							onClick={() => selectImage((selected + 1) % images.length)}
						>
							<span aria-hidden="true">{">"}</span>
						</button>
						<span
							className={styles.counter}
							aria-live="polite"
							aria-atomic="true"
						>
							{selected + 1} / {images.length}
						</span>
					</>
				)}
			</div>
			{images.length > 1 && (
				<div
					className={styles.thumbnails}
					aria-label="Choose a product image"
				>
					{images.map((image, index) => (
						<button
							type="button"
							key={image}
							onClick={() => selectImage(index)}
							aria-label={`View ${title} image ${index + 1}`}
							aria-pressed={selected === index}
						>
							<img
								src={image}
								alt=""
								loading="lazy"
							/>
						</button>
					))}
				</div>
			)}
			{current && (
				<p className={styles.hint}>
					Click the image to view full size.
					{images.length > 1 ? ` ${images.length} views available.` : ""}
				</p>
			)}
		</section>
	);
}
