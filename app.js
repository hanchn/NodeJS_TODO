import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './models/index.js';
import studentRoutes from './routes/students.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 配置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use('/students', studentRoutes);

// 首页路由
app.get('/', (req, res) => {
  res.redirect('/students');
});

// 404处理
app.use((req, res) => {
  res.status(404).render('404', { title: '页面未找到' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: '服务器错误',
    error: err.message 
  });
});

// 启动服务器
async function startServer() {
  try {
    // 同步数据库
    await sequelize.sync({ force: false });
    console.log('数据库连接成功');
    
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
  }
}

startServer();