/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'], 
  safelist: [
    'bg-black',
    'bg-white',
    'text-white',
    'text-black',
    {
      pattern: /bg-(red|green|blue|gray|orange|yellow|sky|blue|purple|pink)-(100|200|300|400|500)/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
