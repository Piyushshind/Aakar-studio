import { Fragment } from 'react';
import type { HighlightedLine } from '@/data/copy';
import { cn } from '@/lib/cn';

/** Renders a line with its key words in gold (spec 4.3: "Emotions", "Memories"). */
export function HighlightedText({
  line,
  highlightClassName = 'text-gold',
}: {
  line: HighlightedLine;
  highlightClassName?: string;
}) {
  const pattern = new RegExp(`(${line.highlight.join('|')})`, 'g');
  return (
    <>
      {line.text.split(pattern).map((part, i) =>
        line.highlight.includes(part) ? (
          <span key={i} className={cn('highlight', highlightClassName)}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
