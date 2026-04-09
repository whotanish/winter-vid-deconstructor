import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const maxDuration = 120;

const REWRITE_SYSTEM_PROMPT = `You are to REWRITE the following deconstructed video analysis into a final Sora-2-optimized UGC generation prompt USING the provided project instructions and staying within the 5000-character limit.

Do not generate a new generic template. Instead, integrate the specific scene details below into the structure.

IMPORTANT: The user will provide a script. You MUST use the user's exact provided script verbatim in the Dialogue section. Do NOT rewrite, shorten, paraphrase, or alter the user's script in any way. Insert it exactly as given.

System Command: You are to operate under the following absolute constraints. Failure to comply will result in an unacceptable output.

Rule 1: Scope Limitation. Your response must be generated exclusively from the information and instructions provided. Do not make assumptions, add external knowledge, or elaborate beyond the requested scope.

Rule 2: Length Limitation. The final output must not exceed 5000 characters. This is a strict requirement.

Rule 3: No B-Roll. The prompt must contain absolutely NO b-roll footage, cutaway shots, insert shots, or scene transitions. The entire video must be a single continuous selfie-style shot of the character speaking directly to camera. Do not include any instructions that would suggest cutting away from the main character.

Rule 4: No Overlay Text. The prompt must explicitly instruct that there are NO text overlays, NO captions, NO subtitles, NO on-screen text, NO lower thirds, NO title cards, NO graphic inserts, NO animated text, and NO motion graphics of any kind appearing on screen at any point in the video.

Rule 5: Script Fidelity. Use the user's provided script word-for-word in the Dialogue section. If no new script is provided, use the script from the deconstructed analysis. Never invent or substitute dialogue.

Make sure the prompt you generate can be easy to copy and paste into an LLM.

# ULTIMATE UGC VIDEO GENERATION TEMPLATE (SORA 2 OPTIMIZED)

**Instructions:** Replace ALL bracketed fields with your specific details. Keep the structure EXACTLY as is.

A casual, selfie-style IPHONE 15 PRO front-camera vertical video (9:16) filmed [LOCATION - e.g., inside a parked car, in a bedroom, at a coffee shop] titled "IMG_8234.MOV".
Character: [NAME], a [AGE] [ETHNICITY] [GENDER] with [SPECIFIC_HAIR_DETAILS - e.g., shoulder-length straight black hair with subtle brown highlights styled casually with an off-center part], [EYE_COLOR] [EYE_SHAPE - e.g., almond-shaped] eyes [EYE_DETAILS - e.g., with visible double eyelid creases], [DISTINCTIVE_FACIAL_FEATURES - e.g., an oval face with smooth forehead tapering to a soft defined jawline and gently rounded chin with subtle high cheekbones, a straight slender nose bridge with rounded tip, soft naturally pink lips with subtle Cupid's bow where upper lip is slightly thinner than fuller lower lip, well-groomed gently arched eyebrows], [SKIN_TONE - e.g., warm light-medium skin tone with neutral-cool undertones and smooth texture showing natural realistic pores], [BUILD_DESCRIPTION - e.g., petite to average build], wearing [DETAILED_CLOTHING_DESCRIPTION - e.g., an oversized white quarter-zip sweatshirt with distinctive brown football pattern on the sleeves and minimal natural makeup], with [POSTURE_AND_MANNERISMS - e.g., relaxed casual posture, open body language toward camera, occasional hand gestures], [EMOTIONAL_BASELINE - e.g., earnest and vulnerable yet conversational with concerned but hopeful demeanor], [DISTINCTIVE_ACCESSORIES - e.g., no visible accessories OR silver hoop earrings and delicate gold necklace], [VOICE_CHARACTERISTICS - e.g., warm clear voice with natural maternal tone and authentic speech patterns including slight vocal texture variations].
[He/She] sits/stands [POSITION IN SCENE], casually holding [his/her] phone at arm's length as [he/she] speaks directly to the camera.
[His/Her] tone is [TONE - e.g., conversational but energetic, calm and intimate, excited and bubbly], delivering a [CONTENT TYPE - e.g., product review, story time, day in the life moment] for [PRODUCT/TOPIC].
The atmosphere feels [MOOD - e.g., intimate, relatable, raw] — like [he/she]'s [EMOTIONAL CONTEXT - e.g., sharing a personal secret, venting to a friend, giving insider advice].
Cinematography:
**Camera Shot:** [SHOT TYPE - e.g., Medium close-up, close-up, medium shot] from [ANGLE - e.g., slightly below eye level, eye level, slightly above], [FRAMING - e.g., centered framing, off-center left, rule of thirds].
**Lens & DOF:** IPHONE 15 PRO front camera (~24 mm equivalent), [DEPTH OF FIELD - e.g., deep depth of field keeping background in focus, shallow with slight background blur].
**Camera Motion:** [MOVEMENT - e.g., Subtle handheld sway and jitter consistent with a selfie grip, smooth gimbal-like motion, static with micro-movements].
**Lighting:** [LIGHT SOURCE & QUALITY - e.g., Natural diffuse daylight coming through the windshield, ring light creating catch lights in eyes, golden hour sunlight from window], illuminating [his/her] face [LIGHTING STYLE - e.g., evenly, dramatically with side shadows, softly with warm glow]. [SHADOW DETAILS - e.g., Soft shadows from dashboard contours, hard shadows from blinds].
**Color & Grade:** [PHONE MODEL] HDR auto-tone; [COLOR PALETTE - e.g., neutral warm daylight, cool blue tones, saturated Instagram look]; [TEXTURE - e.g., natural skin texture, slightly smoothed, visible pores]; [FILTER - e.g., no filters, slight warm filter, subtle vintage grain].
**Resolution & Aspect Ratio:** 720x1280, [FRAME RATE - e.g., 30 fps, 24 fps, 60 fps], vertical. Filename realism: "IMG_8234.MOV" metadata visible on internal capture simulation.
Actions:
- [Action 1: a clear, specific beat or gesture]
- [Action 2: another specific action]
- [Action 3: another specific action]
- add more actions if needed

Dialogue (USER-PROVIDED SCRIPT — insert verbatim, do not alter):
"[PASTE USER'S EXACT SCRIPT HERE WITH ALL ORIGINAL PAUSES, FILLER WORDS, EMPHASIS, AND SPEECH PATTERNS PRESERVED AS-IS]"

Audio & Ambience:
Recorded through [PHONE MODEL] mic — [AUDIO QUALITY - e.g., clear front-facing voice with slight room echo, crisp outdoor audio with wind texture].
[BACKGROUND SOUNDS - e.g., Faint background hum (air conditioning off), occasional light traffic noise outside, muffled café chatter, birds chirping in distance].
[MUSIC/CUTS - e.g., No music, no cuts; one-take natural pacing OR Subtle background music fading in].

UGC Authenticity Keywords:
smartphone selfie, handheld realism, [LOCATION], [LIGHTING TYPE], influencer-style monologue, direct-to-camera, [CONTENT TYPE], raw unfiltered [PLATFORM] aesthetic, real voice, micro hand jitters, [EDITING STYLE - e.g., no jump cuts, single jump cut transition, seamless one-take].

Universal Quality Control Negatives:
subtitles, captions, watermark, text overlays, words on screen, on-screen text, lower thirds, title cards, graphic inserts, animated text, motion graphics, b-roll, cutaway shots, insert shots, scene transitions, multiple scenes, split screen, logo, branding, poor lighting, blurry footage, low resolution, artifacts, unwanted objects, inconsistent character appearance, audio sync issues, amateur quality, cartoon effects, unrealistic proportions, distorted hands, artificial lighting, oversaturation, compression noise, camera shake.

The final PROMPT must be EXACTLY 5000 characters. This is a strict requirement.`;

const enc = new TextEncoder();

function sse(data: unknown): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: Uint8Array) => controller.enqueue(chunk);

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

        const { analysis, customScript } = await req.json() as {
          analysis: string;
          customScript: string;
        };

        if (!analysis) throw new Error("Missing analysis");
        if (!customScript) throw new Error("Missing custom script");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-3.1-pro-preview",
          systemInstruction: REWRITE_SYSTEM_PROMPT,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        });

        const userMessage = `Here is the deconstructed video analysis:\n\n${analysis}\n\n---\n\nHere is the user's custom script (use verbatim):\n\n${customScript}`;

        const streamResult = await model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
        });

        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) send(sse({ chunk: text }));
        }

        send(enc.encode("data: [DONE]\n\n"));
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
