import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || "http://localhost:8333",
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.APP_KEY || "app_access",
        secretAccessKey: process.env.APP_SECRET || "app_secret",
    },
    forcePathStyle: true, // Necessary for SeaweedFS
});

export { s3Client };
