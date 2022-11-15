module.exports = {
  plugins: {
    tailwindcss: {
      // 如果是由 electron 项目来启动，那么执行目录就不是 web 项目路径，所以不能用相对路径，要用绝对路径。
      config: __dirname + '/tailwind.config.cjs',
    },
    autoprefixer: {},
  },
}
