import { NextRequest } from "next/server";

const ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  let body: { mimeType?: string; displayName?: string; fileSize?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { mimeType, displayName, fileSize } = body;

  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return Response.json({ error: "Invalid or missing mimeType" }, { status: 400 });
  }
  if (!fileSize || fileSize <= 0) {
    return Response.json({ error: "Invalid or missing fileSize" }, { status: 400 });
  }

  // Initiate a resumable upload session with the Gemini Files API.
  // The returned upload URL does not contain the API key — safe to hand to the browser.
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
      body: JSON.stringify({ file: { display_name: displayName ?? "video" } }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return Response.json(
      { error: `Gemini upload init failed: ${text}` },
      { status: res.status }
    );
  }

  const uploadUrl = res.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    return Response.json({ error: "No upload URL returned by Gemini" }, { status: 502 });
  }

  return Response.json({ uploadUrl });
}
