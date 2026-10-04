import { connectDatabase } from "@/lib/database";
import { Campaign, Product } from "@/models";
import AdminAction from "@/components/store/AdminAction";
import MOQProgress from "@/components/store/MOQProgress";
import StatusBadge from "@/components/store/StatusBadge";
import pageStyles from "@/styles/StorePage.module.css";
import styles from "@/styles/Admin.module.css";
export default async function CampaignsPage(): Promise<React.ReactElement> {
	await connectDatabase();
	const campaigns = await Campaign.find().sort({ preorderClose: 1 }).lean();
	const products = await Product.find({
		_id: { $in: campaigns.map((item) => item.productId) }
	}).lean();
	return (
		<div className={pageStyles.page}>
			<header className={pageStyles.header}>
				<p className={pageStyles.kicker}>MOQ control</p>
				<h1>Campaigns</h1>
				<p>
					Close an open campaign after its deadline. The server chooses MOQ met or
					failed from verified paid quantity only.
				</p>
			</header>
			<div className={styles.campaigns}>
				{campaigns.map((campaign) => {
					const product = products.find(
						(item) => item._id.toString() === campaign.productId.toString()
					);
					return (
						<article
							className={styles.campaign}
							key={campaign._id.toString()}
						>
							<div>
								<h2>{product?.title ?? campaign.name}</h2>
								<p>
									Deadline {campaign.preorderClose.toLocaleString("en-IN")} ·{" "}
									{campaign.paidQuantity}/{campaign.moq} paid pieces
								</p>
								<MOQProgress
									paid={campaign.paidQuantity}
									moq={campaign.moq}
								/>
								<StatusBadge status={campaign.status} />
							</div>
							<div className={styles.actions}>
								{campaign.status === "open" && (
									<AdminAction
										endpoint={`/api/store/admin/campaigns/${campaign._id}`}
										action="decide"
										label="Close & decide MOQ"
										confirmText="Close this campaign using its current verified paid count?"
									/>
								)}
								{campaign.status === "MOQ_met" && (
									<AdminAction
										endpoint={`/api/store/admin/campaigns/${campaign._id}`}
										action="vendor_ordered"
										label="Mark vendor ordered"
									/>
								)}
								{campaign.status === "vendor_ordered" && (
									<AdminAction
										endpoint={`/api/store/admin/campaigns/${campaign._id}`}
										action="ready_for_pickup"
										label="Mark campaign ready"
									/>
								)}
								{campaign.status === "ready_for_pickup" && (
									<AdminAction
										endpoint={`/api/store/admin/campaigns/${campaign._id}`}
										action="close"
										label="Close campaign"
									/>
								)}
							</div>
						</article>
					);
				})}
			</div>
		</div>
	);
}
