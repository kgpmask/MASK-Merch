import { auth, adminEmails } from "@/auth";
import { emailIsAllowed } from "@/lib/store/access";
import { assertRateLimit } from "@/lib/store/rate-limit";

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
export function isAdminEmail(email: string | null | undefined): boolean {
	return emailIsAllowed(email, process.env.ADMIN_EMAILS);
}
