/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#1a1d23",
        foreground: "#f4f1ea",
        warning: "#ff9500",
        info: "#00d4ff",
        urgent: "#ff3b30",
        muted: "#6b7280",
        border: "#2d3139",
      },
      fontFamily: {
        "space-grotesk": ["SpaceGrotesk"],
        mono: ["IBMPlexMono"],
      },
    },
  },
  plugins: [],
};
