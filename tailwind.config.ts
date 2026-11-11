import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#14213d", brand: "#315efb", mint: "#dff7ed" } } },
  plugins: []
};
export default config;
