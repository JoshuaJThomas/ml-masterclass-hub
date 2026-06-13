import { describe, it, expect } from 'vitest';
import { tokens, cssVars } from './tokens.js';

describe('design tokens (overhaul, dark-first)', () => {
  it('exposes the OLED base + single accent', () => {
    expect(tokens.colors.bg).toBe('#0e0f12');
    expect(tokens.colors.accent).toBe('#5e9bff');
    expect(tokens.colors.green).toBe('#3fb950');
    expect(tokens.colors.red).toBe('#f85149');
  });

  it('cssVars() emits the new canonical tokens', () => {
    const css = cssVars();
    expect(css).toContain('color-scheme: dark;');
    expect(css).toContain('--color-bg: #0e0f12;');
    expect(css).toContain('--color-accent: #5e9bff;');
    expect(css).toContain('--radius-card: 12px;');
    expect(css).toContain('--size-xl: 28px;');
  });

  it('still emits legacy compat names so pre-overhaul views stay coherent', () => {
    const css = cssVars();
    // remapped onto the dark palette, not the old Cohere values
    expect(css).toContain('--color-ink: #e6e8ec;');
    expect(css).toContain('--color-canvas: #16181d;');
    expect(css).toContain('--color-primary: #5e9bff;');
  });
});
