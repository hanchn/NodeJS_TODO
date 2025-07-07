# 贡献指南 (Contributing Guide)

感谢您对学生管理系统项目的关注！我们欢迎任何形式的贡献，包括但不限于代码、文档、测试、问题报告等。

## 📋 目录

- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试指南](#测试指南)
- [文档编写](#文档编写)
- [问题报告](#问题报告)
- [功能请求](#功能请求)

## 🛠️ 开发环境设置

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git >= 2.0.0

### 快速开始

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 Fork 项目到您的账户
   ```

2. **克隆项目**
   ```bash
   git clone https://github.com/your-username/NodeJS_TODO.git
   cd NodeJS_TODO
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **配置环境变量**
   ```bash
   cp .env.example .env
   # 根据需要修改 .env 文件中的配置
   ```

5. **初始化数据库**
   ```bash
   npm run db:init
   ```

6. **启动开发服务器**
   ```bash
   npm run dev
   ```

7. **访问应用**
   打开浏览器访问 http://localhost:3000

## 📁 项目结构

```
├── app.js                 # 应用入口文件
├── config/                # 配置文件
│   ├── database.js        # 数据库配置
│   └── development.js     # 开发环境配置
├── controllers/           # 控制器层
├── models/                # 数据模型层
├── services/              # 业务逻辑层
├── views/                 # 视图模板
├── routes/                # 路由定义
├── middleware/            # 中间件
├── utils/                 # 工具函数
├── scripts/               # 脚本文件
├── docs/                  # 文档
├── database/              # 数据库文件
└── public/                # 静态资源
```

## 🔄 开发流程

### 1. 创建功能分支

```bash
# 从 main 分支创建新的功能分支
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. 开发功能

- 遵循 [代码规范](#代码规范)
- 编写必要的测试
- 更新相关文档
- 确保代码通过所有测试

### 3. 提交代码

```bash
# 添加修改的文件
git add .

# 提交代码（遵循提交规范）
git commit -m "feat: add new student search feature"

# 推送到远程分支
git push origin feature/your-feature-name
```

### 4. 创建 Pull Request

1. 在 GitHub 上创建 Pull Request
2. 填写详细的 PR 描述
3. 等待代码审查
4. 根据反馈修改代码
5. 合并到主分支

## 📝 代码规范

### JavaScript 规范

- 使用 ES6+ 语法
- 使用 2 个空格缩进
- 使用单引号字符串
- 行末不加分号
- 函数和变量使用驼峰命名
- 常量使用大写下划线命名

### 文件命名规范

- 文件名使用小写字母和连字符
- 组件文件使用 PascalCase
- 工具函数文件使用 camelCase

### 代码注释

```javascript
/**
 * 函数描述
 * @param {string} param1 - 参数1描述
 * @param {number} param2 - 参数2描述
 * @returns {Promise<Object>} 返回值描述
 */
async function exampleFunction(param1, param2) {
  // 实现逻辑
}
```

### 错误处理

```javascript
try {
  // 业务逻辑
  const result = await someAsyncOperation()
  return result
} catch (error) {
  console.error('操作失败:', error.message)
  throw new Error(`操作失败: ${error.message}`)
}
```

## 📋 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `perf`: 性能优化
- `ci`: CI/CD 相关

### 提交格式

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 示例

```bash
# 新功能
git commit -m "feat(student): add bulk import functionality"

# 修复 bug
git commit -m "fix(validation): correct email validation regex"

# 文档更新
git commit -m "docs(readme): update installation instructions"

# 重构
git commit -m "refactor(service): extract common validation logic"
```

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- --grep "student service"

# 生成测试覆盖率报告
npm run test:coverage
```

### 编写测试

```javascript
// tests/services/studentService.test.js
import { expect } from 'chai'
import studentService from '../../services/studentService.js'

describe('StudentService', () => {
  describe('createStudent', () => {
    it('should create a new student with valid data', async () => {
      const studentData = {
        studentId: '2024001',
        name: '张三',
        gender: '男',
        age: 20,
        major: '计算机科学',
        grade: '大二'
      }
      
      const result = await studentService.createStudent(studentData)
      expect(result).to.have.property('id')
      expect(result.name).to.equal('张三')
    })
  })
})
```

## 📚 文档编写

### API 文档

使用 JSDoc 格式编写 API 文档：

```javascript
/**
 * 获取学生列表
 * @route GET /students
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {number} [req.query.page=1] - 页码
 * @param {number} [req.query.limit=10] - 每页数量
 * @param {string} [req.query.search] - 搜索关键词
 * @param {Object} res - Express 响应对象
 * @returns {Promise<void>}
 */
async function getStudents(req, res) {
  // 实现逻辑
}
```

### README 更新

当添加新功能时，请更新 README.md 文件：

- 功能列表
- API 接口
- 使用示例
- 配置说明

## 🐛 问题报告

### 报告 Bug

请使用 GitHub Issues 报告问题，并包含以下信息：

1. **问题描述**: 清晰描述遇到的问题
2. **重现步骤**: 详细的重现步骤
3. **期望行为**: 描述期望的正确行为
4. **实际行为**: 描述实际发生的行为
5. **环境信息**: 
   - Node.js 版本
   - npm 版本
   - 操作系统
   - 浏览器版本（如适用）
6. **错误日志**: 相关的错误信息或日志
7. **截图**: 如果有助于理解问题

### Bug 报告模板

```markdown
## Bug 描述
简要描述遇到的问题

## 重现步骤
1. 打开应用
2. 点击 '...'
3. 输入 '...'
4. 看到错误

## 期望行为
描述期望发生的情况

## 实际行为
描述实际发生的情况

## 环境信息
- Node.js: v16.14.0
- npm: 8.3.1
- OS: macOS 12.3
- Browser: Chrome 100.0.4896.75

## 错误日志
```
粘贴相关的错误信息
```

## 截图
如果适用，添加截图帮助解释问题
```

## 💡 功能请求

### 提出新功能

使用 GitHub Issues 提出功能请求：

1. **功能描述**: 详细描述建议的功能
2. **使用场景**: 说明功能的使用场景
3. **解决问题**: 说明功能解决的问题
4. **实现建议**: 如果有实现想法，请分享
5. **替代方案**: 考虑过的其他解决方案

### 功能请求模板

```markdown
## 功能描述
简要描述建议的功能

## 问题背景
描述当前遇到的问题或需求

## 建议解决方案
详细描述建议的实现方式

## 替代方案
描述考虑过的其他解决方案

## 附加信息
任何其他相关信息、截图或示例
```

## 🎯 开发最佳实践

### 1. 代码质量

- 保持函数简洁，单一职责
- 使用有意义的变量和函数名
- 避免深层嵌套，使用早期返回
- 处理边界情况和错误

### 2. 性能考虑

- 避免不必要的数据库查询
- 使用适当的索引
- 实现分页和搜索优化
- 考虑缓存策略

### 3. 安全性

- 验证所有用户输入
- 使用参数化查询防止 SQL 注入
- 实现适当的访问控制
- 不在代码中硬编码敏感信息

### 4. 可维护性

- 编写清晰的注释和文档
- 保持代码结构清晰
- 使用一致的编码风格
- 编写测试用例

## 📞 联系方式

如果您有任何问题或建议，可以通过以下方式联系我们：

- GitHub Issues: [项目 Issues 页面]
- Email: [维护者邮箱]
- 讨论区: [GitHub Discussions]

## 📄 许可证

通过贡献代码，您同意您的贡献将在与项目相同的 [MIT 许可证](LICENSE) 下发布。

---

再次感谢您的贡献！🎉