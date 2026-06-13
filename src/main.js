import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './lib/design/global.css';
import { mount } from 'svelte';
import { cssVars } from './lib/design/tokens.js';
import App from './App.svelte';

// Inject design tokens as :root custom properties (single source of truth).
const styleEl = document.createElement('style');
styleEl.textContent = cssVars();
document.head.appendChild(styleEl);

const app = mount(App, { target: document.getElementById('app') ?? document.body });
export default app;
