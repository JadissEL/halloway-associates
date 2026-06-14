import Groq from "groq-sdk";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import { inferFocusFromText } from "@/lib/chat/knowledge-base";
import type { ChatRequestBody, ChatResponseBody } from "@/lib/chat/types";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
  locale: z.enum(["en", "fr"]),
  visitor: z.object({
    sessionId: z.string().min(8).max(64),
    locale: z.string(),
    pagesVisited: z.array(z.string()).max(50),
    interests: z.array(z.enum(["automation", "revenue", "growth", "product"])),
    messageCount: z.number().int().min(0).max(500),
    lastPage: z.string().optional(),
    startedAt: z.string(),
    updatedAt: z.string(),
  }),
});

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: "Chat is not configured." },
      { status: 503 },
    );
  }

  let body: ChatRequestBody;
  try {
    const json: unknown = await request.json();
    body = requestSchema.parse(json) as ChatRequestBody;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const t = await getTranslations({
    locale: body.locale,
    namespace: "servicesPage.items",
  });

  const serviceItems: Record<
    string,
    { title: string; summary: string; details: string }
  > = {};

  const serviceIds = [
    "ai-automation",
    "ai-chatbots",
    "payments",
    "content-social",
    "marketing-seo",
    "web-mvp",
    "data-crm",
    "community",
    "branding",
    "consulting",
    "startup-mvp",
    "fundraising",
    "training",
    "revenue-engineering",
  ] as const;

  for (const id of serviceIds) {
    serviceItems[id] = {
      title: t(`${id}.title`),
      summary: t(`${id}.summary`),
      details: t(`${id}.details`),
    };
  }

  const systemPrompt = buildSystemPrompt(body.locale, serviceItems, body.visitor);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      temperature: 0.55,
      max_tokens: 600,
      messages: [
        { role: "system", content: systemPrompt },
        ...body.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return Response.json({ error: "Empty response." }, { status: 502 });
    }

    const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
    const suggestedFocus = lastUser
      ? inferFocusFromText(lastUser.content)
      : body.visitor.interests[0];

    const suggestContact =
      /contact|call|discover|book|rendez-vous|appel|discut|parler|email|hello@/i.test(
        content,
      ) ||
      (body.visitor.messageCount >= 3 &&
        body.visitor.interests.length > 0);

    const response: ChatResponseBody = {
      message: content,
      suggestedFocus,
      suggestContact,
    };

    return Response.json(response);
  } catch (error) {
    console.error("[chat-api]", error);
    return Response.json({ error: "Chat unavailable." }, { status: 502 });
  }
}
