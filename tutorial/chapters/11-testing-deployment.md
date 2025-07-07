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