import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#10141d",
        panel: "#171e2e",
        panel2: "#1d2538",
        line: "#2b3350",
        ink: "#eae6db",
        inkmuted: "#9098ac",
        inkfaint: "#5d6478",
        gold: "#c99a3d",
        goldbg: "#2a2310",
        goldline: "#7a5f28",
        teal: "#4fb3a6",
        coral: "#c1666b",
      },
    },
  },
  plugins: [],
};

export default config;
