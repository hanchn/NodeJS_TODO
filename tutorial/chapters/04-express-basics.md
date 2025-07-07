# 第4章：Express.js 基础

## 学习目标

完成本章学习后，你将能够：
- 深入理解 Express.js 框架的核心概念
- 掌握路由系统的设计和实现
- 熟练使用各种中间件
- 学会模板引擎的配置和使用
- 实现静态资源服务
- 处理请求和响应对象

## 前置要求

- 已完成前三章的学习
- 理解 HTTP 协议基础
- 熟悉 JavaScript 异步编程
- 了解 Node.js 基础概念

## 4.1 Express.js 框架概述

### 什么是 Express.js

Express.js 是 Node.js 最流行的 Web 应用框架，它提供了一套简洁而灵活的功能来开发 Web 和移动应用程序。

### Express.js 的特点

1. **轻量级**：核心功能精简，通过中间件扩展
2. **灵活性**：不强制特定的项目结构
3. **中间件生态**：丰富的第三方中间件
4. **路由系统**：强大的路由功能
5. **模板引擎**：支持多种模板引擎
6. **静态文件服务**：内置静态文件服务

### Express.js 架构

```
┌─────────────────────────────────────────────────────────┐
│                    Express Application                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Middleware  │  │ Middleware  │  │ Middleware  │ ... │
│  │     #1      │  │     #2      │  │     #3      │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                    Router System                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Route     │  │   Route     │  │   Route     │ ... │
│  │ Handler #1  │  │ Handler #2  │  │ Handler #3  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 4.2 创建基础 Express 应用

### 最简单的 Express 应用

```javascript
// app.js - 最基础的 Express 应用
const express = require('express');
const app = express();
const PORT = 3000;

// 基础路由
app.get('/', (req, res) => {
  res.send('Hello Express!');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

### 完整的应用结构

```javascript
// app.js - 完整的 Express 应用
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

// 导入配置
const config = require('./config/environment');
const securityConfig = require('./config/security');

// 导入路由
const indexRouter = require('./routes/index');
const studentsRouter = require('./routes/students');
const authRouter = require('./routes/auth');

// 导入中间件
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// 创建 Express 应用
const app = express();

// 信任代理（如果在代理后面运行）
app.set('trust proxy', 1);

// 视图引擎设置
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 安全中间件
app.use(helmet(securityConfig.helmet));
app.use(cors(securityConfig.cors));

// 日志中间件
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 会话中间件
app.use(session(securityConfig.session));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 设置当前用户中间件
app.use(authMiddleware.setCurrentUser);

// 全局变量设置
app.use((req, res, next) => {
  res.locals.appName = config.APP_NAME;
  res.locals.currentPath = req.path;
  res.locals.currentUser = req.currentUser;
  next();
});

// 路由设置
app.use('/', indexRouter);
app.use('/students', studentsRouter);
app.use('/auth', authRouter);

// 404 处理
app.use(errorHandler.notFound);

// 全局错误处理
app.use(errorHandler.globalErrorHandler);

// 启动服务器
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 ${config.APP_NAME} 运行在 http://localhost:${PORT}`);
  console.log(`📝 环境: ${config.NODE_ENV}`);
  console.log(`📁 静态文件目录: ${path.join(__dirname, 'public')}`);
  console.log(`👁️  视图目录: ${path.join(__dirname, 'views')}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;
```

## 4.3 路由系统详解

### 基础路由

```javascript
// 基础路由方法
app.get('/', (req, res) => {
  res.send('GET 请求');
});

app.post('/', (req, res) => {
  res.send('POST 请求');
});

app.put('/', (req, res) => {
  res.send('PUT 请求');
});

app.delete('/', (req, res) => {
  res.send('DELETE 请求');
});

// 处理所有 HTTP 方法
app.all('/all', (req, res) => {
  res.send(`${req.method} 请求`);
});
```

### 路由参数

```javascript
// 路径参数
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.send(`用户 ID: ${userId}`);
});

// 多个参数
app.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  res.send(`用户 ${userId} 的文章 ${postId}`);
});

// 可选参数
app.get('/posts/:year/:month?', (req, res) => {
  const { year, month } = req.params;
  if (month) {
    res.send(`${year}年${month}月的文章`);
  } else {
    res.send(`${year}年的文章`);
  }
});

// 通配符参数
app.get('/files/*', (req, res) => {
  const filePath = req.params[0];
  res.send(`文件路径: ${filePath}`);
});
```

### 查询参数

```javascript
// 查询参数处理
app.get('/search', (req, res) => {
  const {
    q,           // 搜索关键词
    page = 1,    // 页码，默认为1
    limit = 10,  // 每页数量，默认为10
    sort = 'id', // 排序字段，默认为id
    order = 'asc' // 排序方向，默认为升序
  } = req.query;
  
  res.json({
    query: q,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    },
    sorting: {
      field: sort,
      direction: order
    }
  });
});

// URL: /search?q=nodejs&page=2&limit=20&sort=name&order=desc
```

### 路由模式匹配

```javascript
// 字符串模式
app.get('/ab*cd', handler);     // 匹配 abcd, abxcd, abRANDOMcd 等
app.get('/ab+cd', handler);     // 匹配 abcd, abbcd, abbbcd 等
app.get('/ab?cd', handler);     // 匹配 acd, abcd
app.get('/ab(cd)?e', handler);  // 匹配 abe, abcde

// 正则表达式模式
app.get(/.*fly$/, handler);     // 匹配以 fly 结尾的路径
app.get(/\/(\d+)/, handler);    // 匹配包含数字的路径
```

### Express Router

```javascript
// routes/students.js - 学生路由模块
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');

// 路由级中间件
router.use((req, res, next) => {
  console.log(`学生路由访问时间: ${new Date().toISOString()}`);
  next();
});

// 学生列表 - GET /students
router.get('/', studentController.index);

// 学生搜索 - GET /students/search
router.get('/search', studentController.search);

// 新建学生表单 - GET /students/new
router.get('/new', 
  authMiddleware.requireAuth,
  studentController.new
);

// 创建学生 - POST /students
router.post('/', 
  authMiddleware.requireAuth,
  validationMiddleware.validateStudent,
  studentController.create
);

// 学生详情 - GET /students/:id
router.get('/:id', 
  validationMiddleware.validateId,
  studentController.show
);

// 编辑学生表单 - GET /students/:id/edit
router.get('/:id/edit', 
  authMiddleware.requireAuth,
  validationMiddleware.validateId,
  studentController.edit
);

// 更新学生 - PUT /students/:id
router.put('/:id', 
  authMiddleware.requireAuth,
  validationMiddleware.validateId,
  validationMiddleware.validateStudent,
  studentController.update
);

// 删除学生 - DELETE /students/:id
router.delete('/:id', 
  authMiddleware.requireAuth,
  validationMiddleware.validateId,
  studentController.destroy
);

// 批量操作路由
router.post('/batch/delete', 
  authMiddleware.requireAuth,
  validationMiddleware.validateBatchIds,
  studentController.batchDelete
);

// 导出学生数据 - GET /students/export
router.get('/export/:format', 
  authMiddleware.requireAuth,
  validationMiddleware.validateExportFormat,
  studentController.export
);

// 导入学生数据 - POST /students/import
router.post('/import', 
  authMiddleware.requireAuth,
  validationMiddleware.validateImportFile,
  studentController.import
);

module.exports = router;
```

### 路由参数验证

```javascript
// middleware/validation.js - 路由参数验证
const { param, query } = require('express-validator');

class ValidationMiddleware {
  // 验证ID参数
  validateId = [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID必须是正整数'),
    this.handleValidationErrors
  ];

  // 验证分页参数
  validatePagination = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数'),
    this.handleValidationErrors
  ];

  // 验证排序参数
  validateSorting = [
    query('sortBy')
      .optional()
      .isIn(['id', 'name', 'email', 'age', 'created_at'])
      .withMessage('排序字段无效'),
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC', 'asc', 'desc'])
      .withMessage('排序方向必须是 ASC 或 DESC'),
    this.handleValidationErrors
  ];

  // 验证搜索参数
  validateSearch = [
    query('q')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('搜索关键词长度必须在1-100字符之间'),
    this.handleValidationErrors
  ];

  // 验证导出格式
  validateExportFormat = [
    param('format')
      .isIn(['csv', 'excel', 'pdf'])
      .withMessage('导出格式必须是 csv、excel 或 pdf'),
    this.handleValidationErrors
  ];

  // 验证批量ID
  validateBatchIds = [
    body('ids')
      .isArray({ min: 1 })
      .withMessage('必须提供至少一个ID')
      .custom((ids) => {
        if (!ids.every(id => Number.isInteger(id) && id > 0)) {
          throw new Error('所有ID必须是正整数');
        }
        return true;
      }),
    this.handleValidationErrors
  ];
}
```

## 4.4 中间件系统

### 中间件概念

中间件是一个函数，它可以访问请求对象（req）、响应对象（res）和应用程序请求-响应循环中的下一个中间件函数（next）。

```javascript
// 中间件函数结构
function middleware(req, res, next) {
  // 执行一些操作
  console.log('中间件执行');
  
  // 调用下一个中间件
  next();
}

// 错误处理中间件
function errorMiddleware(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('服务器错误');
}
```

### 中间件类型

#### 1. 应用级中间件

```javascript
// 应用到所有路由
app.use((req, res, next) => {
  console.log('请求时间:', new Date().toISOString());
  next();
});

// 应用到特定路径
app.use('/api', (req, res, next) => {
  console.log('API 请求');
  next();
});

// 应用到特定方法和路径
app.use('/users', (req, res, next) => {
  if (req.method === 'POST') {
    console.log('创建用户请求');
  }
  next();
});
```

#### 2. 路由级中间件

```javascript
// 单个路由中间件
app.get('/protected', authenticate, (req, res) => {
  res.send('受保护的路由');
});

// 多个中间件
app.get('/admin', 
  authenticate, 
  authorize('admin'), 
  (req, res) => {
    res.send('管理员页面');
  }
);

// 中间件数组
const middlewares = [authenticate, authorize('admin'), logAccess];
app.get('/admin/users', middlewares, (req, res) => {
  res.send('用户管理');
});
```

#### 3. 错误处理中间件

```javascript
// 错误处理中间件必须有4个参数
app.use((err, req, res, next) => {
  // 记录错误
  console.error({
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // 根据错误类型返回不同响应
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: '验证错误',
      details: err.details
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: '未授权访问'
    });
  }
  
  // 默认错误响应
  res.status(500).json({
    error: '服务器内部错误'
  });
});
```

#### 4. 内置中间件

```javascript
// 静态文件服务
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// JSON 解析
app.use(express.json({ limit: '10mb' }));

// URL 编码解析
app.use(express.urlencoded({ extended: true }));
```

#### 5. 第三方中间件

```javascript
// 日志中间件
const morgan = require('morgan');
app.use(morgan('combined'));

// 安全中间件
const helmet = require('helmet');
app.use(helmet());

// CORS 中间件
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// 压缩中间件
const compression = require('compression');
app.use(compression());

// 速率限制
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 100个请求
});
app.use('/api/', limiter);
```

### 自定义中间件开发

#### 请求日志中间件

```javascript
// middleware/requestLogger.js
const fs = require('fs');
const path = require('path');

class RequestLogger {
  constructor(options = {}) {
    this.logFile = options.logFile || path.join(__dirname, '../logs/requests.log');
    this.format = options.format || 'combined';
    this.skip = options.skip || (() => false);
  }

  // 中间件函数
  middleware() {
    return (req, res, next) => {
      // 跳过某些请求
      if (this.skip(req, res)) {
        return next();
      }

      const startTime = Date.now();
      const startDate = new Date();

      // 监听响应结束事件
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logEntry = this.formatLogEntry(req, res, duration, startDate);
        this.writeLog(logEntry);
      });

      next();
    };
  }

  // 格式化日志条目
  formatLogEntry(req, res, duration, timestamp) {
    const logData = {
      timestamp: timestamp.toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      contentLength: res.get('Content-Length')
    };

    if (this.format === 'json') {
      return JSON.stringify(logData);
    }

    // Apache Combined Log Format
    return `${logData.ip} - - [${timestamp.toISOString()}] "${logData.method} ${logData.url} HTTP/1.1" ${logData.status} ${logData.contentLength || '-'} "${logData.referer || '-'}" "${logData.userAgent || '-'}" ${logData.duration}`;
  }

  // 写入日志文件
  writeLog(logEntry) {
    fs.appendFile(this.logFile, logEntry + '\n', (err) => {
      if (err) {
        console.error('写入日志失败:', err);
      }
    });
  }
}

module.exports = RequestLogger;
```

#### 认证中间件

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthMiddleware {
  // JWT 认证
  authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1]; // Bearer TOKEN
      
      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: '无效的令牌' });
        }
        
        try {
          const user = await User.findByPk(decoded.userId);
          if (!user) {
            return res.status(401).json({ error: '用户不存在' });
          }
          
          req.user = user;
          next();
        } catch (error) {
          res.status(500).json({ error: '认证失败' });
        }
      });
    } else {
      res.status(401).json({ error: '缺少认证令牌' });
    }
  }

  // 会话认证
  authenticateSession(req, res, next) {
    if (req.session && req.session.userId) {
      User.findByPk(req.session.userId)
        .then(user => {
          if (user) {
            req.user = user;
            next();
          } else {
            res.redirect('/auth/login');
          }
        })
        .catch(err => {
          console.error('会话认证错误:', err);
          res.redirect('/auth/login');
        });
    } else {
      res.redirect('/auth/login');
    }
  }

  // 权限检查
  authorize(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: '未认证' });
      }

      const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role];
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      const hasPermission = requiredRoles.some(role => userRoles.includes(role));

      if (!hasPermission) {
        return res.status(403).json({ error: '权限不足' });
      }

      next();
    };
  }

  // 可选认证（不强制要求登录）
  optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (!err && decoded) {
          try {
            const user = await User.findByPk(decoded.userId);
            req.user = user;
          } catch (error) {
            // 忽略错误，继续执行
          }
        }
        next();
      });
    } else {
      next();
    }
  }
}

module.exports = new AuthMiddleware();
```

## 4.5 请求和响应对象

### 请求对象 (req)

```javascript
app.get('/request-demo', (req, res) => {
  // 基本信息
  console.log('请求方法:', req.method);           // GET
  console.log('请求路径:', req.path);             // /request-demo
  console.log('完整URL:', req.originalUrl);       // /request-demo?name=test
  console.log('协议:', req.protocol);             // http 或 https
  console.log('主机名:', req.hostname);           // localhost
  console.log('IP地址:', req.ip);                // 客户端IP
  
  // 请求头
  console.log('所有请求头:', req.headers);
  console.log('User-Agent:', req.get('User-Agent'));
  console.log('Content-Type:', req.get('Content-Type'));
  
  // 路径参数
  console.log('路径参数:', req.params);
  
  // 查询参数
  console.log('查询参数:', req.query);
  
  // 请求体（需要解析中间件）
  console.log('请求体:', req.body);
  
  // Cookie（需要 cookie-parser 中间件）
  console.log('Cookies:', req.cookies);
  
  // 会话（需要 express-session 中间件）
  console.log('会话:', req.session);
  
  // 文件上传（需要 multer 中间件）
  console.log('上传文件:', req.files);
  
  res.json({ message: '请求信息已记录到控制台' });
});
```

### 响应对象 (res)

```javascript
app.get('/response-demo', (req, res) => {
  // 设置状态码
  res.status(200);
  
  // 设置响应头
  res.set('X-Custom-Header', 'MyValue');
  res.set({
    'X-Another-Header': 'AnotherValue',
    'X-Third-Header': 'ThirdValue'
  });
  
  // 设置 Cookie
  res.cookie('sessionId', '12345', {
    maxAge: 900000,
    httpOnly: true,
    secure: false
  });
  
  // 清除 Cookie
  res.clearCookie('oldCookie');
  
  // 不同类型的响应
  
  // 1. 发送文本
  // res.send('Hello World');
  
  // 2. 发送 JSON
  // res.json({ message: 'Success', data: [] });
  
  // 3. 发送文件
  // res.sendFile(path.join(__dirname, 'public/index.html'));
  
  // 4. 下载文件
  // res.download('/path/to/file.pdf', 'download.pdf');
  
  // 5. 重定向
  // res.redirect('/login');
  // res.redirect(301, '/new-url');
  
  // 6. 渲染模板
  res.render('index', {
    title: '响应演示',
    message: '这是一个响应演示页面'
  });
});
```

### 响应方法详解

```javascript
// 不同场景的响应处理
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.findAll();
    
    // 成功响应
    res.status(200).json({
      success: true,
      data: students,
      count: students.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // 错误响应
    res.status(500).json({
      success: false,
      error: '获取学生列表失败',
      message: error.message
    });
  }
});

// 文件上传响应
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: '没有上传文件'
    });
  }
  
  res.status(201).json({
    success: true,
    message: '文件上传成功',
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// 分页响应
app.get('/api/students/paginated', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Student.findAndCountAll({
      limit,
      offset,
      order: [['id', 'ASC']]
    });
    
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取分页数据失败'
    });
  }
});
```

## 4.6 模板引擎 (EJS)

### EJS 基础语法

```html
<!-- views/layouts/main.ejs - 主布局模板 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %> - <%= appName %></title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- 自定义样式 -->
    <link rel="stylesheet" href="/css/main.css">
    
    <!-- 页面特定样式 -->
    <% if (typeof pageStyles !== 'undefined') { %>
        <% pageStyles.forEach(style => { %>
            <link rel="stylesheet" href="<%= style %>">
        <% }); %>
    <% } %>
</head>
<body>
    <!-- 导航栏 -->
    <%- include('../partials/navigation') %>
    
    <!-- 主要内容区域 -->
    <main class="container mt-4">
        <!-- Flash 消息 -->
        <% if (typeof messages !== 'undefined') { %>
            <%- include('../partials/messages', { messages }) %>
        <% } %>
        
        <!-- 页面内容 -->
        <%- body %>
    </main>
    
    <!-- 页脚 -->
    <%- include('../partials/footer') %>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- 页面特定脚本 -->
    <% if (typeof pageScripts !== 'undefined') { %>
        <% pageScripts.forEach(script => { %>
            <script src="<%= script %>"></script>
        <% }); %>
    <% } %>
</body>
</html>
```

### EJS 语法详解

```html
<!-- views/students/index.ejs - 学生列表页面 -->
<% layout('layouts/main') %>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h1><%= title %></h1>
    <% if (currentUser && currentUser.role === 'admin') { %>
        <a href="/students/new" class="btn btn-primary">
            <i class="fas fa-plus"></i> 新建学生
        </a>
    <% } %>
</div>

<!-- 搜索表单 -->
<div class="card mb-4">
    <div class="card-body">
        <form method="GET" action="/students">
            <div class="row">
                <div class="col-md-4">
                    <input type="text" 
                           class="form-control" 
                           name="search" 
                           placeholder="搜索学生姓名或邮箱"
                           value="<%= search.query %>">
                </div>
                <div class="col-md-3">
                    <select name="sortBy" class="form-select">
                        <option value="id" <%= search.sortBy === 'id' ? 'selected' : '' %>>按ID排序</option>
                        <option value="name" <%= search.sortBy === 'name' ? 'selected' : '' %>>按姓名排序</option>
                        <option value="email" <%= search.sortBy === 'email' ? 'selected' : '' %>>按邮箱排序</option>
                        <option value="age" <%= search.sortBy === 'age' ? 'selected' : '' %>>按年龄排序</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <select name="sortOrder" class="form-select">
                        <option value="ASC" <%= search.sortOrder === 'ASC' ? 'selected' : '' %>>升序</option>
                        <option value="DESC" <%= search.sortOrder === 'DESC' ? 'selected' : '' %>>降序</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <button type="submit" class="btn btn-outline-primary w-100">
                        <i class="fas fa-search"></i> 搜索
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<!-- 学生列表 -->
<% if (students && students.length > 0) { %>
    <div class="card">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>姓名</th>
                            <th>邮箱</th>
                            <th>年龄</th>
                            <th>电话</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <% students.forEach(student => { %>
                            <tr>
                                <td><%= student.id %></td>
                                <td>
                                    <a href="/students/<%= student.id %>" class="text-decoration-none">
                                        <%= student.name %>
                                    </a>
                                </td>
                                <td><%= student.email %></td>
                                <td><%= student.age || '-' %></td>
                                <td><%= student.phone || '-' %></td>
                                <td>
                                    <%= new Date(student.created_at).toLocaleDateString('zh-CN') %>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm" role="group">
                                        <a href="/students/<%= student.id %>" 
                                           class="btn btn-outline-info" 
                                           title="查看详情">
                                            <i class="fas fa-eye"></i>
                                        </a>
                                        <% if (currentUser && currentUser.role === 'admin') { %>
                                            <a href="/students/<%= student.id %>/edit" 
                                               class="btn btn-outline-warning" 
                                               title="编辑">
                                                <i class="fas fa-edit"></i>
                                            </a>
                                            <button type="button" 
                                                    class="btn btn-outline-danger" 
                                                    title="删除"
                                                    onclick="confirmDelete(<%= student.id %>, '<%= student.name %>')">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        <% } %>
                                    </div>
                                </td>
                            </tr>
                        <% }); %>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <!-- 分页 -->
    <% if (pagination.totalPages > 1) { %>
        <%- include('../partials/pagination', { pagination, search }) %>
    <% } %>
<% } else { %>
    <div class="alert alert-info text-center">
        <i class="fas fa-info-circle"></i>
        <% if (search.query) { %>
            没有找到匹配 "<%= search.query %>" 的学生。
        <% } else { %>
            暂无学生数据。
        <% } %>
        <% if (currentUser && currentUser.role === 'admin') { %>
            <br>
            <a href="/students/new" class="btn btn-primary mt-2">
                <i class="fas fa-plus"></i> 添加第一个学生
            </a>
        <% } %>
    </div>
<% } %>

<!-- 删除确认模态框 -->
<div class="modal fade" id="deleteModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">确认删除</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>确定要删除学生 <strong id="studentName"></strong> 吗？</p>
                <p class="text-muted">此操作不可撤销。</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <form id="deleteForm" method="POST" style="display: inline;">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn btn-danger">确认删除</button>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
function confirmDelete(studentId, studentName) {
    document.getElementById('studentName').textContent = studentName;
    document.getElementById('deleteForm').action = `/students/${studentId}`;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}
</script>
```

### 部分模板 (Partials)

```html
<!-- views/partials/navigation.ejs -->
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
        <a class="navbar-brand" href="/">
            <i class="fas fa-graduation-cap"></i>
            <%= appName %>
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link <%= currentPath === '/' ? 'active' : '' %>" href="/">
                        <i class="fas fa-home"></i> 首页
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <%= currentPath.startsWith('/students') ? 'active' : '' %>" href="/students">
                        <i class="fas fa-users"></i> 学生管理
                    </a>
                </li>
                <% if (currentUser && currentUser.role === 'admin') { %>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="adminDropdown" role="button" data-bs-toggle="dropdown">
                            <i class="fas fa-cog"></i> 管理
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="/admin/users">用户管理</a></li>
                            <li><a class="dropdown-item" href="/admin/settings">系统设置</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="/admin/logs">系统日志</a></li>
                        </ul>
                    </li>
                <% } %>
            </ul>
            
            <ul class="navbar-nav">
                <% if (currentUser) { %>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                            <i class="fas fa-user"></i>
                            <%= currentUser.username %>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="/profile">个人资料</a></li>
                            <li><a class="dropdown-item" href="/settings">设置</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <form method="POST" action="/auth/logout" style="display: inline;">
                                    <button type="submit" class="dropdown-item">
                                        <i class="fas fa-sign-out-alt"></i> 退出登录
                                    </button>
                                </form>
                            </li>
                        </ul>
                    </li>
                <% } else { %>
                    <li class="nav-item">
                        <a class="nav-link" href="/auth/login">
                            <i class="fas fa-sign-in-alt"></i> 登录
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/auth/register">
                            <i class="fas fa-user-plus"></i> 注册
                        </a>
                    </li>
                <% } %>
            </ul>
        </div>
    </div>
</nav>
```

```html
<!-- views/partials/pagination.ejs -->
<nav aria-label="分页导航" class="mt-4">
    <ul class="pagination justify-content-center">
        <!-- 上一页 -->
        <li class="page-item <%= !pagination.hasPrev ? 'disabled' : '' %>">
            <% if (pagination.hasPrev) { %>
                <a class="page-link" href="?page=<%= pagination.currentPage - 1 %>&search=<%= search.query %>&sortBy=<%= search.sortBy %>&sortOrder=<%= search.sortOrder %>">
                    <i class="fas fa-chevron-left"></i> 上一页
                </a>
            <% } else { %>
                <span class="page-link">
                    <i class="fas fa-chevron-left"></i> 上一页
                </span>
            <% } %>
        </li>
        
        <!-- 页码 -->
        <% 
            const startPage = Math.max(1, pagination.currentPage - 2);
            const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);
        %>
        
        <% if (startPage > 1) { %>
            <li class="page-item">
                <a class="page-link" href="?page=1&search=<%= search.query %>&sortBy=<%= search.sortBy %>&sortOrder=<%= search.sortOrder %>">1</a>
            </li>
            <% if (startPage > 2) { %>
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            <% } %>
        <% } %>
        
        <% for (let i = startPage; i <= endPage; i++) { %>
            <li class="page-item <%= i === pagination.currentPage ? 'active' : '' %>">
                <% if (i === pagination.currentPage) { %>
                    <span class="page-link"><%= i %></span>
                <% } else { %>
                    <a class="page-link" href="?page=<%= i %>&search=<%= search.query %>&sortBy=<%= search.sortBy %>&sortOrder=<%= search.sortOrder %>"><%= i %></a>
                <% } %>
            </li>
        <% } %>
        
        <% if (endPage < pagination.totalPages) { %>
            <% if (endPage < pagination.totalPages - 1) { %>
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            <% } %>
            <li class="page-item">
                <a class="page-link" href="?page=<%= pagination.totalPages %>&search=<%= search.query %>&sortBy=<%= search.sortBy %>&sortOrder=<%= search.sortOrder %>"><%= pagination.totalPages %></a>
            </li>
        <% } %>
        
        <!-- 下一页 -->
        <li class="page-item <%= !pagination.hasNext ? 'disabled' : '' %>">
            <% if (pagination.hasNext) { %>
                <a class="page-link" href="?page=<%= pagination.currentPage + 1 %>&search=<%= search.query %>&sortBy=<%= search.sortBy %>&sortOrder=<%= search.sortOrder %>">
                    下一页 <i class="fas fa-chevron-right"></i>
                </a>
            <% } else { %>
                <span class="page-link">
                    下一页 <i class="fas fa-chevron-right"></i>
                </span>
            <% } %>
        </li>
    </ul>
    
    <!-- 分页信息 -->
    <div class="text-center text-muted mt-2">
        显示第 <%= (pagination.currentPage - 1) * 10 + 1 %> - <%= Math.min(pagination.currentPage * 10, pagination.totalCount) %> 条，
        共 <%= pagination.totalCount %> 条记录，
        第 <%= pagination.currentPage %> / <%= pagination.totalPages %> 页
    </div>
</nav>
```

## 4.7 静态资源服务

### 基础静态文件服务

```javascript
// 基础静态文件服务
app.use(express.static('public'));

// 多个静态目录
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/assets', express.static('assets'));

// 虚拟路径前缀
app.use('/static', express.static('public'));
// 现在可以通过 /static/css/style.css 访问 public/css/style.css
```

### 高级静态文件配置

```javascript
// 高级静态文件配置
const path = require('path');
const express = require('express');

// 静态文件选项
const staticOptions = {
  dotfiles: 'ignore',        // 忽略点文件
  etag: true,               // 启用 ETag
  extensions: ['htm', 'html'], // 默认扩展名
  index: ['index.html'],    // 目录索引文件
  lastModified: true,       // 设置 Last-Modified 头
  maxAge: '1d',            // 缓存时间
  redirect: false,          // 禁用目录重定向
  setHeaders: function (res, path, stat) {
    // 设置自定义响应头
    res.set('X-Timestamp', Date.now());
    
    // 根据文件类型设置不同的缓存策略
    if (path.endsWith('.css') || path.endsWith('.js')) {
      res.set('Cache-Control', 'public, max-age=31536000'); // 1年
    } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.gif')) {
      res.set('Cache-Control', 'public, max-age=2592000'); // 30天
    }
  }
};

app.use('/static', express.static(path.join(__dirname, 'public'), staticOptions));
```

### 文件上传处理

```javascript
// 使用 multer 处理文件上传
const multer = require('multer');
const path = require('path');

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据文件类型设置不同的存储目录
    let uploadPath = 'uploads/';
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else if (file.mimetype === 'application/pdf') {
      uploadPath += 'documents/';
    } else {
      uploadPath += 'others/';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // 最多5个文件
  }
});

// 单文件上传
app.post('/upload/single', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' });
  }
  
  res.json({
    message: '文件上传成功',
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    }
  });
});

// 多文件上传
app.post('/upload/multiple', upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '没有上传文件' });
  }
  
  const files = req.files.map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    size: file.size,
    path: file.path
  }));
  
  res.json({
    message: `成功上传 ${files.length} 个文件`,
    files: files
  });
});

// 不同字段的文件上传
app.post('/upload/fields', upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'documents', maxCount: 3 }
]), (req, res) => {
  const result = {
    message: '文件上传成功',
    files: {}
  };
  
  if (req.files.avatar) {
    result.files.avatar = req.files.avatar[0];
  }
  
  if (req.files.documents) {
    result.files.documents = req.files.documents;
  }
  
  res.json(result);
});
```

## 4.8 本章小结

在本章中，我们深入学习了 Express.js 框架的核心功能：

✅ **Express.js 基础**：
- 理解了 Express.js 的架构和特点
- 学会了创建基础和完整的 Express 应用
- 掌握了应用配置和启动流程

✅ **路由系统**：
- 掌握了基础路由和路由参数
- 学会了使用 Express Router 进行模块化路由
- 理解了 RESTful 路由设计原则
- 实现了路由参数验证

✅ **中间件系统**：
- 深入理解了中间件的概念和类型
- 学会了开发自定义中间件
- 掌握了错误处理中间件的使用
- 了解了常用的第三方中间件

✅ **请求响应处理**：
- 熟练掌握了请求对象的属性和方法
- 学会了不同类型的响应处理
- 理解了状态码和响应头的设置

✅ **模板引擎**：
- 深入学习了 EJS 模板语法
- 实现了布局模板和部分模板
- 掌握了数据传递和条件渲染

✅ **静态资源服务**：
- 配置了基础和高级静态文件服务
- 学习了文件上传处理
- 掌握了静态资源的缓存策略

## 4.9 课后练习

1. **基础路由练习**：创建一个简单的 Express 应用，实现以下路由：
   - 首页路由 (`/`)
   - 关于页面路由 (`/about`)
   - 联系我们路由 (`/contact`)
   - 404 错误处理路由

2. **中间件练习**：
   - 创建一个请求日志中间件，记录每个请求的方法、路径和时间
   - 创建一个响应时间中间件，计算请求处理时间并在响应头中添加

3. **路由参数练习**：
   - 创建一个产品路由 (`/products/:id`)，根据 ID 显示不同产品信息
   - 实现一个博客路由 (`/blog/:year/:month/:day/:slug`)，展示特定日期的博客文章

4. **模板引擎练习**：
   - 使用 EJS 创建一个包含导航栏、内容区和页脚的布局模板
   - 创建一个产品列表页面，使用循环显示产品数据
   - 创建一个产品详情页面，显示单个产品的详细信息

5. **静态文件练习**：
   - 配置静态文件服务，提供 CSS、JavaScript 和图片文件
   - 创建一个简单的文件上传页面，允许用户上传图片并显示

## 4.10 下一章预告

在下一章中，我们将学习 Sequelize ORM，这是一个功能强大的 Node.js ORM 库，用于与关系型数据库交互。我们将学习如何：

- 配置 Sequelize 连接数据库
- 定义模型和关联关系
- 执行 CRUD 操作
- 使用查询构建器
- 实现数据验证和钩子
- 处理事务和迁移

## 4.11 学习资源

### 官方文档
- [Express.js 官方文档](https://expressjs.com/)
- [EJS 官方文档](https://ejs.co/)
- [Multer 文件上传文档](https://github.com/expressjs/multer)

### 推荐阅读
- 《Express in Action》 - Evan Hahn
- 《Web Development with Node and Express》 - Ethan Brown

### 在线教程
- [MDN Web Docs: Express/Node 入门](https://developer.mozilla.org/zh-CN/docs/Learn/Server-side/Express_Nodejs/Introduction)
- [Express.js 中文文档](http://expressjs.com/zh-cn/)

### 视频资源
- [Express.js 速成课程](https://www.youtube.com/watch?v=L72fhGm1tfE)
- [Node.js 和 Express.js 完整课程](https://www.youtube.com/watch?v=Oe421EPjeBE)

---

恭喜你完成了 Express.js 基础的学习！在本章中，你已经掌握了使用 Express.js 构建 Web 应用的核心知识。这些技能将为我们的学生管理系统项目打下坚实的基础。在下一章中，我们将学习如何使用 Sequelize ORM 与数据库交互，进一步丰富我们的应用功能。