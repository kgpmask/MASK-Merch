import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDatabase } from "@/lib/database";
import { Admin, User } from "@/models";
import { parseEmailAllowList } from "@/lib/store/access";

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
        { $set: { googleId: profile?.sub ?? "", name: user.name ?? "MASK student", image: user.image, lastLoginAt: new Date() }, $setOnInsert: { firstLoginAt: new Date() } },
        { upsert: true },
      );
      if (adminEmails().includes(user.email.toLowerCase())) await Admin.updateOne({ email: user.email.toLowerCase() }, { $setOnInsert: { createdAt: new Date() } }, { upsert: true });
      return true;
    },
  },
});
