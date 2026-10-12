import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
	GARMENT_TYPES,
	type GarmentType,
	type SizeChart,
	type StoreProduct
} from "@/types/store";

export const designDirectory = path.join(process.cwd(), "designs");
export const imageTypes: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp"
};
export type DesignFolder = { folder: string; files: string[] };

function record(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("Design configuration must be a JSON object.");
	return value as Record<string, unknown>;
}

function imageUrl(folder: string, file: string): string {
	return `/api/store/designs/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
}

function garmentSizes(value: unknown, label: string): string[] {
	if (
		!Array.isArray(value) ||
		!value.length ||
		!value.every(
			(size): size is string =>
				typeof size === "string" &&
				/^[A-Za-z0-9][A-Za-z0-9 /()._-]{0,39}$/.test(size) &&
				size === size.trim()
		) ||
		new Set(value).size !== value.length
	)
		throw new Error(`Invalid or duplicate sizes for ${label}`);
	return value;
}

function garmentPrice(value: unknown, label: string): number {
	if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1)
		throw new Error(`${label} must be positive integer paise`);
	return value;
}

function sizeChart(value: unknown, folder: DesignFolder): SizeChart {
	const config = value == null ? {} : record(value);
	const image =
		config.image ??
		folder.files.find((file) => /^size-chart\.(png|jpe?g|webp)$/i.test(file));
	if (
		image != null &&
		(typeof image !== "string" ||
			!folder.files.includes(image) ||
			!imageTypes[path.extname(image).toLowerCase()])
	)
		throw new Error(
			`Size chart image must name a supported image in artwork/${folder.folder}`
		);
	const columns = config.columns ?? [];
	const rows = config.rows ?? [];
	if (
		!Array.isArray(columns) ||
		!columns.every(
			(column): column is string =>
				typeof column === "string" && column.trim().length > 0
		) ||
		!Array.isArray(rows) ||
		!rows.every(
			(row): row is string[] =>
				Array.isArray(row) &&
				row.length === columns.length &&
				row.every((cell) => typeof cell === "string")
		) ||
		(rows.length > 0 && columns.length < 2)
	)
		throw new Error(
			`Size chart rows must match the text column headings for ${folder.folder}`
		);
	if (config.note != null && typeof config.note !== "string")
		throw new Error(`Invalid size chart note for ${folder.folder}`);
	return {
		...(typeof image === "string"
			? { image: imageUrl(folder.folder, image) }
			: {}),
		columns,
		rows,
		...(typeof config.note === "string" ? { note: config.note } : {})
	};
}

export function designProducts(
	folders: DesignFolder[],
	input: unknown
): StoreProduct[] {
	const config = record(input);
	const defaults = record(config.defaults);
	const designs = record(config.designs);
	const slugs = new Set<string>();
	return [...folders]
		.sort((a, b) =>
			a.folder.localeCompare(b.folder, undefined, { numeric: true })
		)
		.flatMap((folder): StoreProduct[] => {
			const entry = {
				...defaults,
				...(Object.hasOwn(designs, folder.folder)
					? record(designs[folder.folder])
					: {})
			};
			const supported = folder.files
				.filter((file) => imageTypes[path.extname(file).toLowerCase()])
				.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
			if (!supported.length) return [];
			const chart = sizeChart(entry.sizeChart, { ...folder, files: supported });
			const images = supported
				.map((file) => imageUrl(folder.folder, file))
				.filter((url) => url !== chart.image);
			if (!images.length) return [];
			const slug = folder.folder
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");
			if (!slug || slugs.has(slug))
				throw new Error(`Duplicate or invalid design slug: ${folder.folder}`);
			slugs.add(slug);
			const {
				garmentType,
				sizes,
				pricePaise,
				normalPricePaise,
				normalSizes,
				oversizedSizes,
				oversizedPricePaise,
				moq,
				preorderClose,
				colour,
				material,
				gsm
			} = entry;
			if (
				garmentType !== "tshirt" &&
				!GARMENT_TYPES.some((type) => type === garmentType)
			)
				throw new Error(`Choose garmentType tshirt or hoodie for ${folder.folder}`);
			const garmentTypes: GarmentType[] =
				garmentType === "hoodie"
					? ["hoodie"]
					: ["normal_tshirt", "oversized_tshirt"];
			const fits = garmentTypes.map((type) => ({
				type,
				sizes: garmentSizes(
					type === "hoodie"
						? sizes
						: type === "normal_tshirt"
							? (normalSizes ?? sizes)
							: (oversizedSizes ?? sizes ?? normalSizes),
					`${folder.folder}/${type}`
				),
				price: garmentPrice(
					type === "hoodie"
						? pricePaise
						: type === "normal_tshirt"
							? (normalPricePaise ?? pricePaise)
							: (oversizedPricePaise ?? normalPricePaise ?? pricePaise),
					type === "oversized_tshirt" ? "Oversized price" : "Price"
				)
			}));
			if (typeof moq !== "number" || !Number.isSafeInteger(moq) || moq < 1)
				throw new Error(`MOQ must be a positive integer: ${folder.folder}`);
			if (
				typeof preorderClose !== "string" ||
				!Number.isFinite(Date.parse(preorderClose)) ||
				typeof colour !== "string" ||
				!colour.trim()
			)
				throw new Error(`Invalid deadline or colour for ${folder.folder}`);
			if (material != null && (typeof material !== "string" || !material.trim()))
				throw new Error(`Invalid material for ${folder.folder}`);
			if (
				gsm != null &&
				(typeof gsm !== "number" || !Number.isSafeInteger(gsm) || gsm < 1)
			)
				throw new Error(
					`GSM must be a positive integer or null for ${folder.folder}`
				);
			const title =
				typeof entry.title === "string" && entry.title.trim()
					? entry.title
					: folder.folder.replace(/[-_]+/g, " ");
			return [
				{
					id: `file-${slug}`,
					slug,
					title,
					artistCredit:
						typeof entry.artistCredit === "string"
							? entry.artistCredit
							: "Artist credit placeholder",
					description:
						typeof entry.description === "string"
							? entry.description
							: "Print placement and garment specifications are pending MASK confirmation.",
					images,
					material: typeof material === "string" ? material : "To be confirmed",
					gsm: typeof gsm === "number" ? gsm : null,
					sizeChart: chart,
					campaign: {
						id: `file-campaign-${slug}`,
						moq,
						paidQuantity: 0,
						preorderClose,
						status: "open"
					},
					variants: fits.flatMap(({ type, sizes: fitSizes, price }) =>
						fitSizes.map((size) => ({
							id: `file-${slug}-${type}-${size}`,
							garmentType: type,
							size,
							colour,
							pricePaise: price,
							sku: `MASK-FILE-${slug}-${type}-${size}`
						}))
					)
				}
			];
		});
}

export async function readDesignProducts(): Promise<{
	products: StoreProduct[];
	fingerprint: string;
}> {
	const artwork = path.join(designDirectory, "artwork");
	const [json, entries] = await Promise.all([
		readFile(path.join(designDirectory, "catalog.json"), "utf8"),
		readdir(artwork, { withFileTypes: true })
	]);
	const folders = await Promise.all(
		entries
			.filter((entry) => entry.isDirectory())
			.map(async (entry) => ({
				folder: entry.name,
				files: (
					await readdir(path.join(artwork, entry.name), { withFileTypes: true })
				)
					.filter((file) => file.isFile())
					.map((file) => file.name)
			}))
	);
	const products = designProducts(folders, JSON.parse(json) as unknown);
	return {
		products,
		fingerprint: createHash("sha256")
			.update(JSON.stringify(products))
			.digest("hex")
	};
}
