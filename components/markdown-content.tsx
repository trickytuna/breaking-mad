import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-6 text-lg leading-8 text-zinc-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-4xl font-black uppercase leading-tight text-zinc-950">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="pt-4 text-3xl font-black uppercase leading-tight text-zinc-950">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="pt-2 text-2xl font-bold uppercase leading-tight text-zinc-900">
              {children}
            </h3>
          ),
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 pl-6">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-cyan-400 pl-4 italic text-zinc-700">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-cyan-400 underline underline-offset-4"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm text-cyan-900">
              {children}
            </code>
          ),
          hr: () => <hr className="border-zinc-300" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
