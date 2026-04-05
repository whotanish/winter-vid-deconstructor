// Proxies a single chunk of a Gemini resumable upload.
// Each chunk is ≤3 MB — well within Vercel's 4.5 MB serverless body limit.
// Gemini requires non-final chunks to be exact multiples of 256 KB (3 MB = 12×256 KB ✓).

export async function POST(req: Request): Promise<Response> {
  const uploadUrl = req.headers.get("x-upload-url");
  const offset    = req.headers.get("x-offset") ?? "0";
  const isLast    = req.headers.get("x-is-last") === "true";

  if (!uploadUrl) {
    return Response.json({ error: "Missing x-upload-url header" }, { status: 400 });
  }

  const chunk = await req.arrayBuffer();

  const geminiRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Offset":  offset,
      "X-Goog-Upload-Command": isLast ? "upload, finalize" : "upload",
    },
    body: chunk,
  });

  if (!geminiRes.ok) {
    return Response.json(
      { error: `Gemini chunk upload failed (${geminiRes.status}): ${await geminiRes.text()}` },
      { status: geminiRes.status }
    );
  }

  if (isLast) {
    const data = await geminiRes.json() as { file: { name: string; uri: string } };
    return Response.json({ file: { name: data.file.name, uri: data.file.uri } });
  }

  return Response.json({ ok: true });
}
