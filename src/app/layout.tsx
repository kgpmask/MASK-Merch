import type { Metadata } from "next";
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/store/CartProvider";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/store/permissions";

export const metadata: Metadata = { title: { default: "MASK Merch", template: "%s | MASK Merch" }, description: "Unofficial community preorder store inspired by Manga and Anime Society Kharagpur." };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): Promise<React.ReactElement> {
  const session = await auth();
  return <html lang="en"><body><CartProvider><div className="siteContainer"><Navbar user={session?.user?.email ? { name: session.user.name ?? "Student", email: session.user.email, isAdmin: isAdminEmail(session.user.email) } : null} /><main className="mainContent">{children}</main><Footer /></div></CartProvider></body></html>;
}
