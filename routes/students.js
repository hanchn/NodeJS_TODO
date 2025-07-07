import express from 'express';
import studentController from '../controllers/studentController.js';

const router = express.Router();

// 学生列表页面
router.get('/', studentController.index);

// 显示添加学生表单
router.get('/new', studentController.new);

// 创建新学生
router.post('/', studentController.create);

// API路由 - 统计信息
router.get('/api/statistics', studentController.statistics);

// API路由 - 搜索学生
router.get('/api/search', studentController.search);

// API路由 - 批量导入
router.post('/api/bulk-import', studentController.bulkImport);

// API路由 - 检查学号可用性
router.get('/api/check-student-id/:studentId', studentController.checkStudentId);

// 显示学生详情
router.get('/:id', studentController.show);

// 显示编辑学生表单
router.get('/:id/edit', studentController.edit);

// 更新学生信息
router.put('/:id', studentController.update);

// 删除学生
router.delete('/:id', studentController.destroy);

export default router;