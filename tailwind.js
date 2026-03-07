/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#001124",
        light: "#F7F7FF",
        accent: "#D99B00",
        mutedBlue: "#7389AE",
        tealAccent: "#62929E",
      },
    },
  },
  plugins: [],
};