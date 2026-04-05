"use client";

import { useState, useCallback, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { UploadCloud, FileVideo, X, Copy, Check, Loader2 } from "lucide-react";

const DEFAULT_PROMPT = `Analyze this video carefully and extract or reconstruct the exact prompt(s) used to generate it if it appears to be AI-generated, or describe what a precise generative AI prompt would need to look like to recreate this video.

Include:
- Subject and main action
- Art style, visual aesthetic, and mood
- Camera movement and shot type
- Lighting and color palette
- Background/environment details
- Any text overlays or special effects
- Aspect ratio and duration cues

Format the output as a clean, copy-paste ready prompt optimized for video generation models like Sora, Runway, or Kling.`;

type Step = {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
};

const STEPS: Step[] = [
  { id: "upload",  label: "Uploading video to Gemini Files API",  status: "pending" },
  { id: "process", label: "Waiting for file to become active",    status: "pending" },
  { id: "analyze", label: "Analyzing video with Gemini",          status: "pending" },
  { id: "extract", label: "Extracting prompt",                    status: "pending" },
];

export default function Home() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [steps, setSteps] = useState<Step[]>(STEPS.map((s) => ({ ...s })));
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const setStepStatus = (id: string, status: Step["status"]) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && isValidVideo(dropped)) setFile(dropped);
  }, []);

  const isValidVideo = (f: File) => {
    const allowed = ["video/mp4", "video/quicktime", "video/webm"];
    return allowed.includes(f.type) && f.size <= 2 * 1024 * 1024 * 1024;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && isValidVideo(f)) setFile(f);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setPhase("processing");
    setResult("");
    setErrorMsg("");
    setUploadProgress(0);
    setSteps(STEPS.map((s) => ({ ...s })));

    try {
      // ── Step 1: Upload directly to Vercel Blob CDN (bypasses Vercel body limit) ──
      setStepStatus("upload", "active");

      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: file.type,
        multipart: true,
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(Math.round(percentage));
        },
      });

      setUploadProgress(100);
      setStepStatus("upload", "done");

      // ── Step 2: Send blob URL to /api/analyze — server uploads to Gemini + streams back ──
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl: blob.url, mimeType: file.type, prompt, description }),
      });

      if (!res.ok || !res.body) {
        throw new Error((await res.text()) || "Analysis request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") { setPhase("done"); continue; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.step) setStepStatus(parsed.step.id, parsed.step.status);
            if (parsed.chunk) setResult((prev) => prev + parsed.chunk);
            if (parsed.error) throw new Error(parsed.error);
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setPhase("error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setFile(null);
    setResult("");
    setPhase("idle");
    setSteps(STEPS.map((s) => ({ ...s })));
    setErrorMsg("");
    setUploadProgress(0);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        <div className="text-center space-y-2 pt-8">
          <h1 className="text-3xl font-bold tracking-tight">Prompt Extractor</h1>
          <p className="text-zinc-400 text-sm">
            Upload a video and extract or reverse-engineer its generation prompt using Gemini
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !file && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-violet-500 bg-violet-500/10"
              : file
              ? "border-zinc-600 bg-zinc-900 cursor-default"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                <FileVideo className="text-violet-400 shrink-0" size={24} />
                <div>
                  <p className="font-medium text-sm truncate max-w-sm">{file.name}</p>
                  <p className="text-zinc-500 text-xs">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <UploadCloud className="mx-auto text-zinc-500" size={36} />
              <div>
                <p className="font-medium">Drop your video here</p>
                <p className="text-zinc-500 text-sm mt-1">MP4, MOV, WebM &middot; up to 2 GB (Gemini limit)</p>
              </div>
              <p className="text-xs text-zinc-600">or click to browse</p>
            </div>
          )}
        </div>

        {/* Optional description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">
            Video description <span className="text-zinc-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any context about the video to help Gemini understand it better..."
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>

        {/* Analysis prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Analysis prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm font-mono placeholder-zinc-600 focus:outline-none focus:border-violet-500 resize-y"
          />
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!file || phase === "processing"}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {phase === "processing" ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Analysing...
            </span>
          ) : (
            "Analyse & Extract Prompt"
          )}
        </button>

        {/* Progress steps */}
        {phase === "processing" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Progress</p>
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <span className="shrink-0">
                  {step.status === "done" ? (
                    <Check size={15} className="text-emerald-400" />
                  ) : step.status === "active" ? (
                    <Loader2 size={15} className="animate-spin text-violet-400" />
                  ) : step.status === "error" ? (
                    <X size={15} className="text-red-400" />
                  ) : (
                    <span className="block w-[15px] h-[15px] rounded-full border border-zinc-700" />
                  )}
                </span>
                <span className={`text-sm ${
                  step.status === "done" ? "text-zinc-300"
                  : step.status === "active" ? "text-zinc-100"
                  : "text-zinc-600"
                }`}>
                  {step.label}
                  {step.id === "upload" && step.status === "active" && uploadProgress > 0 && (
                    <span className="ml-2 text-violet-400 text-xs">{uploadProgress}%</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 flex items-start gap-3">
            <X size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-sm font-medium text-red-300">Analysis failed</p>
              <p className="text-xs text-red-400/80 break-words">{errorMsg}</p>
            </div>
            <button onClick={reset} className="text-xs text-red-400 hover:text-red-200 transition-colors shrink-0">
              Try again
            </button>
          </div>
        )}

        {/* Result */}
        {(result || phase === "done") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-300">Extracted Prompt</p>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={reset}
                  className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400"
                >
                  Reset
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-sm bg-zinc-900 border border-zinc-700 rounded-xl p-5 leading-relaxed font-mono text-zinc-200">
              {result}
              {phase === "processing" && (
                <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle" />
              )}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
