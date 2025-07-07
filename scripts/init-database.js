#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 用于创建数据库表结构和插入示例数据
 */

import { sequelize, syncDatabase, testConnection } from '../config/database.js';
import Student from '../models/Student.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 示例学生数据
 */
const sampleStudents = [
  {
    studentId: '2024001',
    name: '张三',
    gender: '男',
    age: 20,
    major: '计算机科学与技术',
    grade: '大二',
    email: 'zhangsan@example.com',
    phone: '13800138001'
  },
  {
    studentId: '2024002',
    name: '李四',
    gender: '女',
    age: 19,
    major: '软件工程',
    grade: '大一',
    email: 'lisi@example.com',
    phone: '13800138002'
  },
  {
    studentId: '2024003',
    name: '王五',
    gender: '男',
    age: 21,
    major: '信息安全',
    grade: '大三',
    email: 'wangwu@example.com',
    phone: '13800138003'
  },
  {
    studentId: '2024004',
    name: '赵六',
    gender: '女',
    age: 22,
    major: '数据科学与大数据技术',
    grade: '大四',
    email: 'zhaoliu@example.com',
    phone: '13800138004'
  },
  {
    studentId: '2024005',
    name: '钱七',
    gender: '男',
    age: 23,
    major: '人工智能',
    grade: '研一',
    email: 'qianqi@example.com',
    phone: '13800138005'
  },
  {
    studentId: '2024006',
    name: '孙八',
    gender: '女',
    age: 20,
    major: '网络工程',
    grade: '大二',
    email: 'sunba@example.com',
    phone: '13800138006'
  },
  {
    studentId: '2024007',
    name: '周九',
    gender: '男',
    age: 19,
    major: '物联网工程',
    grade: '大一',
    email: 'zhoujiu@example.com',
    phone: '13800138007'
  },
  {
    studentId: '2024008',
    name: '吴十',
    gender: '女',
    age: 21,
    major: '电子信息工程',
    grade: '大三',
    email: 'wushi@example.com',
    phone: '13800138008'
  }
];

/**
 * 检查数据库目录是否存在，不存在则创建
 */
function ensureDatabaseDirectory() {
  const dbDir = path.join(process.cwd(), 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✅ 数据库目录已创建:', dbDir);
  }
}

/**
 * 测试数据库连接
 */
async function testDatabaseConnection() {
  try {
    console.log('🔍 测试数据库连接...');
    await testConnection();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

/**
 * 同步数据库模型
 */
async function syncModels(force = false) {
  try {
    console.log('🔄 同步数据库模型...');
    await syncDatabase(force);
    console.log('✅ 数据库模型同步完成');
  } catch (error) {
    console.error('❌ 数据库模型同步失败:', error.message);
    process.exit(1);
  }
}

/**
 * 插入示例数据
 */
async function insertSampleData() {
  try {
    console.log('📝 检查现有数据...');
    const existingCount = await Student.count();
    
    if (existingCount > 0) {
      console.log(`ℹ️  数据库中已有 ${existingCount} 条学生记录，跳过示例数据插入`);
      return;
    }

    console.log('📝 插入示例数据...');
    await Student.bulkCreate(sampleStudents);
    console.log(`✅ 成功插入 ${sampleStudents.length} 条示例数据`);
  } catch (error) {
    console.error('❌ 插入示例数据失败:', error.message);
    process.exit(1);
  }
}

/**
 * 创建数据库索引
 */
async function createIndexes() {
  try {
    console.log('🔍 创建数据库索引...');
    
    // 创建常用查询字段的索引
    const queries = [
      'CREATE INDEX IF NOT EXISTS idx_students_name ON students(name)',
      'CREATE INDEX IF NOT EXISTS idx_students_major ON students(major)',
      'CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade)',
      'CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(createdAt)'
    ];

    for (const query of queries) {
      await sequelize.query(query);
    }
    
    console.log('✅ 数据库索引创建完成');
  } catch (error) {
    console.error('❌ 创建数据库索引失败:', error.message);
    // 索引创建失败不应该终止程序
  }
}

/**
 * 显示数据库信息
 */
async function showDatabaseInfo() {
  try {
    const studentCount = await Student.count();
    const dbPath = sequelize.options.storage;
    
    console.log('\n📊 数据库信息:');
    console.log(`   数据库文件: ${dbPath}`);
    console.log(`   学生记录数: ${studentCount}`);
    console.log(`   数据库类型: ${sequelize.getDialect()}`);
    
    // 显示表结构信息
    const tableInfo = await sequelize.query("PRAGMA table_info(students)", {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('\n📋 students 表结构:');
    tableInfo.forEach(column => {
      console.log(`   ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : 'NULL'} ${column.pk ? '(PRIMARY KEY)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ 获取数据库信息失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const skipSample = args.includes('--no-sample');
  
  console.log('🚀 开始初始化数据库...');
  console.log(`   强制重建: ${force ? '是' : '否'}`);
  console.log(`   插入示例数据: ${skipSample ? '否' : '是'}`);
  console.log('');
  
  try {
    // 1. 确保数据库目录存在
    ensureDatabaseDirectory();
    
    // 2. 测试数据库连接
    await testDatabaseConnection();
    
    // 3. 同步数据库模型
    await syncModels(force);
    
    // 4. 创建索引
    await createIndexes();
    
    // 5. 插入示例数据（如果需要）
    if (!skipSample) {
      await insertSampleData();
    }
    
    // 6. 显示数据库信息
    await showDatabaseInfo();
    
    console.log('\n🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('\n❌ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
数据库初始化脚本

用法:
  node scripts/init-database.js [选项]

选项:
  --force, -f      强制重建数据库表（会删除现有数据）
  --no-sample      不插入示例数据
  --help, -h       显示帮助信息

示例:
  node scripts/init-database.js                # 正常初始化
  node scripts/init-database.js --force        # 强制重建
  node scripts/init-database.js --no-sample    # 不插入示例数据
`);
}

// 处理命令行参数
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, sampleStudents };