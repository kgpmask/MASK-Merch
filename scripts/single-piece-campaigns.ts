import { config } from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../src/lib/database";
import { Campaign } from "../src/models";

config({ path: ".env.local", quiet: true });

async function update(): Promise<void> {
	try {
		await connectDatabase();
		const result = await Campaign.updateMany(
			{ status: { $in: ["draft", "open"] }, moq: { $gt: 1 } },
			{ $set: { moq: 1 } }
		);
		console.log(
			`Updated ${result.modifiedCount} draft/open campaigns to a single-piece minimum. Existing statuses, orders and payment records were preserved.`
		);
	} finally {
		await mongoose.disconnect();
	}
}

update().catch(() => {
	console.error("Could not update campaigns. Check database access.");
	process.exitCode = 1;
});
