import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[score] ANTHROPIC_API_KEY not set — scoring will return 500");
}

const anthropic = new Anthropic();

const PROMPT = `You are a civil engineering expert analyzing a satellite image of a parking lot to assess its need for rehabilitation.

Score the parking lot on the following dimensions, each from 1 to 10, where 10 means the worst condition (urgent rehabilitation needed) and 1 means excellent condition:

- overall: overall rehabilitation urgency
- surface: pavement cracks, potholes, erosion, heaving
- markings: faded or missing line markings, arrows, symbols
- drainage: signs of standing water, poor runoff, blockage
- vegetation: weeds, grass breaking through pavement, overgrowth

Also write a single-sentence summary and pick a label from exactly one of:
"Excellent Condition" | "Good Condition" | "Moderate Wear" | "Significant Deterioration" | "Critical Rehabilitation Needed"

Respond ONLY with a JSON object — no markdown fences, no extra text:
{"overall":N,"surface":N,"markings":N,"drainage":N,"vegetation":N,"summary":"...","label":"..."}`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { imageUrl } = body as { imageUrl: string };

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  try {
    // Fetch image and convert to base64
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const rawType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const mediaType = (
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(rawType)
        ? rawType
        : "image/jpeg"
    ) as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const raw = msg.content[0];
    if (raw.type !== "text") throw new Error("Unexpected response type");

    const jsonMatch = raw.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const score = JSON.parse(jsonMatch[0]);
    return NextResponse.json(score);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
