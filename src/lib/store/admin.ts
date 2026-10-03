import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/store/permissions";
export async function guardAdminPage(): Promise<{ name: string; email: string }> { const session = await auth(); if (!session?.user?.email || !isAdminEmail(session.user.email)) redirect("/store"); return { name: session.user.name ?? "MASK admin", email: session.user.email.toLowerCase() }; }

export function csvCell(value: string | number | null | undefined): string { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
