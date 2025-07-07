# 第7章：EJS 模板引擎

## 7.1 学习目标

通过本章学习，你将能够：

- 理解模板引擎的作用和 EJS 的特点
- 掌握 EJS 的基础语法和高级特性
- 学会模板继承和组件化开发
- 实现动态数据渲染和条件逻辑
- 掌握表单处理和数据验证
- 理解前后端数据交互机制

## 7.2 EJS 基础概念

### 什么是模板引擎

模板引擎是一种将数据与模板结合生成最终输出的工具。在 Web 开发中，模板引擎帮助我们：

1. **分离关注点**：将业务逻辑与视图逻辑分离
2. **代码复用**：通过模板继承和组件化减少重复代码
3. **动态内容**：根据数据动态生成 HTML 内容
4. **维护性**：提高代码的可读性和可维护性

### EJS 特点和优势

```javascript
// EJS 的主要特点
const ejsFeatures = {
  syntax: '简洁的 JavaScript 语法',
  performance: '高性能的模板编译',
  flexibility: '灵活的模板继承',
  debugging: '友好的错误提示',
  caching: '内置模板缓存机制',
  compatibility: '与 Express.js 完美集成'
};

// EJS vs 其他模板引擎
const templateEngines = {
  EJS: {
    syntax: 'JavaScript-like',
    learning_curve: '低',
    performance: '高',
    features: ['继承', '组件', '缓存']
  },
  Handlebars: {
    syntax: 'Mustache-like',
    learning_curve: '中',
    performance: '中',
    features: ['助手函数', '部分模板']
  },
  Pug: {
    syntax: 'Indentation-based',
    learning_curve: '高',
    performance: '高',
    features: ['简洁语法', '混入']
  }
};
```

### EJS 安装和配置

```javascript
// package.json 依赖
{
  "dependencies": {
    "ejs": "^3.1.9",
    "express": "^4.18.2"
  }
}

// app.js - Express 中配置 EJS
const express = require('express');
const path = require('path');
const app = express();

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 配置 EJS 选项
app.set('view options', {
  delimiter: '%',           // 分隔符
  openDelimiter: '<',      // 开始分隔符
  closeDelimiter: '>',     // 结束分隔符
  cache: process.env.NODE_ENV === 'production', // 生产环境启用缓存
  debug: process.env.NODE_ENV === 'development', // 开发环境启用调试
  compileDebug: process.env.NODE_ENV === 'development',
  rmWhitespace: true,      // 移除空白字符
  root: path.join(__dirname, 'views'), // 模板根目录
  localsName: 'locals',    // 本地变量名
  outputFunctionName: 'echo' // 输出函数名
});

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 全局模板变量
app.locals.siteName = '学生管理系统';
app.locals.version = '1.0.0';
app.locals.currentYear = new Date().getFullYear();

// 辅助函数
app.locals.formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

app.locals.formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount);
};

module.exports = app;
```

## 7.3 EJS 基础语法

### 标签类型

```html
<!-- views/syntax-demo.ejs -->
<!DOCTYPE html>
<html>
<head>
    <title>EJS 语法演示</title>
</head>
<body>
    <h1>EJS 基础语法</h1>
    
    <!-- 1. 输出标签 <%= %> -->
    <p>用户名：<%= user.name %></p>
    <p>当前时间：<%= new Date().toLocaleString() %></p>
    
    <!-- 2. 原始输出标签 <%- %> -->
    <div>HTML 内容：<%- htmlContent %></div>
    
    <!-- 3. 脚本标签 <% %> -->
    <% 
        const greeting = '欢迎';
        const isLoggedIn = user && user.id;
    %>
    
    <!-- 4. 注释标签 <%# %> -->
    <%# 这是 EJS 注释，不会出现在最终 HTML 中 %>
    
    <!-- 5. 条件语句 -->
    <% if (isLoggedIn) { %>
        <p><%= greeting %>，<%= user.name %>！</p>
        <a href="/logout">退出登录</a>
    <% } else { %>
        <p>请先登录</p>
        <a href="/login">登录</a>
    <% } %>
    
    <!-- 6. 循环语句 -->
    <% if (students && students.length > 0) { %>
        <ul>
        <% students.forEach(function(student, index) { %>
            <li>
                <%= index + 1 %>. <%= student.name %> 
                (<%= student.email %>)
            </li>
        <% }); %>
        </ul>
    <% } else { %>
        <p>暂无学生数据</p>
    <% } %>
    
    <!-- 7. 三元运算符 -->
    <p class="<%= user.isActive ? 'active' : 'inactive' %>">
        状态：<%= user.isActive ? '活跃' : '非活跃' %>
    </p>
    
    <!-- 8. 对象和数组操作 -->
    <% const colors = ['red', 'green', 'blue']; %>
    <% const userInfo = { age: 25, city: '北京' }; %>
    
    <p>颜色数量：<%= colors.length %></p>
    <p>用户年龄：<%= userInfo.age %></p>
    
    <!-- 9. 函数调用 -->
    <p>格式化日期：<%= formatDate(new Date()) %></p>
    
    <!-- 10. 字符串操作 -->
    <p>大写用户名：<%= user.name.toUpperCase() %></p>
    <p>邮箱域名：<%= user.email.split('@')[1] %></p>
</body>
</html>
```

### 变量和表达式

```html
<!-- views/variables-demo.ejs -->
<!DOCTYPE html>
<html>
<head>
    <title>变量和表达式</title>
</head>
<body>
    <!-- 变量声明和赋值 -->
    <% 
        let title = '学生信息';
        const maxStudents = 100;
        var currentCount = students ? students.length : 0;
        
        // 复杂计算
        const percentage = maxStudents > 0 ? (currentCount / maxStudents * 100).toFixed(1) : 0;
        
        // 对象解构
        const { name, email, age } = student || {};
        
        // 数组解构
        const [first, second] = students || [];
    %>
    
    <h1><%= title %></h1>
    
    <!-- 数学运算 -->
    <p>学生总数：<%= currentCount %></p>
    <p>最大容量：<%= maxStudents %></p>
    <p>使用率：<%= percentage %>%</p>
    <p>剩余名额：<%= maxStudents - currentCount %></p>
    
    <!-- 字符串操作 -->
    <% if (name) { %>
        <p>学生姓名：<%= name %></p>
        <p>姓名长度：<%= name.length %></p>
        <p>首字母：<%= name.charAt(0) %></p>
        <p>是否包含'张'：<%= name.includes('张') ? '是' : '否' %></p>
    <% } %>
    
    <!-- 数组操作 -->
    <% if (students && students.length > 0) { %>
        <p>第一个学生：<%= students[0].name %></p>
        <p>最后一个学生：<%= students[students.length - 1].name %></p>
        
        <!-- 数组方法 -->
        <% const activeStudents = students.filter(s => s.status === 'active'); %>
        <p>活跃学生数：<%= activeStudents.length %></p>
        
        <% const studentNames = students.map(s => s.name); %>
        <p>所有学生姓名：<%= studentNames.join(', ') %></p>
    <% } %>
    
    <!-- 日期操作 -->
    <% 
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
    %>
    <p>当前日期：<%= year %>年<%= month %>月<%= day %>日</p>
    
    <!-- JSON 操作 -->
    <% if (student) { %>
        <pre><%= JSON.stringify(student, null, 2) %></pre>
    <% } %>
</body>
</html>
```

### 控制流语句

```html
<!-- views/control-flow.ejs -->
<!DOCTYPE html>
<html>
<head>
    <title>控制流语句</title>
</head>
<body>
    <h1>控制流演示</h1>
    
    <!-- if-else 语句 -->
    <section>
        <h2>条件判断</h2>
        <% if (user) { %>
            <% if (user.role === 'admin') { %>
                <p>管理员用户：<%= user.name %></p>
                <a href="/admin">管理面板</a>
            <% } else if (user.role === 'teacher') { %>
                <p>教师用户：<%= user.name %></p>
                <a href="/teacher">教师面板</a>
            <% } else { %>
                <p>学生用户：<%= user.name %></p>
                <a href="/student">学生面板</a>
            <% } %>
        <% } else { %>
            <p>未登录用户</p>
            <a href="/login">请登录</a>
        <% } %>
    </section>
    
    <!-- for 循环 -->
    <section>
        <h2>for 循环</h2>
        <% if (students && students.length > 0) { %>
            <table>
                <thead>
                    <tr>
                        <th>序号</th>
                        <th>姓名</th>
                        <th>邮箱</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    <% for (let i = 0; i < students.length; i++) { %>
                        <% const student = students[i]; %>
                        <tr class="<%= student.status === 'active' ? 'active' : 'inactive' %>">
                            <td><%= i + 1 %></td>
                            <td><%= student.name %></td>
                            <td><%= student.email %></td>
                            <td>
                                <% if (student.status === 'active') { %>
                                    <span class="badge badge-success">活跃</span>
                                <% } else if (student.status === 'inactive') { %>
                                    <span class="badge badge-warning">非活跃</span>
                                <% } else { %>
                                    <span class="badge badge-danger">已毕业</span>
                                <% } %>
                            </td>
                        </tr>
                    <% } %>
                </tbody>
            </table>
        <% } %>
    </section>
    
    <!-- forEach 循环 -->
    <section>
        <h2>forEach 循环</h2>
        <% if (courses && courses.length > 0) { %>
            <div class="course-grid">
                <% courses.forEach(function(course, index) { %>
                    <div class="course-card">
                        <h3><%= course.name %></h3>
                        <p>课程代码：<%= course.code %></p>
                        <p>学分：<%= course.credits %></p>
                        <p>教师：<%= course.teacher %></p>
                        
                        <!-- 嵌套条件 -->
                        <% if (course.students && course.students.length > 0) { %>
                            <p>选课学生：</p>
                            <ul>
                                <% course.students.forEach(function(student) { %>
                                    <li><%= student.name %></li>
                                <% }); %>
                            </ul>
                        <% } else { %>
                            <p>暂无学生选课</p>
                        <% } %>
                    </div>
                <% }); %>
            </div>
        <% } %>
    </section>
    
    <!-- for...in 循环 -->
    <section>
        <h2>对象遍历</h2>
        <% if (statistics) { %>
            <dl>
                <% for (const key in statistics) { %>
                    <dt><%= key %></dt>
                    <dd><%= statistics[key] %></dd>
                <% } %>
            </dl>
        <% } %>
    </section>
    
    <!-- switch 语句模拟 -->
    <section>
        <h2>多条件判断</h2>
        <% if (user && user.status) { %>
            <% 
                let statusMessage = '';
                let statusClass = '';
                
                switch (user.status) {
                    case 'active':
                        statusMessage = '账户正常';
                        statusClass = 'success';
                        break;
                    case 'pending':
                        statusMessage = '待审核';
                        statusClass = 'warning';
                        break;
                    case 'suspended':
                        statusMessage = '账户暂停';
                        statusClass = 'danger';
                        break;
                    default:
                        statusMessage = '状态未知';
                        statusClass = 'secondary';
                }
            %>
            <div class="alert alert-<%= statusClass %>">
                <%= statusMessage %>
            </div>
        <% } %>
    </section>
    
    <!-- 复杂嵌套逻辑 -->
    <section>
        <h2>复杂逻辑</h2>
        <% if (students && students.length > 0) { %>
            <% 
                const groupedStudents = {};
                students.forEach(student => {
                    const grade = student.grade || '未分级';
                    if (!groupedStudents[grade]) {
                        groupedStudents[grade] = [];
                    }
                    groupedStudents[grade].push(student);
                });
            %>
            
            <% for (const grade in groupedStudents) { %>
                <div class="grade-group">
                    <h3><%= grade %></h3>
                    <% if (groupedStudents[grade].length > 0) { %>
                        <ul>
                            <% groupedStudents[grade].forEach(function(student) { %>
                                <li>
                                    <%= student.name %>
                                    <% if (student.gpa) { %>
                                        (GPA: <%= student.gpa %>)
                                    <% } %>
                                </li>
                            <% }); %>
                        </ul>
                    <% } %>
                </div>
            <% } %>
        <% } %>
    </section>
</body>
</html>
```

## 7.4 模板继承和布局

### 基础布局模板

```html
<!-- views/layout.ejs -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= typeof title !== 'undefined' ? title + ' - ' : '' %><%= siteName %></title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- 自定义样式 -->
    <link href="/css/style.css" rel="stylesheet">
    
    <!-- 页面特定样式 -->
    <% if (typeof pageStyles !== 'undefined') { %>
        <% pageStyles.forEach(function(style) { %>
            <link href="<%= style %>" rel="stylesheet">
        <% }); %>
    <% } %>
    
    <!-- 内联样式 -->
    <% if (typeof inlineStyles !== 'undefined') { %>
        <style>
            <%- inlineStyles %>
        </style>
    <% } %>
</head>
<body class="<%= typeof bodyClass !== 'undefined' ? bodyClass : '' %>">
    <!-- 导航栏 -->
    <%- include('partials/navbar') %>
    
    <!-- 主要内容区域 -->
    <main class="container-fluid">
        <!-- 面包屑导航 -->
        <% if (typeof breadcrumbs !== 'undefined' && breadcrumbs.length > 0) { %>
            <%- include('partials/breadcrumbs', { breadcrumbs: breadcrumbs }) %>
        <% } %>
        
        <!-- 消息提示 -->
        <%- include('partials/messages') %>
        
        <!-- 页面标题 -->
        <% if (typeof pageTitle !== 'undefined') { %>
            <div class="row mb-4">
                <div class="col">
                    <h1 class="page-title">
                        <% if (typeof pageIcon !== 'undefined') { %>
                            <i class="<%= pageIcon %>"></i>
                        <% } %>
                        <%= pageTitle %>
                        <% if (typeof pageSubtitle !== 'undefined') { %>
                            <small class="text-muted"><%= pageSubtitle %></small>
                        <% } %>
                    </h1>
                </div>
                <% if (typeof pageActions !== 'undefined') { %>
                    <div class="col-auto">
                        <%- pageActions %>
                    </div>
                <% } %>
            </div>
        <% } %>
        
        <!-- 页面内容 -->
        <div class="row">
            <!-- 侧边栏 -->
            <% if (typeof showSidebar !== 'undefined' && showSidebar) { %>
                <div class="col-md-3 col-lg-2">
                    <%- include('partials/sidebar') %>
                </div>
                <div class="col-md-9 col-lg-10">
                    <%- body %>
                </div>
            <% } else { %>
                <div class="col-12">
                    <%- body %>
                </div>
            <% } %>
        </div>
    </main>
    
    <!-- 页脚 -->
    <%- include('partials/footer') %>
    
    <!-- 模态框容器 -->
    <div id="modal-container"></div>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    
    <!-- 全局 JavaScript -->
    <script src="/js/app.js"></script>
    
    <!-- 页面特定脚本 -->
    <% if (typeof pageScripts !== 'undefined') { %>
        <% pageScripts.forEach(function(script) { %>
            <script src="<%= script %>"></script>
        <% }); %>
    <% } %>
    
    <!-- 内联脚本 -->
    <% if (typeof inlineScripts !== 'undefined') { %>
        <script>
            <%- inlineScripts %>
        </script>
    <% } %>
</body>
</html>
```

### 导航栏组件

```html
<!-- views/partials/navbar.ejs -->
<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container-fluid">
        <!-- 品牌 -->
        <a class="navbar-brand" href="/">
            <i class="fas fa-graduation-cap"></i>
            <%= siteName %>
        </a>
        
        <!-- 移动端切换按钮 -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <!-- 导航菜单 -->
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link <%= currentPath === '/' ? 'active' : '' %>" href="/">
                        <i class="fas fa-home"></i> 首页
                    </a>
                </li>
                
                <% if (user && (user.role === 'admin' || user.role === 'teacher')) { %>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            <i class="fas fa-users"></i> 学生管理
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="/students">学生列表</a></li>
                            <li><a class="dropdown-item" href="/students/new">添加学生</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="/students/import">批量导入</a></li>
                        </ul>
                    </li>
                    
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            <i class="fas fa-book"></i> 课程管理
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="/courses">课程列表</a></li>
                            <li><a class="dropdown-item" href="/courses/new">添加课程</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="/courses/schedule">课程安排</a></li>
                        </ul>
                    </li>
                <% } %>
                
                <% if (user && user.role === 'admin') { %>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            <i class="fas fa-cog"></i> 系统管理
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="/admin/users">用户管理</a></li>
                            <li><a class="dropdown-item" href="/admin/settings">系统设置</a></li>
                            <li><a class="dropdown-item" href="/admin/logs">操作日志</a></li>
                        </ul>
                    </li>
                <% } %>
            </ul>
            
            <!-- 右侧菜单 -->
            <ul class="navbar-nav">
                <!-- 搜索框 -->
                <li class="nav-item">
                    <form class="d-flex" action="/search" method="GET">
                        <input class="form-control me-2" type="search" name="q" placeholder="搜索学生..." 
                               value="<%= typeof searchQuery !== 'undefined' ? searchQuery : '' %>">
                        <button class="btn btn-outline-light" type="submit">
                            <i class="fas fa-search"></i>
                        </button>
                    </form>
                </li>
                
                <!-- 通知 -->
                <% if (user) { %>
                    <li class="nav-item dropdown">
                        <a class="nav-link position-relative" href="#" role="button" data-bs-toggle="dropdown">
                            <i class="fas fa-bell"></i>
                            <% if (notifications && notifications.unreadCount > 0) { %>
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    <%= notifications.unreadCount %>
                                </span>
                            <% } %>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><h6 class="dropdown-header">通知</h6></li>
                            <% if (notifications && notifications.items.length > 0) { %>
                                <% notifications.items.slice(0, 5).forEach(function(notification) { %>
                                    <li>
                                        <a class="dropdown-item <%= notification.read ? '' : 'fw-bold' %>" 
                                           href="<%= notification.link || '#' %>">
                                            <small class="text-muted"><%= formatDate(notification.createdAt) %></small><br>
                                            <%= notification.message %>
                                        </a>
                                    </li>
                                <% }); %>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-center" href="/notifications">查看全部</a></li>
                            <% } else { %>
                                <li><span class="dropdown-item-text">暂无通知</span></li>
                            <% } %>
                        </ul>
                    </li>
                <% } %>
                
                <!-- 用户菜单 -->
                <% if (user) { %>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            <% if (user.avatar) { %>
                                <img src="<%= user.avatar %>" alt="<%= user.name %>" class="rounded-circle" width="24" height="24">
                            <% } else { %>
                                <i class="fas fa-user-circle"></i>
                            <% } %>
                            <%= user.name %>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="/profile">个人资料</a></li>
                            <li><a class="dropdown-item" href="/settings">账户设置</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <form action="/logout" method="POST" class="d-inline">
                                    <button type="submit" class="dropdown-item">
                                        <i class="fas fa-sign-out-alt"></i> 退出登录
                                    </button>
                                </form>
                            </li>
                        </ul>
                    </li>
                <% } else { %>
                    <li class="nav-item">
                        <a class="nav-link" href="/login">
                            <i class="fas fa-sign-in-alt"></i> 登录
                        </a>
                    </li>
                <% } %>
            </ul>
        </div>
    </div>
</nav>
```

### 消息提示组件

```html
<!-- views/partials/messages.ejs -->
<% if (typeof messages !== 'undefined' && messages) { %>
    <!-- 成功消息 -->
    <% if (messages.success) { %>
        <% const successMessages = Array.isArray(messages.success) ? messages.success : [messages.success]; %>
        <% successMessages.forEach(function(message) { %>
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle"></i>
                <%= message %>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <% }); %>
    <% } %>
    
    <!-- 错误消息 -->
    <% if (messages.error) { %>
        <% const errorMessages = Array.isArray(messages.error) ? messages.error : [messages.error]; %>
        <% errorMessages.forEach(function(message) { %>
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-circle"></i>
                <%= message %>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <% }); %>
    <% } %>
    
    <!-- 警告消息 -->
    <% if (messages.warning) { %>
        <% const warningMessages = Array.isArray(messages.warning) ? messages.warning : [messages.warning]; %>
        <% warningMessages.forEach(function(message) { %>
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle"></i>
                <%= message %>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <% }); %>
    <% } %>
    
    <!-- 信息消息 -->
    <% if (messages.info) { %>
        <% const infoMessages = Array.isArray(messages.info) ? messages.info : [messages.info]; %>
        <% infoMessages.forEach(function(message) { %>
            <div class="alert alert-info alert-dismissible fade show" role="alert">
                <i class="fas fa-info-circle"></i>
                <%= message %>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <% }); %>
    <% } %>
<% } %>

<!-- 验证错误 -->
<% if (typeof errors !== 'undefined' && errors && errors.length > 0) { %>
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="fas fa-exclamation-circle"></i>
        <strong>请修正以下错误：</strong>
        <ul class="mb-0 mt-2">
            <% errors.forEach(function(error) { %>
                <li><%= error.msg || error.message || error %></li>
            <% }); %>
        </ul>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<% } %>

<!-- 自动消失的消息 -->
<script>
// 5秒后自动隐藏成功和信息消息
setTimeout(function() {
    const alerts = document.querySelectorAll('.alert-success, .alert-info');
    alerts.forEach(function(alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    });
}, 5000);
</script>
```

### 面包屑导航组件

```html
<!-- views/partials/breadcrumbs.ejs -->
<% if (breadcrumbs && breadcrumbs.length > 0) { %>
    <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
            <% breadcrumbs.forEach(function(crumb, index) { %>
                <% if (index === breadcrumbs.length - 1) { %>
                    <!-- 当前页面 -->
                    <li class="breadcrumb-item active" aria-current="page">
                        <% if (crumb.icon) { %>
                            <i class="<%= crumb.icon %>"></i>
                        <% } %>
                        <%= crumb.name %>
                    </li>
                <% } else { %>
                    <!-- 链接页面 -->
                    <li class="breadcrumb-item">
                        <% if (crumb.url) { %>
                            <a href="<%= crumb.url %>">
                                <% if (crumb.icon) { %>
                                    <i class="<%= crumb.icon %>"></i>
                                <% } %>
                                <%= crumb.name %>
                            </a>
                        <% } else { %>
                            <% if (crumb.icon) { %>
                                <i class="<%= crumb.icon %>"></i>
                            <% } %>
                            <%= crumb.name %>
                        <% } %>
                    </li>
                <% } %>
            <% }); %>
        </ol>
    </nav>
<% } %>
```

### 页脚组件

```html
<!-- views/partials/footer.ejs -->
<footer class="bg-light mt-5 py-4">
    <div class="container">
        <div class="row">
            <div class="col-md-6">
                <h5><%= siteName %></h5>
                <p class="text-muted">现代化的学生管理系统，提供完整的学生信息管理解决方案。</p>
                <p class="text-muted">
                    <small>
                        版本 <%= version %> | 
                        构建时间：<%= typeof buildTime !== 'undefined' ? formatDate(buildTime) : '未知' %>
                    </small>
                </p>
            </div>
            
            <div class="col-md-3">
                <h6>快速链接</h6>
                <ul class="list-unstyled">
                    <li><a href="/" class="text-muted">首页</a></li>
                    <% if (user && (user.role === 'admin' || user.role === 'teacher')) { %>
                        <li><a href="/students" class="text-muted">学生管理</a></li>
                        <li><a href="/courses" class="text-muted">课程管理</a></li>
                    <% } %>
                    <li><a href="/help" class="text-muted">帮助中心</a></li>
                </ul>
            </div>
            
            <div class="col-md-3">
                <h6>联系我们</h6>
                <ul class="list-unstyled text-muted">
                    <li><i class="fas fa-envelope"></i> support@example.com</li>
                    <li><i class="fas fa-phone"></i> +86 400-123-4567</li>
                    <li><i class="fas fa-map-marker-alt"></i> 北京市朝阳区</li>
                </ul>
            </div>
        </div>
        
        <hr class="my-4">
        
        <div class="row align-items-center">
            <div class="col-md-6">
                <p class="text-muted mb-0">
                    &copy; <%= currentYear %> <%= siteName %>. 保留所有权利。
                </p>
            </div>
            
            <div class="col-md-6 text-md-end">
                <div class="social-links">
                    <a href="#" class="text-muted me-3" title="GitHub">
                        <i class="fab fa-github"></i>
                    </a>
                    <a href="#" class="text-muted me-3" title="微博">
                        <i class="fab fa-weibo"></i>
                    </a>
                    <a href="#" class="text-muted" title="微信">
                        <i class="fab fa-weixin"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
</footer>
```

## 7.5 学生管理页面实现

### 学生列表页面

```html
<!-- views/students/index.ejs -->
<% 
    // 设置页面变量
    const title = '学生管理';
    const pageTitle = '学生列表';
    const pageIcon = 'fas fa-users';
    const breadcrumbs = [
        { name: '首页', url: '/', icon: 'fas fa-home' },
        { name: '学生管理', url: '/students', icon: 'fas fa-users' },
        { name: '学生列表' }
    ];
    
    // 页面操作按钮
    const pageActions = `
        <a href="/students/new" class="btn btn-primary">
            <i class="fas fa-plus"></i> 添加学生
        </a>
        <button type="button" class="btn btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#importModal">
            <i class="fas fa-upload"></i> 批量导入
        </button>
    `;
%>

<%- include('../layout', { 
    title, 
    pageTitle, 
    pageIcon, 
    breadcrumbs, 
    pageActions,
    body: `
        <!-- 搜索和筛选 -->
        <div class="card mb-4">
            <div class="card-body">
                <form method="GET" action="/students" class="row g-3">
                    <div class="col-md-4">
                        <label for="search" class="form-label">搜索</label>
                        <input type="text" class="form-control" id="search" name="search" 
                               placeholder="姓名、邮箱或学号" value="${search || ''}">
                    </div>
                    
                    <div class="col-md-2">
                        <label for="status" class="form-label">状态</label>
                        <select class="form-select" id="status" name="status">
                            <option value="">全部状态</option>
                            <option value="active" ${status === 'active' ? 'selected' : ''}>活跃</option>
                            <option value="inactive" ${status === 'inactive' ? 'selected' : ''}>非活跃</option>
                            <option value="graduated" ${status === 'graduated' ? 'selected' : ''}>已毕业</option>
                            <option value="suspended" ${status === 'suspended' ? 'selected' : ''}>已暂停</option>
                        </select>
                    </div>
                    
                    <div class="col-md-2">
                        <label for="sort" class="form-label">排序</label>
                        <select class="form-select" id="sort" name="sort">
                            <option value="createdAt" ${sort === 'createdAt' ? 'selected' : ''}>创建时间</option>
                            <option value="name" ${sort === 'name' ? 'selected' : ''}>姓名</option>
                            <option value="email" ${sort === 'email' ? 'selected' : ''}>邮箱</option>
                            <option value="age" ${sort === 'age' ? 'selected' : ''}>年龄</option>
                        </select>
                    </div>
                    
                    <div class="col-md-2">
                        <label for="order" class="form-label">顺序</label>
                        <select class="form-select" id="order" name="order">
                            <option value="DESC" ${order === 'DESC' ? 'selected' : ''}>降序</option>
                            <option value="ASC" ${order === 'ASC' ? 'selected' : ''}>升序</option>
                        </select>
                    </div>
                    
                    <div class="col-md-2">
                        <label class="form-label">&nbsp;</label>
                        <div class="d-grid">
                            <button type="submit" class="btn btn-outline-primary">
                                <i class="fas fa-search"></i> 搜索
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- 统计信息 -->
        ${statistics ? `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title text-primary">${statistics.total}</h5>
                            <p class="card-text">总学生数</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title text-success">${statistics.active}</h5>
                            <p class="card-text">活跃学生</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title text-info">${statistics.graduated}</h5>
                            <p class="card-text">已毕业</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title text-warning">${statistics.averageAge}</h5>
                            <p class="card-text">平均年龄</p>
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}
        
        <!-- 学生列表 -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">学生列表</h5>
                <div>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="toggleView('table')">
                        <i class="fas fa-table"></i> 表格视图
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="toggleView('card')">
                        <i class="fas fa-th"></i> 卡片视图
                    </button>
                </div>
            </div>
            
            <div class="card-body">
                ${students && students.length > 0 ? `
                    <!-- 表格视图 -->
                    <div id="table-view" class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>
                                        <input type="checkbox" id="selectAll" class="form-check-input">
                                    </th>
                                    <th>头像</th>
                                    <th>学号</th>
                                    <th>姓名</th>
                                    <th>邮箱</th>
                                    <th>年龄</th>
                                    <th>状态</th>
                                    <th>创建时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${students.map(student => `
                                    <tr>
                                        <td>
                                            <input type="checkbox" class="form-check-input student-checkbox" 
                                                   value="${student.id}">
                                        </td>
                                        <td>
                                            ${student.avatar ? 
                                                `<img src="${student.avatar}" alt="${student.name}" 
                                                     class="rounded-circle" width="40" height="40">` :
                                                `<div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center" 
                                                     style="width: 40px; height: 40px; color: white;">
                                                    ${student.name.charAt(0).toUpperCase()}
                                                 </div>`
                                            }
                                        </td>
                                        <td><code>${student.studentId || '-'}</code></td>
                                        <td>
                                            <a href="/students/${student.id}" class="text-decoration-none">
                                                ${student.name}
                                            </a>
                                        </td>
                                        <td>${student.email}</td>
                                        <td>${student.age || '-'}</td>
                                        <td>
                                            <span class="badge ${
                                                student.status === 'active' ? 'bg-success' :
                                                student.status === 'inactive' ? 'bg-warning' :
                                                student.status === 'graduated' ? 'bg-info' :
                                                'bg-danger'
                                            }">
                                                ${
                                                    student.status === 'active' ? '活跃' :
                                                    student.status === 'inactive' ? '非活跃' :
                                                    student.status === 'graduated' ? '已毕业' :
                                                    '已暂停'
                                                }
                                            </span>
                                        </td>
                                        <td>${formatDate(student.createdAt)}</td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <a href="/students/${student.id}" class="btn btn-outline-info" title="查看">
                                                    <i class="fas fa-eye"></i>
                                                </a>
                                                <a href="/students/${student.id}/edit" class="btn btn-outline-primary" title="编辑">
                                                    <i class="fas fa-edit"></i>
                                                </a>
                                                <button type="button" class="btn btn-outline-danger" 
                                                        onclick="deleteStudent(${student.id}, '${student.name}')" title="删除">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- 卡片视图 -->
                    <div id="card-view" class="row" style="display: none;">
                        ${students.map(student => `
                            <div class="col-md-6 col-lg-4 mb-3">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <div class="d-flex align-items-center mb-3">
                                            ${student.avatar ? 
                                                `<img src="${student.avatar}" alt="${student.name}" 
                                                     class="rounded-circle me-3" width="50" height="50">` :
                                                `<div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                     style="width: 50px; height: 50px; color: white;">
                                                    ${student.name.charAt(0).toUpperCase()}
                                                 </div>`
                                            }
                                            <div>
                                                <h6 class="card-title mb-1">${student.name}</h6>
                                                <small class="text-muted">${student.studentId || '未分配学号'}</small>
                                            </div>
                                        </div>
                                        
                                        <p class="card-text">
                                            <i class="fas fa-envelope text-muted"></i> ${student.email}<br>
                                            ${student.age ? `<i class="fas fa-birthday-cake text-muted"></i> ${student.age}岁<br>` : ''}
                                            <span class="badge ${
                                                student.status === 'active' ? 'bg-success' :
                                                student.status === 'inactive' ? 'bg-warning' :
                                                student.status === 'graduated' ? 'bg-info' :
                                                'bg-danger'
                                            }">
                                                ${
                                                    student.status === 'active' ? '活跃' :
                                                    student.status === 'inactive' ? '非活跃' :
                                                    student.status === 'graduated' ? '已毕业' :
                                                    '已暂停'
                                                }
                                            </span>
                                        </p>
                                    </div>
                                    
                                    <div class="card-footer">
                                        <div class="btn-group w-100">
                                            <a href="/students/${student.id}" class="btn btn-outline-info btn-sm">
                                                <i class="fas fa-eye"></i> 查看
                                            </a>
                                            <a href="/students/${student.id}/edit" class="btn btn-outline-primary btn-sm">
                                                <i class="fas fa-edit"></i> 编辑
                                            </a>
                                            <button type="button" class="btn btn-outline-danger btn-sm" 
                                                    onclick="deleteStudent(${student.id}, '${student.name}')">
                                                <i class="fas fa-trash"></i> 删除
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-5">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">暂无学生数据</h5>
                        <p class="text-muted">点击上方"添加学生"按钮开始添加学生信息</p>
                        <a href="/students/new" class="btn btn-primary">
                            <i class="fas fa-plus"></i> 添加第一个学生
                        </a>
                    </div>
                `}
            </div>
            
            <!-- 分页 -->
            ${pagination && pagination.totalPages > 1 ? `
                <div class="card-footer">
                    <nav aria-label="学生列表分页">
                        <ul class="pagination justify-content-center mb-0">
                            <!-- 上一页 -->
                            <li class="page-item ${!pagination.hasPrevPage ? 'disabled' : ''}">
                                <a class="page-link" href="?page=${pagination.currentPage - 1}&${new URLSearchParams(Object.fromEntries(Object.entries({search, status, sort, order}).filter(([k, v]) => v))).toString()}">
                                    <i class="fas fa-chevron-left"></i> 上一页
                                </a>
                            </li>
                            
                            <!-- 页码 -->
                            ${Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
                                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.currentPage - 2)) + i;
                                return `
                                    <li class="page-item ${pageNum === pagination.currentPage ? 'active' : ''}">
                                        <a class="page-link" href="?page=${pageNum}&${new URLSearchParams(Object.fromEntries(Object.entries({search, status, sort, order}).filter(([k, v]) => v))).toString()}">
                                            ${pageNum}
                                        </a>
                                    </li>
                                `;
                            }).join('')}
                            
                            <!-- 下一页 -->
                            <li class="page-item ${!pagination.hasNextPage ? 'disabled' : ''}">
                                <a class="page-link" href="?page=${pagination.currentPage + 1}&${new URLSearchParams(Object.fromEntries(Object.entries({search, status, sort, order}).filter(([k, v]) => v))).toString()}">
                                    下一页 <i class="fas fa-chevron-right"></i>
                                </a>
                            </li>
                        </ul>
                    </nav>
                    
                    <div class="text-center mt-2">
                        <small class="text-muted">
                            显示第 ${(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - 
                            ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} 条，
                            共 ${pagination.totalItems} 条记录
                        </small>
                    </div>
                </div>
            ` : ''}
        </div>
        
        <!-- 批量操作工具栏 -->
        <div id="bulk-actions" class="position-fixed bottom-0 start-50 translate-middle-x bg-primary text-white p-3 rounded-top" style="display: none; z-index: 1050;">
            <div class="d-flex align-items-center">
                <span class="me-3">已选择 <span id="selected-count">0</span> 个学生</span>
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-light" onclick="bulkUpdateStatus()">
                        <i class="fas fa-edit"></i> 批量更新状态
                    </button>
                    <button type="button" class="btn btn-light" onclick="bulkExport()">
                        <i class="fas fa-download"></i> 导出选中
                    </button>
                    <button type="button" class="btn btn-danger" onclick="bulkDelete()">
                        <i class="fas fa-trash"></i> 批量删除
                    </button>
                </div>
                <button type="button" class="btn btn-sm btn-outline-light ms-3" onclick="clearSelection()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `
}) %>

<!-- 页面特定脚本 -->
<script>
// 视图切换
function toggleView(viewType) {
    const tableView = document.getElementById('table-view');
    const cardView = document.getElementById('card-view');
    
    if (viewType === 'table') {
        tableView.style.display = 'block';
        cardView.style.display = 'none';
        localStorage.setItem('studentViewType', 'table');
    } else {
        tableView.style.display = 'none';
        cardView.style.display = 'block';
        localStorage.setItem('studentViewType', 'card');
    }
}

// 恢复用户偏好的视图类型
const savedViewType = localStorage.getItem('studentViewType');
if (savedViewType) {
    toggleView(savedViewType);
}

// 全选/取消全选
document.getElementById('selectAll')?.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
    updateBulkActions();
});

// 监听单个复选框变化
document.querySelectorAll('.student-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateBulkActions);
});

// 更新批量操作工具栏
function updateBulkActions() {
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    const bulkActions = document.getElementById('bulk-actions');
    const selectedCount = document.getElementById('selected-count');
    
    if (checkedBoxes.length > 0) {
        bulkActions.style.display = 'block';
        selectedCount.textContent = checkedBoxes.length;
    } else {
        bulkActions.style.display = 'none';
    }
}

// 删除学生
function deleteStudent(id, name) {
    if (confirm(`确定要删除学生 "${name}" 吗？此操作不可恢复。`)) {
        fetch(`/students/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert('删除失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('删除失败:', error);
            alert('删除失败，请稍后重试');
        });
    }
}

// 批量删除
function bulkDelete() {
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    const ids = Array.from(checkedBoxes).map(cb => cb.value);
    
    if (confirm(`确定要删除选中的 ${ids.length} 个学生吗？此操作不可恢复。`)) {
        fetch('/students/bulk-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ ids })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert('批量删除失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('批量删除失败:', error);
            alert('批量删除失败，请稍后重试');
        });
    }
}

// 清除选择
function clearSelection() {
    document.querySelectorAll('.student-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('selectAll').checked = false;
    updateBulkActions();
}
</script>
```

### 学生详情页面

```html
<!-- views/students/show.ejs -->
<% 
    const title = `${student.name} - 学生详情`;
    const pageTitle = student.name;
    const pageSubtitle = student.studentId || '学生详情';
    const pageIcon = 'fas fa-user';
    const breadcrumbs = [
        { name: '首页', url: '/', icon: 'fas fa-home' },
        { name: '学生管理', url: '/students', icon: 'fas fa-users' },
        { name: student.name }
    ];
    
    const pageActions = `
        <div class="btn-group">
            <a href="/students/${student.id}/edit" class="btn btn-primary">
                <i class="fas fa-edit"></i> 编辑
            </a>
            <button type="button" class="btn btn-outline-danger" 
                    onclick="deleteStudent(${student.id}, '${student.name}')">
                <i class="fas fa-trash"></i> 删除
            </button>
        </div>
    `;
%>

<%- include('../layout', { 
    title, 
    pageTitle, 
    pageSubtitle, 
    pageIcon, 
    breadcrumbs, 
    pageActions,
    body: `
        <div class="row">
            <!-- 基本信息 -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        ${student.avatar ? 
                            `<img src="${student.avatar}" alt="${student.name}" 
                                 class="rounded-circle mb-3" width="120" height="120">` :
                            `<div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                                 style="width: 120px; height: 120px; color: white; font-size: 48px;">
                                ${student.name.charAt(0).toUpperCase()}
                             </div>`
                        }
                        
                        <h4>${student.name}</h4>
                        <p class="text-muted">${student.studentId || '未分配学号'}</p>
                        
                        <span class="badge ${
                            student.status === 'active' ? 'bg-success' :
                            student.status === 'inactive' ? 'bg-warning' :
                            student.status === 'graduated' ? 'bg-info' :
                            'bg-danger'
                        } fs-6">
                            ${
                                student.status === 'active' ? '活跃' :
                                student.status === 'inactive' ? '非活跃' :
                                student.status === 'graduated' ? '已毕业' :
                                '已暂停'
                            }
                        </span>
                    </div>
                </div>
                
                <!-- 快速操作 -->
                <div class="card mt-3">
                    <div class="card-header">
                        <h6 class="mb-0">快速操作</h6>
                    </div>
                    <div class="list-group list-group-flush">
                        <a href="mailto:${student.email}" class="list-group-item list-group-item-action">
                            <i class="fas fa-envelope text-primary"></i> 发送邮件
                        </a>
                        <a href="/students/${student.id}/courses" class="list-group-item list-group-item-action">
                            <i class="fas fa-book text-info"></i> 查看课程
                        </a>
                        <a href="/students/${student.id}/grades" class="list-group-item list-group-item-action">
                            <i class="fas fa-chart-line text-success"></i> 查看成绩
                        </a>
                        <a href="/students/${student.id}/attendance" class="list-group-item list-group-item-action">
                            <i class="fas fa-calendar-check text-warning"></i> 考勤记录
                        </a>
                    </div>
                </div>
            </div>
            
            <!-- 详细信息 -->
            <div class="col-md-8">
                <!-- 基本信息标签页 -->
                <div class="card">
                    <div class="card-header">
                        <ul class="nav nav-tabs card-header-tabs" role="tablist">
                            <li class="nav-item">
                                <a class="nav-link active" data-bs-toggle="tab" href="#basic-info" role="tab">
                                    <i class="fas fa-user"></i> 基本信息
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-bs-toggle="tab" href="#academic-info" role="tab">
                                    <i class="fas fa-graduation-cap"></i> 学术信息
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-bs-toggle="tab" href="#contact-info" role="tab">
                                    <i class="fas fa-address-book"></i> 联系信息
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-bs-toggle="tab" href="#activity-log" role="tab">
                                    <i class="fas fa-history"></i> 活动日志
                                </a>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="card-body">
                        <div class="tab-content">
                            <!-- 基本信息 -->
                            <div class="tab-pane fade show active" id="basic-info" role="tabpanel">
                                <div class="row">
                                    <div class="col-md-6">
                                        <dl class="row">
                                            <dt class="col-sm-4">姓名：</dt>
                                            <dd class="col-sm-8">${student.name}</dd>
                                            
                                            <dt class="col-sm-4">学号：</dt>
                                            <dd class="col-sm-8">
                                                ${student.studentId ? `<code>${student.studentId}</code>` : '<span class="text-muted">未分配</span>'}
                                            </dd>
                                            
                                            <dt class="col-sm-4">邮箱：</dt>
                                            <dd class="col-sm-8">
                                                <a href="mailto:${student.email}">${student.email}</a>
                                            </dd>
                                            
                                            <dt class="col-sm-4">年龄：</dt>
                                            <dd class="col-sm-8">${student.age || '<span class="text-muted">未填写</span>'}</dd>
                                            
                                            <dt class="col-sm-4">性别：</dt>
                                            <dd class="col-sm-8">
                                                ${student.gender === 'male' ? '男' : 
                                                  student.gender === 'female' ? '女' : 
                                                  '<span class="text-muted">未填写</span>'}
                                            </dd>
                                        </dl>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <dl class="row">
                                            <dt class="col-sm-4">出生日期：</dt>
                                            <dd class="col-sm-8">
                                                ${student.birthDate ? formatDate(student.birthDate) : '<span class="text-muted">未填写</span>'}
                                            </dd>
                                            
                                            <dt class="col-sm-4">入学时间：</dt>
                                            <dd class="col-sm-8">
                                                ${student.enrollmentDate ? formatDate(student.enrollmentDate) : '<span class="text-muted">未填写</span>'}
                                            </dd>
                                            
                                            <dt class="col-sm-4">状态：</dt>
                                            <dd class="col-sm-8">
                                                <span class="badge ${
                                                    student.status === 'active' ? 'bg-success' :
                                                    student.status === 'inactive' ? 'bg-warning' :
                                                    student.status === 'graduated' ? 'bg-info' :
                                                    'bg-danger'
                                                }">
                                                    ${
                                                        student.status === 'active' ? '活跃' :
                                                        student.status === 'inactive' ? '非活跃' :
                                                        student.status === 'graduated' ? '已毕业' :
                                                        '已暂停'
                                                    }
                                                </span>
                                            </dd>
                                            
                                            <dt class="col-sm-4">创建时间：</dt>
                                            <dd class="col-sm-8">${formatDate(student.createdAt)}</dd>
                                            
                                            <dt class="col-sm-4">更新时间：</dt>
                                            <dd class="col-sm-8">${formatDate(student.updatedAt)}</dd>
                                        </dl>
                                    </div>
                                </div>
                                
                                ${student.bio ? `
                                    <hr>
                                    <h6>个人简介</h6>
                                    <p class="text-muted">${student.bio}</p>
                                ` : ''}
                            </div>
                            
                            <!-- 学术信息 -->
                            <div class="tab-pane fade" id="academic-info" role="tabpanel">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>学术统计</h6>
                                        <dl class="row">
                                            <dt class="col-sm-6">专业：</dt>
                                            <dd class="col-sm-6">${student.major || '<span class="text-muted">未设置</span>'}</dd>
                                            
                                            <dt class="col-sm-6">年级：</dt>
                                            <dd class="col-sm-6">${student.grade || '<span class="text-muted">未设置</span>'}</dd>
                                            
                                            <dt class="col-sm-6">班级：</dt>
                                            <dd class="col-sm-6">${student.class || '<span class="text-muted">未设置</span>'}</dd>
                                            
                                            <dt class="col-sm-6">GPA：</dt>
                                            <dd class="col-sm-6">
                                                ${student.gpa ? 
                                                    `<span class="badge ${
                                                        student.gpa >= 3.5 ? 'bg-success' :
                                                        student.gpa >= 3.0 ? 'bg-info' :
                                                        student.gpa >= 2.5 ? 'bg-warning' :
                                                        'bg-danger'
                                                    }">${student.gpa}</span>` :
                                                    '<span class="text-muted">未计算</span>'
                                                }
                                            </dd>
                                        </dl>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <h6>课程统计</h6>
                                        ${student.courseStats ? `
                                            <dl class="row">
                                                <dt class="col-sm-6">已选课程：</dt>
                                                <dd class="col-sm-6">${student.courseStats.enrolled || 0}</dd>
                                                
                                                <dt class="col-sm-6">已完成：</dt>
                                                <dd class="col-sm-6">${student.courseStats.completed || 0}</dd>
                                                
                                                <dt class="col-sm-6">进行中：</dt>
                                                <dd class="col-sm-6">${student.courseStats.inProgress || 0}</dd>
                                                
                                                <dt class="col-sm-6">总学分：</dt>
                                                <dd class="col-sm-6">${student.courseStats.totalCredits || 0}</dd>
                                            </dl>
                                        ` : '<p class="text-muted">暂无课程数据</p>'}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 联系信息 -->
                            <div class="tab-pane fade" id="contact-info" role="tabpanel">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>个人联系方式</h6>
                                        <dl class="row">
                                            <dt class="col-sm-4">手机：</dt>
                                            <dd class="col-sm-8">
                                                ${student.phone ? 
                                                    `<a href="tel:${student.phone}">${student.phone}</a>` :
                                                    '<span class="text-muted">未填写</span>'
                                                }
                                            </dd>
                                            
                                            <dt class="col-sm-4">地址：</dt>
                                            <dd class="col-sm-8">${student.address || '<span class="text-muted">未填写</span>'}</dd>
                                            
                                            <dt class="col-sm-4">邮编：</dt>
                                            <dd class="col-sm-8">${student.zipCode || '<span class="text-muted">未填写</span>'}</dd>
                                        </dl>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <h6>紧急联系人</h6>
                                        ${student.emergencyContact ? `
                                            <dl class="row">
                                                <dt class="col-sm-4">姓名：</dt>
                                                <dd class="col-sm-8">${student.emergencyContact.name}</dd>
                                                
                                                <dt class="col-sm-4">关系：</dt>
                                                <dd class="col-sm-8">${student.emergencyContact.relationship}</dd>
                                                
                                                <dt class="col-sm-4">电话：</dt>
                                                <dd class="col-sm-8">
                                                    <a href="tel:${student.emergencyContact.phone}">${student.emergencyContact.phone}</a>
                                                </dd>
                                            </dl>
                                        ` : '<p class="text-muted">未填写紧急联系人信息</p>'}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 活动日志 -->
                            <div class="tab-pane fade" id="activity-log" role="tabpanel">
                                ${student.activityLog && student.activityLog.length > 0 ? `
                                    <div class="timeline">
                                        ${student.activityLog.map(log => `
                                            <div class="timeline-item">
                                                <div class="timeline-marker ${
                                                    log.type === 'create' ? 'bg-success' :
                                                    log.type === 'update' ? 'bg-info' :
                                                    log.type === 'delete' ? 'bg-danger' :
                                                    'bg-secondary'
                                                }"></div>
                                                <div class="timeline-content">
                                                    <h6 class="timeline-title">${log.action}</h6>
                                                    <p class="timeline-description">${log.description}</p>
                                                    <small class="text-muted">
                                                        ${formatDate(log.createdAt)} 
                                                        ${log.user ? `by ${log.user.name}` : ''}
                                                    </small>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<p class="text-muted">暂无活动记录</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}) %>

<style>
.timeline {
    position: relative;
    padding-left: 30px;
}

.timeline::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #dee2e6;
}

.timeline-item {
    position: relative;
    margin-bottom: 20px;
}

.timeline-marker {
    position: absolute;
    left: -23px;
    top: 5px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #fff;
}

.timeline-content {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    border-left: 3px solid #007bff;
}

.timeline-title {
    margin-bottom: 5px;
    font-size: 14px;
    font-weight: 600;
}

.timeline-description {
    margin-bottom: 5px;
    font-size: 13px;
    color: #6c757d;
}
</style>

<script>
function deleteStudent(id, name) {
    if (confirm(`确定要删除学生 "${name}" 吗？此操作不可恢复。`)) {
        fetch(`/students/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/students';
            } else {
                alert('删除失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('删除失败:', error);
            alert('删除失败，请稍后重试');
        });
    }
}
</script>
```

## 7.6 表单处理和数据验证

### 学生表单组件

```html
<!-- views/students/form.ejs -->
<div class="card">
    <div class="card-header">
        <h5 class="mb-0">
            <i class="<%= student && student.id ? 'fas fa-edit' : 'fas fa-plus' %>"></i>
            <%= student && student.id ? '编辑学生' : '添加学生' %>
        </h5>
    </div>
    
    <div class="card-body">
        <form action="<%= student && student.id ? `/students/${student.id}` : '/students' %>" 
              method="POST" enctype="multipart/form-data" id="studentForm" novalidate>
            
            <% if (student && student.id) { %>
                <input type="hidden" name="_method" value="PUT">
            <% } %>
            
            <!-- 基本信息 -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3">
                        <i class="fas fa-user text-primary"></i> 基本信息
                    </h6>
                </div>
                
                <!-- 头像上传 -->
                <div class="col-md-12 mb-3">
                    <label class="form-label">头像</label>
                    <div class="d-flex align-items-center">
                        <div class="avatar-preview me-3">
                            <% if (student && student.avatar) { %>
                                <img src="<%= student.avatar %>" alt="头像预览" 
                                     class="rounded-circle" width="80" height="80" id="avatarPreview">
                            <% } else { %>
                                <div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center" 
                                     style="width: 80px; height: 80px; color: white; font-size: 32px;" id="avatarPreview">
                                    <i class="fas fa-user"></i>
                                </div>
                            <% } %>
                        </div>
                        <div>
                            <input type="file" class="form-control" id="avatar" name="avatar" 
                                   accept="image/*" onchange="previewAvatar(this)">
                            <small class="form-text text-muted">
                                支持 JPG、PNG、GIF 格式，文件大小不超过 2MB
                            </small>
                        </div>
                    </div>
                </div>
                
                <!-- 姓名 -->
                <div class="col-md-6 mb-3">
                    <label for="name" class="form-label">姓名 <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="name" name="name" 
                           value="<%= student && student.name ? student.name : '' %>" 
                           required maxlength="50">
                    <div class="invalid-feedback">请输入学生姓名</div>
                </div>
                
                <!-- 学号 -->
                <div class="col-md-6 mb-3">
                    <label for="studentId" class="form-label">学号</label>
                    <input type="text" class="form-control" id="studentId" name="studentId" 
                           value="<%= student && student.studentId ? student.studentId : '' %>" 
                           maxlength="20" pattern="[A-Za-z0-9]+">
                    <small class="form-text text-muted">留空将自动生成</small>
                    <div class="invalid-feedback">学号只能包含字母和数字</div>
                </div>
                
                <!-- 邮箱 -->
                <div class="col-md-6 mb-3">
                    <label for="email" class="form-label">邮箱 <span class="text-danger">*</span></label>
                    <input type="email" class="form-control" id="email" name="email" 
                           value="<%= student && student.email ? student.email : '' %>" 
                           required maxlength="100">
                    <div class="invalid-feedback">请输入有效的邮箱地址</div>
                </div>
                
                <!-- 年龄 -->
                <div class="col-md-6 mb-3">
                    <label for="age" class="form-label">年龄</label>
                    <input type="number" class="form-control" id="age" name="age" 
                           value="<%= student && student.age ? student.age : '' %>" 
                           min="16" max="100">
                    <div class="invalid-feedback">年龄必须在 16-100 之间</div>
                </div>
                
                <!-- 性别 -->
                <div class="col-md-6 mb-3">
                    <label for="gender" class="form-label">性别</label>
                    <select class="form-select" id="gender" name="gender">
                        <option value="">请选择</option>
                        <option value="male" <%= student && student.gender === 'male' ? 'selected' : '' %>>男</option>
                        <option value="female" <%= student && student.gender === 'female' ? 'selected' : '' %>>女</option>
                    </select>
                </div>
                
                <!-- 出生日期 -->
                <div class="col-md-6 mb-3">
                    <label for="birthDate" class="form-label">出生日期</label>
                    <input type="date" class="form-control" id="birthDate" name="birthDate" 
                           value="<%= student && student.birthDate ? student.birthDate.toISOString().split('T')[0] : '' %>">
                </div>
            </div>
            
            <!-- 学术信息 -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3">
                        <i class="fas fa-graduation-cap text-primary"></i> 学术信息
                    </h6>
                </div>
                
                <!-- 专业 -->
                <div class="col-md-4 mb-3">
                    <label for="major" class="form-label">专业</label>
                    <select class="form-select" id="major" name="major">
                        <option value="">请选择专业</option>
                        <option value="计算机科学" <%= student && student.major === '计算机科学' ? 'selected' : '' %>>计算机科学</option>
                        <option value="软件工程" <%= student && student.major === '软件工程' ? 'selected' : '' %>>软件工程</option>
                        <option value="信息管理" <%= student && student.major === '信息管理' ? 'selected' : '' %>>信息管理</option>
                        <option value="数据科学" <%= student && student.major === '数据科学' ? 'selected' : '' %>>数据科学</option>
                        <option value="网络工程" <%= student && student.major === '网络工程' ? 'selected' : '' %>>网络工程</option>
                    </select>
                </div>
                
                <!-- 年级 -->
                <div class="col-md-4 mb-3">
                    <label for="grade" class="form-label">年级</label>
                    <select class="form-select" id="grade" name="grade">
                        <option value="">请选择年级</option>
                        <option value="大一" <%= student && student.grade === '大一' ? 'selected' : '' %>>大一</option>
                        <option value="大二" <%= student && student.grade === '大二' ? 'selected' : '' %>>大二</option>
                        <option value="大三" <%= student && student.grade === '大三' ? 'selected' : '' %>>大三</option>
                        <option value="大四" <%= student && student.grade === '大四' ? 'selected' : '' %>>大四</option>
                        <option value="研一" <%= student && student.grade === '研一' ? 'selected' : '' %>>研一</option>
                        <option value="研二" <%= student && student.grade === '研二' ? 'selected' : '' %>>研二</option>
                        <option value="研三" <%= student && student.grade === '研三' ? 'selected' : '' %>>研三</option>
                    </select>
                </div>
                
                <!-- 班级 -->
                <div class="col-md-4 mb-3">
                    <label for="class" class="form-label">班级</label>
                    <input type="text" class="form-control" id="class" name="class" 
                           value="<%= student && student.class ? student.class : '' %>" 
                           maxlength="20" placeholder="如：计科2021-1班">
                </div>
                
                <!-- 入学时间 -->
                <div class="col-md-6 mb-3">
                    <label for="enrollmentDate" class="form-label">入学时间</label>
                    <input type="date" class="form-control" id="enrollmentDate" name="enrollmentDate" 
                           value="<%= student && student.enrollmentDate ? student.enrollmentDate.toISOString().split('T')[0] : '' %>">
                </div>
                
                <!-- 状态 -->
                <div class="col-md-6 mb-3">
                    <label for="status" class="form-label">状态</label>
                    <select class="form-select" id="status" name="status">
                        <option value="active" <%= !student || student.status === 'active' ? 'selected' : '' %>>活跃</option>
                        <option value="inactive" <%= student && student.status === 'inactive' ? 'selected' : '' %>>非活跃</option>
                        <option value="graduated" <%= student && student.status === 'graduated' ? 'selected' : '' %>>已毕业</option>
                        <option value="suspended" <%= student && student.status === 'suspended' ? 'selected' : '' %>>已暂停</option>
                    </select>
                </div>
            </div>
            
            <!-- 联系信息 -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3">
                        <i class="fas fa-address-book text-primary"></i> 联系信息
                    </h6>
                </div>
                
                <!-- 手机号 -->
                <div class="col-md-6 mb-3">
                    <label for="phone" class="form-label">手机号</label>
                    <input type="tel" class="form-control" id="phone" name="phone" 
                           value="<%= student && student.phone ? student.phone : '' %>" 
                           pattern="[0-9]{11}" maxlength="11">
                    <div class="invalid-feedback">请输入有效的手机号码</div>
                </div>
                
                <!-- 地址 -->
                <div class="col-md-6 mb-3">
                    <label for="address" class="form-label">地址</label>
                    <input type="text" class="form-control" id="address" name="address" 
                           value="<%= student && student.address ? student.address : '' %>" 
                           maxlength="200">
                </div>
                
                <!-- 邮编 -->
                <div class="col-md-6 mb-3">
                    <label for="zipCode" class="form-label">邮编</label>
                    <input type="text" class="form-control" id="zipCode" name="zipCode" 
                           value="<%= student && student.zipCode ? student.zipCode : '' %>" 
                           pattern="[0-9]{6}" maxlength="6">
                    <div class="invalid-feedback">请输入6位数字邮编</div>
                </div>
            </div>
            
            <!-- 紧急联系人 -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3">
                        <i class="fas fa-phone text-primary"></i> 紧急联系人
                    </h6>
                </div>
                
                <!-- 紧急联系人姓名 -->
                <div class="col-md-4 mb-3">
                    <label for="emergencyContactName" class="form-label">姓名</label>
                    <input type="text" class="form-control" id="emergencyContactName" name="emergencyContact[name]" 
                           value="<%= student && student.emergencyContact ? student.emergencyContact.name : '' %>" 
                           maxlength="50">
                </div>
                
                <!-- 关系 -->
                <div class="col-md-4 mb-3">
                    <label for="emergencyContactRelationship" class="form-label">关系</label>
                    <select class="form-select" id="emergencyContactRelationship" name="emergencyContact[relationship]">
                        <option value="">请选择关系</option>
                        <option value="父亲" <%= student && student.emergencyContact && student.emergencyContact.relationship === '父亲' ? 'selected' : '' %>>父亲</option>
                        <option value="母亲" <%= student && student.emergencyContact && student.emergencyContact.relationship === '母亲' ? 'selected' : '' %>>母亲</option>
                        <option value="配偶" <%= student && student.emergencyContact && student.emergencyContact.relationship === '配偶' ? 'selected' : '' %>>配偶</option>
                        <option value="兄弟" <%= student && student.emergencyContact && student.emergencyContact.relationship === '兄弟' ? 'selected' : '' %>>兄弟</option>
                        <option value="姐妹" <%= student && student.emergencyContact && student.emergencyContact.relationship === '姐妹' ? 'selected' : '' %>>姐妹</option>
                        <option value="朋友" <%= student && student.emergencyContact && student.emergencyContact.relationship === '朋友' ? 'selected' : '' %>>朋友</option>
                        <option value="其他" <%= student && student.emergencyContact && student.emergencyContact.relationship === '其他' ? 'selected' : '' %>>其他</option>
                    </select>
                </div>
                
                <!-- 紧急联系人电话 -->
                <div class="col-md-4 mb-3">
                    <label for="emergencyContactPhone" class="form-label">电话</label>
                    <input type="tel" class="form-control" id="emergencyContactPhone" name="emergencyContact[phone]" 
                           value="<%= student && student.emergencyContact ? student.emergencyContact.phone : '' %>" 
                           pattern="[0-9]{11}" maxlength="11">
                    <div class="invalid-feedback">请输入有效的电话号码</div>
                </div>
            </div>
            
            <!-- 个人简介 -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3">
                        <i class="fas fa-info-circle text-primary"></i> 个人简介
                    </h6>
                </div>
                
                <div class="col-12 mb-3">
                    <label for="bio" class="form-label">个人简介</label>
                    <textarea class="form-control" id="bio" name="bio" rows="4" 
                              maxlength="500" placeholder="请简要介绍学生的背景、特长、兴趣等..."><%= student && student.bio ? student.bio : '' %></textarea>
                    <small class="form-text text-muted">
                        <span id="bioCount">0</span>/500 字符
                    </small>
                </div>
            </div>
            
            <!-- 提交按钮 -->
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between">
                        <a href="/students" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i> 返回列表
                        </a>
                        
                        <div>
                            <button type="button" class="btn btn-outline-secondary me-2" onclick="resetForm()">
                                <i class="fas fa-undo"></i> 重置
                            </button>
                            <button type="submit" class="btn btn-primary" id="submitBtn">
                                <i class="fas fa-save"></i> 
                                <%= student && student.id ? '更新学生' : '添加学生' %>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</div>

<!-- 表单验证和交互脚本 -->
<script>
// 头像预览
function previewAvatar(input) {
    const preview = document.getElementById('avatarPreview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="头像预览" class="rounded-circle" width="80" height="80">`;
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// 字符计数
const bioTextarea = document.getElementById('bio');
const bioCount = document.getElementById('bioCount');

function updateBioCount() {
    bioCount.textContent = bioTextarea.value.length;
}

bioTextarea.addEventListener('input', updateBioCount);
updateBioCount(); // 初始化计数

// 表单验证
const form = document.getElementById('studentForm');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', function(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // 自定义验证
    let isValid = true;
    
    // 验证邮箱唯一性（如果是新增或邮箱有变化）
    const emailInput = document.getElementById('email');
    const originalEmail = '<%= student && student.email ? student.email : "" %>';
    
    if (emailInput.value !== originalEmail) {
        // 这里可以添加 AJAX 验证邮箱唯一性的逻辑
    }
    
    // 验证年龄和出生日期的一致性
    const ageInput = document.getElementById('age');
    const birthDateInput = document.getElementById('birthDate');
    
    if (ageInput.value && birthDateInput.value) {
        const birthYear = new Date(birthDateInput.value).getFullYear();
        const currentYear = new Date().getFullYear();
        const calculatedAge = currentYear - birthYear;
        
        if (Math.abs(calculatedAge - parseInt(ageInput.value)) > 1) {
            ageInput.setCustomValidity('年龄与出生日期不匹配');
            isValid = false;
        } else {
            ageInput.setCustomValidity('');
        }
    }
    
    // Bootstrap 验证
    if (form.checkValidity() && isValid) {
        // 显示加载状态
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
        
        // 提交表单
        form.submit();
    } else {
        form.classList.add('was-validated');
    }
});

// 重置表单
function resetForm() {
    if (confirm('确定要重置表单吗？所有未保存的更改将丢失。')) {
        form.reset();
        form.classList.remove('was-validated');
        updateBioCount();
        
        // 重置头像预览
        const preview = document.getElementById('avatarPreview');
        <% if (student && student.avatar) { %>
            preview.innerHTML = '<img src="<%= student.avatar %>" alt="头像预览" class="rounded-circle" width="80" height="80">';
        <% } else { %>
            preview.innerHTML = '<div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center" style="width: 80px; height: 80px; color: white; font-size: 32px;"><i class="fas fa-user"></i></div>';
        <% } %>
    }
}

// 实时验证
const inputs = form.querySelectorAll('input, select, textarea');
inputs.forEach(input => {
    input.addEventListener('blur', function() {
        if (this.checkValidity()) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
    });
});
</script>
```

## 7.7 本章小结

通过本章学习，我们深入掌握了 EJS 模板引擎的核心概念和实际应用：

### 核心知识点

1. **EJS 基础语法**
   - 输出标签、脚本标签、注释标签
   - 变量和表达式处理
   - 控制流语句（条件、循环）

2. **模板继承和组件化**
   - 布局模板设计
   - 组件化开发（导航栏、页脚、消息提示）
   - 模板复用和维护

3. **动态数据渲染**
   - 数据绑定和显示
   - 条件渲染和列表渲染
   - 表单数据处理

4. **用户界面设计**
   - 响应式布局
   - 交互式组件
   - 用户体验优化

### 实践成果

- 创建了完整的学生管理界面
- 实现了数据的增删改查展示
- 掌握了表单验证和用户交互
- 建立了可维护的模板结构

## 7.8 课后练习

### 基础练习

1. **模板语法练习**
   - 创建一个课程列表页面
   - 实现课程的条件筛选和排序
   - 添加分页功能

2. **组件开发**
   - 创建一个可复用的数据表格组件
   - 实现一个通用的模态框组件
   - 开发一个搜索框组件

### 进阶练习

3. **表单处理**
   - 创建课程添加/编辑表单
   - 实现文件上传功能
   - 添加实时表单验证

4. **用户体验优化**
   - 实现无刷新的数据操作
   - 添加加载状态和错误处理
   - 优化移动端显示效果

### 挑战练习

5. **高级功能**
   - 实现数据的批量操作
   - 创建数据可视化图表
   - 添加主题切换功能

## 7.9 下一章预告

下一章我们将学习《前端交互和 AJAX》，内容包括：

- JavaScript 基础和 DOM 操作
- AJAX 请求和响应处理
- 前后端数据交互
- 实时数据更新
- 用户体验优化

## 7.10 学习资源

### 官方文档
- [EJS 官方文档](https://ejs.co/)
- [Express.js 模板引擎](https://expressjs.com/en/guide/using-template-engines.html)

### 推荐阅读
- 《Node.js 实战》- 模板引擎章节
- 《Express.js 实战》- 视图和模板

### 在线资源
- [EJS 在线试用](https://ionicabizau.github.io/ejs-playground/)
- [Bootstrap 5 文档](https://getbootstrap.com/docs/5.3/)

### 视频教程
- [EJS 模板引擎教程](https://www.youtube.com/results?search_query=ejs+template+engine+tutorial)
- [前端模板引擎对比](https://www.youtube.com/results?search_query=template+engines+comparison)