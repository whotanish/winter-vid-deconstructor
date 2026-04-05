export const runtime = "edge"; // no body-size limit, native streaming, no CORS issues

const ALLOWED = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const mimeType    = req.headers.get("x-mime-type") ?? "";
  const fileSize    = req.headers.get("x-file-size") ?? "0";
  const displayName = req.headers.get("x-display-name") ?? "video";

  if (!ALLOWED.has(mimeType)) {
    return Response.json({ error: "Invalid mime type" }, { status: 400 });
  }
  if (!req.body) return Response.json({ error: "Empty body" }, { status: 400 });

  // ── 1. Initiate a Gemini resumable session (server-side, API key stays hidden) ─
  const initRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": fileSize,
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: displayName } }),
    }
  );

  if (!initRes.ok) {
    return Response.json({ error: `Gemini init failed: ${await initRes.text()}` }, { status: initRes.status });
  }

  const uploadUrl = initRes.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) return Response.json({ error: "No upload URL from Gemini" }, { status: 502 });

  // ── 2. Pipe the request body directly to Gemini — never buffered in memory ─────
  const geminiRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": fileSize,
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    // @ts-expect-error duplex required for streaming bodies in some runtimes
    duplex: "half",
    body: req.body,
  });

  if (!geminiRes.ok) {
    return Response.json({ error: `Gemini upload failed: ${await geminiRes.text()}` }, { status: geminiRes.status });
  }

  const data = await geminiRes.json() as { file: { name: string; uri: string } };
  return Response.json({ file: { name: data.file.name, uri: data.file.uri } });
}
