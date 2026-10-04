import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/database";
import { AuditLog, Campaign, Product, Variant } from "@/models";
import { requireAdminApi as requireAdmin } from "@/lib/store/permissions";
import { GARMENT_TYPES, type GarmentType } from "@/types/store";

type VariantInput = {
	garmentType: GarmentType;
	size: string;
	colour: string;
	pricePaise: number;
};
export async function POST(request: Request): Promise<NextResponse> {
	try {
		const admin = await requireAdmin();
		const body = (await request.json()) as {
			title?: string;
			slug?: string;
			artistCredit?: string;
			description?: string;
			images?: string[];
			moq?: number;
			preorderClose?: string;
			vendorNotes?: string;
			variants?: VariantInput[];
		};
		const title = body.title?.trim() ?? "";
		const slug = body.slug?.trim().toLowerCase() ?? "";
		const close = new Date(body.preorderClose ?? "");
		const variants = body.variants ?? [];
		if (
			title.length < 2 ||
			!/^[a-z0-9-]+$/.test(slug) ||
			!body.description?.trim() ||
			!Number.isSafeInteger(body.moq) ||
			(body.moq ?? 0) < 1 ||
			Number.isNaN(close.getTime()) ||
			close <= new Date() ||
			!variants.length
		)
			throw new Error("Complete all product, campaign and variant fields.");
		for (const variant of variants)
			if (
				!GARMENT_TYPES.includes(variant.garmentType) ||
				!variant.size?.trim() ||
				!variant.colour?.trim() ||
				!Number.isSafeInteger(variant.pricePaise) ||
				variant.pricePaise < 0
			)
				throw new Error("Invalid variant.");
		await connectDatabase();
		const session = await mongoose.startSession();
		try {
			await session.withTransaction(async () => {
				const [product] = await Product.create(
					[
						{
							title,
							slug,
							artistCredit: body.artistCredit?.trim() || "Artist credit placeholder",
							description: body.description?.trim(),
							images: body.images ?? [],
							active: false,
							sortOrder: 0
						}
					],
					{ session }
				);
				await Campaign.create(
					[
						{
							productId: product._id,
							name: `${title} preorder`,
							moq: body.moq,
							preorderStart: new Date(),
							preorderClose: close,
							paidQuantity: 0,
							status: "draft",
							vendorNotes: body.vendorNotes?.trim() ?? ""
						}
					],
					{ session }
				);
				await Variant.insertMany(
					variants.map((variant) => ({
						productId: product._id,
						...variant,
						size: variant.size.trim().toUpperCase(),
						colour: variant.colour.trim(),
						sku: `MASK-${slug.slice(0, 8).toUpperCase()}-${variant.garmentType.split("_")[0].toUpperCase()}-${variant.size.trim().toUpperCase()}`,
						active: true
					})),
					{ session }
				);
				await AuditLog.create(
					[
						{
							actorEmail: admin.email,
							action: "product_created",
							entityType: "product",
							entityId: product._id.toString(),
							metadata: { slug }
						}
					],
					{ session }
				);
			});
		} finally {
			await session.endSession();
		}
		return NextResponse.json({ ok: true }, { status: 201 });
	} catch (error) {
		const message =
			error instanceof Error && error.message.includes("duplicate key")
				? "Slug or generated SKU already exists."
				: error instanceof Error
					? error.message
					: "Create failed.";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}

export async function PATCH(request: Request): Promise<NextResponse> {
	try {
		const admin = await requireAdmin();
		const body = (await request.json()) as {
			productId?: string;
			action?: "publish" | "archive" | "move_up" | "move_down" | "update";
			title?: string;
			artistCredit?: string;
			description?: string;
			images?: string[];
			moq?: number;
			preorderClose?: string;
			variants?: Array<{ id: string; pricePaise: number; active: boolean }>;
		};
		if (!body.productId || !body.action)
			throw new Error("Invalid product action.");
		await connectDatabase();
		const product = await Product.findById(body.productId);
		if (!product) throw new Error("Product not found.");
		if (body.action === "update") {
			const close = new Date(body.preorderClose ?? "");
			const variants = body.variants ?? [];
			if (
				!body.title?.trim() ||
				!body.description?.trim() ||
				!body.artistCredit?.trim() ||
				!Number.isSafeInteger(body.moq) ||
				(body.moq ?? 0) < 1 ||
				Number.isNaN(close.getTime()) ||
				!variants.length ||
				variants.some(
					(variant) =>
						!Number.isSafeInteger(variant.pricePaise) || variant.pricePaise < 0
				)
			)
				throw new Error("Invalid product update.");
			product.title = body.title.trim();
			product.description = body.description.trim();
			product.artistCredit = body.artistCredit.trim();
			product.images = body.images ?? [];
			await Promise.all([
				Campaign.updateOne(
					{ productId: product._id, status: { $in: ["draft", "open"] } },
					{ $set: { moq: body.moq, preorderClose: close } }
				),
				Variant.bulkWrite(
					variants.map((variant) => ({
						updateOne: {
							filter: { _id: variant.id, productId: product._id },
							update: {
								$set: { pricePaise: variant.pricePaise, active: variant.active }
							}
						}
					}))
				)
			]);
		} else if (body.action === "publish") {
			product.active = true;
			await Campaign.updateOne(
				{ productId: product._id, status: "draft" },
				{ $set: { status: "open", preorderStart: new Date() } }
			);
		} else if (body.action === "archive") product.active = false;
		else product.sortOrder += body.action === "move_up" ? -1 : 1;
		await product.save();
		await AuditLog.create({
			actorEmail: admin.email,
			action: `product_${body.action}`,
			entityType: "product",
			entityId: body.productId,
			metadata: {}
		});
		return NextResponse.json({ ok: true });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Update failed." },
			{ status: 400 }
		);
	}
}
