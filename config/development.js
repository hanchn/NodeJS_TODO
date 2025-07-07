/**
 * 开发环境配置文件
 */

export default {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: 'development'
  },

  // 数据库配置
  database: {
    dialect: 'sqlite',
    storage: './database/students.db',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
      charset: 'utf8mb4',
      dialectOptions: {
        collate: 'utf8mb4_unicode_ci'
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  // 会话配置
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // 开发环境使用 HTTP
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
  },

  // 安全配置
  security: {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000, // 开发环境限制较宽松
      message: '请求过于频繁，请稍后再试'
    },
    helmet: {
      contentSecurityPolicy: false, // 开发环境禁用CSP
      crossOriginEmbedderPolicy: false
    }
  },

  // 日志配置
  logging: {
    level: 'debug',
    format: 'dev',
    file: {
      enabled: false,
      filename: './logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    },
    console: {
      enabled: true,
      colorize: true
    }
  },

  // 缓存配置
  cache: {
    enabled: false, // 开发环境禁用缓存
    ttl: 300, // 5分钟
    checkperiod: 600 // 10分钟
  },

  // 文件上传配置
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['.xlsx', '.xls', '.csv'],
    uploadDir: './uploads',
    tempDir: './temp'
  },

  // 分页配置
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  },

  // 验证配置
  validation: {
    student: {
      studentId: {
        minLength: 6,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9]+$/
      },
      name: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/
      },
      age: {
        min: 16,
        max: 60
      },
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      phone: {
        pattern: /^1[3-9]\d{9}$/
      }
    }
  },

  // 功能开关
  features: {
    registration: true,
    bulkImport: true,
    dataExport: true,
    statistics: true,
    search: true,
    advancedSearch: true,
    audit: false // 开发环境禁用审计
  },

  // 第三方服务配置
  services: {
    email: {
      enabled: false,
      provider: 'console', // 开发环境使用控制台输出
      smtp: {
        host: 'localhost',
        port: 1025,
        secure: false
      }
    },
    sms: {
      enabled: false,
      provider: 'console'
    }
  },

  // 开发工具配置
  devTools: {
    hotReload: true,
    debugMode: true,
    showErrors: true,
    mockData: true,
    apiDocs: true
  }
};