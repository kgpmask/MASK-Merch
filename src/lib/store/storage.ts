import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { storeConfig } from "@/lib/store/config";

const allowedMime = new Map([
	["image/jpeg", ".jpg"],
	["image/png", ".png"],
	["image/webp", ".webp"]
]);
export interface ProofStorage {
	put(file: File): Promise<string>;
	get(key: string): Promise<{ bytes: Buffer; contentType: string }>;
}

class LocalProofStorage implements ProofStorage {
	private root = path.join(process.cwd(), ".private", "payment-proofs");
	async put(file: File): Promise<string> {
		const extension = allowedMime.get(file.type);
		if (!extension)
			throw new Error("Only JPEG, PNG, and WebP proof images are accepted.");
		if (file.size < 1 || file.size > storeConfig.maxProofBytes)
			throw new Error(
				`Proof image must be smaller than ${Math.floor(storeConfig.maxProofBytes / 1_048_576)} MB.`
			);
		const bytes = Buffer.from(await file.arrayBuffer());
		const valid =
			file.type === "image/jpeg"
				? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
				: file.type === "image/png"
					? bytes
							.subarray(0, 8)
							.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
					: bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
						bytes.subarray(8, 12).toString("ascii") === "WEBP";
		if (!valid)
			throw new Error("The uploaded file content does not match its image type.");
		await mkdir(this.root, { recursive: true });
		const key = `${randomUUID()}${extension}`;
		await writeFile(path.join(this.root, key), bytes, { flag: "wx" });
		return key;
	}
	async get(key: string): Promise<{ bytes: Buffer; contentType: string }> {
		if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(key))
			throw new Error("Invalid proof key.");
		const extension = path.extname(key);
		const types: Record<string, string> = {
			".jpg": "image/jpeg",
			".png": "image/png",
			".webp": "image/webp"
		};
		return {
			bytes: await readFile(path.join(this.root, key)),
			contentType: types[extension] ?? "application/octet-stream"
		};
	}
}

export function proofStorage(): ProofStorage {
	const provider = process.env.PAYMENT_PROOF_STORAGE ?? "local";
	if (provider !== "local")
		throw new Error(
			"Configure a production ProofStorage adapter for the selected provider."
		);
	if (process.env.NODE_ENV === "production")
		throw new Error(
			"Local payment-proof storage is disabled in production. Configure private object storage."
		);
	return new LocalProofStorage();
}
