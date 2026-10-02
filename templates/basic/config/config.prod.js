// _ENV=prod 时加载，覆盖 config.default.js 的同名键（浅合并）。
// 生产相关的密钥、连接串建议从环境变量读取：
//   module.exports = { dbPassword: process.env.DB_PASSWORD };
module.exports = {
  demoMessage: "hello from prod config",
};
