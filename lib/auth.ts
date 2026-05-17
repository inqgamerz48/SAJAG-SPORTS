import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";

/**
 * Constant-time string comparison to avoid timing attacks during admin login.
 */
function safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
}

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const envSecret = process.env.NEXTAUTH_SECRET;

if (!envSecret) {
    // Don't throw — that would break next build and prerender. Instead, fall
    // back to a per-process random secret so no real session can be valid and
    // no forged JWT signed with a known key will be accepted.
    console.error(
        "[auth] NEXTAUTH_SECRET is missing. Using an ephemeral random secret. Admin sessions WILL NOT persist across restarts. Generate a real one with: openssl rand -base64 32"
    );
}
const nextAuthSecret = envSecret || crypto.randomBytes(48).toString("base64");

if (!adminEmail || !adminPassword) {
    // Log loudly. authorize() below will reject every login attempt while
    // these are unset, so the admin panel is locked rather than wide open.
    console.error(
        "[auth] ADMIN_EMAIL and ADMIN_PASSWORD must be set. Admin login is disabled until they are."
    );
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Admin Login",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "admin@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!adminEmail || !adminPassword) return null;
                if (!credentials?.email || !credentials?.password) return null;

                const emailOk = safeEqual(credentials.email, adminEmail);
                const passwordOk = safeEqual(credentials.password, adminPassword);

                if (emailOk && passwordOk) {
                    return { id: "1", name: "Sajag Admin", email: adminEmail, role: "admin" };
                }
                return null;
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                (session.user as any).role = token.role;
            }
            return session;
        }
    },
    pages: {
        signIn: '/admin/login',
    },
    secret: nextAuthSecret,
};
