# 学生管理系统 (Student Management System)

基于 Express.js、EJS、SQLite 和 Sequelize ORM 构建的完整 MVC 架构学生管理系统。

## 🏗️ 项目架构

### MVC 架构模式

```
├── app.js                 # 应用入口文件
├── config/                # 配置文件
│   └── database.js        # 数据库配置和连接管理
├── controllers/           # 控制器层 (Controller)
│   └── studentController.js
├── models/                # 模型层 (Model)
│   ├── index.js          # 数据库连接
│   └── Student.js        # 学生数据模型
├── services/              # 服务层 (Service)
│   └── studentService.js # 业务逻辑处理
├── views/                 # 视图层 (View)
│   ├── layout.ejs        # 布局模板
│   ├── students/         # 学生相关页面
│   ├── 404.ejs          # 404错误页面
│   └── error.ejs        # 通用错误页面
├── routes/                # 路由定义
│   └── students.js
├── middleware/            # 中间件
│   └── index.js          # 自定义中间件集合
├── utils/                 # 工具类
│   └── validator.js      # 数据验证工具
└── database/              # 数据库文件存储
    └── students.db
```

## 🚀 功能特性

### 核心功能
- ✅ **学生信息管理**: 增删改查 (CRUD) 操作
- ✅ **数据验证**: 完整的前端和后端数据验证
- ✅ **搜索功能**: 支持按姓名、学号、专业、年级搜索
- ✅ **分页显示**: 支持分页浏览学生列表
- ✅ **响应式设计**: 基于 Bootstrap 5 的现代化界面

### 技术特性
- ✅ **完整 MVC 架构**: 清晰的代码分层
- ✅ **数据库 ORM**: 使用 Sequelize 进行数据库操作
- ✅ **错误处理**: 完善的错误处理和日志记录
- ✅ **中间件系统**: 安全、日志、验证等中间件
- ✅ **Flash 消息**: 用户操作反馈
- ✅ **健康检查**: 系统状态监控

### API 接口
- ✅ **RESTful API**: 标准的 REST 接口设计
- ✅ **批量导入**: 支持批量导入学生数据
- ✅ **统计信息**: 学生数据统计分析
- ✅ **学号验证**: 实时学号可用性检查

## 📋 数据模型

### 学生模型 (Student)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | INTEGER | 是 | 主键，自增 |
| studentId | STRING | 是 | 学号，唯一 |
| name | STRING | 是 | 姓名 |
| gender | ENUM | 是 | 性别 (男/女) |
| age | INTEGER | 是 | 年龄 (16-60) |
| major | STRING | 是 | 专业 |
| grade | STRING | 是 | 年级 |
| email | STRING | 否 | 邮箱 |
| phone | STRING | 否 | 手机号 |
| createdAt | DATETIME | 是 | 创建时间 |
| updatedAt | DATETIME | 是 | 更新时间 |

## 🛠️ 安装和运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd NodeJS_TODO
```

2. **安装依赖**
```bash
npm install
```

3. **启动应用**
```bash
npm start
```

4. **访问应用**
打开浏览器访问: http://localhost:3000

### 开发模式
```bash
npm run dev  # 如果配置了 nodemon
```

## 📚 API 文档

### 学生管理 API

#### 获取学生列表
```http
GET /students?page=1&limit=10&search=关键词
```

#### 获取学生详情
```http
GET /students/:id
```

#### 创建学生
```http
POST /students
Content-Type: application/x-www-form-urlencoded

studentId=2024001&name=张三&gender=男&age=20&major=计算机科学&grade=大二
```

#### 更新学生
```http
PUT /students/:id
Content-Type: application/x-www-form-urlencoded

name=李四&age=21
```

#### 删除学生
```http
DELETE /students/:id
```

### 统计 API

#### 获取统计信息
```http
GET /students/api/statistics
```

#### 搜索学生
```http
GET /students/api/search?q=关键词&page=1&limit=10
```

#### 批量导入
```http
POST /students/api/bulk-import
Content-Type: application/json

{
  "students": [
    {
      "studentId": "2024001",
      "name": "张三",
      "gender": "男",
      "age": 20,
      "major": "计算机科学",
      "grade": "大二"
    }
  ]
}
```

#### 检查学号可用性
```http
GET /students/api/check-student-id/:studentId?excludeId=123
```

### 系统 API

#### 健康检查
```http
GET /health
```

## 🔧 配置说明

### 环境变量

创建 `.env` 文件（可选）:
```env
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-secret-key
```

### 数据库配置

数据库配置位于 `config/database.js`，支持不同环境:
- **开发环境**: SQLite 文件数据库
- **测试环境**: 内存数据库
- **生产环境**: SQLite 文件数据库（优化配置）

## 🧪 数据验证

### 前端验证
- HTML5 表单验证
- 实时输入检查
- 用户友好的错误提示

### 后端验证
- 数据类型验证
- 长度和格式检查
- 业务规则验证
- SQL 注入防护

### 验证规则

- **学号**: 6-20位字母数字组合，唯一
- **姓名**: 2-50个字符，中英文字母
- **性别**: 男/女
- **年龄**: 16-60之间的整数
- **专业**: 2-100个字符
- **年级**: 特定格式（大一、大二、研一、2023级等）
- **邮箱**: 标准邮箱格式（可选）
- **手机**: 11位中国手机号格式（可选）

## 🛡️ 安全特性

- **XSS 防护**: 输入数据转义和验证
- **CSRF 防护**: 表单令牌验证
- **SQL 注入防护**: 参数化查询
- **请求频率限制**: 防止暴力攻击
- **安全头设置**: 各种安全相关的 HTTP 头
- **输入验证**: 严格的数据验证和清理

## 📊 监控和日志

- **请求日志**: 详细的请求响应日志
- **错误日志**: 完整的错误堆栈信息
- **性能监控**: 响应时间统计
- **健康检查**: 系统状态实时监控

## 🎨 界面特性

- **响应式设计**: 适配各种设备屏幕
- **现代化 UI**: Bootstrap 5 + Bootstrap Icons
- **用户体验**: 流畅的交互和反馈
- **无障碍访问**: 符合 Web 无障碍标准

## 📁 项目结构详解

### Controllers (控制器层)
负责处理 HTTP 请求和响应，调用服务层处理业务逻辑。

### Services (服务层)
包含核心业务逻辑，数据处理和验证。

### Models (模型层)
定义数据结构和数据库交互。

### Views (视图层)
 EJS 模板文件，负责页面渲染。

### Middleware (中间件)
处理请求预处理、安全、日志等横切关注点。

### Utils (工具类)
通用工具函数和验证器。

## 🔄 开发工作流

1. **需求分析** → 确定功能需求
2. **数据建模** → 设计数据库结构
3. **API 设计** → 定义接口规范
4. **后端开发** → 实现业务逻辑
5. **前端开发** → 实现用户界面
6. **测试验证** → 功能和性能测试
7. **部署上线** → 生产环境部署

## 📈 性能优化

- **数据库索引**: 关键字段建立索引
- **分页查询**: 避免大量数据加载
- **连接池**: 数据库连接复用
- **静态资源**: CDN 和缓存优化
- **代码分割**: 按需加载资源

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 👥 作者

- 开发者: [Your Name]
- 邮箱: [your.email@example.com]

---

**注意**: 这是一个教学示例项目，展示了完整的 MVC 架构实现。在生产环境中使用时，请根据实际需求进行安全加固和性能优化。
