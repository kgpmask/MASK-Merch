import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDatabase } from "@/lib/database";
import { Admin, User } from "@/models";
import { assertRateLimit } from "@/lib/store/rate-limit";
// import { parseEmailAllowList } from "@/lib/auth";

export function parseEmailAllowList(value: string | undefined): string[] {
	return (value ?? "")
		.split(",")
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);
}
export function emailIsAllowed(
	email: string | null | undefined,
	allowList: string | undefined
): boolean {
	return Boolean(
		email && parseEmailAllowList(allowList).includes(email.toLowerCase())
	);
}

export function adminEmails(): string[] {
	return parseEmailAllowList(process.env.ADMIN_EMAILS);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [Google],
	session: { strategy: "jwt" },
	pages: { signIn: "/store/checkout" },
	callbacks: {
		authorized: async ({ auth: session }) => Boolean(session),
		signIn: async ({ user, profile }) => {
			if (!user.email) return false;
			await connectDatabase();
			await User.findOneAndUpdate(
				{ email: user.email.toLowerCase() },
				{
					$set: {
						googleId: profile?.sub ?? "",
						name: user.name ?? "MASK student",
						image: user.image,
						lastLoginAt: new Date()
					},
					$setOnInsert: { firstLoginAt: new Date() }
				},
				{ upsert: true }
			);
			if (adminEmails().includes(user.email.toLowerCase()))
				await Admin.updateOne(
					{ email: user.email.toLowerCase() },
					{ $setOnInsert: { createdAt: new Date() } },
					{ upsert: true }
				);
			return true;
		}
	}
});

export async function requireUser(): Promise<{
	name: string;
	email: string;
	image?: string;
}> {
	const session = await auth();
	if (!session?.user?.email) throw new Error("UNAUTHENTICATED");
	return {
		name: session.user.name ?? "MASK student",
		email: session.user.email.toLowerCase(),
		...(session.user.image ? { image: session.user.image } : {})
	};
}
export async function requireAdmin(): Promise<{ name: string; email: string }> {
	const user = await requireUser();
	if (!adminEmails().includes(user.email)) throw new Error("FORBIDDEN");
	return { name: user.name, email: user.email };
}
export async function requireAdminApi(): Promise<{
	name: string;
	email: string;
}> {
	const admin = await requireAdmin();
	assertRateLimit(`admin-api:${admin.email}`, 60, 60_000);
	return admin;
}
