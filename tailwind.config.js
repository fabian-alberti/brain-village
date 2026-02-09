/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind on web may try to manually control the color scheme (via CSS interop).
  // Explicitly use class-based dark mode to avoid runtime crashes like:
  // "Cannot manually set color scheme, as dark mode is type 'media'..."
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#2D5A3D',
        secondary: '#8B9D77',
        accent: '#F4A261',
        destructive: '#9B2335',
        background: '#F5F5F0',
        surface: '#FFFFFF',
      },
    },
  },
  plugins: [],
};
