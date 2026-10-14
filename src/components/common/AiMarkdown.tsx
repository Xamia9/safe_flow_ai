import { Component, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/** Strip a code fence wrapping the whole response and literal <br> tags. */
export function normalizeAiMarkdown(text: string): string {
  let t = text.trim();
  const fence = /^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```$/i.exec(t);
  if (fence?.[1] !== undefined) t = fence[1].trim();
  return t.replace(/<br\s*\/?>/gi, "\n");
}

const components: Components = {
  h1: ({ children }) => <h3 className="mt-4 text-base font-semibold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-4 text-base font-semibold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-4 text-sm font-semibold first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mt-3 text-sm font-semibold first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  a: ({ children }) => <span className="underline">{children}</span>,
  code: ({ children }) => <code className="rounded bg-secondary px-1 font-mono text-xs">{children}</code>,
  table: ({ children }) => (
    <div className="mt-3 overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm tabular">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-secondary text-xs uppercase text-muted-foreground">{children}</thead>,
  tr: ({ children }) => <tr className="border-t first:border-t-0">{children}</tr>,
  th: ({ children }) => <th scope="col" className="px-3 py-2 font-medium">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2">{children}</td>,
};

class RenderBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function AiMarkdown({ text }: { text: string }) {
  const md = normalizeAiMarkdown(text);
  const fallback = <div className="whitespace-pre-wrap">{md}</div>;
  return (
    <div className="break-words text-sm leading-relaxed text-foreground" data-testid="ai-markdown">
      <RenderBoundary fallback={fallback}>
        {/* skipHtml: never render model-generated HTML */}
        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>{md}</ReactMarkdown>
      </RenderBoundary>
    </div>
  );
}
