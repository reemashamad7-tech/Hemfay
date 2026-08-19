/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#7A1028',
          dark: '#5A0B1D',
          soft: '#F7E9ED',
          light: '#FCF4F6',
        },
        brandred: {
          deep: '#8F1635',
          dark: '#A51D32',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#666666',
          muted: '#8A8A8A',
        },
        success: '#22C55E',
        warning: '#EAB308',
        info: '#3B82F6',
        error: '#DC2626',
      },
      borderRadius: {
        primary: '16px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
