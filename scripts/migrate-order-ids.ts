import { config } from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../src/lib/database";
import { formatOrderNumber } from "../src/lib/store/order-number";
import { AuditLog, Order, Payment } from "../src/models";

config({ path: ".env.local", quiet: true });

async function migrate(): Promise<void> {
	await connectDatabase();
	const session = await mongoose.startSession();
	let migrated = 0;
	try {
		await session.withTransaction(async () => {
			const orders = await Order.find({ orderNumber: /^MASK-\d+$/ })
				.sort({ createdAt: 1, _id: 1 })
				.session(session);
			const changes = orders.map((order) => {
				const sequence = Number(order.orderNumber.slice("MASK-".length));
				return {
					order,
					oldNumber: order.orderNumber,
					newNumber: formatOrderNumber(sequence, order.createdAt)
				};
			});
			const targetNumbers = changes.map((change) => change.newNumber);
			if (new Set(targetNumbers).size !== targetNumbers.length)
				throw new Error("Generated order IDs are not unique.");
			const conflicts = await Order.countDocuments({
				orderNumber: { $in: targetNumbers }
			}).session(session);
			if (conflicts > 0) throw new Error("A generated order ID already exists.");

			for (const change of changes) {
				await Order.updateOne(
					{ _id: change.order._id, orderNumber: change.oldNumber },
					{ $set: { orderNumber: change.newNumber } },
					{ session }
				);
				await Promise.all([
					Payment.updateOne(
						{ orderId: change.order._id },
						{ $set: { orderNumber: change.newNumber } },
						{ session }
					),
					AuditLog.updateMany(
						{ entityType: "order", entityId: change.oldNumber },
						{ $set: { entityId: change.newNumber } },
						{ session }
					)
				]);
				migrated += 1;
			}
		});
		console.log(
			`Migrated ${migrated} legacy order IDs and their linked records.`
		);
	} finally {
		await session.endSession();
		await mongoose.disconnect();
	}
}

migrate().catch(() => {
	console.error(
		"Could not migrate order IDs. No partial migration was committed."
	);
	process.exitCode = 1;
});
