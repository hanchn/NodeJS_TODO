# 第10章 文件上传和处理

## 10.1 章节概述

### 学习目标

通过本章学习，你将掌握：

- 文件上传的基本原理和安全考虑
- 使用 Multer 处理文件上传
- 图片处理和优化技术
- 文件存储策略和云存储集成
- 文件访问控制和权限管理
- 大文件上传和断点续传
- 文件类型验证和安全防护

### 技术要点

- **文件上传中间件**：Multer 配置和使用
- **图片处理**：Sharp 图片处理库
- **文件验证**：MIME 类型检查和文件签名验证
- **存储策略**：本地存储、云存储（AWS S3、阿里云 OSS）
- **安全防护**：文件类型限制、大小限制、病毒扫描
- **性能优化**：文件压缩、CDN 加速、缓存策略

## 10.2 文件上传基础

### Multer 中间件配置

```javascript
// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 确保上传目录存在
const ensureUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// 生成唯一文件名
const generateFileName = (originalname) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(originalname);
    return `${timestamp}-${randomString}${ext}`;
};

// 本地存储配置
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath;
        
        // 根据文件类型确定存储路径
        if (file.mimetype.startsWith('image/')) {
            uploadPath = path.join(process.cwd(), 'uploads/images');
        } else if (file.mimetype.startsWith('video/')) {
            uploadPath = path.join(process.cwd(), 'uploads/videos');
        } else if (file.mimetype === 'application/pdf') {
            uploadPath = path.join(process.cwd(), 'uploads/documents');
        } else {
            uploadPath = path.join(process.cwd(), 'uploads/others');
        }
        
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const fileName = generateFileName(file.originalname);
        cb(null, fileName);
    }
});

// 内存存储配置（用于云存储）
const memoryStorage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = {
        'image/jpeg': true,
        'image/png': true,
        'image/gif': true,
        'image/webp': true,
        'application/pdf': true,
        'text/plain': true,
        'application/msword': true,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true
    };
    
    if (allowedTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
    }
};

// 文件大小限制
const limits = {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // 最多5个文件
};

// 创建上传实例
const uploadLocal = multer({
    storage: localStorage,
    fileFilter,
    limits
});

const uploadMemory = multer({
    storage: memoryStorage,
    fileFilter,
    limits
});

// 特定类型的上传配置
const uploadAvatar = multer({
    storage: memoryStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('头像只能是图片文件'), false);
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
});

module.exports = {
    uploadLocal,
    uploadMemory,
    uploadAvatar,
    generateFileName,
    ensureUploadDir
};
```

### 文件验证工具

```javascript
// utils/fileValidator.js
const fs = require('fs');
const path = require('path');

class FileValidator {
    // 文件签名映射
    static fileSignatures = {
        // 图片格式
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/gif': [0x47, 0x49, 0x46],
        'image/webp': [0x52, 0x49, 0x46, 0x46],
        
        // 文档格式
        'application/pdf': [0x25, 0x50, 0x44, 0x46],
        'application/zip': [0x50, 0x4B, 0x03, 0x04],
        
        // 视频格式
        'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
        'video/avi': [0x52, 0x49, 0x46, 0x46]
    };

    // 验证文件签名
    static validateFileSignature(filePath, mimeType) {
        try {
            const signature = this.fileSignatures[mimeType];
            if (!signature) {
                return true; // 如果没有定义签名，跳过验证
            }

            const buffer = fs.readFileSync(filePath);
            const fileHeader = Array.from(buffer.slice(0, signature.length));
            
            return signature.every((byte, index) => byte === fileHeader[index]);
        } catch (error) {
            console.error('文件签名验证失败:', error);
            return false;
        }
    }

    // 验证文件扩展名
    static validateFileExtension(filename, mimeType) {
        const ext = path.extname(filename).toLowerCase();
        const mimeToExt = {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'image/webp': ['.webp'],
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        };

        const allowedExts = mimeToExt[mimeType];
        return allowedExts ? allowedExts.includes(ext) : false;
    }

    // 检查文件是否为恶意文件
    static async scanForMalware(filePath) {
        // 这里可以集成病毒扫描引擎
        // 例如 ClamAV 或其他商业解决方案
        
        // 简单的恶意文件检查
        const dangerousExtensions = [
            '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
            '.vbs', '.js', '.jar', '.ps1', '.sh'
        ];
        
        const ext = path.extname(filePath).toLowerCase();
        if (dangerousExtensions.includes(ext)) {
            return false;
        }

        // 检查文件内容中的可疑模式
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const suspiciousPatterns = [
                /<script[^>]*>.*?<\/script>/gi,
                /javascript:/gi,
                /vbscript:/gi,
                /onload=/gi,
                /onerror=/gi
            ];

            return !suspiciousPatterns.some(pattern => pattern.test(content));
        } catch (error) {
            // 如果无法读取为文本，可能是二进制文件，跳过内容检查
            return true;
        }
    }

    // 综合文件验证
    static async validateFile(filePath, originalName, mimeType) {
        const validations = {
            extension: this.validateFileExtension(originalName, mimeType),
            signature: this.validateFileSignature(filePath, mimeType),
            malware: await this.scanForMalware(filePath)
        };

        return {
            isValid: Object.values(validations).every(Boolean),
            details: validations
        };
    }
}

module.exports = FileValidator;
```

## 10.3 图片处理和优化

### Sharp 图片处理服务

```javascript
// services/imageService.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class ImageService {
    // 图片尺寸配置
    static sizes = {
        thumbnail: { width: 150, height: 150 },
        small: { width: 300, height: 300 },
        medium: { width: 600, height: 600 },
        large: { width: 1200, height: 1200 },
        avatar: { width: 200, height: 200 }
    };

    // 处理头像图片
    static async processAvatar(inputBuffer, outputPath) {
        try {
            const { width, height } = this.sizes.avatar;
            
            await sharp(inputBuffer)
                .resize(width, height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({
                    quality: 90,
                    progressive: true
                })
                .toFile(outputPath);

            return {
                success: true,
                path: outputPath,
                size: { width, height }
            };
        } catch (error) {
            console.error('头像处理失败:', error);
            throw new Error('头像处理失败');
        }
    }

    // 生成多种尺寸的图片
    static async generateMultipleSizes(inputPath, outputDir, baseName) {
        try {
            const results = {};
            const image = sharp(inputPath);
            const metadata = await image.metadata();

            // 确保输出目录存在
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            for (const [sizeName, dimensions] of Object.entries(this.sizes)) {
                // 跳过比原图更大的尺寸
                if (dimensions.width > metadata.width || dimensions.height > metadata.height) {
                    continue;
                }

                const outputPath = path.join(outputDir, `${baseName}_${sizeName}.jpg`);
                
                await sharp(inputPath)
                    .resize(dimensions.width, dimensions.height, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({
                        quality: 85,
                        progressive: true
                    })
                    .toFile(outputPath);

                results[sizeName] = {
                    path: outputPath,
                    size: dimensions
                };
            }

            return results;
        } catch (error) {
            console.error('图片尺寸生成失败:', error);
            throw new Error('图片处理失败');
        }
    }

    // 图片压缩
    static async compressImage(inputPath, outputPath, quality = 80) {
        try {
            const image = sharp(inputPath);
            const metadata = await image.metadata();

            let pipeline = image;

            // 根据图片格式选择压缩方式
            switch (metadata.format) {
                case 'jpeg':
                    pipeline = pipeline.jpeg({ quality, progressive: true });
                    break;
                case 'png':
                    pipeline = pipeline.png({ 
                        compressionLevel: 9,
                        adaptiveFiltering: true
                    });
                    break;
                case 'webp':
                    pipeline = pipeline.webp({ quality });
                    break;
                default:
                    // 转换为JPEG
                    pipeline = pipeline.jpeg({ quality, progressive: true });
            }

            await pipeline.toFile(outputPath);

            // 获取压缩后的文件大小
            const originalSize = fs.statSync(inputPath).size;
            const compressedSize = fs.statSync(outputPath).size;
            const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

            return {
                success: true,
                originalSize,
                compressedSize,
                compressionRatio: `${compressionRatio}%`,
                outputPath
            };
        } catch (error) {
            console.error('图片压缩失败:', error);
            throw new Error('图片压缩失败');
        }
    }

    // 添加水印
    static async addWatermark(inputPath, outputPath, watermarkText) {
        try {
            const image = sharp(inputPath);
            const { width, height } = await image.metadata();

            // 创建文字水印
            const watermarkSvg = `
                <svg width="${width}" height="${height}">
                    <text x="${width - 150}" y="${height - 30}" 
                          font-family="Arial" font-size="20" 
                          fill="rgba(255,255,255,0.7)" 
                          text-anchor="end">${watermarkText}</text>
                </svg>
            `;

            await image
                .composite([{
                    input: Buffer.from(watermarkSvg),
                    gravity: 'southeast'
                }])
                .toFile(outputPath);

            return {
                success: true,
                outputPath
            };
        } catch (error) {
            console.error('添加水印失败:', error);
            throw new Error('添加水印失败');
        }
    }

    // 图片格式转换
    static async convertFormat(inputPath, outputPath, format = 'jpeg', options = {}) {
        try {
            const image = sharp(inputPath);
            let pipeline;

            switch (format.toLowerCase()) {
                case 'jpeg':
                case 'jpg':
                    pipeline = image.jpeg({ quality: options.quality || 85 });
                    break;
                case 'png':
                    pipeline = image.png({ compressionLevel: options.compressionLevel || 6 });
                    break;
                case 'webp':
                    pipeline = image.webp({ quality: options.quality || 85 });
                    break;
                case 'avif':
                    pipeline = image.avif({ quality: options.quality || 85 });
                    break;
                default:
                    throw new Error(`不支持的格式: ${format}`);
            }

            await pipeline.toFile(outputPath);

            return {
                success: true,
                outputPath,
                format
            };
        } catch (error) {
            console.error('格式转换失败:', error);
            throw new Error('格式转换失败');
        }
    }

    // 获取图片信息
    static async getImageInfo(imagePath) {
        try {
            const metadata = await sharp(imagePath).metadata();
            const stats = fs.statSync(imagePath);

            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: stats.size,
                density: metadata.density,
                hasAlpha: metadata.hasAlpha,
                channels: metadata.channels,
                colorspace: metadata.space
            };
        } catch (error) {
            console.error('获取图片信息失败:', error);
            throw new Error('获取图片信息失败');
        }
    }
}

module.exports = ImageService;
```

## 10.4 文件存储策略

### 本地存储服务

```javascript
// services/localStorageService.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

class LocalStorageService {
    constructor(baseDir = 'uploads') {
        this.baseDir = path.resolve(baseDir);
        this.ensureBaseDir();
    }

    // 确保基础目录存在
    async ensureBaseDir() {
        try {
            await stat(this.baseDir);
        } catch (error) {
            if (error.code === 'ENOENT') {
                await mkdir(this.baseDir, { recursive: true });
            }
        }
    }

    // 保存文件
    async saveFile(buffer, relativePath) {
        try {
            const fullPath = path.join(this.baseDir, relativePath);
            const dir = path.dirname(fullPath);

            // 确保目录存在
            await mkdir(dir, { recursive: true });

            // 写入文件
            await writeFile(fullPath, buffer);

            return {
                success: true,
                path: relativePath,
                fullPath,
                size: buffer.length
            };
        } catch (error) {
            console.error('保存文件失败:', error);
            throw new Error('文件保存失败');
        }
    }

    // 删除文件
    async deleteFile(relativePath) {
        try {
            const fullPath = path.join(this.baseDir, relativePath);
            await unlink(fullPath);
            
            return {
                success: true,
                message: '文件删除成功'
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                return {
                    success: true,
                    message: '文件不存在'
                };
            }
            console.error('删除文件失败:', error);
            throw new Error('文件删除失败');
        }
    }

    // 获取文件信息
    async getFileInfo(relativePath) {
        try {
            const fullPath = path.join(this.baseDir, relativePath);
            const stats = await stat(fullPath);

            return {
                exists: true,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory()
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                return { exists: false };
            }
            throw error;
        }
    }

    // 生成文件URL
    generateFileUrl(relativePath) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        return `${baseUrl}/uploads/${relativePath}`;
    }

    // 清理过期文件
    async cleanupExpiredFiles(maxAge = 7 * 24 * 60 * 60 * 1000) { // 默认7天
        try {
            const now = Date.now();
            const cleanupResults = [];

            const cleanupDir = async (dir) => {
                const items = await fs.promises.readdir(dir, { withFileTypes: true });
                
                for (const item of items) {
                    const itemPath = path.join(dir, item.name);
                    
                    if (item.isDirectory()) {
                        await cleanupDir(itemPath);
                    } else {
                        const stats = await stat(itemPath);
                        const age = now - stats.mtime.getTime();
                        
                        if (age > maxAge) {
                            await unlink(itemPath);
                            cleanupResults.push({
                                path: itemPath,
                                age: Math.floor(age / (24 * 60 * 60 * 1000)) + ' days'
                            });
                        }
                    }
                }
            };

            await cleanupDir(this.baseDir);

            return {
                success: true,
                cleanedFiles: cleanupResults.length,
                details: cleanupResults
            };
        } catch (error) {
            console.error('清理过期文件失败:', error);
            throw new Error('清理过期文件失败');
        }
    }
}

module.exports = LocalStorageService;
```

### AWS S3 存储服务

```javascript
// services/s3StorageService.js
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

class S3StorageService {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        });
        this.bucket = process.env.AWS_S3_BUCKET;
    }

    // 上传文件到S3
    async uploadFile(buffer, originalName, mimeType, folder = '') {
        try {
            const key = this.generateKey(originalName, folder);
            
            const params = {
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
                ACL: 'public-read',
                Metadata: {
                    'original-name': originalName,
                    'upload-time': new Date().toISOString()
                }
            };

            const result = await this.s3.upload(params).promise();

            return {
                success: true,
                key: result.Key,
                url: result.Location,
                etag: result.ETag,
                size: buffer.length
            };
        } catch (error) {
            console.error('S3上传失败:', error);
            throw new Error('文件上传失败');
        }
    }

    // 删除S3文件
    async deleteFile(key) {
        try {
            const params = {
                Bucket: this.bucket,
                Key: key
            };

            await this.s3.deleteObject(params).promise();

            return {
                success: true,
                message: '文件删除成功'
            };
        } catch (error) {
            console.error('S3删除失败:', error);
            throw new Error('文件删除失败');
        }
    }

    // 获取文件信息
    async getFileInfo(key) {
        try {
            const params = {
                Bucket: this.bucket,
                Key: key
            };

            const result = await this.s3.headObject(params).promise();

            return {
                exists: true,
                size: result.ContentLength,
                contentType: result.ContentType,
                lastModified: result.LastModified,
                etag: result.ETag,
                metadata: result.Metadata
            };
        } catch (error) {
            if (error.code === 'NotFound') {
                return { exists: false };
            }
            throw error;
        }
    }

    // 生成预签名URL
    async generatePresignedUrl(key, expiresIn = 3600) {
        try {
            const params = {
                Bucket: this.bucket,
                Key: key,
                Expires: expiresIn
            };

            const url = await this.s3.getSignedUrlPromise('getObject', params);

            return {
                success: true,
                url,
                expiresIn
            };
        } catch (error) {
            console.error('生成预签名URL失败:', error);
            throw new Error('生成访问链接失败');
        }
    }

    // 生成上传预签名URL
    async generateUploadPresignedUrl(key, contentType, expiresIn = 3600) {
        try {
            const params = {
                Bucket: this.bucket,
                Key: key,
                ContentType: contentType,
                Expires: expiresIn
            };

            const url = await this.s3.getSignedUrlPromise('putObject', params);

            return {
                success: true,
                uploadUrl: url,
                key,
                expiresIn
            };
        } catch (error) {
            console.error('生成上传预签名URL失败:', error);
            throw new Error('生成上传链接失败');
        }
    }

    // 复制文件
    async copyFile(sourceKey, destinationKey) {
        try {
            const params = {
                Bucket: this.bucket,
                CopySource: `${this.bucket}/${sourceKey}`,
                Key: destinationKey
            };

            const result = await this.s3.copyObject(params).promise();

            return {
                success: true,
                sourceKey,
                destinationKey,
                etag: result.CopyObjectResult.ETag
            };
        } catch (error) {
            console.error('S3文件复制失败:', error);
            throw new Error('文件复制失败');
        }
    }

    // 列出文件
    async listFiles(prefix = '', maxKeys = 1000) {
        try {
            const params = {
                Bucket: this.bucket,
                Prefix: prefix,
                MaxKeys: maxKeys
            };

            const result = await this.s3.listObjectsV2(params).promise();

            return {
                success: true,
                files: result.Contents.map(item => ({
                    key: item.Key,
                    size: item.Size,
                    lastModified: item.LastModified,
                    etag: item.ETag
                })),
                isTruncated: result.IsTruncated,
                nextContinuationToken: result.NextContinuationToken
            };
        } catch (error) {
            console.error('S3文件列表获取失败:', error);
            throw new Error('获取文件列表失败');
        }
    }

    // 生成文件键名
    generateKey(originalName, folder = '') {
        const timestamp = Date.now();
        const uuid = uuidv4();
        const ext = originalName.split('.').pop();
        const baseName = `${timestamp}-${uuid}.${ext}`;
        
        return folder ? `${folder}/${baseName}` : baseName;
    }

    // 获取公共URL
    getPublicUrl(key) {
        return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
}

module.exports = S3StorageService;
```

## 10.5 文件模型和控制器

### 文件模型

```javascript
// models/File.js
module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');
    
    const File = sequelize.define('File', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        originalName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: '原始文件名'
        },
        fileName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: '存储文件名'
        },
        filePath: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: '文件路径'
        },
        fileUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: '文件访问URL'
        },
        mimeType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '文件MIME类型'
        },
        fileSize: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: '文件大小（字节）'
        },
        fileHash: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: '文件哈希值（用于去重）'
        },
        storageType: {
            type: DataTypes.ENUM('local', 's3', 'oss'),
            defaultValue: 'local',
            comment: '存储类型'
        },
        category: {
            type: DataTypes.ENUM('image', 'document', 'video', 'audio', 'other'),
            allowNull: false,
            comment: '文件分类'
        },
        uploadedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            comment: '上传用户ID'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否公开访问'
        },
        downloadCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '下载次数'
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '文件元数据（如图片尺寸等）'
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '过期时间'
        },
        status: {
            type: DataTypes.ENUM('uploading', 'processing', 'completed', 'failed', 'deleted'),
            defaultValue: 'completed',
            comment: '文件状态'
        }
    }, {
        tableName: 'files',
        timestamps: true,
        indexes: [
            {
                fields: ['uploadedBy']
            },
            {
                fields: ['fileHash']
            },
            {
                fields: ['category']
            },
            {
                fields: ['status']
            }
        ]
    });

    return File;
};
```

### 文件控制器

```javascript
// controllers/fileController.js
const { File, User } = require('../models');
const ImageService = require('../services/imageService');
const LocalStorageService = require('../services/localStorageService');
const S3StorageService = require('../services/s3StorageService');
const FileValidator = require('../utils/fileValidator');
const crypto = require('crypto');
const path = require('path');

class FileController {
    // 上传文件
    static async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: '没有上传文件'
                });
            }

            const { file, user } = req;
            const { category = 'other', isPublic = false } = req.body;

            // 计算文件哈希
            const fileHash = crypto.createHash('sha256')
                .update(file.buffer)
                .digest('hex');

            // 检查文件是否已存在
            const existingFile = await File.findOne({
                where: { fileHash }
            });

            if (existingFile) {
                return res.json({
                    success: true,
                    message: '文件已存在',
                    data: existingFile
                });
            }

            // 确定存储服务
            const storageType = process.env.STORAGE_TYPE || 'local';
            let storageService;
            let uploadResult;

            if (storageType === 's3') {
                storageService = new S3StorageService();
                uploadResult = await storageService.uploadFile(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    category
                );
            } else {
                storageService = new LocalStorageService();
                const relativePath = `${category}/${Date.now()}-${file.originalname}`;
                uploadResult = await storageService.saveFile(file.buffer, relativePath);
                uploadResult.url = storageService.generateFileUrl(relativePath);
            }

            // 处理图片
            let metadata = null;
            if (file.mimetype.startsWith('image/')) {
                try {
                    // 如果是本地存储，从文件路径获取信息
                    const imagePath = storageType === 'local' ? uploadResult.fullPath : null;
                    if (imagePath) {
                        metadata = await ImageService.getImageInfo(imagePath);
                    }
                } catch (error) {
                    console.error('获取图片信息失败:', error);
                }
            }

            // 保存文件记录
            const fileRecord = await File.create({
                originalName: file.originalname,
                fileName: path.basename(uploadResult.path || uploadResult.key),
                filePath: uploadResult.path || uploadResult.key,
                fileUrl: uploadResult.url,
                mimeType: file.mimetype,
                fileSize: file.size,
                fileHash,
                storageType,
                category,
                uploadedBy: user.id,
                isPublic: Boolean(isPublic),
                metadata
            });

            res.json({
                success: true,
                message: '文件上传成功',
                data: fileRecord
            });

        } catch (error) {
            console.error('文件上传失败:', error);
            res.status(500).json({
                success: false,
                message: '文件上传失败'
            });
        }
    }

    // 上传头像
    static async uploadAvatar(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: '没有上传头像文件'
                });
            }

            const { file, user } = req;

            // 处理头像图片
            const avatarDir = path.join(process.cwd(), 'uploads/avatars');
            const avatarFileName = `avatar_${user.id}_${Date.now()}.jpg`;
            const avatarPath = path.join(avatarDir, avatarFileName);

            await ImageService.processAvatar(file.buffer, avatarPath);

            // 生成头像URL
            const storageService = new LocalStorageService();
            const avatarUrl = storageService.generateFileUrl(`avatars/${avatarFileName}`);

            // 删除旧头像文件
            if (user.avatar) {
                try {
                    const oldAvatarFile = await File.findOne({
                        where: {
                            uploadedBy: user.id,
                            category: 'image',
                            fileUrl: user.avatar
                        }
                    });

                    if (oldAvatarFile) {
                        await storageService.deleteFile(oldAvatarFile.filePath);
                        await oldAvatarFile.destroy();
                    }
                } catch (error) {
                    console.error('删除旧头像失败:', error);
                }
            }

            // 保存头像文件记录
            const avatarRecord = await File.create({
                originalName: file.originalname,
                fileName: avatarFileName,
                filePath: `avatars/${avatarFileName}`,
                fileUrl: avatarUrl,
                mimeType: 'image/jpeg',
                fileSize: file.size,
                fileHash: crypto.createHash('sha256').update(file.buffer).digest('hex'),
                storageType: 'local',
                category: 'image',
                uploadedBy: user.id,
                isPublic: true,
                metadata: await ImageService.getImageInfo(avatarPath)
            });

            // 更新用户头像
            await user.update({ avatar: avatarUrl });

            res.json({
                success: true,
                message: '头像上传成功',
                data: {
                    avatar: avatarUrl,
                    file: avatarRecord
                }
            });

        } catch (error) {
            console.error('头像上传失败:', error);
            res.status(500).json({
                success: false,
                message: '头像上传失败'
            });
        }
    }

    // 获取文件列表
    static async getFiles(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                category,
                mimeType,
                search
            } = req.query;

            const where = {
                uploadedBy: req.user.id,
                status: 'completed'
            };

            if (category) {
                where.category = category;
            }

            if (mimeType) {
                where.mimeType = {
                    [require('sequelize').Op.like]: `${mimeType}%`
                };
            }

            if (search) {
                where.originalName = {
                    [require('sequelize').Op.like]: `%${search}%`
                };
            }

            const { count, rows } = await File.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                order: [['createdAt', 'DESC']],
                include: [{
                    model: User,
                    as: 'uploader',
                    attributes: ['id', 'username', 'firstName', 'lastName']
                }]
            });

            res.json({
                success: true,
                data: {
                    files: rows,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(count / parseInt(limit))
                    }
                }
            });

        } catch (error) {
            console.error('获取文件列表失败:', error);
            res.status(500).json({
                success: false,
                message: '获取文件列表失败'
            });
        }
    }

    // 获取文件详情
    static async getFileById(req, res) {
        try {
            const { id } = req.params;
            const { user } = req;

            const file = await File.findOne({
                where: { id },
                include: [{
                    model: User,
                    as: 'uploader',
                    attributes: ['id', 'username', 'firstName', 'lastName']
                }]
            });

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            // 检查访问权限
            if (!file.isPublic && file.uploadedBy !== user.id) {
                return res.status(403).json({
                    success: false,
                    message: '没有访问权限'
                });
            }

            res.json({
                success: true,
                data: file
            });

        } catch (error) {
            console.error('获取文件详情失败:', error);
            res.status(500).json({
                success: false,
                message: '获取文件详情失败'
            });
        }
    }

    // 下载文件
    static async downloadFile(req, res) {
        try {
            const { id } = req.params;
            const { user } = req;

            const file = await File.findByPk(id);

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            // 检查访问权限
            if (!file.isPublic && file.uploadedBy !== user.id) {
                return res.status(403).json({
                    success: false,
                    message: '没有下载权限'
                });
            }

            // 增加下载次数
            await file.increment('downloadCount');

            // 根据存储类型处理下载
            if (file.storageType === 's3') {
                const s3Service = new S3StorageService();
                const presignedUrl = await s3Service.generatePresignedUrl(file.filePath);
                
                return res.json({
                    success: true,
                    downloadUrl: presignedUrl.url
                });
            } else {
                // 本地文件下载
                const filePath = path.join(process.cwd(), 'uploads', file.filePath);
                
                res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
                res.setHeader('Content-Type', file.mimeType);
                
                return res.sendFile(filePath);
            }

        } catch (error) {
            console.error('文件下载失败:', error);
            res.status(500).json({
                success: false,
                message: '文件下载失败'
            });
        }
    }

    // 删除文件
    static async deleteFile(req, res) {
        try {
            const { id } = req.params;
            const { user } = req;

            const file = await File.findByPk(id);

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            // 检查删除权限
            if (file.uploadedBy !== user.id) {
                return res.status(403).json({
                    success: false,
                    message: '没有删除权限'
                });
            }

            // 删除物理文件
            try {
                if (file.storageType === 's3') {
                    const s3Service = new S3StorageService();
                    await s3Service.deleteFile(file.filePath);
                } else {
                    const localService = new LocalStorageService();
                    await localService.deleteFile(file.filePath);
                }
            } catch (error) {
                console.error('删除物理文件失败:', error);
            }

            // 删除数据库记录
            await file.destroy();

            res.json({
                success: true,
                message: '文件删除成功'
            });

        } catch (error) {
            console.error('删除文件失败:', error);
            res.status(500).json({
                success: false,
                message: '删除文件失败'
            });
        }
    }

    // 更新文件信息
    static async updateFile(req, res) {
        try {
            const { id } = req.params;
            const { user } = req;
            const { originalName, isPublic, category } = req.body;

            const file = await File.findByPk(id);

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            // 检查修改权限
            if (file.uploadedBy !== user.id) {
                return res.status(403).json({
                    success: false,
                    message: '没有修改权限'
                });
            }

            // 更新文件信息
            const updateData = {};
            if (originalName) updateData.originalName = originalName;
            if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;
            if (category) updateData.category = category;

            await file.update(updateData);

            res.json({
                success: true,
                message: '文件信息更新成功',
                data: file
            });

        } catch (error) {
            console.error('更新文件信息失败:', error);
            res.status(500).json({
                success: false,
                message: '更新文件信息失败'
            });
        }
    }
}

module.exports = FileController;
```

## 10.6 文件上传路由

### 文件路由配置

```javascript
// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const FileController = require('../controllers/fileController');
const { uploadMemory, uploadAvatar } = require('../config/multer');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

// 文件上传验证规则
const fileUploadValidation = [
    body('category')
        .optional()
        .isIn(['image', 'document', 'video', 'audio', 'other'])
        .withMessage('文件分类无效'),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('公开状态必须是布尔值')
];

// 文件ID验证
const fileIdValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('文件ID必须是正整数')
];

// 文件更新验证
const fileUpdateValidation = [
    body('originalName')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('文件名长度必须在1-255字符之间'),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('公开状态必须是布尔值'),
    body('category')
        .optional()
        .isIn(['image', 'document', 'video', 'audio', 'other'])
        .withMessage('文件分类无效')
];

// 上传文件
router.post('/upload',
    authMiddleware,
    uploadMemory.single('file'),
    fileUploadValidation,
    validateRequest,
    FileController.uploadFile
);

// 上传头像
router.post('/upload/avatar',
    authMiddleware,
    uploadAvatar.single('avatar'),
    FileController.uploadAvatar
);

// 批量上传文件
router.post('/upload/batch',
    authMiddleware,
    uploadMemory.array('files', 5),
    fileUploadValidation,
    validateRequest,
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '没有上传文件'
                });
            }

            const uploadResults = [];
            const errors = [];

            for (const file of req.files) {
                try {
                    req.file = file;
                    const result = await FileController.uploadFile(req, res);
                    uploadResults.push(result);
                } catch (error) {
                    errors.push({
                        filename: file.originalname,
                        error: error.message
                    });
                }
            }

            res.json({
                success: true,
                message: '批量上传完成',
                data: {
                    successful: uploadResults,
                    failed: errors
                }
            });

        } catch (error) {
            console.error('批量上传失败:', error);
            res.status(500).json({
                success: false,
                message: '批量上传失败'
            });
        }
    }
);

// 获取文件列表
router.get('/',
    authMiddleware,
    FileController.getFiles
);

// 获取文件详情
router.get('/:id',
    authMiddleware,
    fileIdValidation,
    validateRequest,
    FileController.getFileById
);

// 下载文件
router.get('/:id/download',
    authMiddleware,
    fileIdValidation,
    validateRequest,
    FileController.downloadFile
);

// 更新文件信息
router.put('/:id',
    authMiddleware,
    fileIdValidation,
    fileUpdateValidation,
    validateRequest,
    FileController.updateFile
);

// 删除文件
router.delete('/:id',
    authMiddleware,
    fileIdValidation,
    validateRequest,
    FileController.deleteFile
);

// 获取上传预签名URL（用于大文件直传）
router.post('/presigned-url',
    authMiddleware,
    [
        body('filename')
            .notEmpty()
            .withMessage('文件名不能为空'),
        body('contentType')
            .notEmpty()
            .withMessage('文件类型不能为空'),
        body('fileSize')
            .isInt({ min: 1 })
            .withMessage('文件大小必须是正整数')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { filename, contentType, fileSize } = req.body;
            
            // 检查文件大小限制
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (fileSize > maxSize) {
                return res.status(400).json({
                    success: false,
                    message: '文件大小超过限制'
                });
            }

            const S3StorageService = require('../services/s3StorageService');
            const s3Service = new S3StorageService();
            
            const key = s3Service.generateKey(filename, 'uploads');
            const presignedUrl = await s3Service.generateUploadPresignedUrl(
                key,
                contentType,
                3600 // 1小时过期
            );

            res.json({
                success: true,
                data: presignedUrl
            });

        } catch (error) {
            console.error('生成预签名URL失败:', error);
            res.status(500).json({
                success: false,
                message: '生成上传链接失败'
            });
        }
    }
);

module.exports = router;
```

## 10.7 大文件上传和断点续传

### 分片上传服务

```javascript
// services/chunkUploadService.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

class ChunkUploadService {
    constructor() {
        this.tempDir = path.join(process.cwd(), 'temp/chunks');
        this.ensureTempDir();
    }

    // 确保临时目录存在
    async ensureTempDir() {
        try {
            await mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('创建临时目录失败:', error);
        }
    }

    // 保存文件分片
    async saveChunk(uploadId, chunkIndex, chunkData) {
        try {
            const chunkDir = path.join(this.tempDir, uploadId);
            await mkdir(chunkDir, { recursive: true });
            
            const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`);
            await writeFile(chunkPath, chunkData);

            return {
                success: true,
                chunkPath,
                chunkIndex
            };
        } catch (error) {
            console.error('保存分片失败:', error);
            throw new Error('保存分片失败');
        }
    }

    // 合并文件分片
    async mergeChunks(uploadId, totalChunks, outputPath) {
        try {
            const chunkDir = path.join(this.tempDir, uploadId);
            const writeStream = fs.createWriteStream(outputPath);

            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = path.join(chunkDir, `chunk_${i}`);
                const chunkData = await readFile(chunkPath);
                writeStream.write(chunkData);
            }

            writeStream.end();

            // 等待写入完成
            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            // 清理临时文件
            await this.cleanupChunks(uploadId);

            return {
                success: true,
                outputPath
            };
        } catch (error) {
            console.error('合并分片失败:', error);
            throw new Error('合并分片失败');
        }
    }

    // 检查分片完整性
    async verifyChunks(uploadId, totalChunks, expectedHashes) {
        try {
            const chunkDir = path.join(this.tempDir, uploadId);
            const missingChunks = [];
            const corruptedChunks = [];

            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = path.join(chunkDir, `chunk_${i}`);
                
                try {
                    const chunkData = await readFile(chunkPath);
                    
                    // 验证哈希值
                    if (expectedHashes && expectedHashes[i]) {
                        const chunkHash = crypto.createHash('md5')
                            .update(chunkData)
                            .digest('hex');
                        
                        if (chunkHash !== expectedHashes[i]) {
                            corruptedChunks.push(i);
                        }
                    }
                } catch (error) {
                    if (error.code === 'ENOENT') {
                        missingChunks.push(i);
                    } else {
                        throw error;
                    }
                }
            }

            return {
                isComplete: missingChunks.length === 0 && corruptedChunks.length === 0,
                missingChunks,
                corruptedChunks
            };
        } catch (error) {
            console.error('验证分片失败:', error);
            throw new Error('验证分片失败');
        }
    }

    // 获取上传进度
    async getUploadProgress(uploadId, totalChunks) {
        try {
            const chunkDir = path.join(this.tempDir, uploadId);
            let completedChunks = 0;

            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = path.join(chunkDir, `chunk_${i}`);
                try {
                    await fs.promises.access(chunkPath);
                    completedChunks++;
                } catch (error) {
                    // 分片不存在
                }
            }

            return {
                totalChunks,
                completedChunks,
                progress: Math.round((completedChunks / totalChunks) * 100)
            };
        } catch (error) {
            console.error('获取上传进度失败:', error);
            throw new Error('获取上传进度失败');
        }
    }

    // 清理分片文件
    async cleanupChunks(uploadId) {
        try {
            const chunkDir = path.join(this.tempDir, uploadId);
            const files = await fs.promises.readdir(chunkDir);
            
            for (const file of files) {
                await unlink(path.join(chunkDir, file));
            }
            
            await fs.promises.rmdir(chunkDir);
        } catch (error) {
            console.error('清理分片文件失败:', error);
        }
    }

    // 生成上传ID
    generateUploadId() {
        return crypto.randomBytes(16).toString('hex');
    }
}

module.exports = ChunkUploadService;
```

### 分片上传控制器

```javascript
// controllers/chunkUploadController.js
const ChunkUploadService = require('../services/chunkUploadService');
const { File } = require('../models');
const crypto = require('crypto');
const path = require('path');

class ChunkUploadController {
    // 初始化分片上传
    static async initChunkUpload(req, res) {
        try {
            const {
                filename,
                fileSize,
                chunkSize = 1024 * 1024, // 默认1MB
                fileHash
            } = req.body;

            // 检查文件是否已存在
            if (fileHash) {
                const existingFile = await File.findOne({
                    where: { fileHash }
                });

                if (existingFile) {
                    return res.json({
                        success: true,
                        message: '文件已存在，跳过上传',
                        data: {
                            skipUpload: true,
                            file: existingFile
                        }
                    });
                }
            }

            const chunkService = new ChunkUploadService();
            const uploadId = chunkService.generateUploadId();
            const totalChunks = Math.ceil(fileSize / chunkSize);

            // 可以在这里保存上传会话信息到数据库或缓存
            // 这里简化处理，实际项目中建议使用Redis等缓存

            res.json({
                success: true,
                data: {
                    uploadId,
                    totalChunks,
                    chunkSize
                }
            });

        } catch (error) {
            console.error('初始化分片上传失败:', error);
            res.status(500).json({
                success: false,
                message: '初始化上传失败'
            });
        }
    }

    // 上传文件分片
    static async uploadChunk(req, res) {
        try {
            const { uploadId, chunkIndex } = req.params;
            const chunkData = req.file.buffer;

            const chunkService = new ChunkUploadService();
            const result = await chunkService.saveChunk(
                uploadId,
                parseInt(chunkIndex),
                chunkData
            );

            res.json({
                success: true,
                message: '分片上传成功',
                data: result
            });

        } catch (error) {
            console.error('分片上传失败:', error);
            res.status(500).json({
                success: false,
                message: '分片上传失败'
            });
        }
    }

    // 完成分片上传
    static async completeChunkUpload(req, res) {
        try {
            const { uploadId } = req.params;
            const {
                filename,
                totalChunks,
                fileHash,
                mimeType,
                category = 'other'
            } = req.body;

            const chunkService = new ChunkUploadService();

            // 验证分片完整性
            const verification = await chunkService.verifyChunks(
                uploadId,
                totalChunks
            );

            if (!verification.isComplete) {
                return res.status(400).json({
                    success: false,
                    message: '文件分片不完整',
                    data: {
                        missingChunks: verification.missingChunks,
                        corruptedChunks: verification.corruptedChunks
                    }
                });
            }

            // 合并分片
            const outputDir = path.join(process.cwd(), 'uploads', category);
            const outputFilename = `${Date.now()}-${filename}`;
            const outputPath = path.join(outputDir, outputFilename);

            await chunkService.mergeChunks(uploadId, totalChunks, outputPath);

            // 计算文件大小
            const fs = require('fs');
            const stats = fs.statSync(outputPath);

            // 保存文件记录
            const fileRecord = await File.create({
                originalName: filename,
                fileName: outputFilename,
                filePath: `${category}/${outputFilename}`,
                fileUrl: `/uploads/${category}/${outputFilename}`,
                mimeType,
                fileSize: stats.size,
                fileHash,
                storageType: 'local',
                category,
                uploadedBy: req.user.id,
                isPublic: false
            });

            res.json({
                success: true,
                message: '文件上传完成',
                data: fileRecord
            });

        } catch (error) {
            console.error('完成分片上传失败:', error);
            res.status(500).json({
                success: false,
                message: '完成上传失败'
            });
        }
    }

    // 获取上传进度
    static async getUploadProgress(req, res) {
        try {
            const { uploadId } = req.params;
            const { totalChunks } = req.query;

            const chunkService = new ChunkUploadService();
            const progress = await chunkService.getUploadProgress(
                uploadId,
                parseInt(totalChunks)
            );

            res.json({
                success: true,
                data: progress
            });

        } catch (error) {
            console.error('获取上传进度失败:', error);
            res.status(500).json({
                success: false,
                message: '获取上传进度失败'
            });
        }
    }

    // 取消分片上传
    static async cancelChunkUpload(req, res) {
        try {
            const { uploadId } = req.params;

            const chunkService = new ChunkUploadService();
            await chunkService.cleanupChunks(uploadId);

            res.json({
                success: true,
                message: '上传已取消'
            });

        } catch (error) {
            console.error('取消上传失败:', error);
            res.status(500).json({
                success: false,
                message: '取消上传失败'
            });
        }
    }
}

module.exports = ChunkUploadController;
```

## 10.8 文件安全和访问控制

### 文件访问中间件

```javascript
// middleware/fileAccessMiddleware.js
const { File, User } = require('../models');
const path = require('path');
const fs = require('fs');

// 文件访问权限检查
const checkFileAccess = async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const user = req.user;

        // 获取文件信息
        const file = await File.findByPk(fileId, {
            include: [{
                model: User,
                as: 'uploader',
                attributes: ['id', 'username']
            }]
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: '文件不存在'
            });
        }

        // 检查文件状态
        if (file.status === 'deleted') {
            return res.status(404).json({
                success: false,
                message: '文件已被删除'
            });
        }

        // 检查文件是否过期
        if (file.expiresAt && new Date() > file.expiresAt) {
            return res.status(410).json({
                success: false,
                message: '文件已过期'
            });
        }

        // 权限检查
        let hasAccess = false;

        // 公开文件
        if (file.isPublic) {
            hasAccess = true;
        }
        // 文件所有者
        else if (user && file.uploadedBy === user.id) {
            hasAccess = true;
        }
        // 管理员权限
        else if (user && user.role === 'admin') {
            hasAccess = true;
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: '没有访问权限'
            });
        }

        // 将文件信息添加到请求对象
        req.fileInfo = file;
        next();

    } catch (error) {
        console.error('文件访问权限检查失败:', error);
        res.status(500).json({
            success: false,
            message: '权限检查失败'
        });
    }
};

// 文件下载限流
const downloadRateLimit = (maxDownloads = 10, windowMs = 60 * 1000) => {
    const downloads = new Map();

    return (req, res, next) => {
        const userId = req.user?.id || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // 清理过期记录
        const userDownloads = downloads.get(userId) || [];
        const validDownloads = userDownloads.filter(time => time > windowStart);

        if (validDownloads.length >= maxDownloads) {
            return res.status(429).json({
                success: false,
                message: '下载次数过多，请稍后再试'
            });
        }

        // 记录本次下载
        validDownloads.push(now);
        downloads.set(userId, validDownloads);

        next();
    };
};

// 文件类型安全检查
const fileTypeSecurityCheck = (req, res, next) => {
    const file = req.fileInfo;
    
    // 危险文件类型
    const dangerousTypes = [
        'application/x-executable',
        'application/x-msdownload',
        'application/x-msdos-program',
        'application/x-winexe',
        'application/x-javascript',
        'text/javascript'
    ];

    if (dangerousTypes.includes(file.mimeType)) {
        return res.status(403).json({
            success: false,
            message: '不允许下载此类型文件'
        });
    }

    // 检查文件扩展名
    const ext = path.extname(file.originalName).toLowerCase();
    const dangerousExts = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    
    if (dangerousExts.includes(ext)) {
        return res.status(403).json({
            success: false,
            message: '不允许下载此类型文件'
        });
    }

    next();
};

// 文件大小检查
const fileSizeCheck = (maxSize = 100 * 1024 * 1024) => { // 默认100MB
    return (req, res, next) => {
        const file = req.fileInfo;
        
        if (file.fileSize > maxSize) {
            return res.status(413).json({
                success: false,
                message: '文件过大，无法下载'
            });
        }

        next();
    };
};

// 防盗链检查
const antiHotlinking = (allowedDomains = []) => {
    return (req, res, next) => {
        const referer = req.get('Referer');
        
        // 如果没有referer，可能是直接访问
        if (!referer) {
            return next();
        }

        try {
            const refererUrl = new URL(referer);
            const refererDomain = refererUrl.hostname;
            
            // 检查是否在允许的域名列表中
            if (allowedDomains.length > 0 && !allowedDomains.includes(refererDomain)) {
                return res.status(403).json({
                    success: false,
                    message: '不允许从此域名访问文件'
                });
            }
        } catch (error) {
            // 无效的referer URL
            return res.status(403).json({
                success: false,
                message: '无效的访问来源'
            });
        }

        next();
    };
};

module.exports = {
    checkFileAccess,
    downloadRateLimit,
    fileTypeSecurityCheck,
    fileSizeCheck,
    antiHotlinking
};
```

### 文件病毒扫描服务

```javascript
// services/virusScanService.js
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

class VirusScanService {
    // 使用ClamAV扫描文件
    static async scanWithClamAV(filePath) {
        try {
            // 检查ClamAV是否可用
            await execAsync('which clamscan');
            
            // 扫描文件
            const { stdout, stderr } = await execAsync(`clamscan --no-summary "${filePath}"`);
            
            // 解析扫描结果
            const isClean = stdout.includes('OK') && !stdout.includes('FOUND');
            
            return {
                isClean,
                scanResult: stdout,
                engine: 'ClamAV'
            };
        } catch (error) {
            // ClamAV不可用或扫描失败
            console.warn('ClamAV扫描失败:', error.message);
            return {
                isClean: null,
                error: error.message,
                engine: 'ClamAV'
            };
        }
    }

    // 基础恶意文件检查
    static async basicMalwareCheck(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            
            // 检查文件大小（异常大的文件可能有问题）
            const maxSize = 500 * 1024 * 1024; // 500MB
            if (stats.size > maxSize) {
                return {
                    isClean: false,
                    reason: '文件大小异常'
                };
            }

            // 检查危险文件扩展名
            const dangerousExts = [
                '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
                '.vbs', '.js', '.jar', '.ps1', '.sh', '.app'
            ];
            
            if (dangerousExts.includes(ext)) {
                return {
                    isClean: false,
                    reason: '危险文件类型'
                };
            }

            // 检查文件内容中的可疑模式
            if (stats.size < 10 * 1024 * 1024) { // 只检查小于10MB的文件
                const content = fs.readFileSync(filePath, 'utf8').catch(() => '');
                
                const suspiciousPatterns = [
                    /<script[^>]*>.*?<\/script>/gi,
                    /javascript:/gi,
                    /vbscript:/gi,
                    /eval\s*\(/gi,
                    /document\.write/gi,
                    /window\.location/gi
                ];

                for (const pattern of suspiciousPatterns) {
                    if (pattern.test(content)) {
                        return {
                            isClean: false,
                            reason: '包含可疑代码'
                        };
                    }
                }
            }

            return {
                isClean: true,
                reason: '基础检查通过'
            };
        } catch (error) {
            console.error('基础恶意文件检查失败:', error);
            return {
                isClean: null,
                error: error.message
            };
        }
    }

    // 综合病毒扫描
    static async scanFile(filePath) {
        try {
            const results = {
                filePath,
                scanTime: new Date(),
                engines: []
            };

            // 基础检查
            const basicCheck = await this.basicMalwareCheck(filePath);
            results.engines.push({
                name: 'BasicCheck',
                result: basicCheck
            });

            // ClamAV扫描
            const clamavResult = await this.scanWithClamAV(filePath);
            results.engines.push({
                name: 'ClamAV',
                result: clamavResult
            });

            // 综合判断
            const allClean = results.engines.every(engine => 
                engine.result.isClean === true
            );
            
            const anyThreat = results.engines.some(engine => 
                engine.result.isClean === false
            );

            results.overallResult = {
                isClean: allClean && !anyThreat,
                confidence: anyThreat ? 'high' : allClean ? 'high' : 'low'
            };

            return results;
        } catch (error) {
            console.error('文件扫描失败:', error);
            throw new Error('文件安全扫描失败');
        }
    }

    // 扫描上传的文件
    static async scanUploadedFile(file) {
        // 创建临时文件
        const tempPath = path.join(
            process.cwd(),
            'temp',
            `scan_${Date.now()}_${file.originalname}`
        );

        try {
            // 写入临时文件
            fs.writeFileSync(tempPath, file.buffer);
            
            // 扫描文件
            const scanResult = await this.scanFile(tempPath);
            
            return scanResult;
        } finally {
            // 清理临时文件
            try {
                fs.unlinkSync(tempPath);
            } catch (error) {
                console.error('清理临时文件失败:', error);
            }
        }
    }
}

module.exports = VirusScanService;
```

## 10.9 本章小结

### 核心知识点

通过本章学习，我们掌握了文件上传和处理的核心技术：

1. **文件上传基础**
   - Multer 中间件配置和使用
   - 文件类型验证和安全检查
   - 文件大小限制和存储策略

2. **图片处理技术**
   - Sharp 图片处理库的使用
   - 图片压缩、缩放和格式转换
   - 多尺寸图片生成和水印添加

3. **存储策略**
   - 本地存储服务的实现
   - AWS S3 云存储集成
   - 预签名URL和直传功能

4. **大文件处理**
   - 分片上传的实现原理
   - 断点续传功能
   - 上传进度跟踪

5. **安全防护**
   - 文件类型和内容验证
   - 病毒扫描集成
   - 访问权限控制
   - 防盗链和下载限流

### 实践成果

- ✅ 完整的文件上传系统
- ✅ 图片处理和优化功能
- ✅ 多种存储策略支持
- ✅ 大文件分片上传
- ✅ 完善的安全防护机制
- ✅ 文件访问权限控制

## 10.10 课后练习

### 基础练习

1. **文件上传功能**
   - 实现基本的文件上传接口
   - 添加文件类型和大小验证
   - 创建文件列表和详情页面

2. **图片处理**
   - 实现头像上传和裁剪功能
   - 添加图片压缩和格式转换
   - 生成不同尺寸的缩略图

### 进阶练习

3. **云存储集成**
   - 集成阿里云OSS或腾讯云COS
   - 实现文件的云端备份
   - 添加CDN加速功能

4. **分片上传**
   - 实现大文件分片上传
   - 添加断点续传功能
   - 创建上传进度显示

### 挑战练习

5. **高级安全功能**
   - 集成专业病毒扫描引擎
   - 实现文件水印和版权保护
   - 添加文件加密存储功能

6. **性能优化**
   - 实现文件去重功能
   - 添加智能压缩策略
   - 优化大量文件的处理性能

## 下一章预告

在下一章《第11章 测试和部署》中，我们将学习：

- 单元测试和集成测试
- API 测试和性能测试
- Docker 容器化部署
- CI/CD 持续集成和部署
- 生产环境配置和监控
- 错误追踪和日志管理

## 学习资源

### 官方文档
- [Multer 官方文档](https://github.com/expressjs/multer)
- [Sharp 图片处理库](https://sharp.pixelplumbing.com/)
- [AWS S3 SDK 文档](https://docs.aws.amazon.com/sdk-for-javascript/)

### 推荐阅读
- 《文件上传安全指南》
- 《云存储最佳实践》
- 《图片处理技术详解》

### 在线教程
- [文件上传最佳实践](https://example.com/file-upload-best-practices)
- [图片优化技术](https://example.com/image-optimization)
- [云存储服务对比](https://example.com/cloud-storage-comparison)

### 视频资源
- [Node.js 文件上传实战](https://example.com/nodejs-file-upload)
- [图片处理技术讲解](https://example.com/image-processing)
- [云存储集成教程](https://example.com/cloud-storage-integration)
```