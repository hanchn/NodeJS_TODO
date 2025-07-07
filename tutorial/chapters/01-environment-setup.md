# 第1章：开发环境搭建

## 学习目标

完成本章学习后，你将能够：
- 安装和配置 Node.js 开发环境
- 了解 npm 包管理器的基本使用
- 配置代码编辑器和开发工具
- 创建第一个 Node.js 项目

## 前置要求

- 基本的计算机操作能力
- 了解命令行基础操作
- 有一定的编程基础（任何语言）

## 1.1 安装 Node.js

### 什么是 Node.js？

Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时环境，让 JavaScript 可以在服务器端运行。它具有以下特点：

- **事件驱动**：基于事件循环的非阻塞 I/O 模型
- **单线程**：主线程单线程，但可以创建子进程
- **跨平台**：支持 Windows、macOS、Linux 等操作系统
- **丰富的生态**：拥有庞大的 npm 包生态系统

### 安装方式选择

我们推荐使用 **官方安装包** 的方式安装 Node.js，这是最简单可靠的方法。

#### 方式一：官方安装包（推荐）

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS（长期支持）版本
3. 运行安装程序，按照提示完成安装

#### 方式二：使用 nvm（高级用户）

nvm（Node Version Manager）可以管理多个 Node.js 版本：

```bash
# macOS/Linux 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装最新的 LTS 版本
nvm install --lts
nvm use --lts
```

### 验证安装

打开终端（命令提示符），运行以下命令验证安装：

```bash
# 检查 Node.js 版本
node --version
# 应该输出类似：v18.17.0

# 检查 npm 版本
npm --version
# 应该输出类似：9.6.7
```

> **注意**：本教程要求 Node.js 版本 >= 16.0.0

## 1.2 配置 npm

### 什么是 npm？

npm（Node Package Manager）是 Node.js 的包管理器，用于：
- 安装和管理第三方包
- 管理项目依赖
- 运行脚本命令
- 发布自己的包

### 配置国内镜像源

为了提高包下载速度，建议配置国内镜像源：

```bash
# 查看当前镜像源
npm config get registry

# 设置淘宝镜像源
npm config set registry https://registry.npmmirror.com/

# 验证配置
npm config get registry
```

### 常用 npm 命令

```bash
# 初始化项目
npm init

# 安装包
npm install <package-name>
npm install <package-name> --save-dev  # 开发依赖
npm install <package-name> -g          # 全局安装

# 卸载包
npm uninstall <package-name>

# 查看已安装的包
npm list
npm list -g  # 全局包

# 更新包
npm update

# 运行脚本
npm run <script-name>
npm start    # 运行 start 脚本
npm test     # 运行 test 脚本
```

## 1.3 选择代码编辑器

### 推荐编辑器：Visual Studio Code

VS Code 是目前最受欢迎的代码编辑器，具有以下优势：
- 免费开源
- 丰富的插件生态
- 优秀的 JavaScript/Node.js 支持
- 内置终端和调试器

### 安装 VS Code

1. 访问 [VS Code 官网](https://code.visualstudio.com/)
2. 下载对应操作系统的版本
3. 安装并启动

### 推荐插件

安装以下插件提升开发体验：

```
必装插件：
- JavaScript (ES6) code snippets  # JS 代码片段
- Prettier - Code formatter        # 代码格式化
- ESLint                          # 代码检查
- Auto Rename Tag                 # 自动重命名标签
- Bracket Pair Colorizer          # 括号配对着色

推荐插件：
- GitLens                         # Git 增强
- Thunder Client                  # API 测试
- Live Server                     # 本地服务器
- Path Intellisense              # 路径智能提示
- Material Icon Theme            # 图标主题
```

### 配置 VS Code

创建工作区配置文件 `.vscode/settings.json`：

```json
{
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

## 1.4 Git 版本控制

### 安装 Git

#### Windows
下载 [Git for Windows](https://git-scm.com/download/win) 并安装

#### macOS
```bash
# 使用 Homebrew 安装
brew install git

# 或者下载官方安装包
# https://git-scm.com/download/mac
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install git

# CentOS/RHEL
sudo yum install git
```

### 配置 Git

```bash
# 配置用户信息
git config --global user.name "你的姓名"
git config --global user.email "你的邮箱"

# 配置默认编辑器
git config --global core.editor "code --wait"

# 查看配置
git config --list
```

### 基础 Git 命令

```bash
# 初始化仓库
git init

# 添加文件到暂存区
git add .
git add <filename>

# 提交更改
git commit -m "提交信息"

# 查看状态
git status

# 查看提交历史
git log

# 创建分支
git branch <branch-name>
git checkout -b <branch-name>

# 切换分支
git checkout <branch-name>

# 合并分支
git merge <branch-name>
```

## 1.5 创建第一个 Node.js 项目

### 创建项目目录

```bash
# 创建项目目录
mkdir my-first-node-app
cd my-first-node-app

# 初始化 Git 仓库
git init

# 创建 .gitignore 文件
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "*.log" >> .gitignore
```

### 初始化 npm 项目

```bash
# 交互式初始化
npm init

# 或者使用默认配置
npm init -y
```

这会创建 `package.json` 文件：

```json
{
  "name": "my-first-node-app",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

### 创建第一个 Node.js 文件

创建 `index.js` 文件：

```javascript
// index.js
console.log('Hello, Node.js!');
console.log('Node.js 版本:', process.version);
console.log('当前工作目录:', process.cwd());

// 简单的 HTTP 服务器
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>欢迎来到 Node.js 世界！</h1>');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

### 运行项目

```bash
# 运行 Node.js 文件
node index.js
```

打开浏览器访问 `http://localhost:3000`，你应该能看到欢迎页面。

### 添加 npm 脚本

修改 `package.json` 中的 scripts 部分：

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

现在可以使用 npm 命令运行项目：

```bash
npm start
# 或者
npm run dev
```

## 1.6 开发工具推荐

### 终端工具

#### Windows
- **Windows Terminal**：现代化的终端应用
- **Git Bash**：提供 Unix 风格的命令行

#### macOS
- **iTerm2**：功能强大的终端替代品
- **Oh My Zsh**：Zsh 配置框架

#### Linux
- **Terminator**：支持分屏的终端
- **Zsh + Oh My Zsh**：强大的 Shell 配置

### API 测试工具

- **Postman**：功能全面的 API 测试工具
- **Insomnia**：简洁的 REST 客户端
- **Thunder Client**：VS Code 插件，轻量级 API 测试

### 数据库管理工具

- **DBeaver**：通用数据库管理工具
- **SQLite Browser**：SQLite 专用管理工具
- **TablePlus**：现代化数据库客户端

## 1.7 常见问题解决

### 问题1：npm 安装速度慢

**解决方案**：
```bash
# 使用 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com/
cnpm install <package-name>

# 或者使用 yarn
npm install -g yarn
yarn add <package-name>
```

### 问题2：权限错误

**Windows**：以管理员身份运行命令提示符

**macOS/Linux**：
```bash
# 不要使用 sudo npm，而是配置 npm 目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 问题3：Node.js 版本冲突

**解决方案**：使用 nvm 管理多个版本
```bash
# 安装特定版本
nvm install 16.17.0
nvm use 16.17.0

# 设置默认版本
nvm alias default 16.17.0
```

## 1.8 本章小结

在本章中，我们完成了以下内容：

✅ **环境搭建**：
- 安装了 Node.js 和 npm
- 配置了国内镜像源
- 验证了安装结果

✅ **工具配置**：
- 安装并配置了 VS Code
- 安装了必要的插件
- 配置了 Git 版本控制

✅ **实践项目**：
- 创建了第一个 Node.js 项目
- 编写了简单的 HTTP 服务器
- 学会了使用 npm 脚本

✅ **开发工具**：
- 了解了常用的开发工具
- 学会了解决常见问题

## 1.9 课后练习

### 练习1：环境验证
创建一个新的 Node.js 项目，要求：
1. 使用 `npm init` 初始化项目
2. 创建一个输出系统信息的脚本
3. 添加 npm 脚本来运行程序

### 练习2：简单服务器
修改 HTTP 服务器，要求：
1. 支持多个路由（/, /about, /contact）
2. 返回不同的页面内容
3. 添加 404 错误处理

### 练习3：包管理
练习 npm 包管理：
1. 安装 `lodash` 包
2. 在代码中使用 lodash 的功能
3. 查看 `package.json` 的变化

## 1.10 下一章预告

在下一章《项目初始化》中，我们将：
- 深入了解 `package.json` 配置
- 学习依赖包管理
- 配置项目脚本
- 设置开发和生产环境

---

**学习提示**：
- 多动手实践，理论结合实际
- 遇到问题先查看错误信息，再搜索解决方案
- 建议将每章的代码保存到 Git 仓库中
- 可以在学习群中与其他同学交流讨论

**参考资源**：
- [Node.js 官方文档](https://nodejs.org/docs/)
- [npm 官方文档](https://docs.npmjs.com/)
- [VS Code 官方文档](https://code.visualstudio.com/docs)
- [Git 官方教程](https://git-scm.com/docs/gittutorial)