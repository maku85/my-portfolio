module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", "Inter", "sans-serif"],
        raleway: ["Raleway", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#4D96FF",
          dark: "#163031",
        },
        accent: {
          DEFAULT: "#F59E42",
        },
      },
    },
  },
};
