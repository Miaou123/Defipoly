import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/utils/**/*.{js,ts,jsx,tsx}", // Add this to scan constants.ts
  ],
  safelist: [
    // Property colors - safelist all the dynamic classes
    'bg-amber-900',  // Brown
    'bg-sky-300',    // Light Blue
    'bg-pink-400',   // Pink
    'bg-orange-500', // Orange
    'bg-red-600',    // Red
    'bg-yellow-400', // Yellow
    'bg-green-600',  // Green
    'bg-blue-900',   // Dark Blue
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;