/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00ff88', // Neon green for buttons and accents
        secondary: '#ff00ff', // Neon pink for hover effects
        background: '#0a0a1a', // Darker background
        card: '#1a1a2e', // Card background
        text: '#e0e0ff', // Light text for contrast
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse 2s ease-in-out infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { boxShadow: '0 0 5px #00ff88' },
          '50%': { boxShadow: '0 0 20px #00ff88' },
        },
      },
    },
  },
  plugins: [],
};
