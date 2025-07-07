# 第5章：Sequelize ORM

## 学习目标

完成本章学习后，你将能够：
- 深入理解 ORM 的概念和优势
- 掌握 Sequelize 的安装和配置
- 学会定义模型和数据类型
- 熟练使用关联关系
- 掌握 CRUD 操作和查询构建器
- 理解数据验证和钩子函数
- 学会使用事务和迁移

## 前置要求

- 已完成前四章的学习
- 理解关系型数据库基础概念
- 熟悉 SQL 基础语法
- 了解 JavaScript Promise 和 async/await

## 5.1 ORM 概述

### 什么是 ORM

ORM（Object-Relational Mapping，对象关系映射）是一种编程技术，用于在不兼容的类型系统之间转换数据。在面向对象编程语言中，它实际上创建了一个"虚拟对象数据库"。

### ORM 的优势

1. **抽象化**：隐藏了 SQL 的复杂性
2. **类型安全**：提供了类型检查和验证
3. **可移植性**：支持多种数据库
4. **开发效率**：减少样板代码
5. **维护性**：更容易维护和重构
6. **安全性**：防止 SQL 注入攻击

### ORM vs 原生 SQL

```javascript
// 原生 SQL
const query = `
  SELECT s.*, COUNT(c.id) as course_count 
  FROM students s 
  LEFT JOIN student_courses sc ON s.id = sc.student_id 
  LEFT JOIN courses c ON sc.course_id = c.id 
  WHERE s.age > ? AND s.created_at > ? 
  GROUP BY s.id 
  ORDER BY s.name ASC 
  LIMIT ? OFFSET ?
`;
const students = await db.query(query, [18, '2023-01-01', 10, 0]);

// Sequelize ORM
const students = await Student.findAll({
  where: {
    age: { [Op.gt]: 18 },
    created_at: { [Op.gt]: '2023-01-01' }
  },
  include: [{
    model: Course,
    through: { attributes: [] }
  }],
  order: [['name', 'ASC']],
  limit: 10,
  offset: 0
});
```

## 5.2 Sequelize 简介

### Sequelize 特点

- **多数据库支持**：PostgreSQL, MySQL, MariaDB, SQLite, Microsoft SQL Server
- **Promise 支持**：原生支持 Promise 和 async/await
- **事务支持**：完整的事务功能
- **连接池**：自动连接池管理
- **迁移和种子**：数据库版本控制
- **验证**：内置数据验证
- **钩子**：生命周期钩子函数
- **关联**：丰富的关联关系支持

### 安装和配置

```bash
# 安装 Sequelize 和数据库驱动
npm install sequelize

# 根据使用的数据库安装对应驱动
npm install sqlite3        # SQLite
npm install mysql2         # MySQL
npm install pg pg-hstore   # PostgreSQL
npm install tedious        # Microsoft SQL Server

# 安装 Sequelize CLI（可选）
npm install --save-dev sequelize-cli
```

### 基础配置

```javascript
// config/database.js - 数据库配置
const { Sequelize } = require('sequelize');
const path = require('path');

// 环境配置
const config = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database/students.db'),
    logging: console.log, // 开发环境显示 SQL 日志
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false, // 测试环境不显示日志
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false, // 生产环境不显示日志
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
};

// 获取当前环境配置
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建 Sequelize 实例
const sequelize = new Sequelize(dbConfig);

// 测试连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  testConnection,
  Sequelize
};
```

## 5.3 模型定义

### 基础模型定义

```javascript
// models/Student.js - 学生模型
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
  // 主键（自动创建，也可以显式定义）
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 姓名
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '姓名不能为空'
      },
      len: {
        args: [2, 100],
        msg: '姓名长度必须在2-100字符之间'
      }
    }
  },
  
  // 邮箱
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: '邮箱已存在'
    },
    validate: {
      isEmail: {
        msg: '请输入有效的邮箱地址'
      }
    }
  },
  
  // 年龄
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: '年龄必须大于0'
      },
      max: {
        args: [150],
        msg: '年龄不能超过150'
      }
    }
  },
  
  // 电话
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[\d\-\+\(\)\s]+$/,
        msg: '请输入有效的电话号码'
      }
    }
  },
  
  // 地址
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // 性别
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
    defaultValue: null
  },
  
  // 出生日期
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: {
        msg: '请输入有效的日期'
      },
      isBefore: {
        args: new Date().toISOString().split('T')[0],
        msg: '出生日期不能是未来日期'
      }
    }
  },
  
  // 入学日期
  enrollment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  
  // 状态
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'graduated', 'suspended'),
    allowNull: false,
    defaultValue: 'active'
  },
  
  // GPA
  gpa: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0.00],
        msg: 'GPA不能小于0.00'
      },
      max: {
        args: [4.00],
        msg: 'GPA不能大于4.00'
      }
    }
  },
  
  // 备注
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // 头像URL
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        msg: '请输入有效的URL'
      }
    }
  }
}, {
  // 模型选项
  tableName: 'students',
  timestamps: true,
  underscored: true,
  paranoid: true, // 软删除
  
  // 索引
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['name']
    },
    {
      fields: ['status']
    },
    {
      fields: ['enrollment_date']
    }
  ],
  
  // 默认排序
  defaultScope: {
    order: [['created_at', 'DESC']]
  },
  
  // 作用域
  scopes: {
    active: {
      where: {
        status: 'active'
      }
    },
    withGPA: {
      where: {
        gpa: {
          [sequelize.Sequelize.Op.not]: null
        }
      }
    },
    recent: {
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }
  }
});

// 实例方法
Student.prototype.getFullInfo = function() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    age: this.age,
    status: this.status,
    gpa: this.gpa,
    enrollmentYear: this.enrollment_date ? new Date(this.enrollment_date).getFullYear() : null
  };
};

Student.prototype.isActive = function() {
  return this.status === 'active';
};

Student.prototype.calculateAge = function() {
  if (!this.birth_date) return null;
  const today = new Date();
  const birthDate = new Date(this.birth_date);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// 类方法
Student.findByEmail = async function(email) {
  return await this.findOne({
    where: { email }
  });
};

Student.findActiveStudents = async function(options = {}) {
  return await this.scope('active').findAll(options);
};

Student.getStatistics = async function() {
  const total = await this.count();
  const active = await this.count({ where: { status: 'active' } });
  const graduated = await this.count({ where: { status: 'graduated' } });
  const avgGPA = await this.aggregate('gpa', 'AVG', {
    where: {
      gpa: { [sequelize.Sequelize.Op.not]: null }
    }
  });
  
  return {
    total,
    active,
    graduated,
    inactive: total - active - graduated,
    averageGPA: avgGPA ? parseFloat(avgGPA).toFixed(2) : null
  };
};

module.exports = Student;
```

### 数据类型详解

```javascript
// 常用数据类型示例
const ExampleModel = sequelize.define('Example', {
  // 字符串类型
  shortString: DataTypes.STRING,           // VARCHAR(255)
  longString: DataTypes.STRING(1000),      // VARCHAR(1000)
  text: DataTypes.TEXT,                    // TEXT
  mediumText: DataTypes.TEXT('medium'),    // MEDIUMTEXT (MySQL)
  longText: DataTypes.TEXT('long'),        // LONGTEXT (MySQL)
  
  // 数字类型
  integer: DataTypes.INTEGER,              // INTEGER
  bigint: DataTypes.BIGINT,               // BIGINT
  float: DataTypes.FLOAT,                 // FLOAT
  double: DataTypes.DOUBLE,               // DOUBLE
  decimal: DataTypes.DECIMAL(10, 2),      // DECIMAL(10,2)
  
  // 布尔类型
  boolean: DataTypes.BOOLEAN,             // BOOLEAN
  
  // 日期类型
  date: DataTypes.DATE,                   // DATETIME
  dateOnly: DataTypes.DATEONLY,           // DATE
  time: DataTypes.TIME,                   // TIME
  
  // 枚举类型
  status: DataTypes.ENUM('active', 'inactive', 'pending'),
  
  // JSON 类型（PostgreSQL, MySQL 5.7+, SQLite 3.38+）
  jsonData: DataTypes.JSON,
  jsonbData: DataTypes.JSONB,             // PostgreSQL only
  
  // 数组类型（PostgreSQL only）
  tags: DataTypes.ARRAY(DataTypes.STRING),
  numbers: DataTypes.ARRAY(DataTypes.INTEGER),
  
  // UUID 类型
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4
  },
  
  // 虚拟字段（不存储在数据库中）
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstName} ${this.lastName}`;
    },
    set(value) {
      const names = value.split(' ');
      this.setDataValue('firstName', names[0]);
      this.setDataValue('lastName', names[1]);
    }
  }
});
```

## 5.4 模型关联

### 一对一关联 (hasOne / belongsTo)

```javascript
// models/User.js - 用户模型
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// models/Profile.js - 用户资料模型
const Profile = sequelize.define('Profile', {
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  bio: DataTypes.TEXT,
  avatar: DataTypes.STRING,
  birthDate: DataTypes.DATEONLY,
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  }
});

// 建立关联
User.hasOne(Profile, {
  foreignKey: 'userId',
  as: 'profile',
  onDelete: 'CASCADE'
});

Profile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 使用关联
const userWithProfile = await User.findOne({
  where: { id: 1 },
  include: [{
    model: Profile,
    as: 'profile'
  }]
});

// 创建关联数据
const user = await User.create({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'hashedPassword'
});

const profile = await user.createProfile({
  firstName: 'John',
  lastName: 'Doe',
  bio: 'Software Developer'
});
```

### 一对多关联 (hasMany / belongsTo)

```javascript
// models/Course.js - 课程模型
const Course = sequelize.define('Course', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: DataTypes.TEXT,
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  instructorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'instructors',
      key: 'id'
    }
  }
});

// models/Instructor.js - 教师模型
const Instructor = sequelize.define('Instructor', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  department: DataTypes.STRING,
  title: DataTypes.STRING
});

// 建立关联
Instructor.hasMany(Course, {
  foreignKey: 'instructorId',
  as: 'courses',
  onDelete: 'SET NULL'
});

Course.belongsTo(Instructor, {
  foreignKey: 'instructorId',
  as: 'instructor'
});

// 使用关联
const instructorWithCourses = await Instructor.findOne({
  where: { id: 1 },
  include: [{
    model: Course,
    as: 'courses'
  }]
});

// 创建关联数据
const instructor = await Instructor.findByPk(1);
const newCourse = await instructor.createCourse({
  name: 'Advanced JavaScript',
  code: 'CS301',
  description: 'Advanced JavaScript programming concepts',
  credits: 4
});

// 获取教师的所有课程
const courses = await instructor.getCourses();

// 添加现有课程到教师
const existingCourse = await Course.findByPk(2);
await instructor.addCourse(existingCourse);
```

### 多对多关联 (belongsToMany)

```javascript
// models/StudentCourse.js - 学生课程关联模型（中间表）
const StudentCourse = sequelize.define('StudentCourse', {
  studentId: {
    type: DataTypes.INTEGER,
    references: {
      model: Student,
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.INTEGER,
    references: {
      model: Course,
      key: 'id'
    }
  },
  enrollmentDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  grade: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D', 'F'),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('enrolled', 'completed', 'dropped'),
    defaultValue: 'enrolled'
  }
}, {
  tableName: 'student_courses',
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'courseId']
    }
  ]
});

// 建立多对多关联
Student.belongsToMany(Course, {
  through: StudentCourse,
  foreignKey: 'studentId',
  otherKey: 'courseId',
  as: 'courses'
});

Course.belongsToMany(Student, {
  through: StudentCourse,
  foreignKey: 'courseId',
  otherKey: 'studentId',
  as: 'students'
});

// 直接关联到中间表
Student.hasMany(StudentCourse, {
  foreignKey: 'studentId',
  as: 'enrollments'
});

Course.hasMany(StudentCourse, {
  foreignKey: 'courseId',
  as: 'enrollments'
});

StudentCourse.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student'
});

StudentCourse.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'course'
});

// 使用多对多关联
const studentWithCourses = await Student.findOne({
  where: { id: 1 },
  include: [{
    model: Course,
    as: 'courses',
    through: {
      attributes: ['enrollmentDate', 'grade', 'status']
    }
  }]
});

// 学生选课
const student = await Student.findByPk(1);
const course = await Course.findByPk(1);

// 添加课程到学生
await student.addCourse(course, {
  through: {
    enrollmentDate: new Date(),
    status: 'enrolled'
  }
});

// 更新选课信息
const enrollment = await StudentCourse.findOne({
  where: {
    studentId: 1,
    courseId: 1
  }
});

await enrollment.update({
  grade: 'A',
  status: 'completed'
});

// 获取学生的所有选课记录
const enrollments = await StudentCourse.findAll({
  where: { studentId: 1 },
  include: [
    {
      model: Course,
      as: 'course'
    }
  ]
});
```

## 5.5 CRUD 操作

### 创建 (Create)

```javascript
// 单个创建
const student = await Student.create({
  name: '张三',
  email: 'zhangsan@example.com',
  age: 20,
  phone: '13800138000'
});

// 批量创建
const students = await Student.bulkCreate([
  {
    name: '李四',
    email: 'lisi@example.com',
    age: 21
  },
  {
    name: '王五',
    email: 'wangwu@example.com',
    age: 19
  }
], {
  validate: true, // 启用验证
  ignoreDuplicates: true // 忽略重复记录
});

// 使用 findOrCreate
const [student, created] = await Student.findOrCreate({
  where: { email: 'zhangsan@example.com' },
  defaults: {
    name: '张三',
    age: 20
  }
});

if (created) {
  console.log('创建了新学生');
} else {
  console.log('学生已存在');
}

// 使用 upsert（更新或插入）
const [student, created] = await Student.upsert({
  email: 'zhangsan@example.com',
  name: '张三三',
  age: 21
}, {
  returning: true // PostgreSQL only
});
```

### 查询 (Read)

```javascript
// 查找所有记录
const allStudents = await Student.findAll();

// 根据主键查找
const student = await Student.findByPk(1);

// 查找一条记录
const student = await Student.findOne({
  where: {
    email: 'zhangsan@example.com'
  }
});

// 条件查询
const students = await Student.findAll({
  where: {
    age: {
      [Op.gte]: 18,
      [Op.lte]: 25
    },
    status: 'active',
    name: {
      [Op.like]: '%张%'
    }
  },
  order: [['created_at', 'DESC']],
  limit: 10,
  offset: 0
});

// 复杂查询
const { Op } = require('sequelize');

const students = await Student.findAll({
  where: {
    [Op.or]: [
      {
        name: {
          [Op.like]: '%张%'
        }
      },
      {
        email: {
          [Op.like]: '%zhang%'
        }
      }
    ],
    [Op.and]: [
      {
        age: {
          [Op.gte]: 18
        }
      },
      {
        status: 'active'
      }
    ]
  }
});

// 聚合查询
const count = await Student.count({
  where: {
    status: 'active'
  }
});

const avgAge = await Student.aggregate('age', 'AVG', {
  where: {
    age: {
      [Op.not]: null
    }
  }
});

const maxGPA = await Student.max('gpa');
const minAge = await Student.min('age');
const totalStudents = await Student.sum('id'); // 不太实用，仅作示例

// 分组查询
const statusCounts = await Student.findAll({
  attributes: [
    'status',
    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
  ],
  group: ['status']
});

// 分页查询
const { count, rows } = await Student.findAndCountAll({
  where: {
    status: 'active'
  },
  order: [['created_at', 'DESC']],
  limit: 10,
  offset: 20
});

console.log(`总共 ${count} 条记录，当前页 ${rows.length} 条`);

// 原生 SQL 查询
const [results, metadata] = await sequelize.query(
  'SELECT * FROM students WHERE age > :age',
  {
    replacements: { age: 18 },
    type: QueryTypes.SELECT
  }
);
```

### 更新 (Update)

```javascript
// 更新单个实例
const student = await Student.findByPk(1);
if (student) {
  student.age = 21;
  student.phone = '13900139000';
  await student.save();
  
  // 或者使用 update 方法
  await student.update({
    age: 21,
    phone: '13900139000'
  });
}

// 批量更新
const [affectedCount] = await Student.update(
  {
    status: 'inactive'
  },
  {
    where: {
      age: {
        [Op.lt]: 18
      }
    }
  }
);

console.log(`更新了 ${affectedCount} 条记录`);

// 增量更新
await Student.increment(
  { age: 1 }, // 增加的字段和值
  {
    where: {
      id: {
        [Op.in]: [1, 2, 3]
      }
    }
  }
);

// 减量更新
await Student.decrement(
  { gpa: 0.1 },
  {
    where: {
      status: 'probation'
    }
  }
);
```

### 删除 (Delete)

```javascript
// 删除单个实例
const student = await Student.findByPk(1);
if (student) {
  await student.destroy();
}

// 批量删除
const deletedCount = await Student.destroy({
  where: {
    status: 'inactive',
    created_at: {
      [Op.lt]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 一年前
    }
  }
});

console.log(`删除了 ${deletedCount} 条记录`);

// 软删除（需要在模型中设置 paranoid: true）
const student = await Student.findByPk(1);
await student.destroy(); // 软删除，设置 deleted_at 字段

// 恢复软删除的记录
await student.restore();

// 强制删除（真正删除）
await student.destroy({ force: true });

// 查询包含软删除的记录
const allStudents = await Student.findAll({
  paranoid: false // 包含软删除的记录
});

// 只查询软删除的记录
const deletedStudents = await Student.findAll({
  where: {
    deleted_at: {
      [Op.not]: null
    }
  },
  paranoid: false
});
```

## 5.6 查询构建器和操作符

### 常用操作符

```javascript
const { Op } = require('sequelize');

// 比较操作符
const students = await Student.findAll({
  where: {
    age: {
      [Op.eq]: 20,        // age = 20
      [Op.ne]: 20,        // age != 20
      [Op.gt]: 18,        // age > 18
      [Op.gte]: 18,       // age >= 18
      [Op.lt]: 25,        // age < 25
      [Op.lte]: 25,       // age <= 25
      [Op.between]: [18, 25], // age BETWEEN 18 AND 25
      [Op.notBetween]: [18, 25], // age NOT BETWEEN 18 AND 25
      [Op.in]: [18, 19, 20], // age IN (18, 19, 20)
      [Op.notIn]: [18, 19, 20] // age NOT IN (18, 19, 20)
    }
  }
});

// 字符串操作符
const students = await Student.findAll({
  where: {
    name: {
      [Op.like]: '%张%',      // name LIKE '%张%'
      [Op.notLike]: '%张%',   // name NOT LIKE '%张%'
      [Op.iLike]: '%ZHANG%',  // name ILIKE '%ZHANG%' (PostgreSQL)
      [Op.notILike]: '%ZHANG%', // name NOT ILIKE '%ZHANG%'
      [Op.startsWith]: '张',   // name LIKE '张%'
      [Op.endsWith]: '三',     // name LIKE '%三'
      [Op.substring]: '张三'   // name LIKE '%张三%'
    }
  }
});

// 正则表达式（MySQL, PostgreSQL）
const students = await Student.findAll({
  where: {
    email: {
      [Op.regexp]: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    }
  }
});

// 空值检查
const students = await Student.findAll({
  where: {
    phone: {
      [Op.is]: null,      // phone IS NULL
      [Op.not]: null      // phone IS NOT NULL
    }
  }
});

// 逻辑操作符
const students = await Student.findAll({
  where: {
    [Op.and]: [
      { age: { [Op.gte]: 18 } },
      { status: 'active' }
    ],
    [Op.or]: [
      { name: { [Op.like]: '%张%' } },
      { email: { [Op.like]: '%zhang%' } }
    ],
    [Op.not]: {
      status: 'suspended'
    }
  }
});
```

### 高级查询

```javascript
// 子查询
const studentsWithHighGPA = await Student.findAll({
  where: {
    gpa: {
      [Op.gt]: sequelize.literal('(SELECT AVG(gpa) FROM students WHERE gpa IS NOT NULL)')
    }
  }
});

// 使用函数
const students = await Student.findAll({
  where: {
    [Op.and]: [
      sequelize.where(
        sequelize.fn('YEAR', sequelize.col('enrollment_date')),
        2023
      ),
      sequelize.where(
        sequelize.fn('UPPER', sequelize.col('name')),
        { [Op.like]: '%ZHANG%' }
      )
    ]
  }
});

// 复杂的 JOIN 查询
const studentsWithCourses = await Student.findAll({
  include: [
    {
      model: Course,
      as: 'courses',
      through: {
        where: {
          status: 'enrolled'
        },
        attributes: ['enrollmentDate', 'grade']
      },
      include: [
        {
          model: Instructor,
          as: 'instructor',
          attributes: ['name', 'department']
        }
      ]
    }
  ],
  where: {
    status: 'active'
  }
});

// 分组和聚合
const courseStats = await Student.findAll({
  attributes: [
    [sequelize.fn('COUNT', sequelize.col('Student.id')), 'studentCount'],
    [sequelize.fn('AVG', sequelize.col('enrollments.grade')), 'avgGrade']
  ],
  include: [
    {
      model: StudentCourse,
      as: 'enrollments',
      attributes: [],
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['name', 'code']
        }
      ]
    }
  ],
  group: ['enrollments.course.id'],
  having: sequelize.where(
    sequelize.fn('COUNT', sequelize.col('Student.id')),
    { [Op.gt]: 5 }
  )
});
```

## 5.7 数据验证

### 内置验证器

```javascript
const Student = sequelize.define('Student', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      // 非空验证
      notNull: {
        msg: '姓名不能为空'
      },
      notEmpty: {
        msg: '姓名不能为空字符串'
      },
      
      // 长度验证
      len: {
        args: [2, 50],
        msg: '姓名长度必须在2-50字符之间'
      }
    }
  },
  
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      // 邮箱格式验证
      isEmail: {
        msg: '请输入有效的邮箱地址'
      },
      
      // 自定义验证
      isUnique: async function(value) {
        const existingStudent = await Student.findOne({
          where: {
            email: value,
            id: { [Op.ne]: this.id || 0 }
          }
        });
        if (existingStudent) {
          throw new Error('邮箱已被使用');
        }
      }
    }
  },
  
  age: {
    type: DataTypes.INTEGER,
    validate: {
      // 数值范围验证
      min: {
        args: [1],
        msg: '年龄必须大于0'
      },
      max: {
        args: [150],
        msg: '年龄不能超过150'
      },
      
      // 整数验证
      isInt: {
        msg: '年龄必须是整数'
      }
    }
  },
  
  phone: {
    type: DataTypes.STRING,
    validate: {
      // 正则表达式验证
      is: {
        args: /^1[3-9]\d{9}$/,
        msg: '请输入有效的手机号码'
      }
    }
  },
  
  website: {
    type: DataTypes.STRING,
    validate: {
      // URL 验证
      isUrl: {
        msg: '请输入有效的网址'
      }
    }
  },
  
  gpa: {
    type: DataTypes.DECIMAL(3, 2),
    validate: {
      // 小数验证
      isDecimal: {
        msg: 'GPA必须是小数'
      },
      
      // 自定义验证函数
      isValidGPA(value) {
        if (value !== null && (value < 0 || value > 4.0)) {
          throw new Error('GPA必须在0.0-4.0之间');
        }
      }
    }
  },
  
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'graduated', 'suspended'),
    validate: {
      // 枚举值验证
      isIn: {
        args: [['active', 'inactive', 'graduated', 'suspended']],
        msg: '状态值无效'
      }
    }
  }
}, {
  // 模型级验证
  validate: {
    // 验证年龄和出生日期的一致性
    ageAndBirthDateConsistency() {
      if (this.age && this.birth_date) {
        const calculatedAge = this.calculateAge();
        if (Math.abs(this.age - calculatedAge) > 1) {
          throw new Error('年龄与出生日期不匹配');
        }
      }
    },
    
    // 验证入学日期不能是未来日期
    enrollmentDateNotFuture() {
      if (this.enrollment_date && new Date(this.enrollment_date) > new Date()) {
        throw new Error('入学日期不能是未来日期');
      }
    },
    
    // 验证毕业生必须有GPA
    graduatedStudentMustHaveGPA() {
      if (this.status === 'graduated' && !this.gpa) {
        throw new Error('毕业生必须有GPA记录');
      }
    }
  }
});
```

### 自定义验证器

```javascript
// utils/validators.js - 自定义验证器
class CustomValidators {
  // 中国身份证号验证
  static isChineseIDCard(value) {
    const pattern = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    if (!pattern.test(value)) {
      throw new Error('请输入有效的身份证号码');
    }
    
    // 校验位验证
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(value[i]) * weights[i];
    }
    
    const checkCode = checkCodes[sum % 11];
    if (value[17].toUpperCase() !== checkCode) {
      throw new Error('身份证号码校验位错误');
    }
  }
  
  // 强密码验证
  static isStrongPassword(value) {
    if (value.length < 8) {
      throw new Error('密码长度至少8位');
    }
    
    if (!/[a-z]/.test(value)) {
      throw new Error('密码必须包含小写字母');
    }
    
    if (!/[A-Z]/.test(value)) {
      throw new Error('密码必须包含大写字母');
    }
    
    if (!/\d/.test(value)) {
      throw new Error('密码必须包含数字');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      throw new Error('密码必须包含特殊字符');
    }
  }
  
  // 银行卡号验证（Luhn算法）
  static isBankCard(value) {
    if (!/^\d{16,19}$/.test(value)) {
      throw new Error('银行卡号格式错误');
    }
    
    let sum = 0;
    let isEven = false;
    
    for (let i = value.length - 1; i >= 0; i--) {
      let digit = parseInt(value[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    if (sum % 10 !== 0) {
      throw new Error('银行卡号校验失败');
    }
  }
  
  // 异步验证：检查用户名是否已存在
  static async isUniqueUsername(value) {
    const existingUser = await User.findOne({
      where: { username: value }
    });
    
    if (existingUser) {
      throw new Error('用户名已存在');
    }
  }
}

module.exports = CustomValidators;
```

### 验证错误处理

```javascript
// controllers/studentController.js - 验证错误处理
const { ValidationError, UniqueConstraintError } = require('sequelize');

class StudentController {
  async create(req, res) {
    try {
      const student = await Student.create(req.body);
      res.status(201).json({
        success: true,
        data: student,
        message: '学生创建成功'
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        // 处理验证错误
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        
        return res.status(400).json({
          success: false,
          error: '数据验证失败',
          details: errors
        });
      }
      
      if (error instanceof UniqueConstraintError) {
        // 处理唯一约束错误
        const field = error.errors[0].path;
        return res.status(409).json({
          success: false,
          error: '数据冲突',
          message: `${field} 已存在`
        });
      }
      
      // 其他错误
      console.error('创建学生失败:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }
  
  // 验证辅助方法
  validateStudentData(data) {
    const errors = [];
    
    // 自定义业务逻辑验证
    if (data.age && data.birth_date) {
      const birthYear = new Date(data.birth_date).getFullYear();
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - birthYear;
      
      if (Math.abs(data.age - calculatedAge) > 1) {
        errors.push({
          field: 'age',
          message: '年龄与出生日期不匹配'
        });
      }
    }
    
    if (data.enrollment_date && new Date(data.enrollment_date) > new Date()) {
      errors.push({
        field: 'enrollment_date',
        message: '入学日期不能是未来日期'
      });
    }
    
    return errors;
  }
}
```

## 5.8 钩子函数 (Hooks)

### 实例钩子

```javascript
const bcrypt = require('bcrypt');
const Student = sequelize.define('Student', {
  // ... 字段定义
}, {
  hooks: {
    // 创建前钩子
    beforeCreate: async (student, options) => {
      console.log('即将创建学生:', student.name);
      
      // 自动生成学号
      if (!student.studentId) {
        const year = new Date().getFullYear();
        const count = await Student.count() + 1;
        student.studentId = `${year}${count.toString().padStart(4, '0')}`;
      }
      
      // 邮箱转小写
      if (student.email) {
        student.email = student.email.toLowerCase();
      }
    },
    
    // 创建后钩子
    afterCreate: async (student, options) => {
      console.log('学生创建成功:', student.name);
      
      // 发送欢迎邮件
      await sendWelcomeEmail(student.email, student.name);
      
      // 记录日志
      await AuditLog.create({
        action: 'CREATE_STUDENT',
        entityId: student.id,
        entityType: 'Student',
        details: `创建学生: ${student.name}`,
        userId: options.userId
      });
    },
    
    // 更新前钩子
    beforeUpdate: async (student, options) => {
      // 记录变更的字段
      const changed = student.changed();
      if (changed.length > 0) {
        console.log('学生信息即将更新:', changed);
        
        // 如果邮箱发生变更，需要重新验证
        if (changed.includes('email')) {
          student.emailVerified = false;
        }
      }
    },
    
    // 更新后钩子
    afterUpdate: async (student, options) => {
      const changed = student.changed();
      if (changed.length > 0) {
        // 记录变更日志
        await AuditLog.create({
          action: 'UPDATE_STUDENT',
          entityId: student.id,
          entityType: 'Student',
          details: `更新字段: ${changed.join(', ')}`,
          userId: options.userId
        });
      }
    },
    
    // 删除前钩子
    beforeDestroy: async (student, options) => {
      console.log('即将删除学生:', student.name);
      
      // 检查是否有关联数据
      const enrollmentCount = await StudentCourse.count({
        where: { studentId: student.id }
      });
      
      if (enrollmentCount > 0 && !options.force) {
        throw new Error('学生有选课记录，无法删除');
      }
    },
    
    // 删除后钩子
    afterDestroy: async (student, options) => {
      console.log('学生删除成功:', student.name);
      
      // 清理相关数据
      await StudentCourse.destroy({
        where: { studentId: student.id },
        force: true
      });
      
      // 记录删除日志
      await AuditLog.create({
        action: 'DELETE_STUDENT',
        entityId: student.id,
        entityType: 'Student',
        details: `删除学生: ${student.name}`,
        userId: options.userId
      });
    },
    
    // 验证前钩子
    beforeValidate: (student, options) => {
      // 数据清理和标准化
      if (student.name) {
        student.name = student.name.trim();
      }
      
      if (student.phone) {
        // 清理电话号码格式
        student.phone = student.phone.replace(/[^\d]/g, '');
      }
    },
    
    // 验证后钩子
    afterValidate: (student, options) => {
      console.log('学生数据验证通过:', student.name);
    }
  }
});
```

### 模型钩子

```javascript
// 批量操作钩子
Student.addHook('beforeBulkCreate', async (students, options) => {
  console.log(`即将批量创建 ${students.length} 个学生`);
  
  // 批量生成学号
  const year = new Date().getFullYear();
  let count = await Student.count();
  
  students.forEach(student => {
    if (!student.studentId) {
      count++;
      student.studentId = `${year}${count.toString().padStart(4, '0')}`;
    }
  });
});

Student.addHook('afterBulkCreate', async (students, options) => {
  console.log(`批量创建 ${students.length} 个学生成功`);
  
  // 批量发送欢迎邮件
  const emailPromises = students.map(student => 
    sendWelcomeEmail(student.email, student.name)
  );
  
  await Promise.all(emailPromises);
});

Student.addHook('beforeBulkUpdate', async (options) => {
  console.log('即将批量更新学生数据');
  
  // 记录更新前的数据
  const studentsToUpdate = await Student.findAll({
    where: options.where,
    attributes: ['id', 'name', 'email']
  });
  
  options.originalData = studentsToUpdate;
});

Student.addHook('afterBulkUpdate', async (options) => {
  console.log('批量更新学生数据完成');
  
  // 记录批量更新日志
  if (options.originalData) {
    const logPromises = options.originalData.map(student => 
      AuditLog.create({
        action: 'BULK_UPDATE_STUDENT',
        entityId: student.id,
        entityType: 'Student',
        details: `批量更新学生: ${student.name}`,
        userId: options.userId
      })
    );
    
    await Promise.all(logPromises);
  }
});
```

### 全局钩子

```javascript
// 全局钩子，应用于所有模型
sequelize.addHook('beforeCreate', (instance, options) => {
  // 自动设置创建时间
  if (!instance.created_at) {
    instance.created_at = new Date();
  }
  
  // 设置创建者
  if (options.userId && !instance.created_by) {
    instance.created_by = options.userId;
  }
});

sequelize.addHook('beforeUpdate', (instance, options) => {
  // 自动设置更新时间
  instance.updated_at = new Date();
  
  // 设置更新者
  if (options.userId) {
    instance.updated_by = options.userId;
  }
});

// 连接钩子
sequelize.addHook('beforeConnect', (config) => {
  console.log('即将连接数据库:', config.host);
});

sequelize.addHook('afterConnect', (connection, config) => {
  console.log('数据库连接成功');
});

sequelize.addHook('beforeDisconnect', (connection) => {
  console.log('即将断开数据库连接');
});

sequelize.addHook('afterDisconnect', (connection) => {
  console.log('数据库连接已断开');
});
```

### 条件钩子

```javascript
// 根据条件执行不同的钩子逻辑
Student.addHook('beforeCreate', async (student, options) => {
  // 只对特定类型的学生执行特殊逻辑
  if (student.type === 'international') {
    // 国际学生需要额外的验证
    if (!student.passport) {
      throw new Error('国际学生必须提供护照信息');
    }
    
    // 生成国际学生专用学号
    const year = new Date().getFullYear();
    const count = await Student.count({ where: { type: 'international' } }) + 1;
    student.studentId = `INT${year}${count.toString().padStart(4, '0')}`;
  }
});

// 钩子中的错误处理
Student.addHook('afterCreate', async (student, options) => {
  try {
    // 尝试发送欢迎邮件
    await sendWelcomeEmail(student.email, student.name);
  } catch (error) {
    // 邮件发送失败不应该影响学生创建
    console.error('发送欢迎邮件失败:', error);
    
    // 可以选择记录到错误日志或重试队列
    await ErrorLog