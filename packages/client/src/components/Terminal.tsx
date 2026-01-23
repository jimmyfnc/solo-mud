import { useEffect, useRef } from 'react';
import type { OutputLine } from '@solo-mud/shared';

interface TerminalProps {
  lines: OutputLine[];
  maxLines?: number;
}

/**
 * Terminal component - displays game output in a scrollable terminal-like view.
 */
export function Terminal({ lines, maxLines = 500 }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (shouldScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  // Track if user has scrolled up
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Consider "at bottom" if within 50px
    shouldScrollRef.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  // Trim to maxLines
  const displayLines = lines.slice(-maxLines);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
    >
      {displayLines.map((line, index) => (
        <TerminalLine key={index} line={line} />
      ))}
    </div>
  );
}

interface TerminalLineProps {
  line: OutputLine;
}

/**
 * Single line of terminal output with style-based coloring.
 */
function TerminalLine({ line }: TerminalLineProps) {
  const styleClasses = getStyleClasses(line.style);

  // Handle timestamp if present
  const timestamp = line.timestamp
    ? new Date(line.timestamp).toLocaleTimeString()
    : null;

  return (
    <div className={`${styleClasses} whitespace-pre-wrap`}>
      {timestamp && (
        <span className="text-gray-600 mr-2">[{timestamp}]</span>
      )}
      {line.text}
    </div>
  );
}

/**
 * Map output styles to Tailwind classes.
 */
function getStyleClasses(style?: OutputLine['style']): string {
  switch (style) {
    case 'error':
      return 'text-red-400';
    case 'success':
      return 'text-green-400';
    case 'combat':
      return 'text-orange-400';
    case 'system':
      return 'text-cyan-400';
    case 'whisper':
      return 'text-purple-400 italic';
    case 'normal':
    default:
      return 'text-gray-200';
  }
}

export default Terminal;
