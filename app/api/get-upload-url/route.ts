import { NextRequest } from "next/server";

const ALLOWED = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const { mimeType, displayName, fileSize } = await req.json() as {
    mimeType: string;
    displayName: string;
    fileSize: number;
  };

  if (!ALLOWED.has(mimeType)) {
    return Response.json({ error: "Invalid mime type" }, { status: 400 });
  }

  // Initiate a Gemini resumable upload session — returns a session URL the browser
  // can POST the raw file bytes to directly. API key stays server-side.
  const res = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(fileSize),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: displayName || "video" } }),
    }
  );

  if (!res.ok) {
    return Response.json({ error: `Gemini error: ${await res.text()}` }, { status: res.status });
  }

  const uploadUrl = res.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) return Response.json({ error: "No upload URL returned by Gemini" }, { status: 502 });

  return Response.json({ uploadUrl });
}
