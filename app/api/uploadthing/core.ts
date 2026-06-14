import { createUploadthing, type FileRouter } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const f = createUploadthing();

// Helper to check if user is admin OR a logged in customer
async function checkAuth() {
    // 1. Check Admin (NextAuth)
    const adminSession = await getServerSession(authOptions);
    if (adminSession?.user) return { userId: 'admin', role: 'admin' };

    // 2. Check Customer (Supabase)
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { userId: user.id, role: 'customer' };

    throw new Error("Unauthorized to upload");
}

export const ourFileRouter = {
    productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
        .middleware(async () => {
            const user = await checkAuth();
            if (user.role !== 'admin') throw new Error("Only admins can upload products");
            return { userId: user.userId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return { url: file.ufsUrl };
        }),
    repairImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async () => {
            // Public endpoint: Allow guest users (e.g., customers from ads without accounts) to upload repair images.
            return { userId: "guest" };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Repair image upload complete:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
