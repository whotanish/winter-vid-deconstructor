import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest } from "next/server";

const ALLOWED = new Set(["video/mp4", "video/quicktime", "video/webm"]);

// Token endpoint for @vercel/blob client-side uploads.
// The browser calls this to get a short-lived token, then uploads directly
// to Vercel Blob CDN — no Vercel function body limit in the upload path.
export async function POST(req: NextRequest): Promise<Response> {
  const body = (await req.json()) as HandleUploadBody;

  const response = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async (_pathname, clientPayload) => {
      const mimeType = clientPayload ?? "";
      if (!ALLOWED.has(mimeType)) throw new Error("Invalid video type");
      return {
        allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm"],
        maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
        tokenPayload: mimeType,
      };
    },
    onUploadCompleted: async () => {
      // Cleanup handled by the analyze route after Gemini processing.
    },
  });

  return Response.json(response);
}
