# 第9章：用户认证和授权

## 9.1 章节概述

本章将深入学习用户认证和授权系统的设计与实现。我们将构建一个完整的用户管理系统，包括注册、登录、权限控制等功能，确保应用的安全性和用户体验。

### 学习目标

- 理解认证和授权的基本概念
- 掌握密码加密和安全存储
- 学习 JWT 令牌认证机制
- 实现用户注册和登录系统
- 掌握基于角色的权限控制（RBAC）
- 学习会话管理和安全最佳实践
- 实现第三方登录集成
- 掌握安全防护措施

### 技术要点

- bcrypt 密码加密
- JWT 令牌生成和验证
- Express 中间件认证
- 角色和权限管理
- 会话存储和管理
- OAuth 2.0 第三方登录
- 安全防护和最佳实践

## 9.2 认证基础概念

### 认证 vs 授权

```javascript
// 认证（Authentication）：验证用户身份
// "你是谁？"
const authenticate = (username, password) => {
    // 验证用户名和密码是否正确
    return verifyCredentials(username, password);
};

// 授权（Authorization）：验证用户权限
// "你能做什么？"
const authorize = (user, resource, action) => {
    // 检查用户是否有权限执行特定操作
    return checkPermission(user, resource, action);
};
```

### 用户模型设计

```javascript
// models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 50],
                isAlphanumeric: true
            }
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: [6, 255]
            }
        },
        firstName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                len: [1, 50]
            }
        },
        lastName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                len: [1, 50]
            }
        },
        avatar: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        role: {
            type: DataTypes.ENUM('admin', 'teacher', 'student'),
            defaultValue: 'student',
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'),
            defaultValue: 'pending',
            allowNull: false
        },
        emailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        emailVerificationToken: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        passwordResetToken: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        lastLoginAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        loginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        lockUntil: {
            type: DataTypes.DATE,
            allowNull: true
        },
        twoFactorEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        twoFactorSecret: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        hooks: {
            // 密码加密钩子
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await User.hashPassword(user.password);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await User.hashPassword(user.password);
                }
            }
        }
    });

    // 类方法
    User.hashPassword = async (password) => {
        const saltRounds = 12;
        return bcrypt.hash(password, saltRounds);
    };

    User.generateToken = () => {
        return crypto.randomBytes(32).toString('hex');
    };

    // 实例方法
    User.prototype.comparePassword = async function(password) {
        return bcrypt.compare(password, this.password);
    };

    User.prototype.generateJWT = function() {
        const payload = {
            id: this.id,
            username: this.username,
            email: this.email,
            role: this.role,
            status: this.status
        };

        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
            issuer: 'student-management-system'
        });
    };

    User.prototype.generateRefreshToken = function() {
        const payload = {
            id: this.id,
            type: 'refresh'
        };

        return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
            issuer: 'student-management-system'
        });
    };

    User.prototype.isLocked = function() {
        return this.lockUntil && this.lockUntil > Date.now();
    };

    User.prototype.incrementLoginAttempts = async function() {
        // 如果已经锁定且锁定时间已过，重置计数器
        if (this.lockUntil && this.lockUntil < Date.now()) {
            return this.update({
                loginAttempts: 1,
                lockUntil: null
            });
        }

        const updates = { loginAttempts: this.loginAttempts + 1 };

        // 如果达到最大尝试次数，锁定账户
        const maxAttempts = 5;
        const lockTime = 2 * 60 * 60 * 1000; // 2小时

        if (updates.loginAttempts >= maxAttempts && !this.isLocked()) {
            updates.lockUntil = Date.now() + lockTime;
        }

        return this.update(updates);
    };

    User.prototype.resetLoginAttempts = async function() {
        return this.update({
            loginAttempts: 0,
            lockUntil: null
        });
    };

    User.prototype.updateLastLogin = async function() {
        return this.update({
            lastLoginAt: new Date()
        });
    };

    User.prototype.generateEmailVerificationToken = async function() {
        const token = User.generateToken();
        await this.update({
            emailVerificationToken: token
        });
        return token;
    };

    User.prototype.generatePasswordResetToken = async function() {
        const token = User.generateToken();
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

        await this.update({
            passwordResetToken: token,
            passwordResetExpires: expires
        });

        return token;
    };

    User.prototype.toJSON = function() {
        const values = { ...this.get() };
        
        // 移除敏感信息
        delete values.password;
        delete values.emailVerificationToken;
        delete values.passwordResetToken;
        delete values.twoFactorSecret;
        
        return values;
    };

    return User;
};
```

### 角色和权限模型

```javascript
// models/Role.js
module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');
    
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'roles',
        timestamps: true
    });

    return Role;
};

// models/Permission.js
module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');
    
    const Permission = sequelize.define('Permission', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        resource: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        action: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'permissions',
        timestamps: true
    });

    return Permission;
};

// models/associations.js
module.exports = (sequelize) => {
    const { User, Role, Permission } = sequelize.models;

    // 用户和角色的多对多关系
    User.belongsToMany(Role, {
        through: 'UserRoles',
        foreignKey: 'userId',
        otherKey: 'roleId',
        as: 'roles'
    });

    Role.belongsToMany(User, {
        through: 'UserRoles',
        foreignKey: 'roleId',
        otherKey: 'userId',
        as: 'users'
    });

    // 角色和权限的多对多关系
    Role.belongsToMany(Permission, {
        through: 'RolePermissions',
        foreignKey: 'roleId',
        otherKey: 'permissionId',
        as: 'permissions'
    });

    Permission.belongsToMany(Role, {
        through: 'RolePermissions',
        foreignKey: 'permissionId',
        otherKey: 'roleId',
        as: 'roles'
    });

    // 用户和权限的多对多关系（直接权限）
    User.belongsToMany(Permission, {
        through: 'UserPermissions',
        foreignKey: 'userId',
        otherKey: 'permissionId',
        as: 'permissions'
    });

    Permission.belongsToMany(User, {
        through: 'UserPermissions',
        foreignKey: 'permissionId',
        otherKey: 'userId',
        as: 'users'
    });
};
```

## 9.3 密码安全和加密

### 密码策略和验证

```javascript
// utils/passwordUtils.js
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');

class PasswordUtils {
    // 密码强度要求
    static requirements = {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        minScore: 2 // zxcvbn 评分 0-4
    };

    // 验证密码强度
    static validatePassword(password) {
        const errors = [];
        const { requirements } = this;

        // 长度检查
        if (password.length < requirements.minLength) {
            errors.push(`密码长度至少 ${requirements.minLength} 位`);
        }

        if (password.length > requirements.maxLength) {
            errors.push(`密码长度不能超过 ${requirements.maxLength} 位`);
        }

        // 字符类型检查
        if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('密码必须包含大写字母');
        }

        if (requirements.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('密码必须包含小写字母');
        }

        if (requirements.requireNumbers && !/\d/.test(password)) {
            errors.push('密码必须包含数字');
        }

        if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('密码必须包含特殊字符');
        }

        // 使用 zxcvbn 评估密码强度
        const strength = zxcvbn(password);
        if (strength.score < requirements.minScore) {
            errors.push(`密码强度不足，建议：${strength.feedback.suggestions.join('，')}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength: {
                score: strength.score,
                feedback: strength.feedback,
                crackTime: strength.crack_times_display.offline_slow_hashing_1e4_per_second
            }
        };
    }

    // 生成安全密码
    static generateSecurePassword(length = 16) {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        const allChars = uppercase + lowercase + numbers + symbols;
        let password = '';
        
        // 确保包含每种类型的字符
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        
        // 填充剩余长度
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // 打乱字符顺序
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    // 检查密码是否被泄露（可选：集成 HaveIBeenPwned API）
    static async checkPasswordBreach(password) {
        try {
            const crypto = require('crypto');
            const https = require('https');
            
            // 计算密码的 SHA-1 哈希
            const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
            const prefix = hash.substring(0, 5);
            const suffix = hash.substring(5);
            
            return new Promise((resolve, reject) => {
                const options = {
                    hostname: 'api.pwnedpasswords.com',
                    port: 443,
                    path: `/range/${prefix}`,
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Student-Management-System'
                    }
                };
                
                const req = https.request(options, (res) => {
                    let data = '';
                    
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    
                    res.on('end', () => {
                        const lines = data.split('\n');
                        const found = lines.find(line => line.startsWith(suffix));
                        
                        if (found) {
                            const count = parseInt(found.split(':')[1]);
                            resolve({ breached: true, count });
                        } else {
                            resolve({ breached: false, count: 0 });
                        }
                    });
                });
                
                req.on('error', (error) => {
                    // 如果 API 调用失败，不阻止密码设置
                    resolve({ breached: false, count: 0, error: error.message });
                });
                
                req.setTimeout(5000, () => {
                    req.destroy();
                    resolve({ breached: false, count: 0, error: 'Timeout' });
                });
                
                req.end();
            });
        } catch (error) {
            return { breached: false, count: 0, error: error.message };
        }
    }

    // 密码历史检查
    static async checkPasswordHistory(userId, newPassword, historyLimit = 5) {
        const { PasswordHistory } = require('../models');
        
        const history = await PasswordHistory.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: historyLimit
        });
        
        for (const record of history) {
            const isMatch = await bcrypt.compare(newPassword, record.passwordHash);
            if (isMatch) {
                return {
                    isReused: true,
                    message: `不能使用最近 ${historyLimit} 次使用过的密码`
                };
            }
        }
        
        return { isReused: false };
    }

    // 保存密码历史
    static async savePasswordHistory(userId, passwordHash) {
        const { PasswordHistory } = require('../models');
        
        // 保存新密码
        await PasswordHistory.create({
            userId,
            passwordHash
        });
        
        // 清理旧记录，只保留最近的记录
        const historyLimit = 5;
        const allRecords = await PasswordHistory.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        
        if (allRecords.length > historyLimit) {
            const recordsToDelete = allRecords.slice(historyLimit);
            await PasswordHistory.destroy({
                where: {
                    id: recordsToDelete.map(r => r.id)
                }
            });
        }
    }
}

module.exports = PasswordUtils;
```

### 密码历史模型

```javascript
// models/PasswordHistory.js
module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');
    
    const PasswordHistory = sequelize.define('PasswordHistory', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        passwordHash: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        tableName: 'password_history',
        timestamps: true,
        updatedAt: false // 只需要创建时间
    });

    return PasswordHistory;
};
```

## 9.4 JWT 令牌认证

### JWT 工具类

```javascript
// utils/jwtUtils.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

class JWTUtils {
    // 生成访问令牌
    static generateAccessToken(payload) {
        return jwt.sign(
            {
                ...payload,
                type: 'access',
                iat: Math.floor(Date.now() / 1000)
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '15m',
                issuer: 'student-management-system',
                audience: 'student-management-app'
            }
        );
    }

    // 生成刷新令牌
    static generateRefreshToken(payload) {
        return jwt.sign(
            {
                id: payload.id,
                type: 'refresh',
                iat: Math.floor(Date.now() / 1000)
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
                issuer: 'student-management-system',
                audience: 'student-management-app'
            }
        );
    }

    // 验证访问令牌
    static async verifyAccessToken(token) {
        try {
            const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET, {
                issuer: 'student-management-system',
                audience: 'student-management-app'
            });

            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }

            return { valid: true, decoded };
        } catch (error) {
            return { 
                valid: false, 
                error: error.message,
                expired: error.name === 'TokenExpiredError'
            };
        }
    }

    // 验证刷新令牌
    static async verifyRefreshToken(token) {
        try {
            const decoded = await promisify(jwt.verify)(token, process.env.JWT_REFRESH_SECRET, {
                issuer: 'student-management-system',
                audience: 'student-management-app'
            });

            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            return { valid: true, decoded };
        } catch (error) {
            return { 
                valid: false, 
                error: error.message,
                expired: error.name === 'TokenExpiredError'
            };
        }
    }

    // 解码令牌（不验证）
    static decodeToken(token) {
        try {
            return jwt.decode(token, { complete: true });
        } catch (error) {
            return null;
        }
    }

    // 检查令牌是否即将过期
    static isTokenExpiringSoon(token, thresholdMinutes = 5) {
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.payload.exp) {
            return true;
        }

        const expirationTime = decoded.payload.exp * 1000;
        const currentTime = Date.now();
        const thresholdTime = thresholdMinutes * 60 * 1000;

        return (expirationTime - currentTime) < thresholdTime;
    }

    // 生成令牌对
    static generateTokenPair(user) {
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status
        };

        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload)
        };
    }

    // 刷新令牌
    static async refreshTokens(refreshToken) {
        const verification = await this.verifyRefreshToken(refreshToken);
        
        if (!verification.valid) {
            throw new Error('Invalid refresh token');
        }

        // 从数据库获取最新用户信息
        const { User } = require('../models');
        const user = await User.findByPk(verification.decoded.id);
        
        if (!user || user.status !== 'active') {
            throw new Error('User not found or inactive');
        }

        return this.generateTokenPair(user);
    }
}

module.exports = JWTUtils;
```

### 认证中间件

```javascript
// middleware/auth.js
const JWTUtils = require('../utils/jwtUtils');
const { User } = require('../models');

// 基础认证中间件
const authenticate = async (req, res, next) => {
    try {
        // 从请求头获取令牌
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        const token = authHeader.substring(7);
        
        // 验证令牌
        const verification = await JWTUtils.verifyAccessToken(token);
        if (!verification.valid) {
            return res.status(401).json({
                success: false,
                message: verification.expired ? '令牌已过期' : '无效的令牌',
                expired: verification.expired
            });
        }

        // 获取用户信息
        const user = await User.findByPk(verification.decoded.id, {
            include: [
                {
                    association: 'roles',
                    include: ['permissions']
                },
                {
                    association: 'permissions'
                }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }

        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: '用户账户已被禁用'
            });
        }

        // 将用户信息添加到请求对象
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        console.error('认证错误:', error);
        res.status(500).json({
            success: false,
            message: '认证服务错误'
        });
    }
};

// 可选认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const verification = await JWTUtils.verifyAccessToken(token);
            
            if (verification.valid) {
                const user = await User.findByPk(verification.decoded.id, {
                    include: [
                        {
                            association: 'roles',
                            include: ['permissions']
                        },
                        {
                            association: 'permissions'
                        }
                    ]
                });
                
                if (user && user.status === 'active') {
                    req.user = user;
                    req.token = token;
                }
            }
        }
        
        next();
    } catch (error) {
        // 可选认证失败不阻止请求
        next();
    }
};

// 角色检查中间件
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '需要登录'
            });
        }

        const userRoles = req.user.roles ? req.user.roles.map(role => role.name) : [];
        const hasRole = roles.some(role => userRoles.includes(role) || req.user.role === role);

        if (!hasRole) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }

        next();
    };
};

// 权限检查中间件
const requirePermission = (resource, action) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '需要登录'
            });
        }

        const hasPermission = checkUserPermission(req.user, resource, action);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: `没有权限执行 ${action} 操作在 ${resource} 资源上`
            });
        }

        next();
    };
};

// 检查用户权限
const checkUserPermission = (user, resource, action) => {
    // 管理员拥有所有权限
    if (user.role === 'admin') {
        return true;
    }

    // 检查直接权限
    if (user.permissions) {
        const hasDirectPermission = user.permissions.some(permission => 
            permission.resource === resource && permission.action === action
        );
        if (hasDirectPermission) return true;
    }

    // 检查角色权限
    if (user.roles) {
        for (const role of user.roles) {
            if (role.permissions) {
                const hasRolePermission = role.permissions.some(permission => 
                    permission.resource === resource && permission.action === action
                );
                if (hasRolePermission) return true;
            }
        }
    }

    return false;
};

// 资源所有者检查中间件
const requireOwnership = (resourceModel, resourceIdParam = 'id', userIdField = 'userId') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '需要登录'
                });
            }

            // 管理员跳过所有权检查
            if (req.user.role === 'admin') {
                return next();
            }

            const resourceId = req.params[resourceIdParam];
            const { [resourceModel] } = require('../models');
            
            const resource = await resourceModel.findByPk(resourceId);
            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: '资源不存在'
                });
            }

            if (resource[userIdField] !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: '只能操作自己的资源'
                });
            }

            req.resource = resource;
            next();
        } catch (error) {
            console.error('所有权检查错误:', error);
            res.status(500).json({
                success: false,
                message: '权限检查失败'
            });
        }
    };
};

module.exports = {
    authenticate,
    optionalAuth,
    requireRole,
    requirePermission,
    requireOwnership,
    checkUserPermission
};
```

## 9.5 用户注册和登录

### 认证控制器

```javascript
// controllers/authController.js
const { User, PasswordHistory } = require('../models');
const JWTUtils = require('../utils/jwtUtils');
const PasswordUtils = require('../utils/passwordUtils');
const EmailService = require('../services/emailService');
const { validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

class AuthController {
    // 用户注册
    static async register(req, res) {
        try {
            // 验证输入
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: '输入验证失败',
                    errors: errors.array()
                });
            }

            const { username, email, password, firstName, lastName } = req.body;

            // 检查用户是否已存在
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [
                        { username },
                        { email }
                    ]
                }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: existingUser.username === username ? '用户名已存在' : '邮箱已被注册'
                });
            }

            // 验证密码强度
            const passwordValidation = PasswordUtils.validatePassword(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '密码不符合要求',
                    errors: passwordValidation.errors
                });
            }

            // 检查密码是否被泄露
            const breachCheck = await PasswordUtils.checkPasswordBreach(password);
            if (breachCheck.breached) {
                return res.status(400).json({
                    success: false,
                    message: `此密码已在数据泄露中出现 ${breachCheck.count} 次，请使用其他密码`
                });
            }

            // 创建用户
            const user = await User.create({
                username,
                email,
                password,
                firstName,
                lastName,
                status: 'pending' // 需要邮箱验证
            });

            // 保存密码历史
            await PasswordUtils.savePasswordHistory(user.id, user.password);

            // 生成邮箱验证令牌
            const verificationToken = await user.generateEmailVerificationToken();

            // 发送验证邮件
            await EmailService.sendEmailVerification(user.email, {
                name: `${user.firstName} ${user.lastName}`,
                verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
            });

            res.status(201).json({
                success: true,
                message: '注册成功，请检查邮箱完成验证',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        status: user.status
                    }
                }
            });

        } catch (error) {
            console.error('注册错误:', error);
            res.status(500).json({
                success: false,
                message: '注册失败，请稍后重试'
            });
        }
    }

    // 用户登录
    static async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: '输入验证失败',
                    errors: errors.array()
                });
            }

            const { login, password, rememberMe = false } = req.body;

            // 查找用户（支持用户名或邮箱登录）
            const user = await User.findOne({
                where: {
                    [Op.or]: [
                        { username: login },
                        { email: login }
                    ]
                }
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }

            // 检查账户是否被锁定
            if (user.isLocked()) {
                return res.status(423).json({
                    success: false,
                    message: '账户已被锁定，请稍后重试',
                    lockUntil: user.lockUntil
                });
            }

            // 验证密码
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                // 增加登录失败次数
                await user.incrementLoginAttempts();
                
                return res.status(401).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }

            // 检查账户状态
            if (user.status === 'pending') {
                return res.status(403).json({
                    success: false,
                    message: '账户未激活，请检查邮箱完成验证'
                });
            }

            if (user.status === 'suspended') {
                return res.status(403).json({
                    success: false,
                    message: '账户已被暂停'
                });
            }

            if (user.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: '账户状态异常'
                });
            }

            // 重置登录失败次数
            await user.resetLoginAttempts();
            
            // 更新最后登录时间
            await user.updateLastLogin();

            // 生成令牌
            const tokens = JWTUtils.generateTokenPair(user);

            // 设置 Cookie（如果选择记住我）
            if (rememberMe) {
                res.cookie('refreshToken', tokens.refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
                });
            }

            res.json({
                success: true,
                message: '登录成功',
                data: {
                    user: user.toJSON(),
                    tokens
                }
            });

        } catch (error) {
            console.error('登录错误:', error);
            res.status(500).json({
                success: false,
                message: '登录失败，请稍后重试'
            });
        }
    }

    // 刷新令牌
    static async refreshToken(req, res) {
        try {
            let refreshToken = req.body.refreshToken || req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: '未提供刷新令牌'
                });
            }

            const tokens = await JWTUtils.refreshTokens(refreshToken);

            res.json({
                success: true,
                message: '令牌刷新成功',
                data: { tokens }
            });

        } catch (error) {
            console.error('令牌刷新错误:', error);
            res.status(401).json({
                success: false,
                message: '令牌刷新失败'
            });
        }
    }

    // 用户登出
    static async logout(req, res) {
        try {
            // 清除 Cookie
            res.clearCookie('refreshToken');

            // TODO: 将令牌加入黑名单（可选）
            
            res.json({
                success: true,
                message: '登出成功'
            });

        } catch (error) {
            console.error('登出错误:', error);
            res.status(500).json({
                success: false,
                message: '登出失败'
            });
        }
    }

    // 邮箱验证
    static async verifyEmail(req, res) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: '验证令牌不能为空'
                });
            }

            const user = await User.findOne({
                where: { emailVerificationToken: token }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: '无效的验证令牌'
                });
            }

            // 更新用户状态
            await user.update({
                emailVerified: true,
                status: 'active',
                emailVerificationToken: null
            });

            res.json({
                success: true,
                message: '邮箱验证成功，账户已激活'
            });

        } catch (error) {
            console.error('邮箱验证错误:', error);
            res.status(500).json({
                success: false,
                message: '邮箱验证失败'
            });
        }
    }

    // 重发验证邮件
    static async resendVerification(req, res) {
        try {
            const { email } = req.body;

            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            if (user.emailVerified) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱已验证'
                });
            }

            // 生成新的验证令牌
            const verificationToken = await user.generateEmailVerificationToken();

            // 发送验证邮件
            await EmailService.sendEmailVerification(user.email, {
                name: `${user.firstName} ${user.lastName}`,
                verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
            });

            res.json({
                success: true,
                message: '验证邮件已重新发送'
            });

        } catch (error) {
            console.error('重发验证邮件错误:', error);
            res.status(500).json({
                success: false,
                message: '发送失败，请稍后重试'
            });
        }
    }

    // 忘记密码
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            const user = await User.findOne({ where: { email } });
            if (!user) {
                // 为了安全，不透露用户是否存在
                return res.json({
                    success: true,
                    message: '如果邮箱存在，重置链接已发送'
                });
            }

            // 生成重置令牌
            const resetToken = await user.generatePasswordResetToken();

            // 发送重置邮件
            await EmailService.sendPasswordReset(user.email, {
                name: `${user.firstName} ${user.lastName}`,
                resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
            });

            res.json({
                success: true,
                message: '如果邮箱存在，重置链接已发送'
            });

        } catch (error) {
            console.error('忘记密码错误:', error);
            res.status(500).json({
                success: false,
                message: '处理失败，请稍后重试'
            });
        }
    }

    // 重置密码
    static async resetPassword(req, res) {
        try {
            const { token, password } = req.body;

            const user = await User.findOne({
                where: {
                    passwordResetToken: token,
                    passwordResetExpires: {
                        [Op.gt]: new Date()
                    }
                }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: '重置令牌无效或已过期'
                });
            }

            // 验证新密码
            const passwordValidation = PasswordUtils.validatePassword(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '密码不符合要求',
                    errors: passwordValidation.errors
                });
            }

            // 检查密码历史
            const historyCheck = await PasswordUtils.checkPasswordHistory(user.id, password);
            if (historyCheck.isReused) {
                return res.status(400).json({
                    success: false,
                    message: historyCheck.message
                });
            }

            // 更新密码
            await user.update({
                password,
                passwordResetToken: null,
                passwordResetExpires: null,
                loginAttempts: 0,
                lockUntil: null
            });

            // 保存密码历史
            await PasswordUtils.savePasswordHistory(user.id, user.password);

            res.json({
                success: true,
                message: '密码重置成功'
            });

        } catch (error) {
            console.error('重置密码错误:', error);
            res.status(500).json({
                success: false,
                message: '密码重置失败'
            });
        }
    }

    // 修改密码
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = req.user;

            // 验证当前密码
            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: '当前密码错误'
                });
            }

            // 验证新密码
            const passwordValidation = PasswordUtils.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: '新密码不符合要求',
                    errors: passwordValidation.errors
                });
            }

            // 检查密码历史
            const historyCheck = await PasswordUtils.checkPasswordHistory(user.id, newPassword);
            if (historyCheck.isReused) {
                return res.status(400).json({
                    success: false,
                    message: historyCheck.message
                });
            }

            // 更新密码
            await user.update({ password: newPassword });

            // 保存密码历史
            await PasswordUtils.savePasswordHistory(user.id, user.password);

            res.json({
                success: true,
                message: '密码修改成功'
            });

        } catch (error) {
            console.error('修改密码错误:', error);
            res.status(500).json({
                success: false,
                message: '密码修改失败'
            });
        }
    }

    // 获取当前用户信息
    static async getCurrentUser(req, res) {
        try {
            const user = await User.findByPk(req.user.id, {
                include: [
                    {
                        association: 'roles',
                        include: ['permissions']
                    },
                    {
                        association: 'permissions'
                    }
                ]
            });

            res.json({
                success: true,
                data: { user: user.toJSON() }
            });

        } catch (error) {
            console.error('获取用户信息错误:', error);
            res.status(500).json({
                success: false,
                message: '获取用户信息失败'
            });
        }
    }
}

module.exports = AuthController;

// 登录限流配置
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 最多5次尝试
    message: {
        success: false,
        message: '登录尝试次数过多，请15分钟后重试'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

// 注册限流配置
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 3, // 最多3次注册
    message: {
        success: false,
        message: '注册尝试次数过多，请1小时后重试'
    }
});

module.exports = {
    AuthController,
    loginLimiter,
    registerLimiter
};
```

### 输入验证规则

```javascript
// validators/authValidators.js
const { body } = require('express-validator');

// 注册验证
const registerValidation = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('用户名长度必须在3-50个字符之间')
        .isAlphanumeric()
        .withMessage('用户名只能包含字母和数字')
        .custom(async (value) => {
            const { User } = require('../models');
            const user = await User.findOne({ where: { username: value } });
            if (user) {
                throw new Error('用户名已存在');
            }
            return true;
        }),
    
    body('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail()
        .custom(async (value) => {
            const { User } = require('../models');
            const user = await User.findOne({ where: { email: value } });
            if (user) {
                throw new Error('邮箱已被注册');
            }
            return true;
        }),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('密码长度至少8位')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
        .withMessage('密码必须包含大小写字母、数字和特殊字符'),
    
    body('firstName')
        .isLength({ min: 1, max: 50 })
        .withMessage('名字长度必须在1-50个字符之间')
        .trim(),
    
    body('lastName')
        .isLength({ min: 1, max: 50 })
        .withMessage('姓氏长度必须在1-50个字符之间')
        .trim()
];

// 登录验证
const loginValidation = [
    body('login')
        .notEmpty()
        .withMessage('用户名或邮箱不能为空')
        .trim(),
    
    body('password')
        .notEmpty()
        .withMessage('密码不能为空')
];

// 修改密码验证
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('当前密码不能为空'),
    
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('新密码长度至少8位')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
        .withMessage('新密码必须包含大小写字母、数字和特殊字符')
];

// 重置密码验证
const resetPasswordValidation = [
    body('token')
        .notEmpty()
        .withMessage('重置令牌不能为空'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('密码长度至少8位')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
        .withMessage('密码必须包含大小写字母、数字和特殊字符')
];

// 邮箱验证
const emailValidation = [
    body('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail()
];

module.exports = {
    registerValidation,
    loginValidation,
    changePasswordValidation,
    resetPasswordValidation,
    emailValidation
};
```

### 邮件服务

```javascript
// services/emailService.js
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // 发送邮箱验证邮件
    async sendEmailVerification(email, data) {
        try {
            const template = await ejs.renderFile(
                path.join(__dirname, '../views/emails/email-verification.ejs'),
                data
            );

            const mailOptions = {
                from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
                to: email,
                subject: '邮箱验证 - 学生管理系统',
                html: template
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`邮箱验证邮件已发送至: ${email}`);
        } catch (error) {
            console.error('发送邮箱验证邮件失败:', error);
            throw error;
        }
    }

    // 发送密码重置邮件
    async sendPasswordReset(email, data) {
        try {
            const template = await ejs.renderFile(
                path.join(__dirname, '../views/emails/password-reset.ejs'),
                data
            );

            const mailOptions = {
                from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
                to: email,
                subject: '密码重置 - 学生管理系统',
                html: template
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`密码重置邮件已发送至: ${email}`);
        } catch (error) {
            console.error('发送密码重置邮件失败:', error);
            throw error;
        }
    }

    // 发送欢迎邮件
    async sendWelcomeEmail(email, data) {
        try {
            const template = await ejs.renderFile(
                path.join(__dirname, '../views/emails/welcome.ejs'),
                data
            );

            const mailOptions = {
                from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
                to: email,
                subject: '欢迎加入学生管理系统',
                html: template
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`欢迎邮件已发送至: ${email}`);
        } catch (error) {
            console.error('发送欢迎邮件失败:', error);
            throw error;
        }
    }

    // 发送安全警告邮件
    async sendSecurityAlert(email, data) {
        try {
            const template = await ejs.renderFile(
                path.join(__dirname, '../views/emails/security-alert.ejs'),
                data
            );

            const mailOptions = {
                from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
                to: email,
                subject: '安全警告 - 学生管理系统',
                html: template
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`安全警告邮件已发送至: ${email}`);
        } catch (error) {
            console.error('发送安全警告邮件失败:', error);
            throw error;
        }
    }

    // 验证邮件配置
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('邮件服务连接成功');
            return true;
        } catch (error) {
            console.error('邮件服务连接失败:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
```

## 9.6 认证路由配置

```javascript
// routes/auth.js
const express = require('express');
const { AuthController, loginLimiter, registerLimiter } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
    registerValidation,
    loginValidation,
    changePasswordValidation,
    resetPasswordValidation,
    emailValidation
} = require('../validators/authValidators');

const router = express.Router();

// 用户注册
router.post('/register', registerLimiter, registerValidation, AuthController.register);

// 用户登录
router.post('/login', loginLimiter, loginValidation, AuthController.login);

// 刷新令牌
router.post('/refresh-token', AuthController.refreshToken);

// 用户登出
router.post('/logout', AuthController.logout);

// 邮箱验证
router.post('/verify-email', AuthController.verifyEmail);

// 重发验证邮件
router.post('/resend-verification', emailValidation, AuthController.resendVerification);

// 忘记密码
router.post('/forgot-password', emailValidation, AuthController.forgotPassword);

// 重置密码
router.post('/reset-password', resetPasswordValidation, AuthController.resetPassword);

// 修改密码（需要认证）
router.post('/change-password', authenticate, changePasswordValidation, AuthController.changePassword);

// 获取当前用户信息（需要认证）
router.get('/me', authenticate, AuthController.getCurrentUser);

module.exports = router;
```

## 9.7 会话管理和安全

### 会话存储

```javascript
// config/session.js
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('../models');

// 创建会话存储
const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'sessions',
    checkExpirationInterval: 15 * 60 * 1000, // 15分钟检查一次过期会话
    expiration: 24 * 60 * 60 * 1000 // 24小时过期
});

// 会话配置
const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        sameSite: 'strict'
    },
    name: 'sessionId' // 自定义会话ID名称
};

// 同步会话表
sessionStore.sync();

module.exports = {
    sessionConfig,
    sessionStore
};
```

### 安全中间件

```javascript
// middleware/security.js
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// CORS 配置
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
        
        // 允许没有 origin 的请求（如移动应用）
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('不被 CORS 策略允许'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

// 全局限流
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100个请求
    message: {
        success: false,
        message: '请求过于频繁，请稍后重试'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// 慢速响应（在达到限制前降低响应速度）
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15分钟
    delayAfter: 50, // 50个请求后开始延迟
    delayMs: 500 // 每个请求延迟500ms
});

// Helmet 安全配置
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

module.exports = {
    corsOptions,
    globalLimiter,
    speedLimiter,
    helmetConfig
};
```

### IP 白名单和黑名单

```javascript
// middleware/ipFilter.js
const ipRangeCheck = require('ip-range-check');

class IPFilter {
    constructor() {
        this.whitelist = process.env.IP_WHITELIST?.split(',') || [];
        this.blacklist = process.env.IP_BLACKLIST?.split(',') || [];
    }

    // IP 白名单中间件
    whitelist() {
        return (req, res, next) => {
            if (this.whitelist.length === 0) {
                return next();
            }

            const clientIP = this.getClientIP(req);
            const isAllowed = this.whitelist.some(range => 
                ipRangeCheck(clientIP, range)
            );

            if (!isAllowed) {
                return res.status(403).json({
                    success: false,
                    message: 'IP地址不在允许范围内'
                });
            }

            next();
        };
    }

    // IP 黑名单中间件
    blacklist() {
        return (req, res, next) => {
            const clientIP = this.getClientIP(req);
            const isBlocked = this.blacklist.some(range => 
                ipRangeCheck(clientIP, range)
            );

            if (isBlocked) {
                return res.status(403).json({
                    success: false,
                    message: 'IP地址已被禁止访问'
                });
            }

            next();
        };
    }

    // 获取客户端真实IP
    getClientIP(req) {
        return req.ip ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'];
    }

    // 动态添加到黑名单
    addToBlacklist(ip) {
        if (!this.blacklist.includes(ip)) {
            this.blacklist.push(ip);
        }
    }

    // 从黑名单移除
    removeFromBlacklist(ip) {
        const index = this.blacklist.indexOf(ip);
        if (index > -1) {
            this.blacklist.splice(index, 1);
        }
    }
}

module.exports = new IPFilter();
```

## 9.8 双因素认证（2FA）

### 2FA 工具类

```javascript
// utils/twoFactorAuth.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class TwoFactorAuth {
    // 生成2FA密钥
    static generateSecret(user) {
        const secret = speakeasy.generateSecret({
            name: `${process.env.APP_NAME} (${user.email})`,
            issuer: process.env.APP_NAME,
            length: 32
        });

        return {
            secret: secret.base32,
            otpauthUrl: secret.otpauth_url
        };
    }

    // 生成QR码
    static async generateQRCode(otpauthUrl) {
        try {
            return await QRCode.toDataURL(otpauthUrl);
        } catch (error) {
            throw new Error('生成QR码失败');
        }
    }

    // 验证TOTP令牌
    static verifyToken(secret, token, window = 2) {
        return speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window // 允许的时间窗口
        });
    }

    // 生成备用恢复码
    static generateRecoveryCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            codes.push(code);
        }
        return codes;
    }

    // 验证恢复码
    static async verifyRecoveryCode(userId, code) {
        const { RecoveryCode } = require('../models');
        
        const recoveryCode = await RecoveryCode.findOne({
            where: {
                userId,
                code,
                used: false
            }
        });

        if (!recoveryCode) {
            return false;
        }

        // 标记为已使用
        await recoveryCode.update({ used: true, usedAt: new Date() });
        return true;
    }
}

module.exports = TwoFactorAuth;
```

### 恢复码模型

```javascript
// models/RecoveryCode.js
module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');
    
    const RecoveryCode = sequelize.define('RecoveryCode', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        code: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        used: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        usedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'recovery_codes',
        timestamps: true
    });

    return RecoveryCode;
};
```

### 2FA 控制器

```javascript
// controllers/twoFactorController.js
const TwoFactorAuth = require('../utils/twoFactorAuth');
const { User, RecoveryCode } = require('../models');

class TwoFactorController {
    // 启用2FA - 第一步：生成密钥
    static async setupTwoFactor(req, res) {
        try {
            const user = req.user;

            if (user.twoFactorEnabled) {
                return res.status(400).json({
                    success: false,
                    message: '双因素认证已启用'
                });
            }

            // 生成密钥
            const { secret, otpauthUrl } = TwoFactorAuth.generateSecret(user);
            
            // 生成QR码
            const qrCode = await TwoFactorAuth.generateQRCode(otpauthUrl);

            // 临时保存密钥（未启用）
            await user.update({ twoFactorSecret: secret });

            res.json({
                success: true,
                message: '请扫描QR码并输入验证码完成设置',
                data: {
                    qrCode,
                    secret // 用于手动输入
                }
            });

        } catch (error) {
            console.error('设置2FA错误:', error);
            res.status(500).json({
                success: false,
                message: '设置失败'
            });
        }
    }

    // 启用2FA - 第二步：验证并启用
    static async enableTwoFactor(req, res) {
        try {
            const { token } = req.body;
            const user = req.user;

            if (!user.twoFactorSecret) {
                return res.status(400).json({
                    success: false,
                    message: '请先设置双因素认证'
                });
            }

            // 验证令牌
            const isValid = TwoFactorAuth.verifyToken(user.twoFactorSecret, token);
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: '验证码错误'
                });
            }

            // 生成恢复码
            const recoveryCodes = TwoFactorAuth.generateRecoveryCodes();
            
            // 保存恢复码
            const recoveryCodeRecords = recoveryCodes.map(code => ({
                userId: user.id,
                code
            }));
            await RecoveryCode.bulkCreate(recoveryCodeRecords);

            // 启用2FA
            await user.update({ twoFactorEnabled: true });

            res.json({
                success: true,
                message: '双因素认证已启用',
                data: {
                    recoveryCodes
                }
            });

        } catch (error) {
            console.error('启用2FA错误:', error);
            res.status(500).json({
                success: false,
                message: '启用失败'
            });
        }
    }

    // 禁用2FA
    static async disableTwoFactor(req, res) {
        try {
            const { password, token } = req.body;
            const user = req.user;

            if (!user.twoFactorEnabled) {
                return res.status(400).json({
                    success: false,
                    message: '双因素认证未启用'
                });
            }

            // 验证密码
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: '密码错误'
                });
            }

            // 验证2FA令牌
            const isTokenValid = TwoFactorAuth.verifyToken(user.twoFactorSecret, token);
            if (!isTokenValid) {
                return res.status(400).json({
                    success: false,
                    message: '验证码错误'
                });
            }

            // 禁用2FA并清理相关数据
            await user.update({
                twoFactorEnabled: false,
                twoFactorSecret: null
            });

            // 删除恢复码
            await RecoveryCode.destroy({
                where: { userId: user.id }
            });

            res.json({
                success: true,
                message: '双因素认证已禁用'
            });

        } catch (error) {
            console.error('禁用2FA错误:', error);
            res.status(500).json({
                success: false,
                message: '禁用失败'
            });
        }
    }

    // 验证2FA令牌
    static async verifyTwoFactor(req, res) {
        try {
            const { token, recoveryCode } = req.body;
            const user = req.user;

            if (!user.twoFactorEnabled) {
                return res.status(400).json({
                    success: false,
                    message: '双因素认证未启用'
                });
            }

            let isValid = false;

            if (token) {
                // 验证TOTP令牌
                isValid = TwoFactorAuth.verifyToken(user.twoFactorSecret, token);
            } else if (recoveryCode) {
                // 验证恢复码
                isValid = await TwoFactorAuth.verifyRecoveryCode(user.id, recoveryCode);
            }

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: '验证码或恢复码错误'
                });
            }

            res.json({
                success: true,
                message: '验证成功'
            });

        } catch (error) {
            console.error('验证2FA错误:', error);
            res.status(500).json({
                success: false,
                message: '验证失败'
            });
        }
    }

    // 重新生成恢复码
    static async regenerateRecoveryCodes(req, res) {
        try {
            const { password } = req.body;
            const user = req.user;

            if (!user.twoFactorEnabled) {
                return res.status(400).json({
                    success: false,
                    message: '双因素认证未启用'
                });
            }

            // 验证密码
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: '密码错误'
                });
            }

            // 删除旧的恢复码
            await RecoveryCode.destroy({
                where: { userId: user.id }
            });

            // 生成新的恢复码
            const recoveryCodes = TwoFactorAuth.generateRecoveryCodes();
            const recoveryCodeRecords = recoveryCodes.map(code => ({
                userId: user.id,
                code
            }));
            await RecoveryCode.bulkCreate(recoveryCodeRecords);

            res.json({
                success: true,
                message: '恢复码已重新生成',
                data: {
                    recoveryCodes
                }
            });

        } catch (error) {
            console.error('重新生成恢复码错误:', error);
            res.status(500).json({
                success: false,
                message: '生成失败'
            });
        }
    }
}

module.exports = TwoFactorController;
```

## 9.9 OAuth 第三方登录

### OAuth 配置

```javascript
// config/oauth.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { User } = require('../models');

// Google OAuth 策略
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // 查找现有用户
        let user = await User.findOne({
            where: { googleId: profile.id }
        });

        if (user) {
            return done(null, user);
        }

        // 检查邮箱是否已存在
        user = await User.findOne({
            where: { email: profile.emails[0].value }
        });

        if (user) {
            // 关联Google账户
            await user.update({ googleId: profile.id });
            return done(null, user);
        }

        // 创建新用户
        user = await User.create({
            googleId: profile.id,
            username: profile.emails[0].value.split('@')[0],
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            avatar: profile.photos[0].value,
            emailVerified: true,
            status: 'active',
            password: Math.random().toString(36) // 随机密码
        });

        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

// GitHub OAuth 策略
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({
            where: { githubId: profile.id }
        });

        if (user) {
            return done(null, user);
        }

        // 检查邮箱是否已存在
        const email = profile.emails?.[0]?.value;
        if (email) {
            user = await User.findOne({ where: { email } });
            if (user) {
                await user.update({ githubId: profile.id });
                return done(null, user);
            }
        }

        // 创建新用户
        user = await User.create({
            githubId: profile.id,
            username: profile.username,
            email: email || `${profile.username}@github.local`,
            firstName: profile.displayName?.split(' ')[0] || profile.username,
            lastName: profile.displayName?.split(' ')[1] || '',
            avatar: profile.photos[0].value,
            emailVerified: !!email,
            status: 'active',
            password: Math.random().toString(36)
        });

        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

// 序列化用户
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// 反序列化用户
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
```

### OAuth 控制器

```javascript
// controllers/oauthController.js
const JWTUtils = require('../utils/jwtUtils');

class OAuthController {
    // OAuth 成功回调
    static async oauthSuccess(req, res) {
        try {
            const user = req.user;
            
            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
            }

            // 生成JWT令牌
            const tokens = JWTUtils.generateTokenPair(user);

            // 重定向到前端，携带令牌
            const redirectUrl = `${process.env.FRONTEND_URL}/oauth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`;
            res.redirect(redirectUrl);

        } catch (error) {
            console.error('OAuth成功回调错误:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
        }
    }

    // OAuth 失败回调
    static async oauthFailure(req, res) {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // 解绑第三方账户
    static async unlinkOAuth(req, res) {
        try {
            const { provider } = req.params;
            const user = req.user;

            // 检查是否设置了密码（防止无法登录）
            if (!user.password) {
                return res.status(400).json({
                    success: false,
                    message: '请先设置密码后再解绑第三方账户'
                });
            }

            const updateData = {};
            switch (provider) {
                case 'google':
                    updateData.googleId = null;
                    break;
                case 'github':
                    updateData.githubId = null;
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: '不支持的第三方平台'
                    });
            }

            await user.update(updateData);

            res.json({
                success: true,
                message: `${provider} 账户已解绑`
            });

        } catch (error) {
            console.error('解绑OAuth错误:', error);
            res.status(500).json({
                success: false,
                message: '解绑失败'
            });
        }
    }
}

module.exports = OAuthController;
```

### OAuth 路由

```javascript
// routes/oauth.js
const express = require('express');
const passport = require('../config/oauth');
const OAuthController = require('../controllers/oauthController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Google OAuth
router.get('/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/failure' }),
    OAuthController.oauthSuccess
);

// GitHub OAuth
router.get('/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/auth/failure' }),
    OAuthController.oauthSuccess
);

// OAuth 失败
router.get('/failure', OAuthController.oauthFailure);

// 解绑第三方账户
router.delete('/unlink/:provider', authenticate, OAuthController.unlinkOAuth);

module.exports = router;
```

## 9.10 本章小结

### 核心知识点

1. **认证与授权基础**
   - 理解认证和授权的区别
   - 掌握用户模型设计
   - 学习角色和权限管理

2. **密码安全**
   - 密码强度验证
   - bcrypt 加密存储
   - 密码历史管理
   - 防止密码泄露

3. **JWT 令牌认证**
   - 访问令牌和刷新令牌
   - 令牌验证和刷新
   - 安全的令牌管理

4. **认证中间件**
   - 基础认证检查
   - 角色权限控制
   - 资源所有权验证

5. **安全防护**
   - 登录限流和防暴力破解
   - 会话管理
   - IP 过滤
   - 安全头设置

6. **双因素认证**
   - TOTP 令牌生成和验证
   - 恢复码管理
   - QR 码生成

7. **第三方登录**
   - OAuth 2.0 集成
   - Google 和 GitHub 登录
   - 账户关联和解绑

### 实践成果

- ✅ 完整的用户认证系统
- ✅ 安全的密码管理
- ✅ JWT 令牌认证机制
- ✅ 基于角色的权限控制
- ✅ 双因素认证功能
- ✅ 第三方登录集成
- ✅ 全面的安全防护

## 9.11 课后练习

### 基础练习

1. **用户注册登录**
   - 实现完整的用户注册流程
   - 添加邮箱验证功能
   - 实现密码重置功能

2. **权限管理**
   - 创建角色管理界面
   - 实现权限分配功能
   - 测试不同角色的访问控制

3. **安全加固**
   - 配置登录限流
   - 实现账户锁定机制
   - 添加安全日志记录

### 进阶练习

1. **双因素认证**
   - 实现完整的2FA设置流程
   - 添加恢复码管理
   - 创建2FA状态管理界面

2. **第三方登录**
   - 集成更多OAuth提供商
   - 实现账户合并功能
   - 添加社交账户管理

3. **高级安全**
   - 实现设备指纹识别
   - 添加异常登录检测
   - 创建安全审计系统

### 挑战练习

1. **单点登录（SSO）**
   - 实现SAML 2.0集成
   - 创建SSO服务提供商
   - 实现跨域认证

2. **生物识别认证**
   - 集成WebAuthn API
   - 实现指纹/面部识别
   - 添加硬件密钥支持

3. **零信任架构**
   - 实现持续身份验证
   - 添加设备信任评估
   - 创建动态权限调整

## 下一章预告

在下一章《文件上传和处理》中，我们将学习：

- 文件上传的安全处理
- 图片处理和优化
- 文件存储策略
- 云存储集成
- 文件访问控制
- 大文件上传处理

## 学习资源

### 官方文档
- [Passport.js 官方文档](http://www.passportjs.org/docs/)
- [JWT 官方网站](https://jwt.io/)
- [bcrypt 文档](https://github.com/kelektiv/node.bcrypt.js)

### 推荐阅读
- [OWASP 认证备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OAuth 2.0 安全最佳实践](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [密码存储备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### 在线教程
- [Node.js 安全最佳实践](https://nodejs.org/en/docs/guides/security/)
- [Express.js 安全更新](https://expressjs.com/en/advanced/best-practice-security.html)

### 视频资源
- [JWT 认证完整教程](https://www.youtube.com/watch?v=mbsmsi7l3r4)
- [Node.js 安全实践](https://www.youtube.com/watch?v=f2EqECiTBL8)
```