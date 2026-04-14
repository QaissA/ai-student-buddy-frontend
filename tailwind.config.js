/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary:     '#FF6B35',
        secondary:   '#4ECDC4',
        'ai-purple': '#9B59B6',
        achievement: '#FFD93D',
        surface:     '#FFFBF0',
        anchor:      '#2C3E50',
      },
      fontFamily: {
        sans:    ['"Be Vietnam Pro"', 'sans-serif'],
        display: ['"Fredoka One"', 'cursive'],
        arabic:  ['"Noto Naskh Arabic"', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 4px 24px rgba(44, 62, 80, 0.08)',
        'card-hover': '0 8px 40px rgba(44, 62, 80, 0.14)',
      },
    },
  },
  plugins: [],
};
