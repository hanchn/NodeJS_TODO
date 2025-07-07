import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建SQLite数据库连接
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false, // 设置为true可以看到SQL查询日志
  define: {
    timestamps: true, // 自动添加createdAt和updatedAt字段
    underscored: false, // 使用驼峰命名
  }
});

// 测试数据库连接
try {
  await sequelize.authenticate();
  console.log('数据库连接已建立');
} catch (error) {
  console.error('无法连接到数据库:', error);
}