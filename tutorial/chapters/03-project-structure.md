# 第3章：项目结构设计

## 学习目标

完成本章学习后，你将能够：
- 深入理解 MVC 架构模式
- 设计合理的项目目录结构
- 掌握模块化开发思想
- 实现关注点分离原则
- 建立可扩展的代码组织方式

## 前置要求

- 已完成前两章的学习
- 理解 JavaScript 模块系统
- 熟悉面向对象编程概念

## 3.1 MVC 架构模式详解

### 什么是 MVC

MVC（Model-View-Controller）是一种软件架构模式，将应用程序分为三个核心组件：

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    View     │◄───│ Controller  │───►│    Model    │
│   (视图)     │    │   (控制器)   │    │   (模型)     │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                   │                   │
       │                   ▼                   │
       └───────────── User Input ──────────────┘
```

### MVC 组件详解

#### Model（模型）
- **职责**：数据管理和业务逻辑
- **包含**：数据库操作、数据验证、业务规则
- **特点**：独立于用户界面，可重用

```javascript
// 示例：学生模型
class Student {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.age = data.age;
  }

  // 业务逻辑：验证学生数据
  validate() {
    const errors = [];
    if (!this.name || this.name.length < 2) {
      errors.push('姓名至少需要2个字符');
    }
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('请输入有效的邮箱地址');
    }
    return errors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

#### View（视图）
- **职责**：用户界面展示
- **包含**：HTML 模板、CSS 样式、前端 JavaScript
- **特点**：负责数据的可视化展示

```html
<!-- 示例：学生列表视图 -->
<!DOCTYPE html>
<html>
<head>
    <title>学生列表</title>
</head>
<body>
    <h1>学生管理系统</h1>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>姓名</th>
                <th>邮箱</th>
                <th>年龄</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            <% students.forEach(student => { %>
            <tr>
                <td><%= student.id %></td>
                <td><%= student.name %></td>
                <td><%= student.email %></td>
                <td><%= student.age %></td>
                <td>
                    <a href="/students/<%= student.id %>/edit">编辑</a>
                    <a href="/students/<%= student.id %>/delete">删除</a>
                </td>
            </tr>
            <% }); %>
        </tbody>
    </table>
</body>
</html>
```

#### Controller（控制器）
- **职责**：处理用户输入，协调 Model 和 View
- **包含**：路由处理、请求验证、响应生成
- **特点**：连接用户界面和业务逻辑

```javascript
// 示例：学生控制器
class StudentController {
  // 显示学生列表
  async index(req, res) {
    try {
      const students = await Student.findAll();
      res.render('students/index', { students });
    } catch (error) {
      res.status(500).render('error', { message: '获取学生列表失败' });
    }
  }

  // 显示创建学生表单
  new(req, res) {
    res.render('students/new', { student: {}, errors: [] });
  }

  // 创建新学生
  async create(req, res) {
    try {
      const student = new Student(req.body);
      const errors = student.validate();
      
      if (errors.length > 0) {
        return res.render('students/new', { student: req.body, errors });
      }
      
      await student.save();
      res.redirect('/students');
    } catch (error) {
      res.status(500).render('error', { message: '创建学生失败' });
    }
  }
}
```

### MVC 的优势

1. **关注点分离**：每个组件有明确的职责
2. **可维护性**：代码结构清晰，易于维护
3. **可测试性**：各组件可以独立测试
4. **可重用性**：模型和视图可以在不同场景下重用
5. **团队协作**：不同角色可以并行开发

## 3.2 目录结构设计

### 标准 Node.js 项目结构

```
student-management-system/
├── app.js                     # 应用入口文件
├── package.json               # 项目配置
├── package-lock.json          # 依赖锁定
├── .env                       # 环境变量
├── .gitignore                 # Git 忽略文件
├── README.md                  # 项目文档
│
├── config/                    # 配置文件目录
│   ├── database.js            # 数据库配置
│   ├── environment.js         # 环境配置
│   ├── session.js             # 会话配置
│   └── security.js            # 安全配置
│
├── controllers/               # 控制器目录
│   ├── index.js               # 控制器入口
│   ├── studentController.js   # 学生控制器
│   ├── authController.js      # 认证控制器
│   └── baseController.js      # 基础控制器
│
├── models/                    # 数据模型目录
│   ├── index.js               # 模型入口
│   ├── Student.js             # 学生模型
│   ├── User.js                # 用户模型
│   └── associations.js        # 模型关联
│
├── views/                     # 视图模板目录
│   ├── layouts/               # 布局模板
│   │   ├── main.ejs           # 主布局
│   │   └── admin.ejs          # 管理员布局
│   ├── students/              # 学生相关视图
│   │   ├── index.ejs          # 学生列表
│   │   ├── show.ejs           # 学生详情
│   │   ├── new.ejs            # 新建学生
│   │   └── edit.ejs           # 编辑学生
│   ├── auth/                  # 认证相关视图
│   │   ├── login.ejs          # 登录页面
│   │   └── register.ejs       # 注册页面
│   ├── partials/              # 部分模板
│   │   ├── header.ejs         # 页头
│   │   ├── footer.ejs         # 页脚
│   │   └── navigation.ejs     # 导航
│   ├── index.ejs              # 首页
│   ├── 404.ejs                # 404 页面
│   └── error.ejs              # 错误页面
│
├── routes/                    # 路由目录
│   ├── index.js               # 路由入口
│   ├── students.js            # 学生路由
│   ├── auth.js                # 认证路由
│   └── api.js                 # API 路由
│
├── middleware/                # 中间件目录
│   ├── index.js               # 中间件入口
│   ├── auth.js                # 认证中间件
│   ├── validation.js          # 验证中间件
│   ├── errorHandler.js        # 错误处理中间件
│   └── logger.js              # 日志中间件
│
├── services/                  # 服务层目录
│   ├── studentService.js      # 学生服务
│   ├── authService.js         # 认证服务
│   ├── emailService.js        # 邮件服务
│   └── fileService.js         # 文件服务
│
├── utils/                     # 工具函数目录
│   ├── logger.js              # 日志工具
│   ├── validator.js           # 验证工具
│   ├── helpers.js             # 辅助函数
│   └── constants.js           # 常量定义
│
├── public/                    # 静态资源目录
│   ├── css/                   # 样式文件
│   │   ├── main.css           # 主样式
│   │   ├── bootstrap.min.css  # Bootstrap
│   │   └── custom.css         # 自定义样式
│   ├── js/                    # JavaScript 文件
│   │   ├── main.js            # 主脚本
│   │   ├── bootstrap.min.js   # Bootstrap JS
│   │   └── validation.js      # 前端验证
│   ├── images/                # 图片文件
│   │   ├── logo.png           # 网站 Logo
│   │   └── avatars/           # 用户头像
│   └── uploads/               # 上传文件
│       └── students/          # 学生相关文件
│
├── database/                  # 数据库目录
│   ├── students.db            # SQLite 数据库文件
│   ├── migrations/            # 数据库迁移
│   └── seeders/               # 种子数据
│
├── scripts/                   # 脚本文件目录
│   ├── init-database.js       # 初始化数据库
│   ├── seed-database.js       # 填充种子数据
│   ├── backup.js              # 数据备份
│   └── deploy.js              # 部署脚本
│
├── tests/                     # 测试文件目录
│   ├── unit/                  # 单元测试
│   │   ├── models/            # 模型测试
│   │   ├── controllers/       # 控制器测试
│   │   └── services/          # 服务测试
│   ├── integration/           # 集成测试
│   │   └── routes/            # 路由测试
│   ├── fixtures/              # 测试数据
│   └── helpers/               # 测试辅助
│
├── logs/                      # 日志文件目录
│   ├── app.log                # 应用日志
│   ├── error.log              # 错误日志
│   └── access.log             # 访问日志
│
└── docs/                      # 文档目录
    ├── api.md                 # API 文档
    ├── deployment.md          # 部署文档
    └── development.md         # 开发文档
```

### 目录结构设计原则

#### 1. 按功能分层
```
# 好的做法：按功能分层
controllers/
  studentController.js
  userController.js
  courseController.js

# 避免的做法：按文件类型分组
student/
  studentController.js
  studentModel.js
  studentView.ejs
```

#### 2. 关注点分离
```
# 配置相关
config/
  database.js      # 数据库配置
  environment.js   # 环境配置
  security.js      # 安全配置

# 业务逻辑相关
services/
  studentService.js
  authService.js

# 工具函数
utils/
  logger.js
  validator.js
```

#### 3. 可扩展性
```
# 支持模块化扩展
modules/
  student/
    controller.js
    model.js
    routes.js
    service.js
  course/
    controller.js
    model.js
    routes.js
    service.js
```

## 3.3 模块化开发

### CommonJS 模块系统

#### 导出模块

```javascript
// utils/logger.js - 单个函数导出
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

module.exports = log;
```

```javascript
// utils/validator.js - 多个函数导出
function isEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isPhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

function isEmpty(value) {
  return !value || value.trim().length === 0;
}

module.exports = {
  isEmail,
  isPhone,
  isEmpty
};
```

```javascript
// models/Student.js - 类导出
class Student {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.age = data.age;
  }

  validate() {
    // 验证逻辑
  }

  save() {
    // 保存逻辑
  }
}

module.exports = Student;
```

#### 导入模块

```javascript
// 导入单个函数
const log = require('./utils/logger');
log('应用启动');

// 导入多个函数
const { isEmail, isEmpty } = require('./utils/validator');
const validator = require('./utils/validator');

// 导入类
const Student = require('./models/Student');
const student = new Student({ name: '张三', email: 'zhang@example.com' });

// 导入核心模块
const path = require('path');
const fs = require('fs');

// 导入第三方模块
const express = require('express');
const sequelize = require('sequelize');
```

### 模块组织策略

#### 1. 入口文件模式

```javascript
// controllers/index.js - 控制器入口
const studentController = require('./studentController');
const authController = require('./authController');
const userController = require('./userController');

module.exports = {
  studentController,
  authController,
  userController
};
```

```javascript
// 使用入口文件
const { studentController, authController } = require('./controllers');
```

#### 2. 配置聚合模式

```javascript
// config/index.js - 配置聚合
const database = require('./database');
const environment = require('./environment');
const security = require('./security');

module.exports = {
  database,
  environment,
  security
};
```

#### 3. 服务注册模式

```javascript
// services/index.js - 服务注册
const services = {};

// 注册服务
services.student = require('./studentService');
services.auth = require('./authService');
services.email = require('./emailService');

// 服务依赖注入
services.student.setEmailService(services.email);
services.auth.setStudentService(services.student);

module.exports = services;
```

## 3.4 创建基础控制器

### 基础控制器类

```javascript
// controllers/baseController.js
class BaseController {
  constructor() {
    // 绑定方法到实例
    this.index = this.index.bind(this);
    this.show = this.show.bind(this);
    this.new = this.new.bind(this);
    this.create = this.create.bind(this);
    this.edit = this.edit.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  // 通用错误处理
  handleError(res, error, message = '服务器内部错误') {
    console.error('Controller Error:', error);
    res.status(500).render('error', {
      title: '错误',
      message: process.env.NODE_ENV === 'development' ? error.message : message
    });
  }

  // 通用验证错误处理
  handleValidationError(res, errors, data, template) {
    res.status(400).render(template, {
      errors,
      ...data
    });
  }

  // 通用成功响应
  handleSuccess(res, redirectPath, message) {
    if (message) {
      // 如果有 flash 消息系统，在这里设置
      // req.flash('success', message);
    }
    res.redirect(redirectPath);
  }

  // 通用分页处理
  getPaginationParams(req) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  }

  // 通用搜索参数处理
  getSearchParams(req) {
    const { search, sortBy, sortOrder } = req.query;
    
    return {
      search: search || '',
      sortBy: sortBy || 'id',
      sortOrder: sortOrder || 'ASC'
    };
  }

  // 需要子类实现的方法
  async index(req, res) {
    throw new Error('index method must be implemented');
  }

  async show(req, res) {
    throw new Error('show method must be implemented');
  }

  async new(req, res) {
    throw new Error('new method must be implemented');
  }

  async create(req, res) {
    throw new Error('create method must be implemented');
  }

  async edit(req, res) {
    throw new Error('edit method must be implemented');
  }

  async update(req, res) {
    throw new Error('update method must be implemented');
  }

  async destroy(req, res) {
    throw new Error('destroy method must be implemented');
  }
}

module.exports = BaseController;
```

### 学生控制器实现

```javascript
// controllers/studentController.js
const BaseController = require('./baseController');
const Student = require('../models/Student');
const { isEmail, isEmpty } = require('../utils/validator');

class StudentController extends BaseController {
  // 显示学生列表
  async index(req, res) {
    try {
      const { page, limit, offset } = this.getPaginationParams(req);
      const { search, sortBy, sortOrder } = this.getSearchParams(req);
      
      let whereClause = {};
      if (search) {
        whereClause = {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } }
          ]
        };
      }
      
      const { count, rows: students } = await Student.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder]],
        limit,
        offset
      });
      
      const totalPages = Math.ceil(count / limit);
      
      res.render('students/index', {
        title: '学生列表',
        students,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: count,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        search: {
          query: search,
          sortBy,
          sortOrder
        }
      });
    } catch (error) {
      this.handleError(res, error, '获取学生列表失败');
    }
  }

  // 显示学生详情
  async show(req, res) {
    try {
      const { id } = req.params;
      const student = await Student.findByPk(id);
      
      if (!student) {
        return res.status(404).render('404', {
          title: '学生未找到',
          message: `ID 为 ${id} 的学生不存在`
        });
      }
      
      res.render('students/show', {
        title: `学生详情 - ${student.name}`,
        student
      });
    } catch (error) {
      this.handleError(res, error, '获取学生详情失败');
    }
  }

  // 显示新建学生表单
  async new(req, res) {
    res.render('students/new', {
      title: '新建学生',
      student: {},
      errors: []
    });
  }

  // 创建新学生
  async create(req, res) {
    try {
      const { name, email, age, phone, address } = req.body;
      
      // 验证输入数据
      const errors = this.validateStudentData({ name, email, age, phone });
      
      if (errors.length > 0) {
        return this.handleValidationError(res, errors, {
          title: '新建学生',
          student: req.body
        }, 'students/new');
      }
      
      // 检查邮箱是否已存在
      const existingStudent = await Student.findOne({ where: { email } });
      if (existingStudent) {
        return this.handleValidationError(res, ['邮箱地址已被使用'], {
          title: '新建学生',
          student: req.body
        }, 'students/new');
      }
      
      // 创建学生
      const student = await Student.create({
        name,
        email,
        age: parseInt(age),
        phone,
        address
      });
      
      this.handleSuccess(res, '/students', '学生创建成功');
    } catch (error) {
      this.handleError(res, error, '创建学生失败');
    }
  }

  // 显示编辑学生表单
  async edit(req, res) {
    try {
      const { id } = req.params;
      const student = await Student.findByPk(id);
      
      if (!student) {
        return res.status(404).render('404', {
          title: '学生未找到',
          message: `ID 为 ${id} 的学生不存在`
        });
      }
      
      res.render('students/edit', {
        title: `编辑学生 - ${student.name}`,
        student,
        errors: []
      });
    } catch (error) {
      this.handleError(res, error, '获取学生信息失败');
    }
  }

  // 更新学生信息
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, age, phone, address } = req.body;
      
      const student = await Student.findByPk(id);
      if (!student) {
        return res.status(404).render('404', {
          title: '学生未找到',
          message: `ID 为 ${id} 的学生不存在`
        });
      }
      
      // 验证输入数据
      const errors = this.validateStudentData({ name, email, age, phone });
      
      if (errors.length > 0) {
        return this.handleValidationError(res, errors, {
          title: `编辑学生 - ${student.name}`,
          student: { ...student.toJSON(), ...req.body }
        }, 'students/edit');
      }
      
      // 检查邮箱是否被其他学生使用
      if (email !== student.email) {
        const existingStudent = await Student.findOne({ where: { email } });
        if (existingStudent) {
          return this.handleValidationError(res, ['邮箱地址已被其他学生使用'], {
            title: `编辑学生 - ${student.name}`,
            student: { ...student.toJSON(), ...req.body }
          }, 'students/edit');
        }
      }
      
      // 更新学生信息
      await student.update({
        name,
        email,
        age: parseInt(age),
        phone,
        address
      });
      
      this.handleSuccess(res, `/students/${id}`, '学生信息更新成功');
    } catch (error) {
      this.handleError(res, error, '更新学生信息失败');
    }
  }

  // 删除学生
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const student = await Student.findByPk(id);
      
      if (!student) {
        return res.status(404).render('404', {
          title: '学生未找到',
          message: `ID 为 ${id} 的学生不存在`
        });
      }
      
      await student.destroy();
      this.handleSuccess(res, '/students', '学生删除成功');
    } catch (error) {
      this.handleError(res, error, '删除学生失败');
    }
  }

  // 验证学生数据
  validateStudentData({ name, email, age, phone }) {
    const errors = [];
    
    if (isEmpty(name)) {
      errors.push('姓名不能为空');
    } else if (name.length < 2) {
      errors.push('姓名至少需要2个字符');
    } else if (name.length > 50) {
      errors.push('姓名不能超过50个字符');
    }
    
    if (isEmpty(email)) {
      errors.push('邮箱不能为空');
    } else if (!isEmail(email)) {
      errors.push('请输入有效的邮箱地址');
    }
    
    if (age) {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
        errors.push('年龄必须是1-150之间的数字');
      }
    }
    
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      errors.push('请输入有效的手机号码');
    }
    
    return errors;
  }
}

module.exports = new StudentController();
```

## 3.5 路由组织

### 路由模块化

```javascript
// routes/students.js - 学生路由
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');

// 学生列表
router.get('/', studentController.index);

// 新建学生表单
router.get('/new', authMiddleware.requireAuth, studentController.new);

// 创建学生
router.post('/', 
  authMiddleware.requireAuth,
  validationMiddleware.validateStudent,
  studentController.create
);

// 学生详情
router.get('/:id', studentController.show);

// 编辑学生表单
router.get('/:id/edit', 
  authMiddleware.requireAuth,
  studentController.edit
);

// 更新学生
router.put('/:id', 
  authMiddleware.requireAuth,
  validationMiddleware.validateStudent,
  studentController.update
);

// 删除学生
router.delete('/:id', 
  authMiddleware.requireAuth,
  studentController.destroy
);

module.exports = router;
```

```javascript
// routes/index.js - 路由入口
const express = require('express');
const router = express.Router();

// 首页路由
router.get('/', (req, res) => {
  res.render('index', {
    title: '学生管理系统',
    message: '欢迎使用学生管理系统！'
  });
});

// 子路由
router.use('/students', require('./students'));
router.use('/auth', require('./auth'));
router.use('/api', require('./api'));

module.exports = router;
```

### RESTful 路由设计

```javascript
// RESTful 路由约定
// GET    /students          # 学生列表 (index)
// GET    /students/new      # 新建学生表单 (new)
// POST   /students          # 创建学生 (create)
// GET    /students/:id      # 学生详情 (show)
// GET    /students/:id/edit # 编辑学生表单 (edit)
// PUT    /students/:id      # 更新学生 (update)
// DELETE /students/:id      # 删除学生 (destroy)

// 嵌套资源路由
// GET    /students/:id/courses        # 学生的课程列表
// POST   /students/:id/courses        # 为学生添加课程
// DELETE /students/:id/courses/:cid   # 删除学生的课程
```

## 3.6 中间件组织

### 认证中间件

```javascript
// middleware/auth.js
const authService = require('../services/authService');

class AuthMiddleware {
  // 要求用户已登录
  requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
      return res.redirect('/auth/login');
    }
    next();
  }

  // 要求用户未登录
  requireGuest(req, res, next) {
    if (req.session && req.session.userId) {
      return res.redirect('/');
    }
    next();
  }

  // 要求管理员权限
  requireAdmin(req, res, next) {
    if (!req.session || !req.session.userId) {
      return res.redirect('/auth/login');
    }
    
    // 检查用户是否为管理员
    if (!req.session.isAdmin) {
      return res.status(403).render('error', {
        title: '访问被拒绝',
        message: '您没有权限访问此页面'
      });
    }
    
    next();
  }

  // 设置当前用户信息
  async setCurrentUser(req, res, next) {
    if (req.session && req.session.userId) {
      try {
        const user = await authService.findUserById(req.session.userId);
        req.currentUser = user;
        res.locals.currentUser = user;
      } catch (error) {
        console.error('设置当前用户失败:', error);
      }
    }
    next();
  }
}

module.exports = new AuthMiddleware();
```

### 验证中间件

```javascript
// middleware/validation.js
const { body, validationResult } = require('express-validator');

class ValidationMiddleware {
  // 学生数据验证规则
  validateStudent = [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('姓名长度必须在2-50个字符之间'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('请输入有效的邮箱地址'),
    
    body('age')
      .optional()
      .isInt({ min: 1, max: 150 })
      .withMessage('年龄必须是1-150之间的整数'),
    
    body('phone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    
    this.handleValidationErrors
  ];

  // 用户注册验证规则
  validateUserRegistration = [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('用户名长度必须在3-30个字符之间')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('用户名只能包含字母、数字和下划线'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('请输入有效的邮箱地址'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码至少需要6个字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('密码必须包含至少一个小写字母、一个大写字母和一个数字'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('确认密码与密码不匹配');
        }
        return true;
      }),
    
    this.handleValidationErrors
  ];

  // 处理验证错误
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // 将错误信息转换为数组格式
      const errorMessages = errors.array().map(error => error.msg);
      
      // 根据请求类型返回不同格式的错误
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({
          success: false,
          errors: errorMessages
        });
      }
      
      // 对于表单提交，重新渲染表单页面
      const originalUrl = req.originalUrl;
      let template = 'error';
      
      if (originalUrl.includes('/students')) {
        template = originalUrl.includes('/edit') ? 'students/edit' : 'students/new';
      } else if (originalUrl.includes('/auth/register')) {
        template = 'auth/register';
      }
      
      return res.status(400).render(template, {
        errors: errorMessages,
        ...req.body
      });
    }
    
    next();
  }
}

module.exports = new ValidationMiddleware();
```

### 错误处理中间件

```javascript
// middleware/errorHandler.js
const logger = require('../utils/logger');

class ErrorHandler {
  // 404 错误处理
  notFound(req, res, next) {
    const error = new Error(`页面未找到 - ${req.originalUrl}`);
    error.status = 404;
    next(error);
  }

  // 全局错误处理
  globalErrorHandler(error, req, res, next) {
    let { status = 500, message } = error;
    
    // 记录错误日志
    logger.error({
      error: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // 开发环境显示详细错误信息
    if (process.env.NODE_ENV === 'development') {
      return res.status(status).render('error', {
        title: '错误',
        message,
        error: {
          status,
          stack: error.stack
        }
      });
    }
    
    // 生产环境隐藏敏感信息
    const productionMessage = status === 404 ? '页面未找到' : '服务器内部错误';
    
    res.status(status).render('error', {
      title: '错误',
      message: productionMessage,
      error: {}
    });
  }

  // 异步错误捕获
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = new ErrorHandler();
```

## 3.7 服务层设计

### 学生服务

```javascript
// services/studentService.js
const Student = require('../models/Student');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class StudentService {
  // 获取学生列表
  async getStudents(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'id',
        sortOrder = 'ASC'
      } = options;
      
      const offset = (page - 1) * limit;
      
      let whereClause = {};
      if (search) {
        whereClause = {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } }
          ]
        };
      }
      
      const result = await Student.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        students: result.rows,
        totalCount: result.count,
        totalPages: Math.ceil(result.count / limit),
        currentPage: parseInt(page)
      };
    } catch (error) {
      logger.error('获取学生列表失败:', error);
      throw new Error('获取学生列表失败');
    }
  }

  // 根据ID获取学生
  async getStudentById(id) {
    try {
      const student = await Student.findByPk(id);
      if (!student) {
        throw new Error('学生不存在');
      }
      return student;
    } catch (error) {
      logger.error(`获取学生失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  // 创建学生
  async createStudent(studentData) {
    try {
      // 检查邮箱是否已存在
      const existingStudent = await Student.findOne({
        where: { email: studentData.email }
      });
      
      if (existingStudent) {
        throw new Error('邮箱地址已被使用');
      }
      
      const student = await Student.create(studentData);
      logger.info(`学生创建成功 (ID: ${student.id})`);
      return student;
    } catch (error) {
      logger.error('创建学生失败:', error);
      throw error;
    }
  }

  // 更新学生
  async updateStudent(id, studentData) {
    try {
      const student = await this.getStudentById(id);
      
      // 如果邮箱发生变化，检查新邮箱是否已被使用
      if (studentData.email && studentData.email !== student.email) {
        const existingStudent = await Student.findOne({
          where: { 
            email: studentData.email,
            id: { [Op.ne]: id }
          }
        });
        
        if (existingStudent) {
          throw new Error('邮箱地址已被其他学生使用');
        }
      }
      
      await student.update(studentData);
      logger.info(`学生更新成功 (ID: ${id})`);
      return student;
    } catch (error) {
      logger.error(`更新学生失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  // 删除学生
  async deleteStudent(id) {
    try {
      const student = await this.getStudentById(id);
      await student.destroy();
      logger.info(`学生删除成功 (ID: ${id})`);
      return true;
    } catch (error) {
      logger.error(`删除学生失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  // 批量删除学生
  async deleteStudents(ids) {
    try {
      const deletedCount = await Student.destroy({
        where: {
          id: {
            [Op.in]: ids
          }
        }
      });
      
      logger.info(`批量删除学生成功，删除数量: ${deletedCount}`);
      return deletedCount;
    } catch (error) {
      logger.error('批量删除学生失败:', error);
      throw new Error('批量删除学生失败');
    }
  }

  // 搜索学生
  async searchStudents(query, options = {}) {
    try {
      const { limit = 10 } = options;
      
      const students = await Student.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${query}%` } },
            { email: { [Op.like]: `%${query}%` } },
            { phone: { [Op.like]: `%${query}%` } }
          ]
        },
        limit: parseInt(limit),
        order: [['name', 'ASC']]
      });
      
      return students;
    } catch (error) {
      logger.error('搜索学生失败:', error);
      throw new Error('搜索学生失败');
    }
  }

  // 获取学生统计信息
  async getStudentStats() {
    try {
      const totalCount = await Student.count();
      const avgAge = await Student.aggregate('age', 'avg');
      const ageDistribution = await Student.findAll({
        attributes: [
          [sequelize.fn('CASE', 
            sequelize.literal('WHEN age < 18 THEN "未成年"'),
            sequelize.literal('WHEN age BETWEEN 18 AND 25 THEN "青年"'),
            sequelize.literal('WHEN age BETWEEN 26 AND 35 THEN "成年"'),
            sequelize.literal('ELSE "中年及以上"')
          ), 'ageGroup'],
          [sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['ageGroup'],
        raw: true
      });
      
      return {
        totalCount,
        averageAge: Math.round(avgAge * 100) / 100,
        ageDistribution
      };
    } catch (error) {
      logger.error('获取学生统计信息失败:', error);
      throw new Error('获取学生统计信息失败');
    }
  }
}

module.exports = new StudentService();
```

## 3.8 工具函数组织

### 日志工具

```javascript
// utils/logger.js
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDir();
  }

  // 确保日志目录存在
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // 格式化日志消息
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };
    return JSON.stringify(logEntry);
  }

  // 写入日志文件
  writeToFile(filename, message) {
    const logFile = path.join(this.logDir, filename);
    fs.appendFileSync(logFile, message + '\n');
  }

  // 信息日志
  info(message, meta = {}) {
    const formattedMessage = this.formatMessage('INFO', message, meta);
    console.log(`[INFO] ${message}`);
    this.writeToFile('app.log', formattedMessage);
  }

  // 错误日志
  error(message, meta = {}) {
    const formattedMessage = this.formatMessage('ERROR', message, meta);
    console.error(`[ERROR] ${message}`);
    this.writeToFile('error.log', formattedMessage);
    this.writeToFile('app.log', formattedMessage);
  }

  // 警告日志
  warn(message, meta = {}) {
    const formattedMessage = this.formatMessage('WARN', message, meta);
    console.warn(`[WARN] ${message}`);
    this.writeToFile('app.log', formattedMessage);
  }

  // 调试日志
  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('DEBUG', message, meta);
      console.log(`[DEBUG] ${message}`);
      this.writeToFile('debug.log', formattedMessage);
    }
  }
}

module.exports = new Logger();
```

### 验证工具

```javascript
// utils/validator.js
class Validator {
  // 检查是否为空
  isEmpty(value) {
    return !value || (typeof value === 'string' && value.trim().length === 0);
  }

  // 验证邮箱
  isEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证手机号
  isPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // 验证身份证号
  isIdCard(idCard) {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return idCardRegex.test(idCard);
  }

  // 验证密码强度
  isStrongPassword(password) {
    // 至少8位，包含大小写字母、数字和特殊字符
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  // 验证URL
  isUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // 验证数字范围
  isInRange(value, min, max) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  // 验证字符串长度
  isValidLength(str, min, max) {
    if (typeof str !== 'string') return false;
    const length = str.trim().length;
    return length >= min && length <= max;
  }

  // 验证日期格式
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  // 验证年龄
  isValidAge(age) {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum >= 1 && ageNum <= 150;
  }

  // 清理HTML标签
  sanitizeHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // 转义HTML特殊字符
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = new Validator();
```

## 3.9 配置文件组织

### 数据库配置

```javascript
// config/database.js
const path = require('path');
const environment = require('./environment');

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database/students.db'),
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  
  production: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database/students_prod.db'),
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

### 安全配置

```javascript
// config/security.js
module.exports = {
  // 会话配置
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
  },
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Helmet安全头配置
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com']
      }
    }
  },
  
  // 速率限制配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false
  }
};
```

## 3.10 本章小结

在本章中，我们深入学习了项目结构设计的核心概念：

✅ **MVC架构模式**：
- 理解了Model、View、Controller的职责分工
- 学会了如何实现关注点分离
- 掌握了MVC模式的优势和应用场景

✅ **目录结构设计**：
- 建立了标准的Node.js项目结构
- 学会了按功能分层的组织方式
- 理解了可扩展性和可维护性的重要性

✅ **模块化开发**：
- 掌握了CommonJS模块系统
- 学会了模块的导入导出
- 理解了模块组织的最佳实践

✅ **代码组织**：
- 创建了基础控制器类
- 实现了路由模块化
- 设计了中间件系统
- 建立了服务层架构

## 3.11 课后练习

### 练习1：扩展控制器
基于BaseController，创建一个CourseController：
1. 实现课程的CRUD操作
2. 添加课程搜索功能
3. 实现课程统计功能

### 练习2：中间件开发
创建以下中间件：
1. 日志记录中间件
2. 请求限流中间件
3. 文件上传中间件

### 练习3：服务层设计
设计一个通用的BaseService类：
1. 包含基础的CRUD方法
2. 支持分页和搜索
3. 提供事务处理功能

## 3.12 下一章预告

在下一章《Express.js 基础》中，我们将：
- 深入学习 Express.js 框架
- 掌握路由和中间件的高级用法
- 学习模板引擎的使用
- 实现静态资源服务

---

**学习提示**：
- MVC架构是Web开发的经典模式，要深入理解各组件的职责
- 良好的项目结构是团队协作的基础
- 模块化开发有助于代码的复用和维护
- 关注点分离是软件设计的重要原则

**参考资源**：
- [Express.js 官方文档](https://expressjs.com/)
- [Node.js 模块系统](https://nodejs.org/api/modules.html)
- [MVC 架构模式详解](https://developer.mozilla.org/en-US/docs/Glossary/MVC)
- [RESTful API 设计指南](https://restfulapi.net/)