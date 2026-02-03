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
 * Get CSS classes for simulation message based on subtype.
 * - ambient: subtle/italic (background activity)
 * - medium: normal prominence (conversations, world reactions)
 * - prominent: stands out (player reactions, hot topics)
 */
function getSimulationClasses(simType?: OutputLine['simType']): string {
  switch (simType) {
    case 'ambient_action':
    case 'ambient_speech':
      return 'text-gray-500 italic';
    case 'npc_conversation':
    case 'reaction_to_world':
      return 'text-gray-400';
    case 'reaction_to_player':
    case 'hot_topic':
      return 'text-gray-200';
    default:
      return 'text-gray-400';
  }
}

/**
 * Render a single simulation line (NPC action and/or speech).
 */
function SimulationLineContent({
  npcName,
  action,
  says,
}: {
  npcName?: string;
  action?: string;
  says?: string;
}) {
  return (
    <>
      {npcName && <span className="text-yellow-400 font-bold">{npcName}</span>}
      {action && <span className="text-gray-500 italic"> *{action}*</span>}
      {says && <span> says, "{says}"</span>}
    </>
  );
}

/**
 * Single line of terminal output with style-based coloring.
 */
function TerminalLine({ line }: TerminalLineProps) {
  // Handle simulation messages with special rendering
  if (line.style === 'simulation') {
    const simClasses = getSimulationClasses(line.simType);

    // Multi-line conversation
    if (line.simType === 'npc_conversation' && line.lines && line.lines.length > 0) {
      return (
        <div className={`${simClasses} whitespace-pre-wrap`}>
          {line.lines.map((conversationLine, i) => (
            <div key={i}>
              <SimulationLineContent
                npcName={conversationLine.npcName}
                action={conversationLine.action}
                says={conversationLine.says}
              />
            </div>
          ))}
        </div>
      );
    }

    // Single NPC action/speech
    return (
      <div className={`${simClasses} whitespace-pre-wrap`}>
        <SimulationLineContent
          npcName={line.npcName}
          action={line.action}
          says={line.says}
        />
      </div>
    );
  }

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
    case 'simulation':
      // Handled separately in TerminalLine
      return 'text-gray-400';
    case 'speech':
      return 'text-yellow-300';
    case 'emote':
      return 'text-pink-400 italic';
    case 'normal':
    default:
      return 'text-gray-200';
  }
}

export default Terminal;
