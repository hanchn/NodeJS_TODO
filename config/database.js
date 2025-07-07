import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 数据库配置
 */
const config = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database', 'students.db'),
    logging: console.log, // 开发环境显示SQL日志
    define: {
      timestamps: true, // 自动添加 createdAt 和 updatedAt
      underscored: false, // 使用驼峰命名
      freezeTableName: true, // 防止表名复数化
      charset: 'utf8mb4',
      dialectOptions: {
        collate: 'utf8mb4_unicode_ci'
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  test: {
    dialect: 'sqlite',
    storage: ':memory:', // 测试环境使用内存数据库
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  },
  
  production: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database', 'students_prod.db'),
    logging: false, // 生产环境关闭SQL日志
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
      charset: 'utf8mb4',
      dialectOptions: {
        collate: 'utf8mb4_unicode_ci'
      }
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};

// 获取当前环境
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建Sequelize实例
const sequelize = new Sequelize({
  ...dbConfig,
  // SQLite特定配置
  dialectOptions: {
    ...dbConfig.dialectOptions,
    // 启用外键约束
    foreignKeys: true,
    // 设置超时时间
    timeout: 20000
  },
  // 重试配置
  retry: {
    match: [
      /SQLITE_BUSY/,
      /SQLITE_LOCKED/,
      /database is locked/
    ],
    max: 3
  }
});

/**
 * 测试数据库连接
 */
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

/**
 * 同步数据库模型
 * @param {Object} options - 同步选项
 */
export const syncDatabase = async (options = {}) => {
  try {
    const defaultOptions = {
      force: false, // 是否强制重建表
      alter: env === 'development', // 开发环境允许修改表结构
      logging: env === 'development' ? console.log : false
    };
    
    const syncOptions = { ...defaultOptions, ...options };
    
    console.log('🔄 开始同步数据库模型...');
    await sequelize.sync(syncOptions);
    console.log('✅ 数据库模型同步完成');
    
    return true;
  } catch (error) {
    console.error('❌ 数据库模型同步失败:', error.message);
    throw error;
  }
};

/**
 * 关闭数据库连接
 */
export const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error.message);
  }
};

/**
 * 获取数据库信息
 */
export const getDatabaseInfo = () => {
  return {
    dialect: sequelize.getDialect(),
    database: dbConfig.storage || dbConfig.database,
    environment: env,
    version: sequelize.version
  };
};

/**
 * 执行原始SQL查询
 * @param {string} sql - SQL语句
 * @param {Object} options - 查询选项
 */
export const executeRawQuery = async (sql, options = {}) => {
  try {
    const [results, metadata] = await sequelize.query(sql, {
      type: Sequelize.QueryTypes.SELECT,
      ...options
    });
    return results;
  } catch (error) {
    console.error('SQL查询执行失败:', error.message);
    throw error;
  }
};

/**
 * 开始事务
 */
export const beginTransaction = async () => {
  return await sequelize.transaction();
};

/**
 * 健康检查
 */
export const healthCheck = async () => {
  try {
    const startTime = Date.now();
    await sequelize.authenticate();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      environment: env,
      database: dbConfig.storage || dbConfig.database,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      environment: env,
      timestamp: new Date().toISOString()
    };
  }
};

export default sequelize;
export { Sequelize };