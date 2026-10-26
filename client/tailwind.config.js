/** @type {import('tailwindcss').Config} */
// FoodBridge palette — taken from the hostel mess itself:
// banana-leaf green, turmeric, steel thali greys, chili red.
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
          light: '#F3F6F5', // steel-white
          dark: '#0F1714',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#16201C',
          hover: {
            light: '#EBF0EE',
            dark: '#1D2924',
          }
        },
        border: {
          light: '#DCE3E0', // brushed steel
          dark: '#25332D',
        },
        text: {
          primary: {
            light: '#18231E', // leaf-tinted ink
            dark: '#EDF2EF',
          },
          secondary: {
            light: '#46534D',
            dark: '#A9B7B0',
          },
          muted: {
            light: '#6A7871',
            dark: '#7F8E87',
          }
        },
        brand: {
          DEFAULT: '#1E5B3C', // banana leaf
          dark: '#164530',
          deep: '#123826',   // sidebar
          light: '#E1EFE6',
          accent: '#3E8E5E',
        },
        turmeric: {
          DEFAULT: '#D99A1E',
          light: '#FBF0D9',
          dark: '#9A6A0B',
        },
        warning: {
          DEFAULT: '#C98512',
          light: '#FBF0D9',
          dark: '#9A6A0B',
        },
        danger: {
          DEFAULT: '#B4432E', // chili
          light: '#F8E3DE',
          dark: '#8E3322',
        },
      },
      // Mukta runs small for its size, so the small steps are nudged up for legibility.
      fontSize: {
        xs: ['13px', { lineHeight: '1.45' }],
        sm: ['14px', { lineHeight: '1.5' }],
      },
      fontFamily: {
        sans: ['Mukta', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        display: ['"Anek Latin Variable"', 'Mukta', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      borderWidth: {
        DEFAULT: '1px',
      },
    },
  },
  plugins: [],
}
