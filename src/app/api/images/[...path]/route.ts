import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const fileName = path.join("/");
        const bucketName = process.env.S3_BUCKET || "app";

        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: fileName,
            })
        );

        if (!response.Body) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Convert readable stream to Uint8Array
        const bodyContents = await response.Body.transformToByteArray();

        return new NextResponse(Buffer.from(bodyContents), {
            headers: {
                "Content-Type": response.ContentType || "image/jpeg",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Serve error:", error);
        return new NextResponse("Not Found", { status: 404 });
    }
}
