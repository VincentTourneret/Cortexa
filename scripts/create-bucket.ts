import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const s3AdminClient = new S3Client({
    endpoint: process.env.S3_ENDPOINT || "http://localhost:8333",
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.ADMIN_KEY || "admin_access",
        secretAccessKey: process.env.ADMIN_SECRET || "admin_secret",
    },
    forcePathStyle: true,
});

async function createBucket() {
    try {
        console.log("Attempting to create bucket 'app' with ADMIN credentials...");
        await s3AdminClient.send(new CreateBucketCommand({ Bucket: "app" }));
        console.log("Bucket 'app' created successfully!");
    } catch (error) {
        console.error("Error creating bucket:", error);
    }
}

createBucket();
