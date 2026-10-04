import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { connectDatabase } from "@/lib/database";
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

async function validatedImage(file: File): Promise<{
	bytes: Buffer;
	extension: string;
}> {
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
	return { bytes, extension };
}

class LocalProofStorage implements ProofStorage {
	private root = path.join(process.cwd(), ".private", "payment-proofs");
	async put(file: File): Promise<string> {
		const { bytes, extension } = await validatedImage(file);
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

class MongoProofStorage implements ProofStorage {
	private async bucket(): Promise<mongoose.mongo.GridFSBucket> {
		const database = await connectDatabase();
		const db = database.connection.db;
		if (!db) throw new Error("MongoDB is not connected.");
		return new mongoose.mongo.GridFSBucket(db, {
			bucketName: process.env.PAYMENT_PROOF_GRIDFS_BUCKET ?? "paymentProofs"
		});
	}

	async put(file: File): Promise<string> {
		const { bytes, extension } = await validatedImage(file);
		const bucket = await this.bucket();
		const upload = bucket.openUploadStream(`${randomUUID()}${extension}`, {
			metadata: { contentType: file.type }
		});
		await new Promise<void>((resolve, reject) => {
			upload.once("error", reject);
			upload.once("finish", () => resolve());
			upload.end(bytes);
		});
		return upload.id.toString();
	}

	async get(key: string): Promise<{ bytes: Buffer; contentType: string }> {
		if (!/^[a-f0-9]{24}$/.test(key)) throw new Error("Invalid proof key.");
		const bucket = await this.bucket();
		const id = new mongoose.Types.ObjectId(key);
		const stored = await bucket.find({ _id: id }).limit(1).next();
		if (!stored) throw new Error("Payment proof was not found.");
		const chunks: Buffer[] = [];
		for await (const chunk of bucket.openDownloadStream(id)) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}
		const metadata = stored.metadata as { contentType?: unknown } | undefined;
		return {
			bytes: Buffer.concat(chunks),
			contentType:
				typeof metadata?.contentType === "string"
					? metadata.contentType
					: "application/octet-stream"
		};
	}
}

export function proofStorage(): ProofStorage {
	const provider =
		process.env.PAYMENT_PROOF_STORAGE ??
		(process.env.NODE_ENV === "production" ? "mongodb" : "local");
	if (provider === "mongodb") return new MongoProofStorage();
	if (provider === "local" && process.env.NODE_ENV !== "production")
		return new LocalProofStorage();
	if (provider === "local")
		throw new Error(
			"Local payment-proof storage is disabled in production. Set PAYMENT_PROOF_STORAGE=mongodb."
		);
	throw new Error(`Unsupported payment-proof storage provider: ${provider}.`);
}
