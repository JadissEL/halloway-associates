import type { ReactNode } from "react";

// Chat replies are LLM-generated plain text that may contain light inline
// markdown (the sales-advisor system prompt explicitly asks for "bold for
// service names"). Messages render as plain text, not through a markdown
// parser, so without this the model's `**bold**` showed up as literal
// asterisks. Deliberately minimal: only handles **bold**, the one construct
// either system prompt actually asks the model to use.
export function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part ? <span key={i}>{part}</span> : null;
  });
}
