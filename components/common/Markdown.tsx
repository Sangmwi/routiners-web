'use client';

import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * AI 응답 메시지용 마크다운 렌더러
 *
 * 지원 기능:
 * - **볼드**, *이탤릭*
 * - 순서 있는/없는 리스트
 * - 인라인 코드
 * - 줄바꿈 (remark-breaks)
 */
export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
        // 볼드
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        // 이탤릭
        em: ({ children }) => <em className="italic">{children}</em>,
        // 순서 없는 리스트
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
        ),
        // 순서 있는 리스트
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
        ),
        // 리스트 아이템
        li: ({ children }) => <li className="text-sm">{children}</li>,
        // 단락
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
        ),
        // 인라인 코드
        code: ({ children }) => (
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
            {children}
          </code>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
