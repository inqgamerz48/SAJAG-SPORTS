import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";
import AdminMobileHeader from "../components/AdminMobileHeader";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/admin/login");
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <AdminSidebar />
            <AdminMobileHeader />
            <main className="flex-1 overflow-y-auto p-4 pt-20 lg:p-8 lg:pt-8 relative z-0">
                {children}
            </main>
        </div>
    );
}
