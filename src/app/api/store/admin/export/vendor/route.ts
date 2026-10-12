import { NextResponse } from "next/server";
import { requireAdminApi as requireAdmin } from "@/lib/auth";
import { connectDatabase } from "@/lib/database";
import { Order } from "@/models";
import { csvCell } from "@/lib/store/admin";
export async function GET(): Promise<NextResponse> {
	try {
		await requireAdmin();
		await connectDatabase();
		const orders = await Order.find({
			status: { $in: ["confirmed", "ready_for_pickup", "collected"] }
		}).lean();
		const groups = new Map<
			string,
			{
				design: string;
				garment: string;
				size: string;
				quantity: number;
				sku: string;
				notes: string;
				backName: string;
			}
		>();
		for (const order of orders)
			for (const item of order.items) {
				const key = JSON.stringify([
					item.productTitle,
					item.garmentType,
					item.size,
					item.sku,
					item.backName ?? ""
				]);
				const current = groups.get(key);
				if (current) current.quantity += item.quantity;
				else
					groups.set(key, {
						design: item.productTitle,
						garment: item.garmentType,
						size: item.size,
						quantity: item.quantity,
						sku: item.sku,
						notes: "",
						backName: item.backName ?? ""
					});
			}
		const rows = [
			[
				"Design",
				"Garment Type",
				"Size",
				"Quantity",
				"SKU",
				"Vendor Notes",
				"Name on Back"
			],
			...[...groups.values()].map((item) => [
				item.design,
				item.garment,
				item.size,
				item.quantity,
				item.sku,
				item.notes,
				item.backName
			])
		];
		const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
		return new NextResponse(csv, {
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": "attachment; filename=mask-vendor-orders.csv",
				"Cache-Control": "private, no-store"
			}
		});
	} catch {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}
}
