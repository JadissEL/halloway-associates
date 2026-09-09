import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Replaces the old renderInlineMarkdown, which only ever handled **bold** —
// everything else the model wrote (tables, lists, headers, code) came
// through as literal asterisks/pipes/hashes, exactly the "symbols a human
// can't read" and "should be a table but isn't" gap this fixes. This is a
// real Markdown parser (remark-gfm adds GitHub-flavored tables, strikethrough,
// autolinks), not a second hand-rolled regex — the LLM already knows how to
// write well-structured Markdown; the gap was purely that nothing on this
// side ever turned it into real elements. No rehype-raw: raw HTML in the
// source stays inert text rather than executing, since this is untrusted
// model/tool output, not authored content.
//
// Deliberately its own small design-system pass rather than a generic
// "prose" class: every other surface in this app is sharp-edged
// (rounded-none) with a specific gold/graphite/ivory palette, and a
// default markdown stylesheet would look like a foreign component dropped
// into the chat.
const components: Components = {
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:no-underline"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <p className="mb-1.5 mt-1 font-serif text-base font-semibold first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mb-1.5 mt-1 font-serif text-base font-semibold first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mb-1 mt-1 text-sm font-semibold first:mt-0">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-current/30 pl-3 italic opacity-90 last:mb-0">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-current/20" />,
  code: ({ children, className }) => {
    // react-markdown gives block-level code a "language-x" className (from a
    // fenced ```x block) and inline code no className at all — the one
    // reliable signal to tell them apart here.
    const isBlock = Boolean(className);
    if (isBlock) {
      return <code className="font-mono text-[13px]">{children}</code>;
    }
    return (
      <code className="rounded-none bg-black/20 px-1 py-0.5 font-mono text-[13px]">{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-none bg-black/25 p-3 font-mono text-[13px] leading-relaxed last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-current/25">{children}</thead>,
  th: ({ children }) => <th className="whitespace-nowrap px-2.5 py-1.5 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-current/10 px-2.5 py-1.5 align-top">{children}</td>,
};

export function ChatMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
