import { NextResponse } from "next/server";
import { requireAdminApi as requireAdmin } from "@/lib/store/permissions";
import { connectDatabase } from "@/lib/database";
import { Order } from "@/models";
import { csvCell } from "@/lib/store/admin";
export async function GET(): Promise<NextResponse> { try { await requireAdmin(); await connectDatabase(); const orders = await Order.find({ status: { $in: ["confirmed", "ready_for_pickup", "collected"] } }).sort({ "user.name": 1 }).lean(); const rows = [["Order Number", "Student Name", "Google Email", "Items", "Status", "Collected At"], ...orders.map((order) => [order.orderNumber, order.user.name, order.user.email, order.items.map((item) => `${item.productTitle} / ${item.garmentType} / ${item.size} x${item.quantity}`).join("; "), order.status, order.collectedAt?.toISOString() ?? ""])]; const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n"); return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=mask-pickup-sheet.csv", "Cache-Control": "private, no-store" } }); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); } }
