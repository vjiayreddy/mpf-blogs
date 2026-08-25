import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canUploadMedia } from "@/lib/rbac";
import { getOpenAIClient, getOpenAIModel, isOpenAIConfigured } from "@/lib/openai";
import { aiGeneratePostSchema } from "@/lib/validators";
import type { Role } from "@/lib/constants";

const WORD_TARGETS = {
  short: 400,
  medium: 800,
  long: 1500,
} as const;

const responseSchemaHint = `{
  "title": string,
  "excerpt": string (max 2 sentences),
  "html": string (semantic HTML body only — no html/body/head wrappers),
  "seo": {
    "title": string (max 60 chars),
    "description": string (max 155 chars)
  }
}`;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !canUploadMedia(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "OpenAI is not configured. Set OPENAI_API_KEY in .env.local." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = aiGeneratePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { topic, tone, length, keywords } = parsed.data;
  const wordTarget = WORD_TARGETS[length];

  const systemPrompt = `You are an expert blog writer for a professional publication.
Return ONLY valid JSON matching this shape:
${responseSchemaHint}

Rules for html:
- Use only these tags: h2, h3, p, ul, ol, li, blockquote, strong, em, a, code, pre
- Start with an intro paragraph (no h1 — title is separate)
- Include clear section headings (h2/h3)
- Write ~${wordTarget} words
- Tone: ${tone}
- Do not wrap in markdown fences or include commentary outside JSON`;

  const userPrompt = [
    `Topic / brief: ${topic}`,
    keywords?.trim() ? `Keywords to weave in naturally: ${keywords.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "Empty response from OpenAI" }, { status: 502 });
    }

    let generated: {
      title?: string;
      excerpt?: string;
      html?: string;
      seo?: { title?: string; description?: string };
    };
    try {
      generated = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
    }

    const title = String(generated.title || "").trim();
    const excerpt = String(generated.excerpt || "").trim();
    const html = String(generated.html || "").trim();
    const seoTitle = String(generated.seo?.title || title).trim().slice(0, 70);
    const seoDescription = String(generated.seo?.description || excerpt)
      .trim()
      .slice(0, 160);

    if (!title || !html) {
      return NextResponse.json(
        { error: "AI response missing title or html" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      title,
      excerpt,
      html,
      seo: {
        title: seoTitle,
        description: seoDescription,
      },
    });
  } catch (err) {
    console.error("[ai] generate-post failed:", err);
    const message = err instanceof Error ? err.message : "OpenAI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
