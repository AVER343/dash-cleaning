import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#0f7a5d",
                "primary-strong": "#095841",
                danger: "#b42318",
                warning: "#b54708",
                bg: "#f5f8f6",
                surface: "#ffffff",
                "surface-2": "#edf3ef",
                border: "#d4e0d9",
                text: "#12231a",
                "text-muted": "#4d6357",
            },
        },
    },
    plugins: [],
};
export default config;
