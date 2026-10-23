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
        bg: {
          light: '#F8F7F4',
          dark: '#111213',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#18191B',
          hover: {
            light: '#F2F1ED',
            dark: '#222326',
          }
        },
        border: {
          light: '#E4E2DC',
          dark: '#27282B',
        },
        text: {
          primary: {
            light: '#18181B',
            dark: '#F4F4F5',
          },
          secondary: {
            light: '#52525B',
            dark: '#A1A1AA',
          },
          muted: {
            light: '#71717A',
            dark: '#71717A',
          }
        },
        brand: {
          DEFAULT: '#166534', // Deep green
          dark: '#14532D',
          light: '#DCFCE7',
          accent: '#22C55E',
        },
        warning: {
          DEFAULT: '#D97706', // Amber for warning / expiring
          light: '#FEF3C7',
          dark: '#B45309',
        },
        danger: {
          DEFAULT: '#B91C1C', // Brick red for failed / expired
          light: '#FEE2E2',
          dark: '#991B1B',
        },
      },
      fontFamily: {
        sans: ['"Inter Tight"', '"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
      },
      borderWidth: {
        DEFAULT: '1px',
      },
    },
  },
  plugins: [],
}
