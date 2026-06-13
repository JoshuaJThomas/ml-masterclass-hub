// Overhaul design system (DIRECTION.md §3) — dark-first OLED, one accent,
// semantic green/red, ~10 colour tokens. Inter everywhere, mono only in editor/output.
// `compat` re-maps the legacy Cohere token names the existing views still reference
// onto the new palette, so the whole app turns dark/flat on day one without a per-view
// rewrite. The compat block is slated for removal in the slice-4 content pass.

export const tokens = {
  colors: {
    // surfaces (OLED-first)
    bg: '#0e0f12',          // app base
    raised: '#16181d',      // cards / raised surfaces
    'raised-2': '#1d2026',  // nested / hover / inputs
    border: '#262a32',      // hairlines
    // text
    text: '#e6e8ec',
    'text-muted': '#9aa0ab',
    'text-faint': '#6b7280',
    // one accent + semantics
    accent: '#5e9bff',
    'on-accent': '#0a0c10',
    green: '#3fb950',
    red: '#f85149',
  },
  radius: {
    control: '8px',
    card: '12px',
    dot: '999px',
  },
  space: {
    1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px', 8: '32px',
  },
  // type scale 13/15/17/22/28 (sentence case; no ALL-CAPS mono kicker)
  size: {
    xs: '13px', sm: '15px', md: '17px', lg: '22px', xl: '28px',
  },
  font: {
    body: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', 'Menlo', monospace",
  },
};

// Legacy Cohere token names → new palette. Keeps pre-overhaul views coherent in dark.
const compat = {
  // colours
  primary: tokens.colors.accent,
  'on-primary': tokens.colors['on-accent'],
  'cohere-black': tokens.colors.bg,
  ink: tokens.colors.text,
  'deep-green': tokens.colors.accent,
  'dark-navy': tokens.colors.raised,
  canvas: tokens.colors.raised,
  'soft-stone': tokens.colors['raised-2'],
  'pale-green': tokens.colors['raised-2'],
  'pale-blue': tokens.colors['raised-2'],
  hairline: tokens.colors.border,
  'border-light': tokens.colors.border,
  'card-border': tokens.colors.border,
  muted: tokens.colors['text-muted'],
  slate: tokens.colors['text-muted'],
  'body-muted': tokens.colors['text-muted'],
  'action-blue': tokens.colors.accent,
  'focus-blue': tokens.colors.accent,
  coral: tokens.colors.accent,
  'coral-soft': tokens.colors.accent,
  'form-focus': tokens.colors.accent,
  'on-dark': tokens.colors.text,
  error: tokens.colors.red,
  'xp-gold': tokens.colors.accent,
  'streak-flame': tokens.colors.accent,
  win: tokens.colors.green,
  'win-soft': tokens.colors['raised-2'],
  surface: tokens.colors.bg,
  'surface-2': tokens.colors['raised-2'],
  'tab-active': tokens.colors.accent,
};

const compatRadius = {
  xs: '4px', sm: '8px', md: '12px', lg: '12px', xl: '12px', pill: '8px', full: '999px',
};
const compatSpace = {
  xxs: '2px', xs: '6px', sm: '8px', md: '12px', lg: '16px', xl: '24px', xxl: '32px', section: '64px',
};
// Flat by default — soft, near-flat shadows so the dark UI reads as raised, never lifted.
const compatShadow = {
  sm: '0 1px 2px rgba(0,0,0,0.4)',
  md: '0 1px 3px rgba(0,0,0,0.5)',
  lg: '0 2px 8px rgba(0,0,0,0.55)',
  pop: '0 2px 8px rgba(0,0,0,0.55)',
};

function emit(prefix, obj) {
  return Object.entries(obj)
    .map(([k, v]) => `  --${prefix}-${k}: ${v};`)
    .join('\n');
}

export function cssVars() {
  return [
    ':root {',
    '  color-scheme: dark;',
    // canonical new tokens
    emit('color', tokens.colors),
    emit('radius', tokens.radius),
    emit('space', tokens.space),
    emit('size', tokens.size),
    `  --font-body: ${tokens.font.body};`,
    `  --font-mono: ${tokens.font.mono};`,
    `  --font-display: ${tokens.font.body};`,
    // legacy compat (removed in slice 4)
    emit('color', compat),
    emit('radius', compatRadius),
    emit('space', compatSpace),
    emit('shadow', compatShadow),
    '}',
  ].join('\n');
}
