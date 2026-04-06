import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED = new Set(["video/mp4", "video/quicktime", "video/webm"]);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request): Promise<Response> {
  const { mimeType, fileName } = await req.json() as { mimeType: string; fileName: string };

  if (!ALLOWED.has(mimeType)) {
    return Response.json({ error: "Invalid video type" }, { status: 400 });
  }

  const key = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET_NAME!,
      Key:         key,
      ContentType: mimeType,
    }),
    { expiresIn: 3600 }
  );

  return Response.json({ uploadUrl: url, key });
}
