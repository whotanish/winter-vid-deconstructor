import { NextRequest } from "next/server";
import busboy from "busboy";
import { Readable, PassThrough } from "stream";

export const maxDuration = 300;

// App Router handles the raw stream itself — bodyParser is never invoked.
// The equivalent of `api: { bodyParser: false }` from Pages Router is implicit here.

const ALLOWED = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export async function POST(req: NextRequest): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }
  if (!req.body) return Response.json({ error: "Empty body" }, { status: 400 });

  return new Promise<Response>((resolve) => {
    const bb = busboy({ headers: { "content-type": contentType } });

    // Metadata fields — must be appended to FormData before the file field
    // so busboy sees them first as it streams through the multipart body.
    let mimeType = "";
    let displayName = "";
    let fileSize = 0;

    let settled = false;
    const done = (res: Response) => {
      if (!settled) { settled = true; resolve(res); }
    };

    bb.on("field", (name, val) => {
      if (name === "mimeType")    mimeType    = val;
      if (name === "displayName") displayName = val;
      if (name === "fileSize")    fileSize    = parseInt(val, 10);
    });

    bb.on("file", (_field, fileStream, _info) => {
      if (!ALLOWED.has(mimeType)) {
        fileStream.resume(); // drain so the connection closes cleanly
        done(Response.json({ error: "Invalid mime type" }, { status: 400 }));
        return;
      }

      // PassThrough lets busboy keep writing while we async-init the Gemini session.
      // Node.js handles backpressure automatically through pipe().
      const pass = new PassThrough();
      fileStream.pipe(pass);

      (async () => {
        try {
          // ── 1. Initiate a Gemini resumable upload session ─────────────────
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
              body: JSON.stringify({ file: { display_name: displayName || "video" } }),
            }
          );

          if (!initRes.ok) {
            pass.destroy();
            throw new Error(`Gemini init failed (${initRes.status}): ${await initRes.text()}`);
          }

          const uploadUrl = initRes.headers.get("X-Goog-Upload-URL");
          if (!uploadUrl) throw new Error("No upload URL returned by Gemini");

          // ── 2. Stream chunks: PassThrough → fetch body → Gemini ───────────
          // Any chunks that arrived while we awaited initRes are queued in `pass`.
          // Node's fetch reads them immediately, then streams the rest live.
          const webReadable = Readable.toWeb(pass) as ReadableStream<Uint8Array>;

          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              "Content-Length": String(fileSize),
              "X-Goog-Upload-Offset": "0",
              "X-Goog-Upload-Command": "upload, finalize",
            },
            // duplex: "half" is required for streaming request bodies in Node 18+
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error not in TS types yet
            duplex: "half",
            body: webReadable,
          });

          if (!uploadRes.ok) {
            throw new Error(`Gemini upload failed (${uploadRes.status}): ${await uploadRes.text()}`);
          }

          const data = await uploadRes.json() as { file: { name: string; uri: string } };
          done(Response.json({ file: { name: data.file.name, uri: data.file.uri } }));
        } catch (err) {
          done(Response.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 }
          ));
        }
      })();
    });

    bb.on("error", (err: Error) => done(Response.json({ error: err.message }, { status: 500 })));

    // Convert Web ReadableStream → Node.js Readable → busboy parser
    Readable.fromWeb(req.body as import("stream/web").ReadableStream).pipe(bb);
  });
}
