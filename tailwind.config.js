/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark': {
          100: '#1a1a2e',
          200: '#16162a',
          300: '#0f0f1a',
          400: '#0a0a12',
        },
        'accent': {
          green: '#00ff88',
          red: '#ff4757',
          purple: '#a855f7',
          blue: '#3b82f6',
          yellow: '#fbbf24',
        }
      },
      animation: {
        'pulse-green': 'pulse-green 2s infinite',
        'pulse-red': 'pulse-red 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 255, 136, 0.4)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(0, 255, 136, 0)' },
        },
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 71, 87, 0.4)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(255, 71, 87, 0)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px rgba(168, 85, 247, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
