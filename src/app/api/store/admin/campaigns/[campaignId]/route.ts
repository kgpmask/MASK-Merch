import { NextResponse } from "next/server";
import { decideCampaign } from "@/lib/store/orders";
import { requireAdminApi } from "@/lib/store/permissions";
import { connectDatabase } from "@/lib/database";
import { AuditLog, Campaign } from "@/models";
import { canTransitionCampaign } from "@/lib/store/transitions";
import type { CampaignStatus } from "@/types/store";

export async function POST(
	request: Request,
	context: { params: Promise<{ campaignId: string }> }
): Promise<NextResponse> {
	try {
		const admin = await requireAdminApi();
		const { campaignId } = await context.params;
		const body = (await request.json().catch(() => ({ action: "decide" }))) as {
			action?: string;
		};
		if (!body.action || body.action === "decide")
			return NextResponse.json({
				outcome: await decideCampaign(campaignId, admin.email)
			});
		const targets: Record<string, CampaignStatus> = {
			vendor_ordered: "vendor_ordered",
			ready_for_pickup: "ready_for_pickup",
			close: "closed"
		};
		const target = targets[body.action];
		if (!target) throw new Error("Unknown campaign action.");
		await connectDatabase();
		const campaign = await Campaign.findById(campaignId);
		if (!campaign || !canTransitionCampaign(campaign.status, target))
			throw new Error("Invalid campaign transition.");
		campaign.status = target;
		await campaign.save();
		await AuditLog.create({
			actorEmail: admin.email,
			action: `campaign_${target}`,
			entityType: "campaign",
			entityId: campaignId,
			metadata: {}
		});
		return NextResponse.json({ ok: true });
	} catch (error) {
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Campaign action failed."
			},
			{ status: 400 }
		);
	}
}
