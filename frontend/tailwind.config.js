import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    // plugins: [daisyui],
    daisyui: {
        themes: [
            "light",
            "dark",
            "cupcake",
            "bumblebee",
            "synthwave",
            "retro",
            "cyberpunk",
            "valentine",
            "halloween",
            "forest",
            "aqua",
            "luxury",
            "dracula",
            "night",
            "coffee",
            "winter",
        ],
    },
    plugins: [daisyui],
}