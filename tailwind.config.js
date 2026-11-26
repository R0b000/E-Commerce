/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./Auth.Client/**/*.{js,ts,jsx,tsx}",
    "./ecommerce.client/**/*.{js,ts,jsx,tsx}",
    "./Shared/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        '2xs': ['13px', '1.4'],
        xs: ['13px', '1.4'],
        sm: ['14px', '1.5'],
        base: ['14px', '1.5'],
      },
      fontFamily: {
        sans: ['Poppins', '"Nunito Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
