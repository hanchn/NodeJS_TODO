// 导入新的数据库配置
import sequelize, { testConnection } from '../config/database.js';

// 测试数据库连接
try {
  await testConnection();
} catch (error) {
  console.error('数据库初始化失败:', error);
  process.exit(1);
}

export default sequelize;
export { testConnection };