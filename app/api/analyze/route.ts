import { NextRequest } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Part,
} from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

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
      let tmpPath: string | null = null;

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in .env.local");

        const formData = await req.formData();
        const videoFile = formData.get("video") as File | null;
        const userPrompt = (formData.get("prompt") as string | null) || "Analyze this video.";
        const description = (formData.get("description") as string | null) || "";

        if (!videoFile) throw new Error("No video file provided");

        // ── Step 1: Write to tmp & upload ────────────────────────────────────
        send(stepEvent("upload", "active"));

        const bytes = await videoFile.arrayBuffer();
        const ext = videoFile.name.split(".").pop() ?? "mp4";
        tmpPath = join(tmpdir(), `${randomUUID()}.${ext}`);
        await writeFile(tmpPath, Buffer.from(bytes));

        const fileManager = new GoogleAIFileManager(apiKey);
        const uploadResult = await fileManager.uploadFile(tmpPath, {
          mimeType: videoFile.type,
          displayName: videoFile.name,
        });

        send(stepEvent("upload", "done"));

        // ── Step 2: Poll until ACTIVE ─────────────────────────────────────────
        send(stepEvent("process", "active"));

        let fileInfo = await fileManager.getFile(uploadResult.file.name);
        const deadline = Date.now() + 4 * 60 * 1000;

        while (fileInfo.state === FileState.PROCESSING) {
          if (Date.now() > deadline) throw new Error("File processing timed out after 4 minutes");
          await new Promise((r) => setTimeout(r, 3000));
          fileInfo = await fileManager.getFile(uploadResult.file.name);
        }

        if (fileInfo.state === FileState.FAILED) throw new Error("Gemini file processing failed");

        send(stepEvent("process", "done"));

        // ── Step 3: Generate with streaming ──────────────────────────────────
        send(stepEvent("analyze", "active"));

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-3.1-pro-preview",
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        });

        const parts: Part[] = [
          { fileData: { mimeType: videoFile.type, fileUri: fileInfo.uri } },
        ];
        if (description) parts.push({ text: `Video description: ${description}\n\n` });
        parts.push({ text: userPrompt });

        const streamResult = await model.generateContentStream({
          contents: [{ role: "user", parts }],
        });

        send(stepEvent("analyze", "done"));

        // ── Step 4: Stream text chunks ────────────────────────────────────────
        send(stepEvent("extract", "active"));

        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) send(sse({ chunk: text }));
        }

        send(stepEvent("extract", "done"));
        send(enc.encode("data: [DONE]\n\n"));

        // cleanup remote file (best-effort)
        fileManager.deleteFile(uploadResult.file.name).catch(() => undefined);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send(sse({ error: message }));
      } finally {
        if (tmpPath) unlink(tmpPath).catch(() => undefined);
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
