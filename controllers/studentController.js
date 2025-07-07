import studentService from '../services/studentService.js';

/**
 * 学生控制器 - 处理HTTP请求和响应
 */
class StudentController {
  /**
   * 显示学生列表页面
   */
  async index(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      const result = await studentService.getStudents({
        page: parseInt(page),
        limit: parseInt(limit),
        search: search.trim()
      });

      res.render('students/index', {
        title: '学生管理系统',
        students: result.students,
        pagination: result.pagination,
        totalCount: result.pagination.totalCount,
        search: result.search,
        query: req.query
      });
    } catch (error) {
      console.error('获取学生列表错误:', error);
      req.flash('error', error.message);
      res.render('students/index', {
        title: '学生管理系统',
        students: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
          limit: 10
        },
        search: '',
        query: req.query
      });
    }
  }

  /**
   * 显示添加学生表单
   */
  async new(req, res) {
    try {
      res.render('students/new', {
        title: '添加学生',
        student: {}, // 空对象用于表单初始化
        errors: {}
      });
    } catch (error) {
      console.error('显示添加表单错误:', error);
      req.flash('error', '页面加载失败');
      res.redirect('/students');
    }
  }

  /**
   * 创建新学生
   */
  async create(req, res) {
    try {
      const student = await studentService.createStudent(req.body);
      
      req.flash('success', `学生 ${student.name} (${student.studentId}) 添加成功！`);
      res.redirect('/students');
    } catch (error) {
      console.error('创建学生错误:', error);
      
      // 如果是验证错误，返回表单并显示错误信息
      const errors = this.parseValidationErrors(error.message);
      
      res.render('students/new', {
        title: '添加学生',
        student: req.body,
        errors,
        errorMessage: error.message
      });
    }
  }

  /**
   * 显示学生详情
   */
  async show(req, res) {
    try {
      const student = await studentService.getStudentById(req.params.id);
      
      res.render('students/show', {
        title: `学生详情 - ${student.name}`,
        student
      });
    } catch (error) {
      console.error('获取学生详情错误:', error);
      req.flash('error', error.message);
      res.redirect('/students');
    }
  }

  /**
   * 显示编辑学生表单
   */
  async edit(req, res) {
    try {
      const student = await studentService.getStudentById(req.params.id);
      
      res.render('students/edit', {
        title: `编辑学生 - ${student.name}`,
        student,
        errors: {}
      });
    } catch (error) {
      console.error('显示编辑表单错误:', error);
      req.flash('error', error.message);
      res.redirect('/students');
    }
  }

  /**
   * 更新学生信息
   */
  async update(req, res) {
    try {
      const student = await studentService.updateStudent(req.params.id, req.body);
      
      req.flash('success', `学生 ${student.name} 信息更新成功！`);
      res.redirect(`/students/${student.id}`);
    } catch (error) {
      console.error('更新学生错误:', error);
      
      try {
        // 重新获取学生信息以显示表单
        const student = await studentService.getStudentById(req.params.id);
        const errors = this.parseValidationErrors(error.message);
        
        res.render('students/edit', {
          title: `编辑学生 - ${student.name}`,
          student: { ...student.dataValues, ...req.body }, // 合并原数据和提交数据
          errors,
          errorMessage: error.message
        });
      } catch (getError) {
        req.flash('error', error.message);
        res.redirect('/students');
      }
    }
  }

  /**
   * 删除学生
   */
  async destroy(req, res) {
    try {
      const student = await studentService.getStudentById(req.params.id);
      const studentName = student.name;
      const studentId = student.studentId;
      
      await studentService.deleteStudent(req.params.id);
      
      req.flash('success', `学生 ${studentName} (${studentId}) 删除成功！`);
      res.redirect('/students');
    } catch (error) {
      console.error('删除学生错误:', error);
      req.flash('error', error.message);
      res.redirect('/students');
    }
  }

  /**
   * 获取统计信息（API接口）
   */
  async statistics(req, res) {
    try {
      const stats = await studentService.getStatistics();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取统计信息错误:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 批量导入学生（API接口）
   */
  async bulkImport(req, res) {
    try {
      const { students } = req.body;
      
      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的学生数据数组'
        });
      }

      const result = await studentService.bulkCreateStudents(students);
      
      res.json({
        success: true,
        data: result,
        message: `成功导入 ${result.success.length} 个学生，失败 ${result.failed.length} 个`
      });
    } catch (error) {
      console.error('批量导入错误:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 搜索学生（API接口）
   */
  async search(req, res) {
    try {
      const { q: search = '', page = 1, limit = 10 } = req.query;
      
      const result = await studentService.getStudents({
        page: parseInt(page),
        limit: parseInt(limit),
        search: search.trim()
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('搜索学生错误:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 验证学号是否可用（API接口）
   */
  async checkStudentId(req, res) {
    try {
      const { studentId } = req.params;
      const { excludeId } = req.query; // 编辑时排除当前学生ID
      
      const existingStudent = await studentService.getStudentByStudentId(studentId);
      
      let available = !existingStudent;
      
      // 如果是编辑操作，排除当前学生
      if (existingStudent && excludeId && existingStudent.id == excludeId) {
        available = true;
      }
      
      res.json({
        success: true,
        available,
        message: available ? '学号可用' : '学号已存在'
      });
    } catch (error) {
      console.error('检查学号错误:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 解析验证错误信息
   * @param {string} errorMessage - 错误消息
   * @returns {Object} 字段错误对象
   * @private
   */
  parseValidationErrors(errorMessage) {
    const errors = {};
    
    // 简单的错误解析，可以根据需要扩展
    if (errorMessage.includes('学号')) {
      errors.studentId = '学号相关错误';
    }
    if (errorMessage.includes('姓名')) {
      errors.name = '姓名相关错误';
    }
    if (errorMessage.includes('年龄')) {
      errors.age = '年龄相关错误';
    }
    if (errorMessage.includes('邮箱') || errorMessage.includes('email')) {
      errors.email = '邮箱格式错误';
    }
    if (errorMessage.includes('手机') || errorMessage.includes('phone')) {
      errors.phone = '手机号格式错误';
    }
    
    return errors;
  }

  /**
   * 处理异步错误的包装器
   * @param {Function} fn - 异步函数
   * @returns {Function} 包装后的函数
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

export default new StudentController();