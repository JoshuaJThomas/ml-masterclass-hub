import { describe, it, expect } from 'vitest';
import { tokens, cssVars } from './tokens.js';

describe('design tokens', () => {
  it('exposes the Cohere primary and deep-green colors', () => {
    expect(tokens.colors.primary).toBe('#17171c');
    expect(tokens.colors['deep-green']).toBe('#003c33');
  });

  it('cssVars() emits CSS custom properties for colors, radii, and spacing', () => {
    const css = cssVars();
    expect(css).toContain('--color-primary: #17171c;');
    expect(css).toContain('--radius-pill: 32px;');
    expect(css).toContain('--space-section: 80px;');
  });
});
