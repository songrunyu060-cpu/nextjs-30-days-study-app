const config = {
  plugins: {
    "@tailwindcss/postcss": {
      darkMode: ["class"], // 关键点：设置为 class 模式
      content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
      ],
    },
  },
};

export default config;
