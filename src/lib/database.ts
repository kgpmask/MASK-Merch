import mongoose from "mongoose";

type MongooseCache = {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
};
const globalForMongoose = globalThis as typeof globalThis & {
	mongooseCache?: MongooseCache;
};
const cache = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
globalForMongoose.mongooseCache = cache;

export async function connectDatabase(): Promise<typeof mongoose> {
	const uri = process.env.MONGO_URL;
	if (!uri) throw new Error("MONGO_URL is not configured.");
	if (cache.conn) return cache.conn;
	cache.promise ??= mongoose.connect(uri, { bufferCommands: false });
	try {
		cache.conn = await cache.promise;
		return cache.conn;
	} catch (error) {
		cache.promise = null;
		throw error;
	}
}
