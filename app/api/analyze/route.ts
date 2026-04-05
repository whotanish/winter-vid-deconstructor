import { NextRequest } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Part,
} from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";

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

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

        const { fileName, mimeType, prompt: userPrompt, description } = await req.json() as {
          fileName: string;
          mimeType: string;
          prompt?: string;
          description?: string;
        };

        if (!fileName) throw new Error("Missing fileName");
        if (!mimeType) throw new Error("Missing mimeType");

        // ── Step 1: Poll until the file is ACTIVE ─────────────────────────────
        send(stepEvent("process", "active"));

        const fileManager = new GoogleAIFileManager(apiKey);
        let fileInfo = await fileManager.getFile(fileName);
        const deadline = Date.now() + 4 * 60 * 1000;

        while (fileInfo.state === FileState.PROCESSING) {
          if (Date.now() > deadline) throw new Error("File processing timed out after 4 minutes");
          await new Promise((r) => setTimeout(r, 3000));
          fileInfo = await fileManager.getFile(fileName);
        }
        if (fileInfo.state === FileState.FAILED) throw new Error("Gemini file processing failed");

        send(stepEvent("process", "done"));

        // ── Step 2: Generate with streaming ───────────────────────────────────
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

        // ── Step 3: Stream text chunks ─────────────────────────────────────────
        send(stepEvent("extract", "active"));

        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) send(sse({ chunk: text }));
        }

        send(stepEvent("extract", "done"));
        send(enc.encode("data: [DONE]\n\n"));

        fileManager.deleteFile(fileName).catch(() => undefined);
      } catch (err) {
        send(sse({ error: err instanceof Error ? err.message : String(err) }));
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
