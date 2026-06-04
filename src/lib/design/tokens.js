export const tokens = {
  colors: {
    primary: '#17171c',
    'cohere-black': '#000000',
    ink: '#212121',
    'deep-green': '#003c33',
    'dark-navy': '#071829',
    canvas: '#ffffff',
    'soft-stone': '#eeece7',
    'pale-green': '#edfce9',
    'pale-blue': '#f1f5ff',
    hairline: '#d9d9dd',
    'border-light': '#e5e7eb',
    'card-border': '#f2f2f2',
    muted: '#93939f',
    slate: '#75758a',
    'body-muted': '#616161',
    'action-blue': '#1863dc',
    'focus-blue': '#4c6ee6',
    coral: '#ff7759',
    'coral-soft': '#ffad9b',
    'form-focus': '#9b60aa',
    'on-primary': '#ffffff',
    'on-dark': '#ffffff',
    error: '#b30000',
  },
  radius: {
    xs: '4px', sm: '8px', md: '16px', lg: '22px', xl: '30px', pill: '32px', full: '9999px',
  },
  space: {
    xxs: '2px', xs: '6px', sm: '8px', md: '12px', lg: '16px', xl: '24px', xxl: '32px', section: '80px',
  },
  font: {
    display: "'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif",
    body: "'Inter', Arial, ui-sans-serif, system-ui, sans-serif",
    mono: "'Space Mono', ui-monospace, 'Courier New', monospace",
  },
};

function emit(prefix, obj) {
  return Object.entries(obj)
    .map(([k, v]) => `  --${prefix}-${k}: ${v};`)
    .join('\n');
}

export function cssVars() {
  return [
    ':root {',
    emit('color', tokens.colors),
    emit('radius', tokens.radius),
    emit('space', tokens.space),
    `  --font-display: ${tokens.font.display};`,
    `  --font-body: ${tokens.font.body};`,
    `  --font-mono: ${tokens.font.mono};`,
    '}',
  ].join('\n');
}
