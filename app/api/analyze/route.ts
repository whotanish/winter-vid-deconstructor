import { NextRequest } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Part,
} from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { del } from "@vercel/blob";

export const maxDuration = 300;

const enc = new TextEncoder();

function sse(data: unknown): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function stepEvent(id: string, status: "pending" | "active" | "done" | "error"): Uint8Array {
  return sse({ step: { id, status } });
}

export async function POST(req: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: Uint8Array) => controller.enqueue(chunk);
      let geminiFileName: string | null = null;
      let blobUrl: string | null = null;

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in .env.local");

        const body = await req.json() as {
          blobUrl: string;
          mimeType: string;
          prompt?: string;
          description?: string;
        };

        blobUrl = body.blobUrl;
        const { mimeType, description } = body;
        const userPrompt = body.prompt || "Analyze this video.";

        if (!blobUrl) throw new Error("Missing blobUrl");
        if (!mimeType) throw new Error("Missing mimeType");

        // ── Step 1: Stream video from Vercel Blob → Gemini Files API ─────────
        send(stepEvent("gemini_upload", "active"));

        const blobRes = await fetch(blobUrl);
        if (!blobRes.ok || !blobRes.body) {
          throw new Error(`Failed to fetch video from Blob storage (${blobRes.status})`);
        }

        const fileSize = parseInt(blobRes.headers.get("content-length") ?? "0", 10);

        // Initiate a resumable Gemini upload session
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
            body: JSON.stringify({ file: { display_name: "video" } }),
          }
        );
        if (!initRes.ok) throw new Error(`Gemini upload init failed: ${await initRes.text()}`);

        const uploadUrl = initRes.headers.get("X-Goog-Upload-URL");
        if (!uploadUrl) throw new Error("No upload URL returned by Gemini");

        // Stream the blob body directly to Gemini — never buffered in memory
        const geminiUploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Length": String(fileSize),
            "X-Goog-Upload-Offset": "0",
            "X-Goog-Upload-Command": "upload, finalize",
          },
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error duplex required for streaming request body in Node 18+
          duplex: "half",
          body: blobRes.body,
        });
        if (!geminiUploadRes.ok) {
          throw new Error(`Gemini upload failed: ${await geminiUploadRes.text()}`);
        }

        const uploadData = await geminiUploadRes.json() as { file: { name: string } };
        geminiFileName = uploadData.file.name;

        send(stepEvent("gemini_upload", "done"));

        // ── Step 2: Poll until the file is ACTIVE ─────────────────────────────
        send(stepEvent("process", "active"));

        const fileManager = new GoogleAIFileManager(apiKey);
        let fileInfo = await fileManager.getFile(geminiFileName);
        const deadline = Date.now() + 4 * 60 * 1000;

        while (fileInfo.state === FileState.PROCESSING) {
          if (Date.now() > deadline) throw new Error("File processing timed out after 4 minutes");
          await new Promise((r) => setTimeout(r, 3000));
          fileInfo = await fileManager.getFile(geminiFileName);
        }
        if (fileInfo.state === FileState.FAILED) throw new Error("Gemini file processing failed");

        send(stepEvent("process", "done"));

        // ── Step 3: Generate with streaming ───────────────────────────────────
        send(stepEvent("analyze", "active"));

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-3.1-pro-preview",
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        });

        const parts: Part[] = [{ fileData: { mimeType, fileUri: fileInfo.uri } }];
        if (description) parts.push({ text: `Video description: ${description}\n\n` });
        parts.push({ text: userPrompt });

        const streamResult = await model.generateContentStream({
          contents: [{ role: "user", parts }],
        });

        send(stepEvent("analyze", "done"));

        // ── Step 4: Stream text chunks ─────────────────────────────────────────
        send(stepEvent("extract", "active"));

        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) send(sse({ chunk: text }));
        }

        send(stepEvent("extract", "done"));
        send(enc.encode("data: [DONE]\n\n"));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send(sse({ error: message }));
      } finally {
        // Cleanup — best-effort, don't await
        if (geminiFileName) {
          const apiKey = process.env.GEMINI_API_KEY!;
          new GoogleAIFileManager(apiKey).deleteFile(geminiFileName).catch(() => undefined);
        }
        if (blobUrl) del(blobUrl).catch(() => undefined);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
