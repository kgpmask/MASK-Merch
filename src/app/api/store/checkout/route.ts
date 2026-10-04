import { NextResponse } from "next/server";
import { createOrder } from "@/lib/store/orders";
import { requireUser } from "@/lib/store/permissions";
import { assertRateLimit } from "@/lib/store/rate-limit";
import type { CartInput } from "@/types/store";

export async function POST(request: Request): Promise<NextResponse> {
	try {
		const user = await requireUser();
		assertRateLimit(`checkout:${user.email}`, 5, 60_000);
		const body = (await request.json()) as {
			items?: CartInput[];
			policyAccepted?: boolean;
		};
		const result = await createOrder(
			user,
			body.items ?? [],
			body.policyAccepted === true
		);
		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Checkout failed.";
		const status =
			message === "UNAUTHENTICATED" ? 401 : message === "RATE_LIMITED" ? 429 : 400;
		return NextResponse.json({ error: message }, { status });
	}
}
