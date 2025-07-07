import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 请求日志中间件
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // 记录请求开始
  console.log(`📥 [${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
  
  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    console.log(`📤 [${new Date().toISOString()}] ${statusColor} ${res.statusCode} ${req.method} ${req.url} - ${duration}ms`);
  });
  
  next();
};

/**
 * 错误处理中间件
 */
export const errorHandler = (err, req, res, next) => {
  // 记录错误
  console.error('❌ 应用错误:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // 设置默认错误状态码
  const status = err.status || err.statusCode || 500;
  
  // 根据请求类型返回不同格式的错误
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    // AJAX请求返回JSON
    return res.status(status).json({
      success: false,
      message: err.message || '服务器内部错误',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    });
  }
  
  // 普通请求返回错误页面
  const errorDetails = process.env.NODE_ENV === 'development' ? {
    message: err.message,
    stack: err.stack,
    name: err.name
  } : {};
  
  res.status(status).render('error', {
    title: '服务器错误',
    message: err.message || '服务器内部错误',
    error: errorDetails,
    status
  });
};

/**
 * 404处理中间件
 */
export const notFoundHandler = (req, res) => {
  console.log(`🔍 404 - 页面未找到: ${req.method} ${req.url}`);
  
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(404).json({
      success: false,
      message: '请求的资源不存在'
    });
  }
  
  res.status(404).render('404', {
    title: '页面未找到',
    url: req.url
  });
};

/**
 * 安全头中间件
 */
export const securityHeaders = (req, res, next) => {
  // 设置安全相关的HTTP头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 在开发环境中不设置HTTPS相关头
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

/**
 * 请求体大小限制中间件
 */
export const requestSizeLimit = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    const error = new Error('请求体过大');
    error.status = 413;
    return next(error);
  }
  
  next();
};

/**
 * 请求频率限制中间件（简单实现）
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15分钟
const MAX_REQUESTS = 1000; // 最大请求数

export const rateLimit = (req, res, next) => {
  const clientId = req.ip;
  const now = Date.now();
  
  // 清理过期记录
  for (const [id, data] of requestCounts.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      requestCounts.delete(id);
    }
  }
  
  // 检查当前客户端请求频率
  const clientData = requestCounts.get(clientId);
  
  if (!clientData) {
    requestCounts.set(clientId, {
      count: 1,
      firstRequest: now
    });
  } else {
    clientData.count++;
    
    if (clientData.count > MAX_REQUESTS) {
      console.log(`🚫 请求频率限制: ${clientId} - ${clientData.count} 请求`);
      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试'
      });
    }
  }
  
  next();
};

/**
 * 健康检查中间件
 */
export const healthCheck = async (req, res) => {
  try {
    const { healthCheck: dbHealthCheck } = await import('../config/database.js');
    const dbHealth = await dbHealthCheck();
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbHealth,
      environment: process.env.NODE_ENV || 'development'
    };
    
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 验证JSON中间件
 */
export const validateJSON = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON解析错误:', err.message);
    return res.status(400).json({
      success: false,
      message: 'JSON格式错误'
    });
  }
  next(err);
};

/**
 * CORS中间件（如果需要）
 */
export const corsHandler = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * 组合所有中间件
 */
export const setupMiddleware = (app) => {
  // 安全头
  app.use(securityHeaders);
  
  // 请求日志（仅在开发环境）
  if (process.env.NODE_ENV === 'development') {
    app.use(requestLogger);
  }
  
  // 请求大小限制
  app.use(requestSizeLimit);
  
  // 请求频率限制（仅在生产环境）
  if (process.env.NODE_ENV === 'production') {
    app.use(rateLimit);
  }
  
  // JSON验证
  app.use(validateJSON);
  
  // 健康检查路由
  app.get('/health', healthCheck);
  
  console.log('✅ 中间件配置完成');
};