/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060B18',
          900: '#0B132B',
          850: '#101B39',
          800: '#172554',
          750: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
        weather: {
          safe: '#10B981',
          rain: '#38BDF8',
          storm: '#818CF8',
          heat: '#F59E0B',
          flood: '#0284C7',
          cyclone: '#A855F7',
          warning: '#F97316',
          critical: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(56, 189, 248, 0.25)',
        'glow-purple': '0 0 25px -5px rgba(168, 85, 247, 0.25)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.3)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
