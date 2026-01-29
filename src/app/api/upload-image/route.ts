import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ success: 0, message: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = file.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const bucketName = process.env.S3_BUCKET || "app";

        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: fileName,
                Body: buffer,
                ContentType: file.type,
            })
        );

        return NextResponse.json({
            success: 1,
            file: {
                url: `/api/images/${fileName}`,
            },
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: 0, message: "Upload failed" }, { status: 500 });
    }
}
