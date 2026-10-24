"use client";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AssistantMarkdown({ text }: { text: string }) {
  return <div dir="auto" className="min-w-0 text-start text-sm leading-6 [overflow-wrap:anywhere] [&_p+p]:mt-2 [&_strong]:font-semibold [&_em]:font-medium [&_h1]:mt-2 [&_h1]:text-sm [&_h1]:font-semibold [&_h2]:mt-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-4 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-4 [&_li]:ps-1 [&_pre]:my-2 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-secondary [&_pre]:p-2.5 [&_pre]:text-xs [&_code]:rounded [&_code]:bg-secondary/70 [&_code]:px-1 [&_code]:font-sans [&_code]:text-xs">
    <Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
      a: ({ href, children }) => { const safe = href && /^(https?:\/\/|\/(?!\/)|#)/i.test(href); return safe ? <a href={href} target={/^https?:/i.test(href) ? "_blank" : undefined} rel="noopener noreferrer" className="rounded text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">{children}</a> : <span>{children}</span>; },
      img: ({ alt }) => <span className="text-xs text-muted-foreground">{alt}</span>,
      pre: ({ children }) => <pre dir="ltr">{children}</pre>,
      table: ({ children }) => <div className="my-2 max-w-full overflow-x-auto rounded-xl border border-border/60"><table className="w-full text-xs [&_th]:bg-secondary/40 [&_th]:p-2 [&_th]:text-start [&_td]:border-t [&_td]:border-border/50 [&_td]:p-2">{children}</table></div>,
    }}>{text}</Markdown>
  </div>;
}
