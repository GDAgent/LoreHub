const LABEL_HUES: Record<string, number> = {
  bug: 0,
  "priority:high": 8,
  art: 280,
  ui: 200,
  documentation: 210,
  gameplay: 140,
  tracking: 45,
  draft: 250,
  "review-needed": 30,
};

/** Deterministic hue for a label so colors are stable across renders. */
export function labelHue(label: string): number {
  if (label in LABEL_HUES) return LABEL_HUES[label];
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) % 360;
  }
  return hash;
}

/** Inline style for a colored label chip that works in light and dark themes. */
export function labelStyle(label: string): React.CSSProperties {
  const hue = labelHue(label);
  return {
    color: `hsl(${hue} 70% 38%)`,
    background: `hsl(${hue} 80% 96%)`,
    borderColor: `hsl(${hue} 60% 82%)`,
  };
}

/** Human-friendly UTC timestamp. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

/** Short relative-ish description from an ISO date. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
