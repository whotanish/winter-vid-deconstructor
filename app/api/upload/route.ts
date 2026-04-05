export const runtime = "edge";
// Edge runtime: no 4.5 MB serverless body limit, no CORS issues.
// We buffer the file in memory (Edge limit is 128 MB) — this avoids
// the duplex:"half" Node.js extension that crashes in Cloudflare Workers.

const ALLOWED = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const mimeType    = req.headers.get("x-mime-type") ?? "";
  const displayName = req.headers.get("x-display-name") ?? "video";

  if (!ALLOWED.has(mimeType)) {
    return Response.json({ error: "Invalid mime type" }, { status: 400 });
  }

  // Buffer the file — arrayBuffer() works in Edge with no streaming quirks.
  // Actual byte count is used so we're never off from what the browser reported.
  const fileBuffer = await req.arrayBuffer();
  const fileSize   = fileBuffer.byteLength;

  // ── 1. Initiate a Gemini resumable upload session ──────────────────────────
  const initRes = await fetch(
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
      body: JSON.stringify({ file: { display_name: displayName } }),
    }
  );

  if (!initRes.ok) {
    return Response.json(
      { error: `Gemini init failed (${initRes.status}): ${await initRes.text()}` },
      { status: initRes.status }
    );
  }

  const uploadUrl = initRes.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) return Response.json({ error: "No upload URL from Gemini" }, { status: 502 });

  // ── 2. Upload the buffered file to Gemini ──────────────────────────────────
  const geminiRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: fileBuffer, // ArrayBuffer — no duplex needed, works everywhere
  });

  if (!geminiRes.ok) {
    return Response.json(
      { error: `Gemini upload failed (${geminiRes.status}): ${await geminiRes.text()}` },
      { status: geminiRes.status }
    );
  }

  const data = await geminiRes.json() as { file: { name: string; uri: string } };
  return Response.json({ file: { name: data.file.name, uri: data.file.uri } });
}
