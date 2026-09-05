import { prisma } from "@/lib/db/client";
import type { KnowledgeCategory } from "@prisma/client";

export interface KnowledgeHit {
  slug: string;
  category: KnowledgeCategory;
  text: string;
  sourceUrl: string | null;
  effectiveDate: Date | null;
  lastReviewed: Date | null;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .match(/[\p{L}\p{N}]+/gu) ?? [];
}

/**
 * Layer 3 of the AI pipeline: simple keyword/TF-overlap scoring over
 * categorized, source-attributed knowledge articles — no vector DB or model
 * call involved. Only ever returns `isApproved` articles: unreviewed
 * knowledge (e.g. tax facts pulled from web research) must not be stated to
 * users as platform fact until a human approves it (spec section 14.5/9).
 * Upgrade path if this ever stops scaling: pgvector on the same Neon
 * instance, same call signature.
 */
export async function retrieveKnowledge(
  query: string,
  options: { category?: KnowledgeCategory; locale?: string; limit?: number } = {},
): Promise<KnowledgeHit[]> {
  const { category, locale = "en", limit = 4 } = options;
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return [];

  const articles = await prisma.knowledgeArticle.findMany({
    where: { isApproved: true, ...(category ? { category } : {}) },
  });

  const scored = articles
    .map((article) => {
      const haystack = tokenize(`${article.slug} ${article.canonicalText}`);
      const overlap = haystack.filter((t) => queryTokens.has(t)).length;
      return { article, score: overlap };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ article }) => {
    const translations = (article.translations as Record<string, string>) ?? {};
    const text = translations[locale] ?? article.canonicalText;
    return {
      slug: article.slug,
      category: article.category,
      text,
      sourceUrl: article.sourceUrl,
      effectiveDate: article.effectiveDate,
      lastReviewed: article.lastReviewed,
    };
  });
}

export function formatKnowledgeForPrompt(hits: KnowledgeHit[]): string {
  if (hits.length === 0) return "";
  const lines = hits.map((h) => {
    const meta = [
      h.sourceUrl ? `source: ${h.sourceUrl}` : null,
      h.lastReviewed ? `last reviewed: ${h.lastReviewed.toISOString().slice(0, 10)}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return `- [${h.category}/${h.slug}]${meta ? ` (${meta})` : ""} ${h.text}`;
  });
  return `RELEVANT PLATFORM KNOWLEDGE (only state facts that appear below; if the answer isn't here, say so rather than guessing):\n${lines.join("\n")}`;
}
