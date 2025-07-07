# 第11章 测试和部署

## 11.1 章节概述

### 学习目标

通过本章学习，你将掌握：

- 单元测试和集成测试的编写
- API 测试和性能测试技术
- 测试覆盖率分析和报告
- Docker 容器化部署
- CI/CD 持续集成和部署流程
- 生产环境配置和优化
- 监控、日志和错误追踪
- 负载均衡和高可用部署

### 技术要点

- **测试框架**：Jest、Mocha、Supertest
- **测试类型**：单元测试、集成测试、端到端测试
- **容器化**：Docker、Docker Compose
- **CI/CD**：GitHub Actions、GitLab CI
- **部署平台**：AWS、阿里云、Heroku
- **监控工具**：PM2、Winston、Sentry
- **性能优化**：缓存、CDN、负载均衡

## 11.2 测试环境搭建

### Jest 测试配置

```javascript
// jest.config.js
module.exports = {
    // 测试环境
    testEnvironment: 'node',
    
    // 测试文件匹配模式
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    
    // 覆盖率收集
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/migrations/**',
        '!src/seeders/**',
        '!src/config/**'
    ],
    
    // 覆盖率报告格式
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],
    
    // 覆盖率阈值
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    
    // 测试设置文件
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    
    // 模块路径映射
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    
    // 测试超时时间
    testTimeout: 10000,
    
    // 清理模拟
    clearMocks: true,
    restoreMocks: true
};
```

### 测试环境设置

```javascript
// tests/setup.js
const { sequelize } = require('../src/models');
const redis = require('../src/config/redis');

// 测试前设置
beforeAll(async () => {
    // 设置测试环境变量
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.DB_NAME = 'student_management_test';
    
    // 同步数据库
    await sequelize.sync({ force: true });
    
    // 清理Redis
    await redis.flushdb();
});

// 每个测试前清理
beforeEach(async () => {
    // 清理数据库
    await sequelize.truncate({ cascade: true });
    
    // 清理Redis
    await redis.flushdb();
});

// 测试后清理
afterAll(async () => {
    await sequelize.close();
    await redis.quit();
});

// 全局测试工具
global.testUtils = {
    // 创建测试用户
    async createTestUser(userData = {}) {
        const { User } = require('../src/models');
        const bcrypt = require('bcrypt');
        
        const defaultUser = {
            username: 'testuser',
            email: 'test@example.com',
            password: await bcrypt.hash('password123', 10),
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
            isEmailVerified: true
        };
        
        return await User.create({ ...defaultUser, ...userData });
    },
    
    // 创建测试学生
    async createTestStudent(studentData = {}) {
        const { Student } = require('../src/models');
        
        const defaultStudent = {
            studentId: 'STU001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890',
            dateOfBirth: '1995-01-01',
            address: '123 Test St',
            enrollmentDate: new Date()
        };
        
        return await Student.create({ ...defaultStudent, ...studentData });
    },
    
    // 生成JWT令牌
    generateToken(user) {
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    }
};
```

## 11.3 单元测试

### 模型测试

```javascript
// tests/unit/models/User.test.js
const { User } = require('../../../src/models');
const bcrypt = require('bcrypt');

describe('User Model', () => {
    describe('创建用户', () => {
        test('应该成功创建有效用户', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: await bcrypt.hash('password123', 10),
                firstName: 'Test',
                lastName: 'User'
            };
            
            const user = await User.create(userData);
            
            expect(user.id).toBeDefined();
            expect(user.username).toBe(userData.username);
            expect(user.email).toBe(userData.email);
            expect(user.firstName).toBe(userData.firstName);
            expect(user.lastName).toBe(userData.lastName);
            expect(user.role).toBe('user'); // 默认角色
            expect(user.isEmailVerified).toBe(false); // 默认未验证
        });
        
        test('应该拒绝重复的用户名', async () => {
            await testUtils.createTestUser({ username: 'duplicate' });
            
            await expect(User.create({
                username: 'duplicate',
                email: 'another@example.com',
                password: await bcrypt.hash('password123', 10),
                firstName: 'Another',
                lastName: 'User'
            })).rejects.toThrow();
        });
        
        test('应该拒绝重复的邮箱', async () => {
            await testUtils.createTestUser({ email: 'duplicate@example.com' });
            
            await expect(User.create({
                username: 'anotheruser',
                email: 'duplicate@example.com',
                password: await bcrypt.hash('password123', 10),
                firstName: 'Another',
                lastName: 'User'
            })).rejects.toThrow();
        });
        
        test('应该拒绝无效的邮箱格式', async () => {
            await expect(User.create({
                username: 'testuser',
                email: 'invalid-email',
                password: await bcrypt.hash('password123', 10),
                firstName: 'Test',
                lastName: 'User'
            })).rejects.toThrow();
        });
    });
    
    describe('用户方法', () => {
        let user;
        
        beforeEach(async () => {
            user = await testUtils.createTestUser();
        });
        
        test('toJSON 应该排除敏感信息', () => {
            const userJSON = user.toJSON();
            
            expect(userJSON.password).toBeUndefined();
            expect(userJSON.id).toBeDefined();
            expect(userJSON.username).toBeDefined();
            expect(userJSON.email).toBeDefined();
        });
        
        test('应该正确验证密码', async () => {
            // 假设User模型有validatePassword方法
            const isValid = await user.validatePassword('password123');
            const isInvalid = await user.validatePassword('wrongpassword');
            
            expect(isValid).toBe(true);
            expect(isInvalid).toBe(false);
        });
    });
});
```

### 服务层测试

```javascript
// tests/unit/services/authService.test.js
const AuthService = require('../../../src/services/authService');
const { User } = require('../../../src/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 模拟邮件服务
jest.mock('../../../src/services/emailService');
const EmailService = require('../../../src/services/emailService');

describe('AuthService', () => {
    describe('register', () => {
        test('应该成功注册新用户', async () => {
            const userData = {
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User'
            };
            
            const result = await AuthService.register(userData);
            
            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(result.user.username).toBe(userData.username);
            expect(result.user.password).toBeUndefined(); // 不应返回密码
            
            // 验证用户已保存到数据库
            const savedUser = await User.findOne({ where: { username: userData.username } });
            expect(savedUser).toBeTruthy();
            
            // 验证密码已加密
            const isPasswordHashed = await bcrypt.compare(userData.password, savedUser.password);
            expect(isPasswordHashed).toBe(true);
            
            // 验证发送了验证邮件
            expect(EmailService.sendVerificationEmail).toHaveBeenCalledWith(
                userData.email,
                expect.any(String)
            );
        });
        
        test('应该拒绝已存在的用户名', async () => {
            await testUtils.createTestUser({ username: 'existing' });
            
            const result = await AuthService.register({
                username: 'existing',
                email: 'new@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User'
            });
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('用户名已存在');
        });
        
        test('应该拒绝弱密码', async () => {
            const result = await AuthService.register({
                username: 'newuser',
                email: 'newuser@example.com',
                password: '123', // 弱密码
                firstName: 'New',
                lastName: 'User'
            });
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('密码强度不足');
        });
    });
    
    describe('login', () => {
        let user;
        
        beforeEach(async () => {
            user = await testUtils.createTestUser({
                password: await bcrypt.hash('password123', 10)
            });
        });
        
        test('应该成功登录有效用户', async () => {
            const result = await AuthService.login('testuser', 'password123');
            
            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            
            // 验证JWT令牌
            const decoded = jwt.verify(result.accessToken, process.env.JWT_SECRET);
            expect(decoded.id).toBe(user.id);
        });
        
        test('应该拒绝错误的密码', async () => {
            const result = await AuthService.login('testuser', 'wrongpassword');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('用户名或密码错误');
        });
        
        test('应该拒绝不存在的用户', async () => {
            const result = await AuthService.login('nonexistent', 'password123');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('用户名或密码错误');
        });
        
        test('应该拒绝未验证邮箱的用户', async () => {
            await user.update({ isEmailVerified: false });
            
            const result = await AuthService.login('testuser', 'password123');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('请先验证邮箱');
        });
    });
    
    describe('refreshToken', () => {
        let user, refreshToken;
        
        beforeEach(async () => {
            user = await testUtils.createTestUser();
            const loginResult = await AuthService.login('testuser', 'password123');
            refreshToken = loginResult.refreshToken;
        });
        
        test('应该成功刷新令牌', async () => {
            const result = await AuthService.refreshToken(refreshToken);
            
            expect(result.success).toBe(true);
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.refreshToken).not.toBe(refreshToken); // 新的刷新令牌
        });
        
        test('应该拒绝无效的刷新令牌', async () => {
            const result = await AuthService.refreshToken('invalid-token');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('无效的刷新令牌');
        });
    });
});
```

### 工具函数测试

```javascript
// tests/unit/utils/validation.test.js
const {
    validateEmail,
    validatePassword,
    validatePhone,
    sanitizeInput
} = require('../../../src/utils/validation');

describe('Validation Utils', () => {
    describe('validateEmail', () => {
        test('应该验证有效邮箱', () => {
            const validEmails = [
                'test@example.com',
                'user.name@domain.co.uk',
                'user+tag@example.org'
            ];
            
            validEmails.forEach(email => {
                expect(validateEmail(email)).toBe(true);
            });
        });
        
        test('应该拒绝无效邮箱', () => {
            const invalidEmails = [
                'invalid-email',
                '@example.com',
                'user@',
                'user..name@example.com',
                ''
            ];
            
            invalidEmails.forEach(email => {
                expect(validateEmail(email)).toBe(false);
            });
        });
    });
    
    describe('validatePassword', () => {
        test('应该验证强密码', () => {
            const strongPasswords = [
                'Password123!',
                'MyStr0ng@Pass',
                'C0mplex#Password'
            ];
            
            strongPasswords.forEach(password => {
                const result = validatePassword(password);
                expect(result.isValid).toBe(true);
                expect(result.score).toBeGreaterThanOrEqual(3);
            });
        });
        
        test('应该拒绝弱密码', () => {
            const weakPasswords = [
                '123456',
                'password',
                'abc123',
                '12345678'
            ];
            
            weakPasswords.forEach(password => {
                const result = validatePassword(password);
                expect(result.isValid).toBe(false);
                expect(result.score).toBeLessThan(3);
            });
        });
        
        test('应该提供密码强度反馈', () => {
            const result = validatePassword('weak');
            
            expect(result.feedback).toBeDefined();
            expect(Array.isArray(result.feedback)).toBe(true);
            expect(result.feedback.length).toBeGreaterThan(0);
        });
    });
    
    describe('sanitizeInput', () => {
        test('应该清理HTML标签', () => {
            const input = '<script>alert("xss")</script>Hello World';
            const sanitized = sanitizeInput(input);
            
            expect(sanitized).toBe('Hello World');
            expect(sanitized).not.toContain('<script>');
        });
        
        test('应该保留安全的HTML标签', () => {
            const input = '<p>Hello <strong>World</strong></p>';
            const sanitized = sanitizeInput(input, { allowedTags: ['p', 'strong'] });
            
            expect(sanitized).toBe('<p>Hello <strong>World</strong></p>');
        });
        
        test('应该处理空输入', () => {
            expect(sanitizeInput('')).toBe('');
            expect(sanitizeInput(null)).toBe('');
            expect(sanitizeInput(undefined)).toBe('');
        });
    });
});
```

## 11.4 集成测试

### API 集成测试

```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');

describe('Auth API', () => {
    describe('POST /api/auth/register', () => {
        test('应该成功注册新用户', async () => {
            const userData = {
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'Password123!',
                firstName: 'New',
                lastName: 'User'
            };
            
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);
            
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('注册成功');
            expect(response.body.data.user.username).toBe(userData.username);
            expect(response.body.data.user.password).toBeUndefined();
            
            // 验证用户已保存到数据库
            const savedUser = await User.findOne({ where: { username: userData.username } });
            expect(savedUser).toBeTruthy();
        });
        
        test('应该返回验证错误', async () => {
            const invalidData = {
                username: '', // 空用户名
                email: 'invalid-email', // 无效邮箱
                password: '123', // 弱密码
                firstName: '',
                lastName: ''
            };
            
            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidData)
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
            expect(Array.isArray(response.body.errors)).toBe(true);
        });
        
        test('应该拒绝重复用户名', async () => {
            await testUtils.createTestUser({ username: 'existing' });
            
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'existing',
                    email: 'new@example.com',
                    password: 'Password123!',
                    firstName: 'New',
                    lastName: 'User'
                })
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('用户名已存在');
        });
    });
    
    describe('POST /api/auth/login', () => {
        let user;
        
        beforeEach(async () => {
            user = await testUtils.createTestUser({
                isEmailVerified: true
            });
        });
        
        test('应该成功登录', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                })
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.id).toBe(user.id);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
            
            // 验证设置了cookie
            expect(response.headers['set-cookie']).toBeDefined();
        });
        
        test('应该拒绝错误凭据', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                })
                .expect(401);
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('用户名或密码错误');
        });
        
        test('应该限制登录尝试', async () => {
            // 多次失败登录
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: 'testuser',
                        password: 'wrongpassword'
                    });
            }
            
            // 第6次应该被限制
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                })
                .expect(429);
            
            expect(response.body.message).toContain('登录尝试过多');
        });
    });
    
    describe('POST /api/auth/refresh', () => {
        let user, refreshToken;
        
        beforeEach(async () => {
            user = await testUtils.createTestUser({ isEmailVerified: true });
            
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });
            
            refreshToken = loginResponse.body.data.refreshToken;
        });
        
        test('应该成功刷新令牌', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken })
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
            expect(response.body.data.refreshToken).not.toBe(refreshToken);
        });
        
        test('应该拒绝无效刷新令牌', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'invalid-token' })
                .expect(401);
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('无效的刷新令牌');
        });
    });
});
```

### 学生管理API测试

```javascript
// tests/integration/students.test.js
const request = require('supertest');
const app = require('../../src/app');
const { Student } = require('../../src/models');

describe('Students API', () => {
    let user, authToken;
    
    beforeEach(async () => {
        user = await testUtils.createTestUser({ isEmailVerified: true });
        authToken = testUtils.generateToken(user);
    });
    
    describe('GET /api/students', () => {
        beforeEach(async () => {
            // 创建测试学生数据
            await testUtils.createTestStudent({ studentId: 'STU001', firstName: 'John' });
            await testUtils.createTestStudent({ studentId: 'STU002', firstName: 'Jane' });
            await testUtils.createTestStudent({ studentId: 'STU003', firstName: 'Bob' });
        });
        
        test('应该返回学生列表', async () => {
            const response = await request(app)
                .get('/api/students')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.students).toHaveLength(3);
            expect(response.body.data.pagination).toBeDefined();
        });
        
        test('应该支持分页', async () => {
            const response = await request(app)
                .get('/api/students?page=1&limit=2')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(response.body.data.students).toHaveLength(2);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(2);
            expect(response.body.data.pagination.total).toBe(3);
        });
        
        test('应该支持搜索', async () => {
            const response = await request(app)
                .get('/api/students?search=John')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(response.body.data.students).toHaveLength(1);
            expect(response.body.data.students[0].firstName).toBe('John');
        });
        
        test('应该拒绝未认证请求', async () => {
            const response = await request(app)
                .get('/api/students')
                .expect(401);
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('未提供认证令牌');
        });
    });
    
    describe('POST /api/students', () => {
        test('应该成功创建学生', async () => {
            const studentData = {
                studentId: 'STU004',
                firstName: 'Alice',
                lastName: 'Smith',
                email: 'alice.smith@example.com',
                phone: '1234567890',
                dateOfBirth: '1995-05-15',
                address: '456 Test Ave'
            };
            
            const response = await request(app)
                .post('/api/students')
                .set('Authorization', `Bearer ${authToken}`)
                .send(studentData)
                .expect(201);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.studentId).toBe(studentData.studentId);
            expect(response.body.data.firstName).toBe(studentData.firstName);
            
            // 验证学生已保存到数据库
            const savedStudent = await Student.findOne({ where: { studentId: studentData.studentId } });
            expect(savedStudent).toBeTruthy();
        });
        
        test('应该返回验证错误', async () => {
            const invalidData = {
                studentId: '', // 空学号
                firstName: '',
                lastName: '',
                email: 'invalid-email',
                phone: '123', // 无效电话
                dateOfBirth: 'invalid-date'
            };
            
            const response = await request(app)
                .post('/api/students')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
        
        test('应该拒绝重复学号', async () => {
            await testUtils.createTestStudent({ studentId: 'STU005' });
            
            const response = await request(app)
                .post('/api/students')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    studentId: 'STU005',
                    firstName: 'Duplicate',
                    lastName: 'Student',
                    email: 'duplicate@example.com',
                    phone: '1234567890',
                    dateOfBirth: '1995-01-01',
                    address: '123 Test St'
                })
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('学号已存在');
        });
    });
    
    describe('GET /api/students/:id', () => {
        let student;
        
        beforeEach(async () => {
            student = await testUtils.createTestStudent();
        });
        
        test('应该返回学生详情', async () => {
            const response = await request(app)
                .get(`/api/students/${student.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(student.id);
            expect(response.body.data.studentId).toBe(student.studentId);
        });
        
        test('应该返回404对不存在的学生', async () => {
            const response = await request(app)
                .get('/api/students/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('学生不存在');
        });
    });
    
    describe('PUT /api/students/:id', () => {
        let student;
        
        beforeEach(async () => {
            student = await testUtils.createTestStudent();
        });
        
        test('应该成功更新学生信息', async () => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                email: 'updated@example.com'
            };
            
            const response = await request(app)
                .put(`/api/students/${student.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.firstName).toBe(updateData.firstName);
            expect(response.body.data.lastName).toBe(updateData.lastName);
            expect(response.body.data.email).toBe(updateData.email);
            
            // 验证数据库中的更新
            await student.reload();
            expect(student.firstName).toBe(updateData.firstName);
        });
        
        test('应该拒绝无效更新数据', async () => {
            const response = await request(app)
                .put(`/api/students/${student.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ email: 'invalid-email' })
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });
    
    describe('DELETE /api/students/:id', () => {
        let student;
        
        beforeEach(async () => {
            student = await testUtils.createTestStudent();
        });
        
        test('应该成功删除学生', async () => {
            const response = await request(app)
                .delete(`/api/students/${student.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('删除成功');
            
            // 验证学生已从数据库删除
            const deletedStudent = await Student.findByPk(student.id);
            expect(deletedStudent).toBeNull();
        });
        
        test('应该返回404对不存在的学生', async () => {
            const response = await request(app)
                .delete('/api/students/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('学生不存在');
        });
    });
});
```

## 11.5 性能测试

### 负载测试配置

```javascript
// tests/performance/load.test.js
const autocannon = require('autocannon');
const app = require('../../src/app');
const http = require('http');

describe('Performance Tests', () => {
    let server;
    
    beforeAll((done) => {
        server = http.createServer(app);
        server.listen(0, done);
    });
    
    afterAll((done) => {
        server.close(done);
    });
    
    test('API 响应时间测试', async () => {
        const port = server.address().port;
        
        const result = await autocannon({
            url: `http://localhost:${port}/api/health`,
            connections: 10,
            duration: 10, // 10秒
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // 断言性能指标
        expect(result.latency.average).toBeLessThan(100); // 平均响应时间小于100ms
        expect(result.requests.average).toBeGreaterThan(100); // 平均每秒处理100个请求
        expect(result.errors).toBe(0); // 无错误
        
        console.log('性能测试结果:');
        console.log(`平均响应时间: ${result.latency.average}ms`);
        console.log(`每秒请求数: ${result.requests.average}`);
        console.log(`总请求数: ${result.requests.total}`);
        console.log(`错误数: ${result.errors}`);
    }, 30000);
    
    test('认证API负载测试', async () => {
        const port = server.address().port;
        
        // 创建测试用户
        await testUtils.createTestUser({ isEmailVerified: true });
        
        const result = await autocannon({
            url: `http://localhost:${port}/api/auth/login`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'testuser',
                password: 'password123'
            }),
            connections: 5,
            duration: 5
        });
        
        expect(result.latency.average).toBeLessThan(200);
        expect(result.errors).toBe(0);
    }, 30000);
});
```

### 内存泄漏测试

```javascript
// tests/performance/memory.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Memory Leak Tests', () => {
    test('应该不存在内存泄漏', async () => {
        const initialMemory = process.memoryUsage();
        
        // 执行大量请求
        const promises = [];
        for (let i = 0; i < 1000; i++) {
            promises.push(
                request(app)
                    .get('/api/health')
                    .expect(200)
            );
        }
        
        await Promise.all(promises);
        
        // 强制垃圾回收
        if (global.gc) {
            global.gc();
        }
        
        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // 内存增长应该在合理范围内（小于50MB）
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        
        console.log(`初始内存: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
        console.log(`最终内存: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
        console.log(`内存增长: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    }, 60000);
});
```

## 11.6 Docker 容器化

### Dockerfile

```dockerfile
# Dockerfile
# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 复制应用代码
COPY --chown=nodejs:nodejs . .

# 创建必要的目录
RUN mkdir -p uploads temp logs && chown -R nodejs:nodejs uploads temp logs

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# 启动应用
CMD ["npm", "start"]
```

### Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_NAME=student_management
      - DB_USER=postgres
      - DB_PASSWORD=password
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=student_management
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 开发环境 Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
      - "9229:9229" # 调试端口
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_NAME=student_management_dev
      - DB_USER=postgres
      - DB_PASSWORD=password
      - REDIS_HOST=redis
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    networks:
      - app-network
    command: npm run dev

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=student_management_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-network

volumes:
  postgres_dev_data:

networks:
  app-network:
    driver: bridge
```

### 健康检查脚本

```javascript
// healthcheck.js
const http = require('http');

const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: '/api/health',
    method: 'GET',
    timeout: 2000
};

const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});

req.on('error', () => {
    process.exit(1);
});

req.on('timeout', () => {
    req.destroy();
    process.exit(1);
});

req.end();
```

## 11.7 CI/CD 配置

### GitHub Actions 工作流

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: student_management_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm test
      env:
        NODE_ENV: test
        DB_HOST: localhost
        DB_PORT: 5432
        DB_NAME: student_management_test
        DB_USER: postgres
        DB_PASSWORD: postgres
        REDIS_HOST: localhost
        REDIS_PORT: 6379
        JWT_SECRET: test-secret
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
    
    - name: Run security audit
      run: npm audit --audit-level moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ${{ secrets.DOCKER_USERNAME }}/student-management:latest
          ${{ secrets.DOCKER_USERNAME }}/student-management:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/student-management
          docker-compose pull
          docker-compose up -d
          docker system prune -f
```

### GitLab CI 配置

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

services:
  - postgres:15
  - redis:7

variables:
  POSTGRES_DB: student_management_test
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  REDIS_URL: redis://redis:6379

test:
  stage: test
  image: node:18
  cache:
    paths:
      - node_modules/
  before_script:
    - npm ci
  script:
    - npm run lint
    - npm test
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
  only:
    - merge_requests
    - main
    - develop

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:latest
  only:
    - main

## 11.8 生产环境配置

### 环境变量管理

```javascript
// config/production.js
module.exports = {
    // 数据库配置
    database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        dialect: 'postgres',
        logging: false, // 生产环境关闭SQL日志
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    },
    
    // Redis配置
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3
    },
    
    // JWT配置
    jwt: {
        secret: process.env.JWT_SECRET,
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d'
    },
    
    // 邮件配置
    email: {
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        from: process.env.EMAIL_FROM
    },
    
    // 文件上传配置
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        destination: process.env.UPLOAD_PATH || '/app/uploads'
    },
    
    // 安全配置
    security: {
        bcryptRounds: 12,
        rateLimitWindowMs: 15 * 60 * 1000, // 15分钟
        rateLimitMax: 100, // 每个IP每15分钟最多100个请求
        corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['https://app.example.com']
    },
    
    // 日志配置
    logging: {
        level: 'info',
        file: {
            enabled: true,
            filename: '/app/logs/app.log',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        },
        console: {
            enabled: false // 生产环境关闭控制台日志
        }
    }
};
```

### PM2 进程管理

```javascript
// ecosystem.config.js
module.exports = {
    apps: [{
        name: 'student-management',
        script: './src/server.js',
        instances: 'max', // 使用所有CPU核心
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        // 日志配置
        log_file: './logs/combined.log',
        out_file: './logs/out.log',
        error_file: './logs/error.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        
        // 监控配置
        monitoring: false,
        
        // 重启配置
        max_restarts: 10,
        min_uptime: '10s',
        
        // 内存限制
        max_memory_restart: '500M',
        
        // 自动重启
        autorestart: true,
        
        // 监听文件变化（仅开发环境）
        watch: false,
        ignore_watch: ['node_modules', 'logs', 'uploads'],
        
        // 环境变量
        env_file: '.env.production'
    }],
    
    deploy: {
        production: {
            user: 'deploy',
            host: ['production-server.com'],
            ref: 'origin/main',
            repo: 'git@github.com:username/student-management.git',
            path: '/opt/student-management',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
        },
        staging: {
            user: 'deploy',
            host: ['staging-server.com'],
            ref: 'origin/develop',
            repo: 'git@github.com:username/student-management.git',
            path: '/opt/student-management-staging',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
        }
    }
};
```

### Nginx 反向代理配置

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # 基础配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # 压缩配置
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # 上游服务器
    upstream app {
        least_conn;
        server app:3000 max_fails=3 fail_timeout=30s;
        # 如果有多个实例
        # server app2:3000 max_fails=3 fail_timeout=30s;
        # server app3:3000 max_fails=3 fail_timeout=30s;
    }
    
    # 限流配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # HTTPS重定向
    server {
        listen 80;
        server_name app.example.com;
        return 301 https://$server_name$request_uri;
    }
    
    # 主服务器配置
    server {
        listen 443 ssl http2;
        server_name app.example.com;
        
        # SSL配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        # 客户端最大请求体大小
        client_max_body_size 10M;
        
        # 静态文件
        location /static/ {
            alias /app/public/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # 上传文件
        location /uploads/ {
            alias /app/uploads/;
            expires 1M;
            add_header Cache-Control "public";
        }
        
        # API路由
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # 超时配置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # 登录限流
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # 前端应用
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # 健康检查
        location /health {
            access_log off;
            proxy_pass http://app/api/health;
        }
    }
}
```

## 11.9 监控和日志

### Winston 日志配置

```javascript
// src/utils/logger.js
const winston = require('winston');
const path = require('path');

// 自定义日志格式
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// 创建日志器
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'student-management',
        version: process.env.npm_package_version
    },
    transports: [
        // 错误日志
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            tailable: true
        }),
        
        // 组合日志
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'combined.log'),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
            tailable: true
        }),
        
        // 访问日志
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'access.log'),
            level: 'http',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 10,
            tailable: true
        })
    ],
    
    // 异常处理
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'exceptions.log')
        })
    ],
    
    // 拒绝处理
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'rejections.log')
        })
    ]
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// 请求日志中间件
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id
        };
        
        if (res.statusCode >= 400) {
            logger.warn('HTTP Request', logData);
        } else {
            logger.http('HTTP Request', logData);
        }
    });
    
    next();
};

// 错误日志中间件
const errorLogger = (err, req, res, next) => {
    logger.error('Application Error', {
        error: {
            message: err.message,
            stack: err.stack,
            name: err.name
        },
        request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query
        },
        user: req.user?.id
    });
    
    next(err);
};

module.exports = {
    logger,
    requestLogger,
    errorLogger
};
```

### 应用监控

```javascript
// src/utils/monitoring.js
const os = require('os');
const { logger } = require('./logger');
const { sequelize } = require('../models');
const redis = require('../config/redis');

class MonitoringService {
    constructor() {
        this.metrics = {
            requests: 0,
            errors: 0,
            responseTime: [],
            activeConnections: 0
        };
        
        this.startMonitoring();
    }
    
    // 开始监控
    startMonitoring() {
        // 每分钟记录系统指标
        setInterval(() => {
            this.recordSystemMetrics();
        }, 60000);
        
        // 每5分钟记录应用指标
        setInterval(() => {
            this.recordApplicationMetrics();
        }, 300000);
        
        // 每小时清理指标
        setInterval(() => {
            this.cleanupMetrics();
        }, 3600000);
    }
    
    // 记录系统指标
    async recordSystemMetrics() {
        const metrics = {
            timestamp: new Date(),
            system: {
                platform: os.platform(),
                arch: os.arch(),
                uptime: os.uptime(),
                loadavg: os.loadavg(),
                totalmem: os.totalmem(),
                freemem: os.freemem(),
                cpus: os.cpus().length
            },
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            }
        };
        
        logger.info('System Metrics', metrics);
        
        // 检查内存使用率
        const memoryUsage = (metrics.process.memory.heapUsed / metrics.process.memory.heapTotal) * 100;
        if (memoryUsage > 80) {
            logger.warn('High Memory Usage', {
                usage: `${memoryUsage.toFixed(2)}%`,
                heapUsed: metrics.process.memory.heapUsed,
                heapTotal: metrics.process.memory.heapTotal
            });
        }
        
        // 检查系统负载
        const loadAvg = metrics.system.loadavg[0];
        const cpuCount = metrics.system.cpus;
        if (loadAvg > cpuCount * 0.8) {
            logger.warn('High System Load', {
                loadAvg,
                cpuCount,
                usage: `${((loadAvg / cpuCount) * 100).toFixed(2)}%`
            });
        }
    }
    
    // 记录应用指标
    async recordApplicationMetrics() {
        try {
            // 数据库连接状态
            const dbStatus = await this.checkDatabaseHealth();
            
            // Redis连接状态
            const redisStatus = await this.checkRedisHealth();
            
            // 应用指标
            const appMetrics = {
                timestamp: new Date(),
                database: dbStatus,
                redis: redisStatus,
                application: {
                    requests: this.metrics.requests,
                    errors: this.metrics.errors,
                    errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
                    avgResponseTime: this.calculateAverageResponseTime(),
                    activeConnections: this.metrics.activeConnections
                }
            };
            
            logger.info('Application Metrics', appMetrics);
            
            // 检查错误率
            if (appMetrics.application.errorRate > 5) {
                logger.warn('High Error Rate', {
                    errorRate: `${appMetrics.application.errorRate.toFixed(2)}%`,
                    errors: this.metrics.errors,
                    requests: this.metrics.requests
                });
            }
            
        } catch (error) {
            logger.error('Failed to record application metrics', { error: error.message });
        }
    }
    
    // 检查数据库健康状态
    async checkDatabaseHealth() {
        try {
            const start = Date.now();
            await sequelize.authenticate();
            const responseTime = Date.now() - start;
            
            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
    
    // 检查Redis健康状态
    async checkRedisHealth() {
        try {
            const start = Date.now();
            await redis.ping();
            const responseTime = Date.now() - start;
            
            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
    
    // 计算平均响应时间
    calculateAverageResponseTime() {
        if (this.metrics.responseTime.length === 0) return 0;
        
        const sum = this.metrics.responseTime.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.metrics.responseTime.length);
    }
    
    // 记录请求
    recordRequest(responseTime) {
        this.metrics.requests++;
        this.metrics.responseTime.push(responseTime);
        
        // 保持最近1000个响应时间记录
        if (this.metrics.responseTime.length > 1000) {
            this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
        }
    }
    
    // 记录错误
    recordError() {
        this.metrics.errors++;
    }
    
    // 记录活跃连接
    recordConnection(delta = 1) {
        this.metrics.activeConnections += delta;
    }
    
    // 清理指标
    cleanupMetrics() {
        this.metrics.requests = 0;
        this.metrics.errors = 0;
        this.metrics.responseTime = [];
        
        logger.info('Metrics cleaned up');
    }
    
    // 获取当前指标
    getCurrentMetrics() {
        return {
            ...this.metrics,
            avgResponseTime: this.calculateAverageResponseTime(),
            errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0
        };
    }
}

// 监控中间件
const monitoringMiddleware = (monitoring) => {
    return (req, res, next) => {
        const start = Date.now();
        monitoring.recordConnection(1);
        
        res.on('finish', () => {
            const responseTime = Date.now() - start;
            monitoring.recordRequest(responseTime);
            monitoring.recordConnection(-1);
            
            if (res.statusCode >= 400) {
                monitoring.recordError();
            }
        });
        
        next();
    };
};

module.exports = {
    MonitoringService,
    monitoringMiddleware
};
```

### Sentry 错误追踪

```javascript
// src/utils/sentry.js
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// 初始化Sentry
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.npm_package_version,
    
    // 性能监控
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // 性能分析
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
        new ProfilingIntegration(),
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: require('../app') })
    ],
    
    // 过滤敏感数据
    beforeSend(event) {
        // 移除密码等敏感信息
        if (event.request?.data?.password) {
            delete event.request.data.password;
        }
        
        if (event.extra?.body?.password) {
            delete event.extra.body.password;
        }
        
        return event;
    },
    
    // 忽略特定错误
    ignoreErrors: [
        'ValidationError',
        'SequelizeValidationError',
        'UnauthorizedError'
    ]
});

// 错误处理中间件
const sentryErrorHandler = Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
        // 只处理500级别的错误
        return error.status >= 500;
    }
});

// 用户上下文设置
const setSentryUser = (req, res, next) => {
    if (req.user) {
        Sentry.setUser({
            id: req.user.id,
            username: req.user.username,
            email: req.user.email
        });
    }
    next();
};

// 手动报告错误
const reportError = (error, context = {}) => {
    Sentry.withScope((scope) => {
        Object.keys(context).forEach(key => {
            scope.setContext(key, context[key]);
        });
        Sentry.captureException(error);
    });
};

module.exports = {
    Sentry,
    sentryErrorHandler,
    setSentryUser,
    reportError
};
```

## 11.10 性能优化

### 缓存策略

```javascript
// src/utils/cache.js
const redis = require('../config/redis');
const { logger } = require('./logger');

class CacheService {
    constructor() {
        this.defaultTTL = 3600; // 1小时
    }
    
    // 生成缓存键
    generateKey(prefix, ...parts) {
        return `${prefix}:${parts.join(':')}`;
    }
    
    // 获取缓存
    async get(key) {
        try {
            const value = await redis.get(key);
            if (value) {
                return JSON.parse(value);
            }
            return null;
        } catch (error) {
            logger.error('Cache get error', { key, error: error.message });
            return null;
        }
    }
    
    // 设置缓存
    async set(key, value, ttl = this.defaultTTL) {
        try {
            await redis.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error('Cache set error', { key, error: error.message });
            return false;
        }
    }
    
    // 删除缓存
    async del(key) {
        try {
            await redis.del(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error', { key, error: error.message });
            return false;
        }
    }
    
    // 批量删除缓存
    async delPattern(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
            return keys.length;
        } catch (error) {
            logger.error('Cache delete pattern error', { pattern, error: error.message });
            return 0;
        }
    }
    
    // 缓存装饰器
    cached(ttl = this.defaultTTL) {
        return (target, propertyName, descriptor) => {
            const method = descriptor.value;
            
            descriptor.value = async function(...args) {
                const cacheKey = `method:${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
                
                // 尝试从缓存获取
                let result = await this.cache.get(cacheKey);
                if (result !== null) {
                    return result;
                }
                
                // 执行原方法
                result = await method.apply(this, args);
                
                // 缓存结果
                await this.cache.set(cacheKey, result, ttl);
                
                return result;
            };
            
            return descriptor;
        };
    }
}

// 缓存中间件
const cacheMiddleware = (ttl = 300) => {
    return async (req, res, next) => {
        // 只缓存GET请求
        if (req.method !== 'GET') {
            return next();
        }
        
        const cacheKey = `http:${req.originalUrl}`;
        const cache = new CacheService();
        
        try {
            const cachedResponse = await cache.get(cacheKey);
            if (cachedResponse) {
                res.set(cachedResponse.headers);
                res.set('X-Cache', 'HIT');
                return res.status(cachedResponse.status).json(cachedResponse.body);
            }
        } catch (error) {
            logger.error('Cache middleware error', { error: error.message });
        }
        
        // 拦截响应
        const originalSend = res.json;
        res.json = function(body) {
            // 只缓存成功响应
            if (res.statusCode === 200) {
                const responseData = {
                    status: res.statusCode,
                    headers: res.getHeaders(),
                    body
                };
                
                cache.set(cacheKey, responseData, ttl).catch(error => {
                    logger.error('Failed to cache response', { error: error.message });
                });
            }
            
            res.set('X-Cache', 'MISS');
            return originalSend.call(this, body);
        };
        
        next();
    };
};

module.exports = {
    CacheService,
    cacheMiddleware
};
```

### 数据库优化

```javascript
// src/utils/database-optimizer.js
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const { logger } = require('./logger');

class DatabaseOptimizer {
    // 分析慢查询
    async analyzeSlowQueries() {
        try {
            const slowQueries = await sequelize.query(`
                SELECT 
                    query,
                    calls,
                    total_time,
                    mean_time,
                    rows
                FROM pg_stat_statements 
                WHERE mean_time > 100
                ORDER BY mean_time DESC
                LIMIT 10
            `, { type: QueryTypes.SELECT });
            
            logger.info('Slow queries analysis', { slowQueries });
            return slowQueries;
        } catch (error) {
            logger.error('Failed to analyze slow queries', { error: error.message });
            return [];
        }
    }
    
    // 分析表大小
    async analyzeTableSizes() {
        try {
            const tableSizes = await sequelize.query(`
                SELECT 
                    schemaname,
                    tablename,
                    attname,
                    n_distinct,
                    correlation
                FROM pg_stats 
                WHERE schemaname = 'public'
                ORDER BY n_distinct DESC
            `, { type: QueryTypes.SELECT });
            
            logger.info('Table sizes analysis', { tableSizes });
            return tableSizes;
        } catch (error) {
            logger.error('Failed to analyze table sizes', { error: error.message });
            return [];
        }
    }
    
    // 分析索引使用情况
    async analyzeIndexUsage() {
        try {
            const indexUsage = await sequelize.query(`
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_tup_read,
                    idx_tup_fetch
                FROM pg_stat_user_indexes
                ORDER BY idx_tup_read DESC
            `, { type: QueryTypes.SELECT });
            
            logger.info('Index usage analysis', { indexUsage });
            return indexUsage;
        } catch (error) {
            logger.error('Failed to analyze index usage', { error: error.message });
            return [];
        }
    }
    
    // 优化建议
    async getOptimizationSuggestions() {
        const suggestions = [];
        
        try {
            // 检查未使用的索引
            const unusedIndexes = await sequelize.query(`
                SELECT 
                    schemaname,
                    tablename,
                    indexname
                FROM pg_stat_user_indexes
                WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
            `, { type: QueryTypes.SELECT });
            
            if (unusedIndexes.length > 0) {
                suggestions.push({
                    type: 'unused_indexes',
                    message: '发现未使用的索引',
                    data: unusedIndexes
                });
            }
            
            // 检查缺失的索引
            const missingIndexes = await sequelize.query(`
                SELECT 
                    schemaname,
                    tablename,
                    attname,
                    n_distinct,
                    correlation
                FROM pg_stats 
                WHERE schemaname = 'public' 
                AND n_distinct > 100 
                AND correlation < 0.1
            `, { type: QueryTypes.SELECT });
            
            if (missingIndexes.length > 0) {
                suggestions.push({
                    type: 'missing_indexes',
                    message: '建议添加索引的字段',
                    data: missingIndexes
                });
            }
            
        } catch (error) {
            logger.error('Failed to get optimization suggestions', { error: error.message });
        }
        
        return suggestions;
    }
    
    // 执行VACUUM和ANALYZE
    async maintainDatabase() {
        try {
            await sequelize.query('VACUUM ANALYZE');
            logger.info('Database maintenance completed');
        } catch (error) {
            logger.error('Database maintenance failed', { error: error.message });
        }
    }
}

module.exports = DatabaseOptimizer;
```

## 11.11 本章小结

### 核心知识点

1. **测试体系**
   - 单元测试：模型、服务、工具函数测试
   - 集成测试：API端到端测试
   - 性能测试：负载测试、内存泄漏检测
   - 测试覆盖率：代码覆盖率分析和报告

2. **容器化部署**
   - Docker镜像构建和优化
   - Docker Compose多服务编排
   - 容器健康检查和监控
   - 生产环境容器配置

3. **CI/CD流程**
   - 自动化测试和构建
   - 代码质量检查和安全审计
   - 自动化部署和回滚
   - 多环境部署策略

4. **生产环境配置**
   - 环境变量管理
   - PM2进程管理
   - Nginx反向代理和负载均衡
   - SSL/TLS安全配置

5. **监控和日志**
   - 结构化日志记录
   - 系统和应用监控
   - 错误追踪和报警
   - 性能指标收集

6. **性能优化**
   - Redis缓存策略
   - 数据库查询优化
   - 静态资源优化
   - 内存和CPU优化

### 实践成果

通过本章学习，你已经掌握了：

- ✅ 完整的测试框架搭建
- ✅ Docker容器化部署方案
- ✅ CI/CD自动化流程
- ✅ 生产环境配置和优化
- ✅ 监控和日志系统
- ✅ 性能优化最佳实践

## 11.12 课后练习

### 基础练习

1. **测试编写**
   - 为用户认证模块编写完整的单元测试
   - 实现API集成测试，覆盖所有CRUD操作
   - 添加测试数据工厂和测试工具函数

2. **Docker部署**
   - 创建多阶段Docker构建
   - 配置Docker Compose开发环境
   - 实现容器健康检查

3. **监控配置**
   - 配置Winston日志系统
   - 实现基础的应用监控
   - 添加错误报警机制

### 进阶练习

1. **性能优化**
   - 实现Redis缓存层
   - 优化数据库查询性能
   - 添加API响应时间监控

2. **CI/CD流程**
   - 配置GitHub Actions工作流
   - 实现自动化测试和部署
   - 添加代码质量检查

3. **生产环境**
   - 配置Nginx负载均衡
   - 实现SSL/TLS加密
   - 添加安全头和防护措施

### 挑战练习

1. **高可用部署**
   - 实现多实例负载均衡
   - 配置数据库主从复制
   - 实现零停机部署

2. **监控告警**
   - 集成Prometheus和Grafana
   - 实现自定义监控指标
   - 配置告警规则和通知

3. **性能测试**
   - 实现压力测试和基准测试
   - 分析性能瓶颈和优化点
   - 制定性能优化方案

## 下一章预告

在下一章《项目总结与扩展》中，我们将：

- 回顾整个项目的架构和实现
- 总结开发过程中的最佳实践
- 探讨项目的扩展方向和优化空间
- 分享实际开发中的经验和技巧
- 提供进一步学习的资源和建议

## 学习资源

### 官方文档
- [Jest Testing Framework](https://jestjs.io/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### 推荐阅读
- 《测试驱动开发》- Kent Beck
- 《持续交付》- Jez Humble
- 《Docker实战》- Jeff Nickoloff
- 《高性能网站建设指南》- Steve Souders
- 《SRE：Google运维解密》- Google SRE Team

### 在线资源
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Monitoring and Observability](https://sre.google/books/)
- [Performance Testing Guide](https://k6.io/docs/)

deploy_staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$STAGING_HOST "cd /opt/student-management && docker-compose pull && docker-compose up -d"
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop

deploy_production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$PRODUCTION_HOST "cd /opt/student-management && docker-compose pull && docker-compose up -d"
  environment:
    name: production
    url: https://app.example.com
  when: manual
  only:
    - main
```