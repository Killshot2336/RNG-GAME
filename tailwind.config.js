/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    extend: {
      colors: {
        void: '#070b14',
        royal: {
          navy: '#0b1a33',
          blue: '#1a3a6b',
          gold: '#f5c542',
          crimson: '#e63946',
          emerald: '#2ecc71',
        },
      },
      fontFamily: {
        display: ['"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        panel: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        bubble: '0 0 20px rgba(245, 197, 66, 0.35)',
      },
    },
  },
  plugins: [],
}
