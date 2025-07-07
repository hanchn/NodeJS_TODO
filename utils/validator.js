/**
 * 数据验证工具类
 */
class Validator {
  /**
   * 验证学生数据
   * @param {Object} data - 学生数据
   * @returns {Object} 验证结果 { isValid: boolean, errors: Object }
   */
  static validateStudent(data) {
    const errors = {};
    let isValid = true;

    // 学号验证
    if (!data.studentId || !data.studentId.toString().trim()) {
      errors.studentId = '学号不能为空';
      isValid = false;
    } else {
      const studentId = data.studentId.toString().trim();
      if (studentId.length < 6 || studentId.length > 20) {
        errors.studentId = '学号长度必须在6-20位之间';
        isValid = false;
      } else if (!/^[A-Za-z0-9]+$/.test(studentId)) {
        errors.studentId = '学号只能包含字母和数字';
        isValid = false;
      }
    }

    // 姓名验证
    if (!data.name || !data.name.toString().trim()) {
      errors.name = '姓名不能为空';
      isValid = false;
    } else {
      const name = data.name.toString().trim();
      if (name.length < 2 || name.length > 50) {
        errors.name = '姓名长度必须在2-50个字符之间';
        isValid = false;
      } else if (!/^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(name)) {
        errors.name = '姓名只能包含中文、英文字母和空格';
        isValid = false;
      }
    }

    // 性别验证
    if (!data.gender || !['男', '女'].includes(data.gender.toString().trim())) {
      errors.gender = '性别必须是男或女';
      isValid = false;
    }

    // 年龄验证
    if (!data.age) {
      errors.age = '年龄不能为空';
      isValid = false;
    } else {
      const age = parseInt(data.age);
      if (isNaN(age) || age < 16 || age > 60) {
        errors.age = '年龄必须是16-60之间的数字';
        isValid = false;
      }
    }

    // 专业验证
    if (!data.major || !data.major.toString().trim()) {
      errors.major = '专业不能为空';
      isValid = false;
    } else {
      const major = data.major.toString().trim();
      if (major.length < 2 || major.length > 100) {
        errors.major = '专业名称长度必须在2-100个字符之间';
        isValid = false;
      }
    }

    // 年级验证
    if (!data.grade || !data.grade.toString().trim()) {
      errors.grade = '年级不能为空';
      isValid = false;
    } else {
      const grade = data.grade.toString().trim();
      if (!/^(大一|大二|大三|大四|研一|研二|研三|博一|博二|博三|博四|\d{4}级)$/.test(grade)) {
        errors.grade = '年级格式不正确，请输入如：大一、大二、研一、2023级等';
        isValid = false;
      }
    }

    // 邮箱验证（可选）
    if (data.email && data.email.toString().trim()) {
      const email = data.email.toString().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = '邮箱格式不正确';
        isValid = false;
      } else if (email.length > 100) {
        errors.email = '邮箱长度不能超过100个字符';
        isValid = false;
      }
    }

    // 手机号验证（可选）
    if (data.phone && data.phone.toString().trim()) {
      const phone = data.phone.toString().trim();
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        errors.phone = '手机号格式不正确，请输入11位有效手机号';
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  /**
   * 验证分页参数
   * @param {Object} params - 分页参数
   * @returns {Object} 清理后的分页参数
   */
  static validatePagination(params) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 10));
    const search = (params.search || '').toString().trim();

    return { page, limit, search };
  }

  /**
   * 验证ID参数
   * @param {string|number} id - ID值
   * @returns {Object} 验证结果
   */
  static validateId(id) {
    const numId = parseInt(id);
    if (isNaN(numId) || numId <= 0) {
      return {
        isValid: false,
        error: 'ID必须是正整数'
      };
    }
    return {
      isValid: true,
      id: numId
    };
  }

  /**
   * 清理和标准化学生数据
   * @param {Object} data - 原始数据
   * @returns {Object} 清理后的数据
   */
  static sanitizeStudentData(data) {
    const sanitized = {};

    // 清理字符串字段
    const stringFields = ['studentId', 'name', 'gender', 'major', 'grade', 'email', 'phone'];
    stringFields.forEach(field => {
      if (data[field]) {
        sanitized[field] = data[field].toString().trim();
      }
    });

    // 处理年龄
    if (data.age) {
      sanitized.age = parseInt(data.age);
    }

    // 标准化性别
    if (sanitized.gender) {
      sanitized.gender = sanitized.gender === '男' ? '男' : '女';
    }

    // 标准化邮箱（转小写）
    if (sanitized.email) {
      sanitized.email = sanitized.email.toLowerCase();
    }

    return sanitized;
  }

  /**
   * 验证批量导入数据
   * @param {Array} studentsData - 学生数据数组
   * @returns {Object} 验证结果
   */
  static validateBulkStudents(studentsData) {
    if (!Array.isArray(studentsData)) {
      return {
        isValid: false,
        error: '数据必须是数组格式'
      };
    }

    if (studentsData.length === 0) {
      return {
        isValid: false,
        error: '数据数组不能为空'
      };
    }

    if (studentsData.length > 1000) {
      return {
        isValid: false,
        error: '单次导入数据不能超过1000条'
      };
    }

    const results = {
      isValid: true,
      validData: [],
      invalidData: [],
      duplicateStudentIds: []
    };

    const studentIdSet = new Set();

    studentsData.forEach((data, index) => {
      const validation = this.validateStudent(data);
      
      if (validation.isValid) {
        const sanitizedData = this.sanitizeStudentData(data);
        
        // 检查学号重复
        if (studentIdSet.has(sanitizedData.studentId)) {
          results.duplicateStudentIds.push({
            index: index + 1,
            studentId: sanitizedData.studentId
          });
          results.invalidData.push({
            index: index + 1,
            data,
            errors: { studentId: '学号在导入数据中重复' }
          });
        } else {
          studentIdSet.add(sanitizedData.studentId);
          results.validData.push({
            index: index + 1,
            data: sanitizedData
          });
        }
      } else {
        results.invalidData.push({
          index: index + 1,
          data,
          errors: validation.errors
        });
      }
    });

    if (results.invalidData.length > 0) {
      results.isValid = false;
    }

    return results;
  }

  /**
   * 验证搜索参数
   * @param {string} search - 搜索关键词
   * @returns {Object} 验证结果
   */
  static validateSearch(search) {
    if (!search || typeof search !== 'string') {
      return {
        isValid: true,
        search: ''
      };
    }

    const trimmedSearch = search.trim();
    
    if (trimmedSearch.length > 100) {
      return {
        isValid: false,
        error: '搜索关键词长度不能超过100个字符'
      };
    }

    // 防止SQL注入的基本检查
    const dangerousPatterns = [/['";\\]/g, /\b(DROP|DELETE|INSERT|UPDATE|SELECT)\b/gi];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmedSearch)) {
        return {
          isValid: false,
          error: '搜索关键词包含非法字符'
        };
      }
    }

    return {
      isValid: true,
      search: trimmedSearch
    };
  }
}

export default Validator;