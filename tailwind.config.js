/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",   // Indigo-600
        secondary: "#6366F1", // Indigo-500
        accent: "#10B981",    // Emerald-500
        dark: {
          bg: "#111827",      // Gray-900
          surface: "#1F2937", // Gray-800
          border: "#374151",  // Gray-700
          text: "#F9FAFB",    // Gray-50
          textSecondary: "#9CA3AF", // Gray-400
        }
      },
    },
  },
  plugins: [],
};