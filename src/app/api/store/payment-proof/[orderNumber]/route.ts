import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/database";
import { Order, Payment } from "@/models";
import { isAdminEmail, requireUser } from "@/lib/store/permissions";
import { proofStorage } from "@/lib/store/storage";

export async function GET(_request: Request, context: { params: Promise<{ orderNumber: string }> }): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const { orderNumber } = await context.params;
    await connectDatabase();
    const order = await Order.findOne({ orderNumber });
    if (!order || (order.user.email !== user.email && !isAdminEmail(user.email))) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const payment = await Payment.findOne({ orderId: order._id });
    if (!payment?.proofKey) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const file = await proofStorage().get(payment.proofKey);
    return new NextResponse(new Uint8Array(file.bytes), { headers: { "Content-Type": file.contentType, "Cache-Control": "private, no-store", "Content-Disposition": `inline; filename=proof-${orderNumber}` } });
  } catch { return NextResponse.json({ error: "Not authorised." }, { status: 403 }); }
}
