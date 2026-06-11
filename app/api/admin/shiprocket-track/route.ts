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

        console.log(
            "[SHIPROCKET RAW TRACKING RESPONSE]",
            JSON.stringify(trackingData, null, 2)
        );

        if (!trackingData.success) {
            throw new Error(trackingData.error || "Shiprocket API returned an error");
        }

        const rawData = trackingData.data as any;
        const shipmentTrack = rawData?.tracking_data?.shipment_track?.[0];

        if (!shipmentTrack) {
            const errorMsg = rawData?.tracking_data?.error || "No tracking activities found for this AWB.";
            return NextResponse.json({
                success: true,
                status: "Not Found",
                current_location: null,
                awb_code: awbCode,
                message: errorMsg
            });
        }

        return NextResponse.json({
            success: true,
            status: shipmentTrack.current_status || "Not Found",
            current_location: shipmentTrack.current_location || null,
            awb_code: shipmentTrack.awb_code || awbCode
        });

    } catch (error) {
        console.error("Error fetching Shiprocket tracking:", error);
        return NextResponse.json({ 
            error: "Failed to fetch tracking data", 
            reason: "An unexpected error occurred while communicating with Shiprocket tracking API." 
        }, { status: 500 });
    }
}
