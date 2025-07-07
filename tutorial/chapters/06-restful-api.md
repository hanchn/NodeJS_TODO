# 第6章：RESTful API 设计

## 6.1 学习目标

通过本章学习，你将能够：

- 理解 RESTful API 的设计原则和最佳实践
- 掌握 Express.js 中的路由设计和组织
- 学会实现完整的 CRUD API 接口
- 掌握请求验证和错误处理机制
- 理解 API 版本控制和文档生成
- 学会 API 测试和调试技巧

## 6.2 REST 基础概念

### 什么是 REST

REST（Representational State Transfer）是一种软件架构风格，用于设计网络应用程序的接口。它基于以下核心原则：

1. **资源（Resources）**：一切都是资源，每个资源都有唯一的标识符（URI）
2. **表现层（Representation）**：资源可以有多种表现形式（JSON、XML等）
3. **状态转移（State Transfer）**：通过 HTTP 方法实现资源状态的转移
4. **无状态（Stateless）**：每个请求都包含处理该请求所需的所有信息
5. **统一接口（Uniform Interface）**：使用标准的 HTTP 方法和状态码

### HTTP 方法和语义

```javascript
// RESTful API 的标准 HTTP 方法
const httpMethods = {
  GET: '获取资源（安全、幂等）',
  POST: '创建资源（非安全、非幂等）',
  PUT: '更新整个资源（非安全、幂等）',
  PATCH: '部分更新资源（非安全、非幂等）',
  DELETE: '删除资源（非安全、幂等）',
  HEAD: '获取资源头信息（安全、幂等）',
  OPTIONS: '获取资源支持的方法（安全、幂等）'
};

// 学生资源的 RESTful API 设计示例
const studentApiEndpoints = {
  'GET /api/students': '获取所有学生列表',
  'GET /api/students/:id': '获取特定学生信息',
  'POST /api/students': '创建新学生',
  'PUT /api/students/:id': '更新学生完整信息',
  'PATCH /api/students/:id': '部分更新学生信息',
  'DELETE /api/students/:id': '删除学生',
  'GET /api/students/:id/courses': '获取学生的课程列表',
  'POST /api/students/:id/courses': '为学生添加课程',
  'DELETE /api/students/:id/courses/:courseId': '删除学生的课程'
};
```

### RESTful URL 设计原则

```javascript
// ✅ 好的 RESTful URL 设计
const goodUrls = [
  'GET /api/students',              // 获取学生列表
  'GET /api/students/123',          // 获取ID为123的学生
  'POST /api/students',             // 创建新学生
  'PUT /api/students/123',          // 更新ID为123的学生
  'DELETE /api/students/123',       // 删除ID为123的学生
  'GET /api/students/123/courses',  // 获取学生123的课程
  'GET /api/courses?teacher=john',  // 查询约翰老师的课程
  'GET /api/students?page=2&limit=10' // 分页获取学生
];

// ❌ 不好的 URL 设计
const badUrls = [
  'GET /api/getStudents',           // 动词应该用HTTP方法表示
  'POST /api/student/delete/123',   // 删除应该用DELETE方法
  'GET /api/students/123/delete',   // 同上
  'POST /api/createStudent',        // 动词冗余
  'GET /api/student_list',          // 应该用复数形式
  'GET /api/Students',              // 应该用小写
  'GET /api/students/findByName'    // 应该用查询参数
];
```

## 6.3 Express 路由设计

### 基础路由结构

```javascript
// routes/index.js - 主路由文件
const express = require('express');
const router = express.Router();

// 导入子路由
const studentRoutes = require('./students');
const courseRoutes = require('./courses');
const authRoutes = require('./auth');

// API 版本控制
const v1Router = express.Router();

// 注册子路由
v1Router.use('/students', studentRoutes);
v1Router.use('/courses', courseRoutes);
v1Router.use('/auth', authRoutes);

// 注册版本路由
router.use('/api/v1', v1Router);

// 健康检查端点
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API 根端点
router.get('/api', (req, res) => {
  res.json({
    message: '学生管理系统 API',
    version: 'v1',
    endpoints: {
      students: '/api/v1/students',
      courses: '/api/v1/courses',
      auth: '/api/v1/auth',
      docs: '/api/docs'
    }
  });
});

module.exports = router;
```

### 学生资源路由

```javascript
// routes/students.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { validateStudent, validateStudentUpdate } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const { rateLimit } = require('../middleware/rateLimit');

// 应用中间件
router.use(authenticate); // 所有路由都需要认证
router.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // 限流

// 学生列表和创建
router.route('/')
  .get(
    paginate,
    studentController.getStudents
  )
  .post(
    authorize(['admin', 'teacher']), // 只有管理员和教师可以创建学生
    validateStudent,
    studentController.createStudent
  );

// 学生详情、更新和删除
router.route('/:id')
  .get(studentController.getStudent)
  .put(
    authorize(['admin', 'teacher']),
    validateStudent,
    studentController.updateStudent
  )
  .patch(
    authorize(['admin', 'teacher', 'student']),
    validateStudentUpdate,
    studentController.patchStudent
  )
  .delete(
    authorize(['admin']), // 只有管理员可以删除学生
    studentController.deleteStudent
  );

// 学生课程相关路由
router.get('/:id/courses', studentController.getStudentCourses);
router.post('/:id/courses', 
  authorize(['admin', 'teacher', 'student']),
  studentController.enrollCourse
);
router.delete('/:id/courses/:courseId', 
  authorize(['admin', 'teacher', 'student']),
  studentController.unenrollCourse
);

// 学生成绩相关路由
router.get('/:id/grades', studentController.getStudentGrades);
router.post('/:id/grades', 
  authorize(['admin', 'teacher']),
  studentController.addGrade
);

// 批量操作路由
router.post('/bulk/create', 
  authorize(['admin']),
  studentController.bulkCreateStudents
);
router.patch('/bulk/update', 
  authorize(['admin']),
  studentController.bulkUpdateStudents
);
router.delete('/bulk/delete', 
  authorize(['admin']),
  studentController.bulkDeleteStudents
);

// 搜索和过滤
router.get('/search/:query', 
  paginate,
  studentController.searchStudents
);

// 统计信息
router.get('/stats/overview', 
  authorize(['admin', 'teacher']),
  studentController.getStudentStats
);

module.exports = router;
```

### 路由参数验证

```javascript
// middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');
const { Student } = require('../models');

// 学生ID参数验证
const validateStudentId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('学生ID必须是正整数')
    .custom(async (id) => {
      const student = await Student.findByPk(id);
      if (!student) {
        throw new Error('学生不存在');
      }
      return true;
    })
];

// 学生创建验证
const validateStudent = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('姓名长度必须在2-50个字符之间')
    .matches(/^[\u4e00-\u9fa5a-zA-Z\s]+$/)
    .withMessage('姓名只能包含中文、英文和空格'),
    
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .custom(async (email, { req }) => {
      const existingStudent = await Student.findOne({ where: { email } });
      if (existingStudent && existingStudent.id !== parseInt(req.params.id)) {
        throw new Error('邮箱已被使用');
      }
      return true;
    }),
    
  body('age')
    .optional()
    .isInt({ min: 16, max: 100 })
    .withMessage('年龄必须在16-100之间'),
    
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
    
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('性别必须是 male、female 或 other'),
    
  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('请输入有效的出生日期')
    .custom((birthDate) => {
      const birth = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      if (age < 16 || age > 100) {
        throw new Error('根据出生日期计算的年龄必须在16-100之间');
      }
      return true;
    }),
    
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('地址长度不能超过200个字符'),
    
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'graduated', 'suspended'])
    .withMessage('状态必须是 active、inactive、graduated 或 suspended')
];

// 学生更新验证（部分更新）
const validateStudentUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('姓名长度必须在2-50个字符之间'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
    
  body('age')
    .optional()
    .isInt({ min: 16, max: 100 })
    .withMessage('年龄必须在16-100之间'),
    
  // 其他字段的可选验证...
];

// 查询参数验证
const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
    
  query('sort')
    .optional()
    .isIn(['name', 'email', 'age', 'createdAt', 'updatedAt'])
    .withMessage('排序字段无效'),
    
  query('order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('排序方向必须是 ASC 或 DESC'),
    
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'graduated', 'suspended'])
    .withMessage('状态筛选值无效')
];

// 验证结果处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

module.exports = {
  validateStudentId,
  validateStudent: [...validateStudent, handleValidationErrors],
  validateStudentUpdate: [...validateStudentUpdate, handleValidationErrors],
  validateQuery: [...validateQuery, handleValidationErrors]
};
```

## 6.4 控制器实现

### 基础控制器结构

```javascript
// controllers/baseController.js
class BaseController {
  // 成功响应
  success(res, data, message = '操作成功', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }
  
  // 错误响应
  error(res, message = '操作失败', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }
  
  // 分页响应
  paginated(res, data, pagination, message = '获取成功') {
    return res.json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    });
  }
  
  // 异步错误处理包装器
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = BaseController;
```

### 学生控制器实现

```javascript
// controllers/studentController.js
const BaseController = require('./baseController');
const { Student, Course, StudentCourse } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class StudentController extends BaseController {
  // 获取学生列表
  getStudents = this.asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'DESC',
      status,
      search,
      ageMin,
      ageMax
    } = req.query;
    
    // 构建查询条件
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { studentId: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (ageMin || ageMax) {
      where.age = {};
      if (ageMin) where.age[Op.gte] = parseInt(ageMin);
      if (ageMax) where.age[Op.lte] = parseInt(ageMax);
    }
    
    // 计算偏移量
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // 查询数据
    const { count, rows: students } = await Student.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sort, order.toUpperCase()]],
      attributes: {
        exclude: ['deletedAt'] // 排除软删除字段
      }
    });
    
    // 构建分页信息
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      totalItems: count,
      itemsPerPage: parseInt(limit),
      hasNextPage: parseInt(page) < Math.ceil(count / parseInt(limit)),
      hasPrevPage: parseInt(page) > 1
    };
    
    return this.paginated(res, students, pagination, '获取学生列表成功');
  });
  
  // 获取单个学生
  getStudent = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { include } = req.query;
    
    // 构建查询选项
    const options = {
      where: { id },
      attributes: {
        exclude: ['deletedAt']
      }
    };
    
    // 根据查询参数决定是否包含关联数据
    if (include) {
      const includeArray = include.split(',');
      options.include = [];
      
      if (includeArray.includes('courses')) {
        options.include.push({
          model: Course,
          as: 'courses',
          through: {
            attributes: ['enrollmentDate', 'status', 'grade']
          }
        });
      }
    }
    
    const student = await Student.findOne(options);
    
    if (!student) {
      return this.error(res, '学生不存在', 404);
    }
    
    return this.success(res, student, '获取学生信息成功');
  });
  
  // 创建学生
  createStudent = this.asyncHandler(async (req, res) => {
    const studentData = req.body;
    
    // 生成学号
    const year = new Date().getFullYear();
    const lastStudent = await Student.findOne({
      where: {
        studentId: {
          [Op.like]: `${year}%`
        }
      },
      order: [['studentId', 'DESC']]
    });
    
    let nextNumber = 1;
    if (lastStudent) {
      const lastNumber = parseInt(lastStudent.studentId.slice(-4));
      nextNumber = lastNumber + 1;
    }
    
    studentData.studentId = `${year}${nextNumber.toString().padStart(4, '0')}`;
    
    // 创建学生
    const student = await Student.create(studentData);
    
    return this.success(res, student, '创建学生成功', 201);
  });
  
  // 更新学生（完整更新）
  updateStudent = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const student = await Student.findByPk(id);
    if (!student) {
      return this.error(res, '学生不存在', 404);
    }
    
    // 更新学生信息
    await student.update(updateData);
    
    return this.success(res, student, '更新学生信息成功');
  });
  
  // 部分更新学生
  patchStudent = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    // 移除空值和未定义的字段
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });
    
    if (Object.keys(updateData).length === 0) {
      return this.error(res, '没有提供有效的更新数据', 400);
    }
    
    const [updatedRowsCount] = await Student.update(updateData, {
      where: { id },
      returning: true
    });
    
    if (updatedRowsCount === 0) {
      return this.error(res, '学生不存在或没有更新任何数据', 404);
    }
    
    const updatedStudent = await Student.findByPk(id);
    
    return this.success(res, updatedStudent, '部分更新学生信息成功');
  });
  
  // 删除学生
  deleteStudent = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { force = false } = req.query;
    
    const student = await Student.findByPk(id);
    if (!student) {
      return this.error(res, '学生不存在', 404);
    }
    
    // 检查是否有关联的课程
    const courseCount = await StudentCourse.count({
      where: { studentId: id }
    });
    
    if (courseCount > 0 && !force) {
      return this.error(res, '学生还有关联的课程，请先处理课程关系或使用强制删除', 409);
    }
    
    // 使用事务删除
    await sequelize.transaction(async (t) => {
      // 删除关联的课程记录
      await StudentCourse.destroy({
        where: { studentId: id },
        transaction: t
      });
      
      // 删除学生（软删除）
      await student.destroy({ transaction: t });
    });
    
    return this.success(res, null, '删除学生成功');
  });
  
  // 获取学生课程
  getStudentCourses = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, semester } = req.query;
    
    const student = await Student.findByPk(id);
    if (!student) {
      return this.error(res, '学生不存在', 404);
    }
    
    // 构建查询条件
    const where = { studentId: id };
    if (status) where.status = status;
    if (semester) where.semester = semester;
    
    const courses = await StudentCourse.findAll({
      where,
      include: [{
        model: Course,
        as: 'course'
      }],
      order: [['enrollmentDate', 'DESC']]
    });
    
    return this.success(res, courses, '获取学生课程成功');
  });
  
  // 学生选课
  enrollCourse = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { courseId, semester } = req.body;
    
    // 检查学生是否存在
    const student = await Student.findByPk(id);
    if (!student) {
      return this.error(res, '学生不存在', 404);
    }
    
    // 检查课程是否存在
    const course = await Course.findByPk(courseId);
    if (!course) {
      return this.error(res, '课程不存在', 404);
    }
    
    // 检查是否已经选过该课程
    const existingEnrollment = await StudentCourse.findOne({
      where: {
        studentId: id,
        courseId,
        status: { [Op.in]: ['enrolled', 'completed'] }
      }
    });
    
    if (existingEnrollment) {
      return this.error(res, '已经选过该课程', 409);
    }
    
    // 检查课程是否还有名额
    const enrollmentCount = await StudentCourse.count({
      where: {
        courseId,
        status: 'enrolled'
      }
    });
    
    if (enrollmentCount >= course.maxEnrollment) {
      return this.error(res, '课程已满员', 409);
    }
    
    // 创建选课记录
    const enrollment = await StudentCourse.create({
      studentId: id,
      courseId,
      semester: semester || course.semester,
      enrollmentDate: new Date(),
      status: 'enrolled'
    });
    
    return this.success(res, enrollment, '选课成功', 201);
  });
  
  // 学生退课
  unenrollCourse = this.asyncHandler(async (req, res) => {
    const { id, courseId } = req.params;
    
    const enrollment = await StudentCourse.findOne({
      where: {
        studentId: id,
        courseId,
        status: 'enrolled'
      }
    });
    
    if (!enrollment) {
      return this.error(res, '未找到选课记录或课程已结束', 404);
    }
    
    // 更新选课状态为已退课
    await enrollment.update({
      status: 'dropped',
      dropDate: new Date()
    });
    
    return this.success(res, enrollment, '退课成功');
  });
  
  // 批量创建学生
  bulkCreateStudents = this.asyncHandler(async (req, res) => {
    const { students } = req.body;
    
    if (!Array.isArray(students) || students.length === 0) {
      return this.error(res, '请提供有效的学生数据数组', 400);
    }
    
    // 为每个学生生成学号
    const year = new Date().getFullYear();
    const lastStudent = await Student.findOne({
      where: {
        studentId: {
          [Op.like]: `${year}%`
        }
      },
      order: [['studentId', 'DESC']]
    });
    
    let nextNumber = 1;
    if (lastStudent) {
      const lastNumber = parseInt(lastStudent.studentId.slice(-4));
      nextNumber = lastNumber + 1;
    }
    
    // 为学生数据添加学号
    const studentsWithIds = students.map((student, index) => ({
      ...student,
      studentId: `${year}${(nextNumber + index).toString().padStart(4, '0')}`
    }));
    
    // 批量创建
    const createdStudents = await Student.bulkCreate(studentsWithIds, {
      validate: true,
      returning: true
    });
    
    return this.success(res, createdStudents, `成功创建 ${createdStudents.length} 个学生`, 201);
  });
  
  // 搜索学生
  searchStudents = this.asyncHandler(async (req, res) => {
    const { query } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return this.error(res, '搜索关键词至少需要2个字符', 400);
    }
    
    const searchTerm = query.trim();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows: students } = await Student.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { email: { [Op.iLike]: `%${searchTerm}%` } },
          { studentId: { [Op.iLike]: `%${searchTerm}%` } },
          { phone: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      },
      limit: parseInt(limit),
      offset,
      order: [['name', 'ASC']]
    });
    
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    };
    
    return this.paginated(res, students, pagination, `搜索到 ${count} 个学生`);
  });
  
  // 获取学生统计信息
  getStudentStats = this.asyncHandler(async (req, res) => {
    const stats = await Student.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    const totalStudents = await Student.count();
    const averageAge = await Student.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('age')), 'averageAge']
      ],
      where: {
        age: { [Op.not]: null }
      }
    });
    
    const genderStats = await Student.findAll({
      attributes: [
        'gender',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['gender'],
      where: {
        gender: { [Op.not]: null }
      }
    });
    
    return this.success(res, {
      total: totalStudents,
      averageAge: parseFloat(averageAge?.dataValues?.averageAge || 0).toFixed(1),
      statusDistribution: stats.map(stat => ({
        status: stat.status,
        count: parseInt(stat.dataValues.count)
      })),
      genderDistribution: genderStats.map(stat => ({
        gender: stat.gender,
        count: parseInt(stat.dataValues.count)
      }))
    }, '获取学生统计信息成功');
  });
}

module.exports = new StudentController();
```

## 6.5 错误处理机制

### 全局错误处理中间件

```javascript
// middleware/errorHandler.js
const { ValidationError, DatabaseError, ConnectionError } = require('sequelize');

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 业务错误类
class BusinessError extends AppError {
  constructor(message, statusCode = 400) {
    super(message, statusCode);
    this.name = 'BusinessError';
  }
}

// 验证错误类
class ValidationError extends AppError {
  constructor(message, errors = [], statusCode = 400) {
    super(message, statusCode);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// 权限错误类
class AuthorizationError extends AppError {
  constructor(message = '权限不足', statusCode = 403) {
    super(message, statusCode);
    this.name = 'AuthorizationError';
  }
}

// 认证错误类
class AuthenticationError extends AppError {
  constructor(message = '认证失败', statusCode = 401) {
    super(message, statusCode);
    this.name = 'AuthenticationError';
  }
}

// 资源不存在错误类
class NotFoundError extends AppError {
  constructor(message = '资源不存在', statusCode = 404) {
    super(message, statusCode);
    this.name = 'NotFoundError';
  }
}

// 错误处理函数
const handleSequelizeError = (error) => {
  if (error instanceof ValidationError) {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    return new ValidationError('数据验证失败', errors);
  }
  
  if (error instanceof DatabaseError) {
    console.error('数据库错误:', error);
    return new AppError('数据库操作失败', 500);
  }
  
  if (error instanceof ConnectionError) {
    console.error('数据库连接错误:', error);
    return new AppError('数据库连接失败', 500);
  }
  
  return error;
};

// 开发环境错误响应
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      isOperational: err.isOperational,
      errors: err.errors || null
    },
    timestamp: err.timestamp || new Date().toISOString()
  });
};

// 生产环境错误响应
const sendErrorProd = (err, res) => {
  // 操作性错误：发送给客户端
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || null,
      timestamp: err.timestamp || new Date().toISOString()
    });
  } else {
    // 编程错误：不泄露错误详情
    console.error('ERROR:', err);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      timestamp: new Date().toISOString()
    });
  }
};

// 全局错误处理中间件
const globalErrorHandler = (err, req, res, next) => {
  // 设置默认值
  err.statusCode = err.statusCode || 500;
  err.isOperational = err.isOperational || false;
  
  // 处理 Sequelize 错误
  if (err.name === 'SequelizeValidationError' || 
      err.name === 'SequelizeDatabaseError' || 
      err.name === 'SequelizeConnectionError') {
    err = handleSequelizeError(err);
  }
  
  // 处理 JWT 错误
  if (err.name === 'JsonWebTokenError') {
    err = new AuthenticationError('无效的访问令牌');
  }
  
  if (err.name === 'TokenExpiredError') {
    err = new AuthenticationError('访问令牌已过期');
  }
  
  // 处理 Mongoose CastError（如果使用 MongoDB）
  if (err.name === 'CastError') {
    err = new NotFoundError('资源不存在');
  }
  
  // 处理重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new BusinessError(`${field} 已存在`);
  }
  
  // 记录错误日志
  if (!err.isOperational || err.statusCode >= 500) {
    console.error('Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  // 发送错误响应
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

// 404 错误处理中间件
const notFoundHandler = (req, res, next) => {
  const err = new NotFoundError(`路由 ${req.originalUrl} 不存在`);
  next(err);
};

// 异步错误捕获包装器
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  BusinessError,
  ValidationError,
  AuthorizationError,
  AuthenticationError,
  NotFoundError,
  globalErrorHandler,
  notFoundHandler,
  catchAsync
};
```

### 错误处理使用示例

```javascript
// 在控制器中使用错误处理
const { NotFoundError, BusinessError, catchAsync } = require('../middleware/errorHandler');

class StudentController {
  // 使用 catchAsync 包装异步函数
  getStudent = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    const student = await Student.findByPk(id);
    
    if (!student) {
      // 抛出自定义错误
      throw new NotFoundError('学生不存在');
    }
    
    // 业务逻辑验证
    if (student.status === 'suspended') {
      throw new BusinessError('该学生账户已被暂停');
    }
    
    res.json({
      success: true,
      data: student
    });
  });
  
  // 在路由中直接使用
  deleteStudent = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    const student = await Student.findByPk(id);
    if (!student) {
      return next(new NotFoundError('学生不存在'));
    }
    
    // 检查业务规则
    const courseCount = await StudentCourse.count({
      where: { studentId: id, status: 'enrolled' }
    });
    
    if (courseCount > 0) {
      return next(new BusinessError('学生还有正在进行的课程，无法删除'));
    }
    
    await student.destroy();
    
    res.json({
      success: true,
      message: '删除学生成功'
    });
  });
}
```

## 6.6 API 响应格式标准化

### 统一响应格式

```javascript
// utils/response.js
class ApiResponse {
  constructor(success, message, data = null, errors = null, meta = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }
  
  // 成功响应
  static success(message, data = null, meta = null) {
    return new ApiResponse(true, message, data, null, meta);
  }
  
  // 错误响应
  static error(message, errors = null, meta = null) {
    return new ApiResponse(false, message, null, errors, meta);
  }
  
  // 分页响应
  static paginated(message, data, pagination) {
    return new ApiResponse(true, message, data, null, { pagination });
  }
  
  // 创建响应
  static created(message, data = null) {
    return new ApiResponse(true, message, data, null, { statusCode: 201 });
  }
  
  // 无内容响应
  static noContent(message = '操作成功') {
    return new ApiResponse(true, message, null, null, { statusCode: 204 });
  }
}

// 响应中间件
const responseMiddleware = (req, res, next) => {
  // 成功响应方法
  res.apiSuccess = (message, data = null, statusCode = 200) => {
    const response = ApiResponse.success(message, data);
    return res.status(statusCode).json(response);
  };
  
  // 错误响应方法
  res.apiError = (message, errors = null, statusCode = 400) => {
    const response = ApiResponse.error(message, errors);
    return res.status(statusCode).json(response);
  };
  
  // 分页响应方法
  res.apiPaginated = (message, data, pagination, statusCode = 200) => {
    const response = ApiResponse.paginated(message, data, pagination);
    return res.status(statusCode).json(response);
  };
  
  // 创建响应方法
  res.apiCreated = (message, data = null) => {
    const response = ApiResponse.created(message, data);
    return res.status(201).json(response);
  };
  
  // 无内容响应方法
  res.apiNoContent = (message = '操作成功') => {
    const response = ApiResponse.noContent(message);
    return res.status(204).json(response);
  };
  
  next();
};

module.exports = {
  ApiResponse,
  responseMiddleware
};
```

### 使用统一响应格式

```javascript
// 在控制器中使用
class StudentController {
  getStudents = async (req, res, next) => {
    try {
      const { students, pagination } = await studentService.getStudents(req.query);
      
      return res.apiPaginated('获取学生列表成功', students, pagination);
    } catch (error) {
      next(error);
    }
  };
  
  createStudent = async (req, res, next) => {
    try {
      const student = await studentService.createStudent(req.body);
      
      return res.apiCreated('创建学生成功', student);
    } catch (error) {
      next(error);
    }
  };
  
  deleteStudent = async (req, res, next) => {
    try {
      await studentService.deleteStudent(req.params.id);
      
      return res.apiNoContent('删除学生成功');
    } catch (error) {
      next(error);
    }
  };
}
```

## 6.7 本章小结

在本章中，我们深入学习了 RESTful API 设计的核心概念和实践：

✅ **REST 基础**：
- 理解了 REST 架构风格的核心原则
- 掌握了 HTTP 方法的正确使用
- 学会了设计符合 RESTful 规范的 URL

✅ **Express 路由**：
- 掌握了模块化路由设计
- 学会了路由参数验证和中间件使用
- 理解了路由组织的最佳实践

✅ **控制器实现**：
- 掌握了控制器的分层设计
- 学会了完整的 CRUD 操作实现
- 理解了异步错误处理机制

✅ **错误处理**：
- 建立了完整的错误处理体系
- 学会了自定义错误类的设计
- 掌握了全局错误处理中间件

✅ **响应标准化**：
- 统一了 API 响应格式
- 提高了接口的一致性和可维护性
- 简化了前端数据处理逻辑

## 6.8 课后练习

1. **API 设计练习**：
   - 设计课程管理的完整 RESTful API
   - 实现教师管理的 API 接口
   - 设计成绩管理的 API 结构

2. **错误处理练习**：
   - 实现自定义业务错误类
   - 添加详细的错误日志记录
   - 实现错误监控和报警机制

3. **性能优化练习**：
   - 实现 API 响应缓存
   - 添加请求限流机制
   - 优化数据库查询性能

## 6.9 下一章预告

在下一章中，我们将学习前端模板引擎 EJS 的使用，包括：

- EJS 模板语法详解
- 模板继承和组件化
- 数据绑定和条件渲染
- 表单处理和验证
- 前后端数据交互

---

恭喜你完成了 RESTful API 设计的学习！你现在已经掌握了构建标准化、可维护的 Web API 的核心技能。在下一章中，我们将学习如何使用 EJS 模板引擎构建动态的前端页面。