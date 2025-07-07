/**
 * 消息提示公共文件
 * 统一管理系统中的各种提示信息
 */

/**
 * 成功消息
 */
export const SUCCESS_MESSAGES = {
  // 学生管理相关
  STUDENT_CREATED: (name, studentId) => `学生 ${name} (${studentId}) 添加成功！`,
  STUDENT_UPDATED: (name) => `学生 ${name} 信息更新成功！`,
  STUDENT_DELETED: (name, studentId) => `学生 ${name} (${studentId}) 删除成功！`,
  STUDENT_IMPORTED: (count) => `成功导入 ${count} 名学生！`,
  
  // 系统操作相关
  DATABASE_CONNECTED: '数据库连接成功',
  DATABASE_SYNCED: '数据库模型同步完成',
  SERVER_STARTED: (port) => `服务器运行在 http://localhost:${port}`,
  
  // 数据操作相关
  DATA_EXPORTED: '数据导出成功',
  DATA_BACKUP: '数据备份完成',
  CACHE_CLEARED: '缓存清理完成'
};

/**
 * 错误消息
 */
export const ERROR_MESSAGES = {
  // 验证错误
  VALIDATION_FAILED: '数据验证失败',
  REQUIRED_FIELD: (field) => `${field} 是必填字段`,
  INVALID_FORMAT: (field) => `${field} 格式不正确`,
  INVALID_LENGTH: (field, min, max) => `${field} 长度应在 ${min}-${max} 个字符之间`,
  INVALID_RANGE: (field, min, max) => `${field} 应在 ${min}-${max} 之间`,
  
  // 学生管理错误
  STUDENT_NOT_FOUND: '学生不存在',
  STUDENT_ID_EXISTS: '学号已存在，请使用其他学号',
  STUDENT_ID_INVALID: '学号格式不正确，应为6-20位字母数字组合',
  STUDENT_NAME_INVALID: '姓名格式不正确，应为2-50个字符',
  STUDENT_AGE_INVALID: '年龄应在16-60之间',
  STUDENT_GENDER_INVALID: '性别只能是男或女',
  STUDENT_EMAIL_INVALID: '邮箱格式不正确',
  STUDENT_PHONE_INVALID: '手机号格式不正确',
  
  // 数据库错误
  DATABASE_CONNECTION_FAILED: '数据库连接失败',
  DATABASE_QUERY_FAILED: '数据库查询失败',
  DATABASE_SYNC_FAILED: '数据库同步失败',
  
  // 系统错误
  SERVER_ERROR: '服务器内部错误',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '禁止访问',
  NOT_FOUND: '请求的资源不存在',
  METHOD_NOT_ALLOWED: '请求方法不被允许',
  
  // 文件操作错误
  FILE_NOT_FOUND: '文件不存在',
  FILE_UPLOAD_FAILED: '文件上传失败',
  FILE_FORMAT_INVALID: '文件格式不支持',
  FILE_SIZE_EXCEEDED: '文件大小超出限制',
  
  // 网络错误
  NETWORK_ERROR: '网络连接错误',
  TIMEOUT_ERROR: '请求超时',
  
  // 业务逻辑错误
  OPERATION_FAILED: '操作失败',
  DUPLICATE_OPERATION: '重复操作',
  INVALID_OPERATION: '无效操作'
};

/**
 * 警告消息
 */
export const WARNING_MESSAGES = {
  DATA_WILL_BE_LOST: '此操作将导致数据丢失，请确认',
  UNSAVED_CHANGES: '您有未保存的更改',
  LARGE_DATA_SET: '数据量较大，操作可能需要较长时间',
  DEPRECATED_FEATURE: '此功能即将废弃，请使用新功能',
  BROWSER_NOT_SUPPORTED: '您的浏览器版本过低，可能影响使用体验',
  NETWORK_SLOW: '网络连接较慢，请耐心等待'
};

/**
 * 信息消息
 */
export const INFO_MESSAGES = {
  LOADING: '正在加载...',
  PROCESSING: '正在处理...',
  SAVING: '正在保存...',
  DELETING: '正在删除...',
  UPLOADING: '正在上传...',
  DOWNLOADING: '正在下载...',
  
  NO_DATA: '暂无数据',
  NO_RESULTS: '没有找到匹配的结果',
  EMPTY_LIST: '列表为空',
  
  OPERATION_COMPLETED: '操作完成',
  PLEASE_WAIT: '请稍候...',
  TRY_AGAIN: '请重试',
  
  FEATURE_COMING_SOON: '功能即将上线',
  MAINTENANCE_MODE: '系统维护中'
};

/**
 * 表单验证消息
 */
export const FORM_MESSAGES = {
  REQUIRED: '此字段为必填项',
  INVALID_EMAIL: '请输入有效的邮箱地址',
  INVALID_PHONE: '请输入有效的手机号码',
  PASSWORD_TOO_SHORT: '密码长度至少8位',
  PASSWORD_TOO_WEAK: '密码强度太弱',
  PASSWORDS_NOT_MATCH: '两次输入的密码不一致',
  INVALID_DATE: '请输入有效的日期',
  INVALID_NUMBER: '请输入有效的数字',
  VALUE_TOO_SMALL: (min) => `值不能小于 ${min}`,
  VALUE_TOO_LARGE: (max) => `值不能大于 ${max}`,
  STRING_TOO_SHORT: (min) => `至少需要 ${min} 个字符`,
  STRING_TOO_LONG: (max) => `不能超过 ${max} 个字符`
};

/**
 * 操作确认消息
 */
export const CONFIRM_MESSAGES = {
  DELETE_STUDENT: (name) => `确定要删除学生 ${name} 吗？此操作不可撤销。`,
  DELETE_MULTIPLE: (count) => `确定要删除选中的 ${count} 名学生吗？此操作不可撤销。`,
  CLEAR_ALL_DATA: '确定要清空所有数据吗？此操作不可撤销。',
  RESET_SYSTEM: '确定要重置系统吗？所有数据将被清除。',
  LOGOUT: '确定要退出登录吗？',
  LEAVE_PAGE: '确定要离开此页面吗？未保存的更改将丢失。'
};

/**
 * 状态消息
 */
export const STATUS_MESSAGES = {
  ONLINE: '在线',
  OFFLINE: '离线',
  CONNECTING: '连接中',
  CONNECTED: '已连接',
  DISCONNECTED: '已断开',
  SYNCING: '同步中',
  SYNCED: '已同步',
  ERROR: '错误',
  READY: '就绪',
  LOADING: '加载中'
};

/**
 * 分页消息
 */
export const PAGINATION_MESSAGES = {
  SHOWING_RESULTS: (start, end, total) => `显示第 ${start}-${end} 条，共 ${total} 条记录`,
  NO_MORE_DATA: '没有更多数据了',
  LOAD_MORE: '加载更多',
  FIRST_PAGE: '首页',
  LAST_PAGE: '末页',
  PREVIOUS_PAGE: '上一页',
  NEXT_PAGE: '下一页',
  GO_TO_PAGE: '跳转到第',
  PAGE: '页',
  ITEMS_PER_PAGE: '每页显示'
};

/**
 * 搜索消息
 */
export const SEARCH_MESSAGES = {
  SEARCH_PLACEHOLDER: '请输入搜索关键词...',
  SEARCH_RESULTS: (count) => `找到 ${count} 条结果`,
  NO_SEARCH_RESULTS: '没有找到匹配的结果',
  SEARCH_TOO_SHORT: '搜索关键词至少需要2个字符',
  CLEAR_SEARCH: '清除搜索',
  ADVANCED_SEARCH: '高级搜索',
  SEARCH_TIPS: '搜索提示：支持按姓名、学号、专业、年级搜索'
};

/**
 * 导入导出消息
 */
export const IMPORT_EXPORT_MESSAGES = {
  IMPORT_SUCCESS: (count) => `成功导入 ${count} 条记录`,
  IMPORT_FAILED: '导入失败',
  IMPORT_PARTIAL: (success, failed) => `导入完成：成功 ${success} 条，失败 ${failed} 条`,
  EXPORT_SUCCESS: '导出成功',
  EXPORT_FAILED: '导出失败',
  INVALID_FILE_FORMAT: '文件格式不正确，请上传Excel或CSV文件',
  FILE_TOO_LARGE: '文件大小超出限制',
  DOWNLOAD_TEMPLATE: '下载模板',
  UPLOAD_FILE: '上传文件'
};

/**
 * 获取消息的工具函数
 */
export class MessageHelper {
  /**
   * 格式化错误消息
   * @param {string} key - 错误消息键
   * @param {...any} args - 参数
   * @returns {string} 格式化后的消息
   */
  static getErrorMessage(key, ...args) {
    const message = ERROR_MESSAGES[key];
    return typeof message === 'function' ? message(...args) : message || '未知错误';
  }

  /**
   * 格式化成功消息
   * @param {string} key - 成功消息键
   * @param {...any} args - 参数
   * @returns {string} 格式化后的消息
   */
  static getSuccessMessage(key, ...args) {
    const message = SUCCESS_MESSAGES[key];
    return typeof message === 'function' ? message(...args) : message || '操作成功';
  }

  /**
   * 格式化警告消息
   * @param {string} key - 警告消息键
   * @param {...any} args - 参数
   * @returns {string} 格式化后的消息
   */
  static getWarningMessage(key, ...args) {
    const message = WARNING_MESSAGES[key];
    return typeof message === 'function' ? message(...args) : message || '警告';
  }

  /**
   * 格式化信息消息
   * @param {string} key - 信息消息键
   * @param {...any} args - 参数
   * @returns {string} 格式化后的消息
   */
  static getInfoMessage(key, ...args) {
    const message = INFO_MESSAGES[key];
    return typeof message === 'function' ? message(...args) : message || '信息';
  }

  /**
   * 格式化表单验证消息
   * @param {string} key - 验证消息键
   * @param {...any} args - 参数
   * @returns {string} 格式化后的消息
   */
  static getFormMessage(key, ...args) {
    const message = FORM_MESSAGES[key];
    return typeof message === 'function' ? message(...args) : message || '验证失败';
  }

  /**
   * 格式化确认消息
   * @param {string} key - 确认消息键
   * @param {...any} args - 参数
   * @returns {string} 格式化后的消息
   */
  static getConfirmMessage(key, ...args) {
    const message = CONFIRM_MESSAGES[key];
    return typeof message === 'function' ? message(...args) : message || '确认操作';
  }

  /**
   * 根据HTTP状态码获取错误消息
   * @param {number} statusCode - HTTP状态码
   * @returns {string} 错误消息
   */
  static getHttpErrorMessage(statusCode) {
    const messages = {
      400: '请求参数错误',
      401: '未授权访问',
      403: '禁止访问',
      404: '请求的资源不存在',
      405: '请求方法不被允许',
      408: '请求超时',
      409: '请求冲突',
      422: '请求参数验证失败',
      429: '请求过于频繁',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务不可用',
      504: '网关超时'
    };
    return messages[statusCode] || `HTTP错误 ${statusCode}`;
  }

  /**
   * 创建带有时间戳的日志消息
   * @param {string} level - 日志级别 (info, warn, error)
   * @param {string} message - 消息内容
   * @returns {string} 格式化的日志消息
   */
  static createLogMessage(level, message) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    return `[${timestamp}] ${levelUpper} ${message}`;
  }

  /**
   * 验证消息是否为空
   * @param {string} message - 消息内容
   * @returns {boolean} 是否为空
   */
  static isEmpty(message) {
    return !message || message.trim().length === 0;
  }

  /**
   * 截断过长的消息
   * @param {string} message - 消息内容
   * @param {number} maxLength - 最大长度
   * @returns {string} 截断后的消息
   */
  static truncate(message, maxLength = 100) {
    if (!message || message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + '...';
  }
}

/**
 * 默认导出
 */
export default {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WARNING_MESSAGES,
  INFO_MESSAGES,
  FORM_MESSAGES,
  CONFIRM_MESSAGES,
  STATUS_MESSAGES,
  PAGINATION_MESSAGES,
  SEARCH_MESSAGES,
  IMPORT_EXPORT_MESSAGES,
  MessageHelper
};