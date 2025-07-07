# 第2章：项目初始化

## 学习目标

完成本章学习后，你将能够：
- 创建标准的 Node.js 项目结构
- 深入理解 package.json 配置文件
- 掌握依赖包的安装和管理
- 配置项目开发和生产环境

## 前置要求

- 已完成第1章的环境搭建
- 熟悉基本的命令行操作
- 了解 JSON 格式

## 2.1 创建项目目录

### 项目命名规范

在创建项目之前，我们需要了解一些命名规范：

```bash
# 好的项目名称示例
student-management-system
node-todo-app
my-blog-api

# 避免的命名方式
MyProject          # 避免大写字母
project with space # 避免空格
node_modules       # 避免保留字
```

### 创建项目结构

```bash
# 创建项目根目录
mkdir student-management-system
cd student-management-system

# 初始化 Git 仓库
git init

# 创建基本的项目文件
touch README.md
touch .gitignore
touch .env.example
```

### 配置 .gitignore

创建 `.gitignore` 文件，排除不需要版本控制的文件：

```gitignore
# 依赖包目录
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 环境变量文件
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日志文件
logs/
*.log

# 运行时数据
pids/
*.pid
*.seed
*.pid.lock

# 覆盖率目录
coverage/
.nyc_output/

# 编辑器配置
.vscode/
.idea/
*.swp
*.swo
*~

# 操作系统文件
.DS_Store
Thumbs.db

# 数据库文件
*.sqlite
*.db

# 临时文件
tmp/
temp/
```

## 2.2 深入理解 package.json

### 初始化 package.json

```bash
# 交互式初始化
npm init

# 快速初始化（使用默认值）
npm init -y

# 使用自定义配置初始化
npm init --name="student-management" --version="1.0.0"
```

### package.json 详解

让我们创建一个完整的 `package.json` 文件：

```json
{
  "name": "student-management-system",
  "version": "1.0.0",
  "description": "一个基于 Node.js 的学生管理系统",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "db:init": "node scripts/init-database.js",
    "db:seed": "node scripts/seed-database.js",
    "build": "echo \"No build step required\" && exit 0"
  },
  "keywords": [
    "nodejs",
    "express",
    "student-management",
    "education",
    "crud",
    "mvc"
  ],
  "author": {
    "name": "你的姓名",
    "email": "your.email@example.com",
    "url": "https://your-website.com"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/student-management-system.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/student-management-system/issues"
  },
  "homepage": "https://github.com/yourusername/student-management-system#readme",
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "dependencies": {},
  "devDependencies": {},
  "peerDependencies": {},
  "optionalDependencies": {}
}
```

### 字段详解

#### 基本信息字段

- **name**: 项目名称，必须是小写，可以包含连字符和下划线
- **version**: 版本号，遵循语义化版本规范 (SemVer)
- **description**: 项目描述，简洁明了地说明项目用途
- **main**: 入口文件，当其他模块引用这个包时的入口点
- **keywords**: 关键词数组，便于在 npm 上搜索
- **author**: 作者信息，可以是字符串或对象
- **license**: 许可证类型

#### 脚本字段

- **scripts**: 定义可执行的脚本命令
  - `start`: 生产环境启动命令
  - `dev`: 开发环境启动命令
  - `test`: 测试命令
  - `lint`: 代码检查命令
  - 自定义脚本：如 `db:init`、`db:seed` 等

#### 依赖字段

- **dependencies**: 生产环境依赖
- **devDependencies**: 开发环境依赖
- **peerDependencies**: 同伴依赖
- **optionalDependencies**: 可选依赖

#### 其他字段

- **engines**: 指定 Node.js 和 npm 版本要求
- **repository**: 代码仓库信息
- **bugs**: 问题反馈地址
- **homepage**: 项目主页

## 2.3 依赖包管理

### 理解依赖类型

#### 生产依赖 (dependencies)

这些包在生产环境中运行时需要：

```bash
# 安装生产依赖
npm install express
npm install sequelize sqlite3
npm install ejs

# 或者一次性安装多个
npm install express sequelize sqlite3 ejs
```

#### 开发依赖 (devDependencies)

这些包只在开发过程中需要：

```bash
# 安装开发依赖
npm install --save-dev nodemon
npm install --save-dev eslint
npm install --save-dev jest

# 简写形式
npm install -D nodemon eslint jest
```

### 版本管理

#### 语义化版本 (SemVer)

版本号格式：`主版本号.次版本号.修订号`

```json
{
  "dependencies": {
    "express": "^4.18.2",     // 兼容版本：4.18.2 <= version < 5.0.0
    "sequelize": "~6.28.0",   // 近似版本：6.28.0 <= version < 6.29.0
    "sqlite3": "5.1.4",       // 精确版本：必须是 5.1.4
    "ejs": "*"                 // 任意版本（不推荐）
  }
}
```

#### 版本符号说明

- `^`: 兼容版本更新（默认）
- `~`: 近似版本更新
- 无符号: 精确版本
- `*`: 任意版本
- `>=`, `<=`, `>`, `<`: 范围版本

### 锁定文件

#### package-lock.json

`package-lock.json` 文件的作用：

1. **锁定版本**: 确保团队成员安装相同版本的依赖
2. **提高安装速度**: 记录依赖树结构，加快安装
3. **安全性**: 记录包的完整性校验信息

```bash
# 根据 package-lock.json 安装依赖
npm ci

# 更新 package-lock.json
npm install

# 审计依赖安全性
npm audit
npm audit fix
```

## 2.4 安装项目依赖

### 核心依赖包

让我们安装学生管理系统需要的核心依赖：

```bash
# 生产依赖
npm install express          # Web 框架
npm install sequelize        # ORM 框架
npm install sqlite3          # SQLite 数据库驱动
npm install ejs              # 模板引擎
npm install express-session  # 会话管理
npm install body-parser      # 请求体解析
npm install cors             # 跨域资源共享
npm install helmet           # 安全中间件
npm install morgan           # 日志中间件
npm install dotenv           # 环境变量管理
```

```bash
# 开发依赖
npm install -D nodemon       # 自动重启服务器
npm install -D eslint        # 代码检查
npm install -D prettier      # 代码格式化
npm install -D jest          # 测试框架
npm install -D supertest     # HTTP 测试
```

### 验证安装

安装完成后，检查 `package.json` 文件：

```json
{
  "dependencies": {
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "ejs": "^3.1.8",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "helmet": "^6.0.1",
    "morgan": "^1.10.0",
    "sequelize": "^6.28.0",
    "sqlite3": "^5.1.4"
  },
  "devDependencies": {
    "eslint": "^8.33.0",
    "jest": "^29.4.1",
    "nodemon": "^2.0.20",
    "prettier": "^2.8.3",
    "supertest": "^6.3.3"
  }
}
```

## 2.5 配置开发工具

### ESLint 配置

创建 `.eslintrc.js` 文件：

```javascript
module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'no-undef': 'error'
  }
};
```

### Prettier 配置

创建 `.prettierrc` 文件：

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Nodemon 配置

创建 `nodemon.json` 文件：

```json
{
  "watch": [
    "app.js",
    "routes/",
    "controllers/",
    "models/",
    "middleware/",
    "config/"
  ],
  "ext": "js,json,ejs",
  "ignore": [
    "node_modules/",
    "public/",
    "logs/",
    "*.test.js"
  ],
  "delay": "1000"
}
```

## 2.6 环境变量配置

### 创建环境变量文件

创建 `.env.example` 文件（模板文件）：

```env
# 应用配置
NODE_ENV=development
PORT=3000
APP_NAME=学生管理系统

# 数据库配置
DB_TYPE=sqlite
DB_PATH=./database/students.db

# 会话配置
SESSION_SECRET=your-secret-key-here
SESSION_MAX_AGE=86400000

# 安全配置
CORS_ORIGIN=http://localhost:3000

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

创建实际的 `.env` 文件：

```bash
# 复制模板文件
cp .env.example .env

# 编辑实际配置
# 注意：.env 文件不应该提交到版本控制系统
```

### 使用环境变量

在代码中使用环境变量：

```javascript
// config/environment.js
require('dotenv').config();

module.exports = {
  // 应用配置
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  APP_NAME: process.env.APP_NAME || '学生管理系统',
  
  // 数据库配置
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    path: process.env.DB_PATH || './database/students.db'
  },
  
  // 会话配置
  session: {
    secret: process.env.SESSION_SECRET || 'default-secret',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000
  },
  
  // 安全配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  }
};
```

## 2.7 npm 脚本配置

### 更新 package.json 脚本

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "dev:debug": "nodemon --inspect app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:init": "node scripts/init-database.js",
    "db:seed": "node scripts/seed-database.js",
    "db:reset": "npm run db:init && npm run db:seed",
    "logs:clear": "rm -rf logs/*.log",
    "clean": "rm -rf node_modules package-lock.json",
    "reinstall": "npm run clean && npm install",
    "audit:security": "npm audit",
    "audit:fix": "npm audit fix"
  }
}
```

### 脚本说明

#### 开发脚本
- `npm run dev`: 开发模式启动（自动重启）
- `npm run dev:debug`: 调试模式启动
- `npm start`: 生产模式启动

#### 测试脚本
- `npm test`: 运行测试
- `npm run test:watch`: 监视模式运行测试
- `npm run test:coverage`: 生成测试覆盖率报告

#### 代码质量脚本
- `npm run lint`: 检查代码规范
- `npm run lint:fix`: 自动修复代码规范问题
- `npm run format`: 格式化代码
- `npm run format:check`: 检查代码格式

#### 数据库脚本
- `npm run db:init`: 初始化数据库
- `npm run db:seed`: 填充种子数据
- `npm run db:reset`: 重置数据库

#### 维护脚本
- `npm run clean`: 清理依赖
- `npm run reinstall`: 重新安装依赖
- `npm run audit:security`: 安全审计

## 2.8 创建基础文件结构

### 创建目录结构

```bash
# 创建主要目录
mkdir -p {
config,
controllers,
middleware,
models,
routes,
services,
utils,
views,
public/{css,js,images},
logs,
scripts,
tests,
docs
}

# 创建基础文件
touch app.js
touch config/{database.js,environment.js}
touch middleware/index.js
touch routes/index.js
touch utils/{logger.js,validator.js}
```

### 项目结构说明

```
student-management-system/
├── app.js                 # 应用入口文件
├── package.json           # 项目配置文件
├── package-lock.json      # 依赖锁定文件
├── .env                   # 环境变量文件
├── .env.example           # 环境变量模板
├── .gitignore             # Git 忽略文件
├── .eslintrc.js           # ESLint 配置
├── .prettierrc            # Prettier 配置
├── nodemon.json           # Nodemon 配置
├── README.md              # 项目说明文档
├── config/                # 配置文件目录
│   ├── database.js        # 数据库配置
│   └── environment.js     # 环境配置
├── controllers/           # 控制器目录
├── middleware/            # 中间件目录
│   └── index.js
├── models/                # 数据模型目录
├── routes/                # 路由目录
│   └── index.js
├── services/              # 服务层目录
├── utils/                 # 工具函数目录
│   ├── logger.js
│   └── validator.js
├── views/                 # 视图模板目录
├── public/                # 静态资源目录
│   ├── css/
│   ├── js/
│   └── images/
├── logs/                  # 日志文件目录
├── scripts/               # 脚本文件目录
├── tests/                 # 测试文件目录
└── docs/                  # 文档目录
```

## 2.9 创建入口文件

### 基础 app.js

创建一个基础的 `app.js` 文件：

```javascript
// app.js
const express = require('express');
const path = require('path');
const config = require('./config/environment');

// 创建 Express 应用
const app = express();

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 基础路由
app.get('/', (req, res) => {
  res.render('index', {
    title: config.APP_NAME,
    message: '欢迎使用学生管理系统！'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).render('404', {
    title: '页面未找到',
    url: req.originalUrl
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: '服务器错误',
    message: config.NODE_ENV === 'development' ? err.message : '内部服务器错误'
  });
});

// 启动服务器
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 环境: ${config.NODE_ENV}`);
});

module.exports = app;
```

### 测试基础应用

```bash
# 创建基础视图文件
mkdir -p views
echo '<h1><%= title %></h1><p><%= message %></p>' > views/index.ejs
echo '<h1>404 - <%= title %></h1><p>页面 <%= url %> 未找到</p>' > views/404.ejs
echo '<h1><%= title %></h1><p><%= message %></p>' > views/error.ejs

# 运行应用
npm run dev
```

## 2.10 版本控制

### 初始提交

```bash
# 添加所有文件到暂存区
git add .

# 创建初始提交
git commit -m "feat: 初始化项目结构

- 配置 package.json 和依赖包
- 设置开发工具 (ESLint, Prettier, Nodemon)
- 创建基础目录结构
- 配置环境变量
- 创建基础 Express 应用"

# 查看提交历史
git log --oneline
```

### 提交信息规范

使用约定式提交 (Conventional Commits) 规范：

```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

常用类型：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 2.11 常见问题解决

### 问题1：依赖安装失败

**可能原因**：
- 网络问题
- 权限问题
- Node.js 版本不兼容

**解决方案**：
```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install

# 使用国内镜像
npm config set registry https://registry.npmmirror.com/
```

### 问题2：ESLint 配置冲突

**解决方案**：
```bash
# 检查 ESLint 配置
npx eslint --print-config app.js

# 修复 ESLint 错误
npm run lint:fix
```

### 问题3：环境变量不生效

**解决方案**：
```javascript
// 确保在文件顶部加载 dotenv
require('dotenv').config();

// 检查环境变量是否加载
console.log('NODE_ENV:', process.env.NODE_ENV);
```

## 2.12 本章小结

在本章中，我们完成了以下内容：

✅ **项目初始化**：
- 创建了标准的 Node.js 项目结构
- 配置了完整的 package.json 文件
- 安装了必要的依赖包

✅ **开发工具配置**：
- 配置了 ESLint 代码检查
- 设置了 Prettier 代码格式化
- 配置了 Nodemon 自动重启

✅ **环境管理**：
- 创建了环境变量配置
- 设置了开发和生产环境
- 配置了项目脚本

✅ **版本控制**：
- 配置了 Git 忽略文件
- 学习了提交信息规范
- 创建了初始提交

## 2.13 课后练习

### 练习1：自定义脚本
添加以下 npm 脚本：
1. `npm run backup`: 备份数据库文件
2. `npm run deploy`: 部署到生产环境
3. `npm run health`: 检查应用健康状态

### 练习2：环境配置
创建不同环境的配置文件：
1. `.env.development`
2. `.env.test`
3. `.env.production`

### 练习3：依赖管理
练习依赖包管理：
1. 添加一个新的依赖包
2. 更新现有依赖到最新版本
3. 移除不需要的依赖包

## 2.14 下一章预告

在下一章《项目结构设计》中，我们将：
- 深入理解 MVC 架构模式
- 设计合理的目录结构
- 学习模块化开发思想
- 实现关注点分离

---

**学习提示**：
- package.json 是项目的核心配置文件，要仔细理解每个字段的作用
- 依赖管理是 Node.js 开发的重要技能，要掌握不同类型依赖的使用场景
- 环境变量配置有助于项目在不同环境下的部署和管理
- 良好的项目结构是后续开发的基础

**参考资源**：
- [npm 官方文档](https://docs.npmjs.com/)
- [package.json 字段详解](https://docs.npmjs.com/cli/v8/configuring-npm/package-json)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [约定式提交规范](https://www.conventionalcommits.org/zh-hans/)