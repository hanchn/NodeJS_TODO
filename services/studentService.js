import Student from '../models/Student.js';
import { Op } from 'sequelize';
import Validator from '../utils/validator.js';

/**
 * 学生服务层 - 处理所有学生相关的业务逻辑
 */
class StudentService {
  /**
   * 获取学生列表（支持搜索和分页）
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.limit - 每页数量
   * @param {string} options.search - 搜索关键词
   * @returns {Promise<Object>} 包含学生列表和分页信息的对象
   */
  async getStudents({ page = 1, limit = 10, search = '' } = {}) {
    try {
      // 验证分页参数
      const validatedParams = Validator.validatePagination({ page, limit, search });
      const { page: validPage, limit: validLimit, search: validSearch } = validatedParams;
      
      const offset = (validPage - 1) * validLimit;
      
      // 验证搜索参数
      const searchValidation = Validator.validateSearch(validSearch);
      if (!searchValidation.isValid) {
        throw new Error(searchValidation.error);
      }
      
      // 构建搜索条件
      const whereClause = searchValidation.search ? {
        [Op.or]: [
          { name: { [Op.like]: `%${searchValidation.search}%` } },
          { studentId: { [Op.like]: `%${searchValidation.search}%` } },
          { major: { [Op.like]: `%${searchValidation.search}%` } },
          { grade: { [Op.like]: `%${searchValidation.search}%` } }
        ]
      } : {};

      const { count, rows: students } = await Student.findAndCountAll({
        where: whereClause,
        limit: validLimit,
        offset,
        order: [['createdAt', 'DESC']],
        attributes: {
          exclude: [] // 可以排除敏感字段
        }
      });

      const totalPages = Math.ceil(count / limit);

      return {
        students,
        pagination: {
          currentPage: validPage,
          totalPages,
          totalCount: count,
          hasNext: validPage < totalPages,
          hasPrev: validPage > 1,
          limit: validLimit
        },
        search: searchValidation.search
      };
    } catch (error) {
      throw new Error(`获取学生列表失败: ${error.message}`);
    }
  }

  /**
   * 根据ID获取单个学生
   * @param {number} id - 学生ID
   * @returns {Promise<Object>} 学生对象
   */
  async getStudentById(id) {
    try {
      // 验证ID参数
      const idValidation = Validator.validateId(id);
      if (!idValidation.isValid) {
        throw new Error(idValidation.error);
      }
      
      const student = await Student.findByPk(idValidation.id);
      if (!student) {
        throw new Error('学生不存在');
      }
      return student;
    } catch (error) {
      throw new Error(`获取学生信息失败: ${error.message}`);
    }
  }

  /**
   * 根据学号获取学生
   * @param {string} studentId - 学号
   * @returns {Promise<Object|null>} 学生对象或null
   */
  async getStudentByStudentId(studentId) {
    try {
      return await Student.findOne({ where: { studentId } });
    } catch (error) {
      throw new Error(`查询学生失败: ${error.message}`);
    }
  }

  /**
   * 创建新学生
   * @param {Object} studentData - 学生数据
   * @returns {Promise<Object>} 创建的学生对象
   */
  async createStudent(studentData) {
    try {
      // 验证学号是否已存在
      const existingStudent = await this.getStudentByStudentId(studentData.studentId);
      if (existingStudent) {
        throw new Error('学号已存在，请使用其他学号');
      }

      // 数据清理和验证
      const cleanData = this.validateAndCleanStudentData(studentData);
      
      const student = await Student.create(cleanData);
      return student;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message);
        throw new Error(validationErrors.join(', '));
      }
      throw new Error(`创建学生失败: ${error.message}`);
    }
  }

  /**
   * 更新学生信息
   * @param {number} id - 学生ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的学生对象
   */
  async updateStudent(id, updateData) {
    try {
      const student = await this.getStudentById(id);
      
      // 如果更新学号，检查是否与其他学生冲突
      if (updateData.studentId && updateData.studentId !== student.studentId) {
        const existingStudent = await this.getStudentByStudentId(updateData.studentId);
        if (existingStudent) {
          throw new Error('学号已存在，请使用其他学号');
        }
      }

      // 数据清理和验证
      const cleanData = this.validateAndCleanStudentData(updateData);
      
      await student.update(cleanData);
      return student;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message);
        throw new Error(validationErrors.join(', '));
      }
      throw new Error(`更新学生失败: ${error.message}`);
    }
  }

  /**
   * 删除学生
   * @param {number} id - 学生ID
   * @returns {Promise<boolean>} 删除成功返回true
   */
  async deleteStudent(id) {
    try {
      const student = await this.getStudentById(id);
      await student.destroy();
      return true;
    } catch (error) {
      throw new Error(`删除学生失败: ${error.message}`);
    }
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics() {
    try {
      const totalStudents = await Student.count();
      
      // 按性别统计
      const genderStats = await Student.findAll({
        attributes: [
          'gender',
          [Student.sequelize.fn('COUNT', Student.sequelize.col('gender')), 'count']
        ],
        group: ['gender']
      });

      // 按专业统计
      const majorStats = await Student.findAll({
        attributes: [
          'major',
          [Student.sequelize.fn('COUNT', Student.sequelize.col('major')), 'count']
        ],
        group: ['major'],
        order: [[Student.sequelize.fn('COUNT', Student.sequelize.col('major')), 'DESC']],
        limit: 10
      });

      // 按年级统计
      const gradeStats = await Student.findAll({
        attributes: [
          'grade',
          [Student.sequelize.fn('COUNT', Student.sequelize.col('grade')), 'count']
        ],
        group: ['grade'],
        order: ['grade']
      });

      return {
        totalStudents,
        genderStats: genderStats.map(item => ({
          gender: item.gender,
          count: parseInt(item.dataValues.count)
        })),
        majorStats: majorStats.map(item => ({
          major: item.major,
          count: parseInt(item.dataValues.count)
        })),
        gradeStats: gradeStats.map(item => ({
          grade: item.grade,
          count: parseInt(item.dataValues.count)
        }))
      };
    } catch (error) {
      throw new Error(`获取统计信息失败: ${error.message}`);
    }
  }

  /**
   * 批量导入学生
   * @param {Array} studentsData - 学生数据数组
   * @returns {Promise<Object>} 导入结果
   */
  async bulkCreateStudents(studentsData) {
    try {
      // 验证批量数据
      const validation = Validator.validateBulkStudents(studentsData);
      
      if (!validation.isValid) {
        throw new Error(`数据验证失败: ${validation.error || '存在无效数据'}`);
      }

      const results = {
        success: [],
        failed: validation.invalidData.map(item => ({
          index: item.index,
          data: item.data,
          error: Object.values(item.errors).join(', ')
        })),
        total: studentsData.length,
        duplicates: validation.duplicateStudentIds
      };

      // 处理有效数据
      for (const validItem of validation.validData) {
        try {
          // 检查数据库中是否已存在该学号
          const existingStudent = await this.getStudentByStudentId(validItem.data.studentId);
          if (existingStudent) {
            results.failed.push({
              index: validItem.index,
              data: validItem.data,
              error: '学号已存在于数据库中'
            });
            continue;
          }

          const student = await Student.create(validItem.data);
          results.success.push({
            index: validItem.index,
            studentId: student.studentId,
            name: student.name
          });
        } catch (error) {
          results.failed.push({
            index: validItem.index,
            data: validItem.data,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`批量导入失败: ${error.message}`);
    }
  }

  /**
   * 验证和清理学生数据
   * @param {Object} data - 原始数据
   * @returns {Object} 清理后的数据
   * @private
   */
  validateAndCleanStudentData(data) {
    // 使用验证工具类进行验证
    const validation = Validator.validateStudent(data);
    
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors);
      throw new Error(errorMessages.join(', '));
    }

    // 清理和标准化数据
    return Validator.sanitizeStudentData(data);
  }
}

export default new StudentService();