import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/database";
import { Order, Payment } from "@/models";
import { requireUser } from "@/lib/store/permissions";
import { assertRateLimit } from "@/lib/store/rate-limit";
import { proofStorage } from "@/lib/store/storage";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await requireUser();
    assertRateLimit(`proof:${user.email}`, 6, 60_000);
    const data = await request.formData();
    const orderNumber = String(data.get("orderNumber") ?? "").trim().toUpperCase();
    const utr = String(data.get("utr") ?? "").trim().toUpperCase();
    const payerName = String(data.get("payerName") ?? "").trim();
    const transactionAt = new Date(String(data.get("transactionAt") ?? ""));
    const proof = data.get("proof");
    if (!/^MASK-\d+$/.test(orderNumber) || !/^[A-Z0-9-]{6,40}$/.test(utr) || payerName.length < 2 || Number.isNaN(transactionAt.getTime()) || !(proof instanceof File)) throw new Error("Complete every payment field with valid details.");
    await connectDatabase();
    const order = await Order.findOne({ orderNumber, "user.email": user.email, status: "payment_pending" });
    if (!order) throw new Error("Order is not awaiting payment proof.");
    const proofKey = await proofStorage().put(proof);
    const payment = await Payment.findOneAndUpdate({ orderId: order._id, status: "pending", utr: { $exists: false } }, { $set: { utr, payerName, transactionAt, proofKey, submittedAt: new Date(), status: "submitted" } }, { new: true });
    if (!payment) throw new Error("Payment proof was already submitted.");
    await Order.updateOne({ _id: order._id, status: "payment_pending" }, { $set: { status: "payment_submitted", paymentStatus: "submitted" } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("duplicate key") ? "That UTR has already been submitted." : error instanceof Error ? error.message : "Submission failed.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 400 });
  }
}
