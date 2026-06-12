import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const stuckOrderIds = [
    "a91f0670-bc75-4049-96a3-9bef45534db3",
    "12b7f797-905e-429d-a79d-f52ff76dae2a",
    "ab7f4a4d-5ae9-47e1-b05f-9e663d924680",
    "9210deb2-51ac-4608-a08a-1e8f1427769c",
    "a7cccc55-c542-45f2-b23f-176fb48817b4",
    "e742e0d7-1303-4810-8345-02b1a9763459",
    "10895ba0-0adc-4a3f-b5b3-68d3c3dadf46",
    "f825872b-03a7-4811-8b54-5af07458b030"
  ];

  try {
    const result = await prisma.order.updateMany({
      where: {
        id: { in: stuckOrderIds }
      },
      data: {
        status: "Completed",
        reversePickupBookedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack });
  }
}
