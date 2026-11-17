// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'production',         // 生产模式, 自动压缩代码, 生成 .min.js 效果
  entry: 'mediasoup-client',  // 入口文件
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'mediasoup-client.min.js', // 输出的文件名, 可以自定义
    library: {
      name: 'mediasoupClient',  // 关键: 将导出的模块挂载到 window.mediasoupClient
      type: 'umd',              // UMD 格式兼容 CommonJS 和浏览器全局变量
    },
    globalObject: 'this',       // 确保在浏览器环境中，全局对象是 window
  },
}