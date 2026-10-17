/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        yellow: {
          50: "#FFF9EC",
          100: "#FDEBC4",
          300: "#EAD5A6",
          600: "#E8A33A",
          700: "#A8620F",
          800: "#6E4116",
          900: "#3A2A1A",
        },
        gray: {
          300: "#E8DCC0",
          500: "#8C7556",
          600: "#6B5738",
          700: "#4F3F28",
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "sans-serif"],
        sans: ['"Public Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};