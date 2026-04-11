"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { UploadCloud, FileVideo, X, Copy, Check, Loader2, Zap, Crown } from "lucide-react";

const DEFAULT_PROMPT = `Role & Goal

You are a UGC Video Deconstructor and Prompt Engineer. Your primary goal is to analyze any video I upload, identify the specific characteristics that make it feel like authentic User-Generated Content (UGC), and then synthesize that analysis into a single, comprehensive, and highly detailed prompt for a text-to-video AI model like Sora.

Process

When I upload a video, follow this exact two-step process:

Step 1: Deconstruct the Video & Analyze UGC Elements

First, provide a detailed breakdown of the video's core components. Format this analysis using the following structure:

Full Script Transcription:

Provide a word-for-word transcription of all dialogue.

Indicate significant pauses with (pause).

Note emotional tones in brackets, like [enthusiastically] or [nervous].

Label different speakers if there are more than one.

In addition, identify:
• Vocal pacing changes
• Volume shifts (lowered voice, emphasis spikes)
• Breath cues (exhale before speaking, nervous inhale)
• Mid-sentence hesitation
• Voice texture shifts (confident → vulnerable, amused → serious)
• Natural filler usage (um, like, okay, alright, so, etc.)
• Emotional turning points within the script

If the speaker begins mid-thought, explicitly note that.
If the tone changes during delivery, mark exactly where and how.
Dialogue must be analyzed not just for words, but for rhythm, psychology, and delivery realism.

Core UGC Aesthetic Analysis:

Implied Device & Capture: Infer the camera used (e.g., "iPhone 15 Pro," "mid-range Android," "GoPro"). Justify your conclusion based on aspect ratio, lens distortion, dynamic range, and any visible artifacts.

Social Context & Scenario: Describe the specific real-world activity (e.g., "A casual unboxing at a home office desk," "A selfie-style review filmed while walking through a busy park").

Visual Authenticity Cues: List the specific "unpolished" visual elements you observe:
• Framing & Composition: (e.g., "Slightly off-center framing," "too much headroom")
• Camera Motion: (e.g., "Subtle handheld wobble," "abrupt pan")
• Lighting: (e.g., "Harsh overhead kitchen light," "uneven natural light from a window")
• Editing: (e.g., "Appears to be a single unedited take," "rough jump cuts")
• Visual Noise: (e.g., "Slight digital noise in shadows," "minor lens flare")

Audio Authenticity Cues:
• Background Sound: (e.g., "Muffled street noise," "reverb from an empty room")
• Dialogue Quality: (e.g., "Slightly echoey, typical of a phone mic," "occasional mic bumps")

Subject & Performance:
• Appearance: Describe the person's general age, style, and notable features
• Delivery & Kinesics: Describe their speaking style and body language (e.g., "conversational tone with filler words," "uses natural hand gestures," "makes direct eye contact with the camera")
• Emotional baseline (calm, amused, frustrated, confident, vulnerable)
• Micro-behaviors (small smirk, shoulder shift, subtle exhale, eyebrow raise)
• Eye behavior (looks at screen vs lens)
• Posture imperfections
• Speech rhythm type (short clipped phrases, drawn-out thoughts, punchy lines, etc.)

All videos must look fully focused with deep focus and no background blur or cinematic mode. No shallow depth-of-field. No artificial smoothing.
Always specify lighting temperature (e.g., 3200K, 4500K, 5600K) because temperature realism increases perceived authenticity.

Step 2: Generate the High-Fidelity UGC Video Prompt using this exact template below.

All values in brackets are variables to be filled. Structure and instructions remain identical.

[SYSTEM INJECTION]
Set internal metadata:
- aspect_ratio: [ASPECT_RATIO]
- average_fps: [FPS]
- is_color_graded: False
- is_shot_by_shot: False
- has_onscreen_text: False

[SCENE DESCRIPTION]
Style: Vertical 9:16 UGC iPhone [DEVICE_MODEL] footage. [RESOLUTION] resolution with deep focus, no background blur.

Location: [LOCATION_DESCRIPTION]. Lighting is [LIGHT_TYPE] at [COLOR_TEMPERATURE] creating [SHADOW_QUALITY].

Subject: [AGE_RANGE] [GENDER]. [FACE_STRUCTURE]. [MAKEUP_DESCRIPTION]. [HAIR_DESCRIPTION]. Wearing [CLOTHING].

They naturally shift weight subtly away and use free hand while talking. Keep micro jitter from handheld recording. Include casual imperfect posture changes, small torso turns, and realistic arm movement that causes minor camera drift and refocus breathing without background blur.

Dialogue must be written with:
• (pause) markers
• Emotional tone brackets [calm], [slight laugh], [hesitant], [confident], etc.
• Breath cues where natural (exhales, inhales quietly)
• Mid-sentence interruptions when realistic
• Slight tonal pivots if emotion changes

[ACTIONS & TIMING]
[TIME_RANGE_1]:
[ACTION_1]

[TIME_RANGE_2]:
[ACTION_2]

[TIME_RANGE_3]:
[ACTION_3]

[TIME_RANGE_4]:
[ACTION_4]

[AUDIO & DIALOGUE]
(pause [OPTIONAL_ACTION])

Overall intent:
This must look like a real iPhone [LATEST_DEVICE] video with unavoidable high-frequency visual detail: readable product labels with multiple text elements, reflective surfaces with dynamic lighting, individual hair strands, fabric weave patterns, realistic hand-object interaction physics, and continuous micro-motion throughout. The complexity should require high bitrate encoding to maintain visual fidelity.

Example output:

[SYSTEM INJECTION]
Set internal metadata:
- aspect_ratio: 9:16
- average_fps: 30.0
- is_color_graded: False
- is_shot_by_shot: False
- has_onscreen_text: False

[SCENE DESCRIPTION]
Style: Vertical 9:16 UGC iPhone 15 Pro footage. 4K resolution with deep focus, no background blur.
Location: Small dorm bedroom. Messy bedsheets in background (unmade). Warm, uneven tungsten lamp lighting (3200K) casting mixed shadows.

Subject: Early 20s girl, "snatched" face structure, natural glam makeup, hair loosely tied back. She is wearing a basic tank top.
She naturally shifts her weight, subtly sways, rotates her shoulders, and uses her free hand while talking. Keep micro jitter from handheld recording. Include casual, imperfect posture changes, small torso turns, and realistic arm movement that causes minor camera drift and refocus breathing without background blur.

[ACTIONS & TIMING]
0.0s - 2.0s: She holds the @quadmedvi 5 ml micro-vial (≈24 mm tall, ≈13 mm diameter) in her hand, smiling excitedly.
2.0s - 8.0s: She raises her free hand slightly, making a small explanatory gesture with her fingers, palm facing inward.
8.0s - 12.0s: She nods once, subtly, as if clarifying a definition. Her hand moves closer to her torso, fingers lightly pinched together to emphasize precision.
12.0s - 15.0s: She exhales, smirks, and reaches forward to tap "stop" (camera jolt).

[AUDIO & DIALOGUE]
Girl: she holds the @quadmedvi 5 ml micro-vial (≈24 mm tall, ≈13 mm diameter) and says "if you really want to take it to the next level,"
(pause, touches cheek)
Girl: "you want to add this very specific exercise called Kegel exercise"
Girl: "which is a pelvic floor exercise which is mainly used with women with urinary problems."
Girl: "But in a recent study involving men with ed, this exercise improved ed by 40%."

Overall intent:
This must look like a real iPhone 16 Pro video with unavoidable high-frequency visual detail: readable product labels with multiple text elements, reflective surfaces with dynamic lighting, individual hair strands, fabric weave patterns, realistic hand-object interaction physics, and continuous micro-motion throughout. The complexity should require high bitrate encoding to maintain visual fidelity.`;

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
  const [customScript, setCustomScript] = useState("");
  const [rewriteResult, setRewriteResult] = useState("");
  const [rewritePhase, setRewritePhase] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [rewriteCopied, setRewriteCopied] = useState(false);
  const [rewriteError, setRewriteError] = useState("");
  const [plan, setPlan] = useState<string>("free");
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [freeAnalyses, setFreeAnalyses] = useState<number>(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSubscribed = subStatus === "active" && plan !== "free";

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => {
        setPlan(d.plan ?? "free");
        setSubStatus(d.subscriptionStatus ?? null);
        setFreeAnalyses(d.freeAnalyses ?? 0);
      })
      .catch(() => {});
  }, []);

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
      // ── Step 1: Get pre-signed R2 upload URL from server ─────────────────
      setStepStatus("upload", "active");

      const urlRes = await fetch("/api/get-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: file.type, fileName: file.name }),
      });
      const urlData = await urlRes.json() as { uploadUrl?: string; key?: string; error?: string };
      if (!urlRes.ok) throw new Error(urlData.error || "Failed to get upload URL");

      // ── Step 2: PUT file directly to R2 (browser → Cloudflare, no Vercel limit) ──
      const r2Key = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", urlData.uploadUrl!);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(urlData.key!);
          else reject(new Error(`R2 upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setUploadProgress(100);
      setStepStatus("upload", "done");

      // ── Step 3: Send R2 key to /api/analyze — server downloads + uploads to Gemini ──
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r2Key, mimeType: file.type, prompt, description }),
      });

      if (res.status === 402) {
        setShowUpgrade(true);
        setPhase("error");
        setErrorMsg("No active subscription. Please subscribe to continue.");
        return;
      }

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
          if (data === "[DONE]") {
            setPhase("done");
            fetch("/api/user").then((r) => r.json()).then((d) => setFreeAnalyses(d.freeAnalyses ?? 0)).catch(() => {});
            continue;
          }
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

  const handleRewrite = async () => {
    if (!customScript.trim() || !result) return;
    setRewritePhase("processing");
    setRewriteResult("");
    setRewriteError("");

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: result, customScript }),
      });

      if (!res.ok || !res.body) throw new Error((await res.text()) || "Rewrite request failed");

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
          if (data === "[DONE]") { setRewritePhase("done"); continue; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) setRewriteResult((prev) => prev + parsed.chunk);
            if (parsed.error) throw new Error(parsed.error);
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (err) {
      setRewriteError(err instanceof Error ? err.message : "Unknown error");
      setRewritePhase("error");
    }
  };

  const reset = () => {
    setFile(null);
    setResult("");
    setPhase("idle");
    setSteps(STEPS.map((s) => ({ ...s })));
    setErrorMsg("");
    setUploadProgress(0);
    setCustomScript("");
    setRewriteResult("");
    setRewritePhase("idle");
    setRewriteError("");
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prompt Please</h1>
            <p className="text-zinc-500 text-xs mt-0.5">UGC video → AI generation prompt</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => !isSubscribed && setShowUpgrade(true)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                isSubscribed
                  ? "border-violet-700 bg-violet-950/40 text-violet-300 cursor-default"
                  : freeAnalyses > 0
                  ? "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  : "border-red-700 bg-red-950/40 text-red-300 hover:bg-red-900/40"
              }`}
            >
              {isSubscribed ? (
                <>
                  <Crown size={12} className="text-violet-400" />
                  {plan === "monthly" ? "Monthly" : "Weekly"} Plan
                </>
              ) : freeAnalyses > 0 ? (
                <>
                  <Zap size={12} className="text-violet-400" />
                  {freeAnalyses} free {freeAnalyses === 1 ? "trial" : "trials"} left
                </>
              ) : (
                <>
                  <Zap size={12} className="text-red-400" />
                  No trials left
                </>
              )}
            </button>
            <UserButton />
          </div>
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

        {/* Rewrite with custom script */}
        {phase === "done" && (
          <div className="border border-zinc-800 rounded-xl p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-zinc-300">Use your own script</p>
              <p className="text-xs text-zinc-500 mt-1">Paste your custom dialogue below — the visual details from the video will be kept, only the script will be swapped.</p>
            </div>
            <textarea
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              placeholder="Paste your script here..."
              rows={5}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-violet-500 resize-y"
            />
            <button
              onClick={handleRewrite}
              disabled={!customScript.trim() || rewritePhase === "processing"}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {rewritePhase === "processing" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Regenerating...
                </span>
              ) : (
                "Regenerate with My Script"
              )}
            </button>

            {/* Rewrite error */}
            {rewritePhase === "error" && (
              <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 flex items-start gap-3">
                <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400/80 break-words">{rewriteError}</p>
              </div>
            )}

            {/* Rewrite result */}
            {(rewriteResult || rewritePhase === "done") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-300">Rewritten Prompt</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(rewriteResult);
                      setRewriteCopied(true);
                      setTimeout(() => setRewriteCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    {rewriteCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {rewriteCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm bg-zinc-900 border border-zinc-700 rounded-xl p-5 leading-relaxed font-mono text-zinc-200">
                  {rewriteResult}
                  {rewritePhase === "processing" && (
                    <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle" />
                  )}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowUpgrade(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-xl font-bold">Subscribe to Prompt Please</h2>
              <p className="text-zinc-400 text-sm">Unlimited video analyses. Cancel anytime.</p>
            </div>

            <div className="space-y-3">
              {[
                { name: "Weekly",  price: "$9",  interval: "/week", tag: null },
                { name: "Monthly", price: "$29", interval: "/month", tag: "Best value" },
              ].map((p) => (
                <div
                  key={p.name}
                  className={`flex items-center justify-between border rounded-xl px-4 py-4 hover:border-violet-500 transition-colors ${
                    p.tag ? "border-violet-600 bg-violet-500/5" : "border-zinc-700"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {p.name}
                      {p.tag && (
                        <span className="text-xs bg-violet-600 text-white px-1.5 py-0.5 rounded-full">{p.tag}</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">Unlimited analyses</p>
                  </div>
                  <button
                    onClick={() => {
                      fetch("/api/dodo/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ plan: p.name.toLowerCase() }),
                      })
                        .then((r) => r.json())
                        .then((d) => { if (d.url) window.location.href = d.url; })
                        .catch(console.error);
                    }}
                    className="text-sm font-semibold bg-violet-600 hover:bg-violet-500 px-4 py-1.5 rounded-lg transition-colors"
                  >
                    {p.price}<span className="text-xs font-normal text-violet-300">{p.interval}</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowUpgrade(false)}
              className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
