import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest): Promise<Response> {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm"],
        maximumSizeInBytes: 2 * 1024 * 1024 * 1024, // 2 GB
      }),
      onUploadCompleted: async () => {
        // no-op — analysis is triggered separately by the client
      },
    });
    return Response.json(jsonResponse);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload handler error" },
      { status: 400 }
    );
  }
}
