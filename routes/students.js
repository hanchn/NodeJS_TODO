import express from 'express';
import Student from '../models/Student.js';
import { Op } from 'sequelize';

const router = express.Router();

// 获取所有学生列表（支持搜索和分页）
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
        { major: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows: students } = await Student.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.render('students/index', {
      title: '学生管理系统',
      students,
      currentPage: page,
      totalPages,
      search,
      totalCount: count
    });
  } catch (error) {
    console.error('获取学生列表失败:', error);
    res.status(500).render('error', {
      title: '错误',
      error: '获取学生列表失败'
    });
  }
});

// 显示添加学生表单
router.get('/new', (req, res) => {
  res.render('students/new', {
    title: '添加学生',
    student: {},
    errors: []
  });
});

// 创建新学生
router.post('/', async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.redirect('/students?success=添加学生成功');
  } catch (error) {
    console.error('创建学生失败:', error);
    
    let errors = [];
    if (error.name === 'SequelizeValidationError') {
      errors = error.errors.map(err => err.message);
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errors = ['学号已存在，请使用其他学号'];
    } else {
      errors = ['创建学生失败，请重试'];
    }

    res.render('students/new', {
      title: '添加学生',
      student: req.body,
      errors
    });
  }
});

// 显示学生详情
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).render('404', { title: '学生未找到' });
    }
    res.render('students/show', {
      title: '学生详情',
      student
    });
  } catch (error) {
    console.error('获取学生详情失败:', error);
    res.status(500).render('error', {
      title: '错误',
      error: '获取学生详情失败'
    });
  }
});

// 显示编辑学生表单
router.get('/:id/edit', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).render('404', { title: '学生未找到' });
    }
    res.render('students/edit', {
      title: '编辑学生',
      student,
      errors: []
    });
  } catch (error) {
    console.error('获取学生信息失败:', error);
    res.status(500).render('error', {
      title: '错误',
      error: '获取学生信息失败'
    });
  }
});

// 更新学生信息
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).render('404', { title: '学生未找到' });
    }

    await student.update(req.body);
    res.redirect(`/students/${student.id}?success=更新学生信息成功`);
  } catch (error) {
    console.error('更新学生失败:', error);
    
    let errors = [];
    if (error.name === 'SequelizeValidationError') {
      errors = error.errors.map(err => err.message);
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errors = ['学号已存在，请使用其他学号'];
    } else {
      errors = ['更新学生信息失败，请重试'];
    }

    const student = await Student.findByPk(req.params.id);
    res.render('students/edit', {
      title: '编辑学生',
      student: { ...student.toJSON(), ...req.body },
      errors
    });
  }
});

// 删除学生
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ error: '学生未找到' });
    }

    await student.destroy();
    res.redirect('/students?success=删除学生成功');
  } catch (error) {
    console.error('删除学生失败:', error);
    res.status(500).json({ error: '删除学生失败' });
  }
});

export default router;