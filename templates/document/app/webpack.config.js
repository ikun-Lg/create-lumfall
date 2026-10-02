// 业务 Webpack 扩展配置：与框架基础配置 webpack-merge.merge.smart 合并。
//
// 文档站把项目根目录 docs/ 下的 markdown 按原始文本打进产物
// （页面里通过 require.context 读取），因此在这里声明 asset/source 规则。
module.exports = {
  module: {
    rules: [
      {
        test: /\.md$/,
        // webpack 5 内置资源模块：把文件内容作为字符串导出（default export）
        type: "asset/source",
      },
    ],
  },
};
