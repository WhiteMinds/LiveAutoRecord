/** @type {import('tailwindcss').Config} */
module.exports = {
  // 如果是由 electron 项目来启动，那么执行目录就不是 web 项目路径，所以不能用相对路径，要用绝对路径。
  content: [
    __dirname + '/index.html',
    __dirname + '/src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
