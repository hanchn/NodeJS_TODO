import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import flash from 'connect-flash';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize, { syncDatabase, getDatabaseInfo } from './config/database.js';
import studentRoutes from './routes/students.js';
import { setupMiddleware, errorHandler, notFoundHandler } from './middleware/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 设置自定义中间件
setupMiddleware(app);

// Session 配置
app.use(session({
  secret: process.env.SESSION_SECRET || 'student-management-system-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // 在生产环境中应设置为 true（需要 HTTPS）
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// Flash 消息中间件
app.use(flash());

// 设置模板引擎
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 基础中间件
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// 全局变量中间件 - 使flash消息在所有模板中可用
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  res.locals.info = req.flash('info');
  // 添加一些有用的全局变量
  res.locals.currentUrl = req.url;
  res.locals.environment = process.env.NODE_ENV || 'development';
  next();
});

// 路由
app.use('/students', studentRoutes);

// 首页路由
app.get('/', (req, res) => {
  res.redirect('/students');
});

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 确保数据库目录存在
    const dbInfo = getDatabaseInfo();
    console.log('📊 数据库信息:', dbInfo);
    
    // 同步数据库模型
    await syncDatabase();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 数据库: ${dbInfo.database}`);
    });
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

startServer();