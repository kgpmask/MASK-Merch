import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/store/permissions";
import {
	recordRefund,
	rejectPayment,
	transitionFulfilment,
	verifyPayment
} from "@/lib/store/orders";

export async function POST(
	request: Request,
	context: { params: Promise<{ orderNumber: string }> }
): Promise<NextResponse> {
	try {
		const admin = await requireAdminApi();
		const { orderNumber } = await context.params;
		const body = (await request.json()) as {
			action?: string;
			reason?: string;
			refundUtr?: string;
			amountPaise?: number;
			refundedAt?: string;
		};
		let changed = false;
		if (body.action === "verify")
			changed = await verifyPayment(orderNumber, admin.email);
		else if (body.action === "reject")
			changed = await rejectPayment(orderNumber, admin.email, body.reason ?? "");
		else if (body.action === "refund")
			changed = await recordRefund(
				orderNumber,
				admin.email,
				body.refundUtr ?? "",
				body.amountPaise ?? 0,
				new Date(body.refundedAt ?? "")
			);
		else if (body.action === "ready" || body.action === "collected")
			changed = await transitionFulfilment(orderNumber, admin.email, body.action);
		else throw new Error("Unknown action.");
		return NextResponse.json({ ok: true, changed });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Admin action failed.";
		return NextResponse.json(
			{ error: message },
			{
				status: message === "FORBIDDEN" || message === "UNAUTHENTICATED" ? 403 : 400
			}
		);
	}
}
