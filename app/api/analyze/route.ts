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
      let blobUrl: string | undefined;
      let geminiFileName: string | undefined;

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

        const { blobUrl: incomingBlobUrl, mimeType, prompt: userPrompt, description } =
          await req.json() as {
            blobUrl: string;
            mimeType: string;
            prompt?: string;
            description?: string;
          };

        if (!incomingBlobUrl) throw new Error("Missing blobUrl");
        if (!mimeType) throw new Error("Missing mimeType");
        blobUrl = incomingBlobUrl;

        // ── Step 1: Download from Vercel Blob and upload to Gemini Files API ──
        send(stepEvent("process", "active"));

        const blobResponse = await fetch(blobUrl);
        if (!blobResponse.ok) throw new Error("Failed to download video from storage");
        const fileBuffer = await blobResponse.arrayBuffer();
        const fileSize = fileBuffer.byteLength;

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
        if (!initRes.ok) throw new Error(`Gemini upload init failed (${initRes.status})`);

        const uploadUrl = initRes.headers.get("X-Goog-Upload-URL");
        if (!uploadUrl) throw new Error("No upload URL from Gemini");

        const geminiRes = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "X-Goog-Upload-Offset": "0",
            "X-Goog-Upload-Command": "upload, finalize",
          },
          body: fileBuffer,
        });
        if (!geminiRes.ok) throw new Error(`Gemini upload failed (${geminiRes.status})`);

        const { file: geminiFile } = await geminiRes.json() as { file: { name: string; uri: string } };
        geminiFileName = geminiFile.name;

        del(blobUrl).catch(() => undefined);
        blobUrl = undefined;

        // ── Step 2: Poll until Gemini file is ACTIVE ──────────────────────────
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
        parts.push({ text: userPrompt || "Analyze this video." });

        const streamResult = await model.generateContentStream({
          contents: [{ role: "user", parts }],
        });

        send(stepEvent("analyze", "done"));
        send(stepEvent("extract", "active"));

        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) send(sse({ chunk: text }));
        }

        send(stepEvent("extract", "done"));
        send(enc.encode("data: [DONE]\n\n"));

        fileManager.deleteFile(geminiFileName).catch(() => undefined);
      } catch (err) {
        send(sse({ error: err instanceof Error ? err.message : String(err) }));
        if (blobUrl) del(blobUrl).catch(() => undefined);
        if (geminiFileName) {
          const apiKey = process.env.GEMINI_API_KEY;
          if (apiKey) new GoogleAIFileManager(apiKey).deleteFile(geminiFileName).catch(() => undefined);
        }
      } finally {
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
