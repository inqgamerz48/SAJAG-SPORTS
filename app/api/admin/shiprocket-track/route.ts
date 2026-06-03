import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { trackShipment } from "@/lib/shiprocket";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { awbCode } = await req.json();

        if (!awbCode) {
            return NextResponse.json({ error: "AWB Code is required" }, { status: 400 });
        }

        const trackingData = await trackShipment(awbCode);

        if (!trackingData.success) {
            throw new Error(trackingData.error || "Shiprocket API returned an error");
        }

        return NextResponse.json(trackingData);

    } catch (error) {
        console.error("Error fetching Shiprocket tracking:", error);
        return NextResponse.json({ error: "Failed to fetch tracking data" }, { status: 500 });
    }
}
