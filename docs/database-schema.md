# 数据库表设计文档

## 概述

本文档描述了学生管理系统的数据库表结构设计。系统使用 SQLite 数据库，通过 Sequelize ORM 进行数据操作。

## 表结构设计

### 1. students 表（学生信息表）

**表名**: `students`

**描述**: 存储学生的基本信息

**字段定义**:

| 字段名 | 数据类型 | 长度 | 是否必填 | 是否唯一 | 默认值 | 说明 |
|--------|----------|------|----------|----------|--------|---------|
| id | INTEGER | - | 是 | 是 | AUTO_INCREMENT | 主键，自增ID |
| studentId | VARCHAR | 255 | 是 | 是 | - | 学号，业务主键 |
| name | VARCHAR | 255 | 是 | 否 | - | 学生姓名 |
| gender | ENUM | - | 是 | 否 | - | 性别（男/女） |
| age | INTEGER | - | 是 | 否 | - | 年龄 |
| major | VARCHAR | 255 | 是 | 否 | - | 专业 |
| grade | VARCHAR | 255 | 是 | 否 | - | 年级 |
| email | VARCHAR | 255 | 否 | 否 | NULL | 邮箱地址 |
| phone | VARCHAR | 255 | 否 | 否 | NULL | 手机号码 |
| createdAt | DATETIME | - | 是 | 否 | CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | DATETIME | - | 是 | 否 | CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:

| 索引名 | 索引类型 | 字段 | 说明 |
|--------|----------|------|------|
| PRIMARY | 主键索引 | id | 主键索引 |
| students_student_id | 唯一索引 | studentId | 学号唯一索引 |
| idx_students_name | 普通索引 | name | 姓名查询索引 |
| idx_students_major | 普通索引 | major | 专业查询索引 |
| idx_students_grade | 普通索引 | grade | 年级查询索引 |
| idx_students_created_at | 普通索引 | createdAt | 创建时间索引 |

**约束条件**:

1. **学号约束**: 
   - 长度: 6-20位
   - 格式: 字母数字组合
   - 唯一性: 全局唯一

2. **姓名约束**:
   - 长度: 2-50个字符
   - 格式: 中英文字母、空格

3. **性别约束**:
   - 枚举值: '男', '女'

4. **年龄约束**:
   - 范围: 16-60
   - 类型: 正整数

5. **专业约束**:
   - 长度: 2-100个字符

6. **年级约束**:
   - 格式: 大一、大二、大三、大四、研一、研二、研三、博一、博二、博三、2023级等

7. **邮箱约束**:
   - 格式: 标准邮箱格式验证
   - 可选字段

8. **手机约束**:
   - 格式: 11位中国手机号
   - 可选字段

## 数据库配置

### 开发环境
```javascript
{
  dialect: 'sqlite',
  storage: './database/students.db',
  logging: console.log,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
    charset: 'utf8mb4',
    dialectOptions: {
      collate: 'utf8mb4_unicode_ci'
    }
  }
}
```

### 生产环境
```javascript
{
  dialect: 'sqlite',
  storage: './database/students_prod.db',
  logging: false,
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
    min: 0,
    acquire: 30000,
    idle: 10000
  }
}
```

## 数据迁移

### 初始化脚本

数据库表结构通过 Sequelize 模型自动创建，无需手动执行 SQL 脚本。

### 示例数据

```sql
INSERT INTO students (studentId, name, gender, age, major, grade, email, phone, createdAt, updatedAt) VALUES
('2024001', '张三', '男', 20, '计算机科学与技术', '大二', 'zhangsan@example.com', '13800138001', datetime('now'), datetime('now')),
('2024002', '李四', '女', 19, '软件工程', '大一', 'lisi@example.com', '13800138002', datetime('now'), datetime('now')),
('2024003', '王五', '男', 21, '信息安全', '大三', 'wangwu@example.com', '13800138003', datetime('now'), datetime('now')),
('2024004', '赵六', '女', 22, '数据科学与大数据技术', '大四', 'zhaoliu@example.com', '13800138004', datetime('now'), datetime('now')),
('2024005', '钱七', '男', 23, '人工智能', '研一', 'qianqi@example.com', '13800138005', datetime('now'), datetime('now'));
```

## 性能优化建议

### 1. 索引优化
- 为常用查询字段创建索引
- 避免过多索引影响写入性能
- 定期分析查询性能

### 2. 查询优化
- 使用分页查询避免大量数据加载
- 合理使用 SELECT 字段，避免 SELECT *
- 使用连接查询替代多次单表查询

### 3. 数据维护
- 定期备份数据库
- 监控数据库大小和性能
- 清理无效数据

## 扩展规划

### 未来可能的表结构扩展

1. **用户表** (users)
   - 管理员账户
   - 权限控制

2. **课程表** (courses)
   - 课程信息
   - 学分管理

3. **选课表** (enrollments)
   - 学生选课关系
   - 成绩记录

4. **班级表** (classes)
   - 班级信息
   - 班级学生关系

5. **操作日志表** (audit_logs)
   - 数据变更记录
   - 操作追踪

## 备份和恢复

### 备份策略
```bash
# 每日备份
cp ./database/students.db ./backups/students_$(date +%Y%m%d).db

# 压缩备份
tar -czf ./backups/students_$(date +%Y%m%d).tar.gz ./database/students.db
```

### 恢复策略
```bash
# 从备份恢复
cp ./backups/students_20240101.db ./database/students.db

# 重启应用
npm restart
```

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护人员**: 开发团队