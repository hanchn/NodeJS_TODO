# 第8章：前端交互和 AJAX

## 8.1 章节概述

本章将深入学习前端 JavaScript 和 AJAX 技术，实现动态的用户界面和无刷新的数据交互。我们将学习如何使用原生 JavaScript 和现代 Web API 来创建流畅的用户体验。

### 学习目标

- 掌握现代 JavaScript 基础语法和 ES6+ 特性
- 理解 DOM 操作和事件处理机制
- 学习 AJAX 和 Fetch API 的使用
- 实现前后端数据交互
- 掌握异步编程和 Promise
- 学习错误处理和用户反馈
- 实现实时数据更新和用户体验优化

### 技术要点

- JavaScript ES6+ 语法
- DOM 操作和事件系统
- Fetch API 和 XMLHttpRequest
- Promise 和 async/await
- JSON 数据处理
- 错误处理和用户反馈
- 性能优化和最佳实践

## 8.2 JavaScript 基础回顾

### ES6+ 核心特性

```javascript
// public/js/utils.js

// 1. 箭头函数
const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

// 2. 模板字符串
const createStudentCard = (student) => {
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card student-card" data-student-id="${student.id}">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        ${student.avatar ? 
                            `<img src="${student.avatar}" alt="${student.name}" 
                                 class="rounded-circle me-3" width="50" height="50">` :
                            `<div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center me-3" 
                                 style="width: 50px; height: 50px; color: white; font-size: 20px;">
                                ${student.name.charAt(0).toUpperCase()}
                             </div>`
                        }
                        <div>
                            <h6 class="card-title mb-1">${student.name}</h6>
                            <small class="text-muted">${student.studentId || '未分配学号'}</small>
                        </div>
                    </div>
                    
                    <div class="student-info">
                        <p class="mb-1"><i class="fas fa-envelope text-primary"></i> ${student.email}</p>
                        <p class="mb-1"><i class="fas fa-graduation-cap text-info"></i> ${student.major || '未设置专业'}</p>
                        <p class="mb-2"><i class="fas fa-calendar text-warning"></i> ${student.grade || '未设置年级'}</p>
                        
                        <span class="badge ${
                            student.status === 'active' ? 'bg-success' :
                            student.status === 'inactive' ? 'bg-warning' :
                            student.status === 'graduated' ? 'bg-info' :
                            'bg-danger'
                        }">
                            ${
                                student.status === 'active' ? '活跃' :
                                student.status === 'inactive' ? '非活跃' :
                                student.status === 'graduated' ? '已毕业' :
                                '已暂停'
                            }
                        </span>
                    </div>
                    
                    <div class="card-actions mt-3">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary btn-sm" 
                                    onclick="viewStudent(${student.id})">
                                <i class="fas fa-eye"></i> 查看
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" 
                                    onclick="editStudent(${student.id})">
                                <i class="fas fa-edit"></i> 编辑
                            </button>
                            <button class="btn btn-outline-danger btn-sm" 
                                    onclick="deleteStudent(${student.id}, '${student.name}')">
                                <i class="fas fa-trash"></i> 删除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// 3. 解构赋值
const extractStudentData = (formData) => {
    const {
        name,
        email,
        age,
        gender,
        major,
        grade,
        status = 'active'
    } = formData;
    
    return {
        name: name?.trim(),
        email: email?.toLowerCase().trim(),
        age: age ? parseInt(age) : null,
        gender,
        major,
        grade,
        status
    };
};

// 4. 默认参数
const showNotification = (message, type = 'info', duration = 3000) => {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show notification`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.getElementById('notifications').appendChild(notification);
    
    // 自动移除通知
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
};

// 5. 扩展运算符
const mergeStudentData = (existingData, newData) => {
    return {
        ...existingData,
        ...newData,
        updatedAt: new Date().toISOString()
    };
};

// 6. Promise 和 async/await
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const withLoading = async (asyncFunction, loadingElement) => {
    try {
        loadingElement.style.display = 'block';
        await delay(100); // 确保加载动画显示
        const result = await asyncFunction();
        return result;
    } finally {
        loadingElement.style.display = 'none';
    }
};

// 7. 类和模块
class StudentManager {
    constructor() {
        this.students = new Map();
        this.filters = {
            search: '',
            major: '',
            grade: '',
            status: ''
        };
        this.sortBy = 'name';
        this.sortOrder = 'asc';
    }
    
    // 添加学生到本地缓存
    addStudent(student) {
        this.students.set(student.id, student);
        this.renderStudents();
    }
    
    // 更新学生信息
    updateStudent(id, updates) {
        if (this.students.has(id)) {
            const student = this.students.get(id);
            this.students.set(id, { ...student, ...updates });
            this.renderStudents();
        }
    }
    
    // 删除学生
    removeStudent(id) {
        this.students.delete(id);
        this.renderStudents();
    }
    
    // 设置过滤器
    setFilter(key, value) {
        this.filters[key] = value;
        this.renderStudents();
    }
    
    // 设置排序
    setSorting(sortBy, sortOrder = 'asc') {
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        this.renderStudents();
    }
    
    // 获取过滤和排序后的学生列表
    getFilteredStudents() {
        let students = Array.from(this.students.values());
        
        // 应用过滤器
        students = students.filter(student => {
            const matchesSearch = !this.filters.search || 
                student.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                student.email.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                (student.studentId && student.studentId.toLowerCase().includes(this.filters.search.toLowerCase()));
            
            const matchesMajor = !this.filters.major || student.major === this.filters.major;
            const matchesGrade = !this.filters.grade || student.grade === this.filters.grade;
            const matchesStatus = !this.filters.status || student.status === this.filters.status;
            
            return matchesSearch && matchesMajor && matchesGrade && matchesStatus;
        });
        
        // 应用排序
        students.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];
            
            // 处理空值
            if (!aValue) aValue = '';
            if (!bValue) bValue = '';
            
            // 字符串比较
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            let comparison = 0;
            if (aValue > bValue) comparison = 1;
            if (aValue < bValue) comparison = -1;
            
            return this.sortOrder === 'desc' ? -comparison : comparison;
        });
        
        return students;
    }
    
    // 渲染学生列表
    renderStudents() {
        const container = document.getElementById('students-container');
        const students = this.getFilteredStudents();
        
        if (students.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">没有找到学生</h5>
                        <p class="text-muted">请尝试调整搜索条件或添加新学生</p>
                        <a href="/students/new" class="btn btn-primary">
                            <i class="fas fa-plus"></i> 添加学生
                        </a>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = students.map(createStudentCard).join('');
        
        // 更新统计信息
        this.updateStats(students);
    }
    
    // 更新统计信息
    updateStats(students) {
        const totalElement = document.getElementById('total-students');
        const activeElement = document.getElementById('active-students');
        const graduatedElement = document.getElementById('graduated-students');
        
        if (totalElement) totalElement.textContent = students.length;
        if (activeElement) {
            activeElement.textContent = students.filter(s => s.status === 'active').length;
        }
        if (graduatedElement) {
            graduatedElement.textContent = students.filter(s => s.status === 'graduated').length;
        }
    }
}

// 导出工具函数
window.StudentUtils = {
    formatDate,
    createStudentCard,
    extractStudentData,
    showNotification,
    mergeStudentData,
    withLoading,
    delay
};

// 创建全局学生管理器实例
window.studentManager = new StudentManager();
```

## 8.3 DOM 操作和事件处理

### 现代 DOM 操作

```javascript
// public/js/dom-utils.js

// DOM 查询工具
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// 元素创建工具
const createElement = (tag, attributes = {}, children = []) => {
    const element = document.createElement(tag);
    
    // 设置属性
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else {
            element[key] = value;
        }
    });
    
    // 添加子元素
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    
    return element;
};

// 事件处理工具
class EventManager {
    constructor() {
        this.listeners = new Map();
    }
    
    // 添加事件监听器
    on(element, event, handler, options = {}) {
        const key = `${element}_${event}`;
        
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        
        this.listeners.get(key).push({ handler, options });
        element.addEventListener(event, handler, options);
    }
    
    // 移除事件监听器
    off(element, event, handler) {
        const key = `${element}_${event}`;
        
        if (this.listeners.has(key)) {
            const listeners = this.listeners.get(key);
            const index = listeners.findIndex(l => l.handler === handler);
            
            if (index !== -1) {
                listeners.splice(index, 1);
                element.removeEventListener(event, handler);
            }
        }
    }
    
    // 清除所有事件监听器
    clear() {
        this.listeners.clear();
    }
    
    // 委托事件处理
    delegate(container, selector, event, handler) {
        this.on(container, event, (e) => {
            const target = e.target.closest(selector);
            if (target) {
                handler.call(target, e);
            }
        });
    }
}

// 表单处理工具
class FormHandler {
    constructor(form) {
        this.form = form;
        this.validators = new Map();
        this.eventManager = new EventManager();
        this.setupValidation();
    }
    
    // 设置表单验证
    setupValidation() {
        // 实时验证
        this.eventManager.delegate(this.form, 'input, select, textarea', 'blur', (e) => {
            this.validateField(e.target);
        });
        
        // 输入时清除错误状态
        this.eventManager.delegate(this.form, 'input, select, textarea', 'input', (e) => {
            if (e.target.classList.contains('is-invalid')) {
                e.target.classList.remove('is-invalid');
                const feedback = e.target.parentNode.querySelector('.invalid-feedback');
                if (feedback) feedback.style.display = 'none';
            }
        });
        
        // 表单提交验证
        this.eventManager.on(this.form, 'submit', (e) => {
            e.preventDefault();
            this.handleSubmit(e);
        });
    }
    
    // 添加验证规则
    addValidator(fieldName, validator) {
        if (!this.validators.has(fieldName)) {
            this.validators.set(fieldName, []);
        }
        this.validators.get(fieldName).push(validator);
    }
    
    // 验证单个字段
    validateField(field) {
        const fieldName = field.name;
        const validators = this.validators.get(fieldName) || [];
        
        // 清除之前的错误状态
        field.classList.remove('is-invalid', 'is-valid');
        
        // 运行验证器
        for (const validator of validators) {
            const result = validator(field.value, field);
            if (result !== true) {
                this.showFieldError(field, result);
                return false;
            }
        }
        
        // 验证通过
        field.classList.add('is-valid');
        return true;
    }
    
    // 显示字段错误
    showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        let feedback = field.parentNode.querySelector('.invalid-feedback');
        if (!feedback) {
            feedback = createElement('div', { className: 'invalid-feedback' });
            field.parentNode.appendChild(feedback);
        }
        
        feedback.textContent = message;
        feedback.style.display = 'block';
    }
    
    // 验证整个表单
    validateForm() {
        const fields = this.form.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    // 获取表单数据
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // 处理多值字段
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    // 设置表单数据
    setFormData(data) {
        Object.entries(data).forEach(([key, value]) => {
            const field = this.form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = field.value === value;
                } else {
                    field.value = value;
                }
            }
        });
    }
    
    // 重置表单
    reset() {
        this.form.reset();
        this.form.querySelectorAll('.is-invalid, .is-valid').forEach(field => {
            field.classList.remove('is-invalid', 'is-valid');
        });
        this.form.querySelectorAll('.invalid-feedback').forEach(feedback => {
            feedback.style.display = 'none';
        });
    }
    
    // 处理表单提交
    async handleSubmit(e) {
        if (!this.validateForm()) {
            return;
        }
        
        const submitBtn = this.form.querySelector('[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // 显示加载状态
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
            
            // 获取表单数据
            const formData = this.getFormData();
            
            // 触发自定义提交事件
            const submitEvent = new CustomEvent('formSubmit', {
                detail: { formData, form: this.form }
            });
            this.form.dispatchEvent(submitEvent);
            
        } catch (error) {
            console.error('表单提交错误:', error);
            showNotification('提交失败，请稍后重试', 'danger');
        } finally {
            // 恢复按钮状态
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
    
    // 销毁表单处理器
    destroy() {
        this.eventManager.clear();
        this.validators.clear();
    }
}

// 模态框管理
class ModalManager {
    constructor() {
        this.modals = new Map();
    }
    
    // 创建模态框
    create(id, options = {}) {
        const {
            title = '模态框',
            body = '',
            footer = '',
            size = '',
            backdrop = true,
            keyboard = true
        } = options;
        
        const modal = createElement('div', {
            className: 'modal fade',
            id: id,
            'data-bs-backdrop': backdrop,
            'data-bs-keyboard': keyboard,
            tabindex: '-1'
        }, [
            createElement('div', {
                className: `modal-dialog ${size ? `modal-${size}` : ''}`
            }, [
                createElement('div', {
                    className: 'modal-content'
                }, [
                    createElement('div', {
                        className: 'modal-header'
                    }, [
                        createElement('h5', {
                            className: 'modal-title',
                            textContent: title
                        }),
                        createElement('button', {
                            type: 'button',
                            className: 'btn-close',
                            'data-bs-dismiss': 'modal'
                        })
                    ]),
                    createElement('div', {
                        className: 'modal-body',
                        innerHTML: body
                    }),
                    footer ? createElement('div', {
                        className: 'modal-footer',
                        innerHTML: footer
                    }) : null
                ].filter(Boolean))
            ])
        ]);
        
        document.body.appendChild(modal);
        this.modals.set(id, new bootstrap.Modal(modal));
        
        return this.modals.get(id);
    }
    
    // 显示模态框
    show(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.show();
        }
    }
    
    // 隐藏模态框
    hide(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.hide();
        }
    }
    
    // 更新模态框内容
    updateContent(id, { title, body, footer }) {
        const modalElement = document.getElementById(id);
        if (!modalElement) return;
        
        if (title) {
            const titleElement = modalElement.querySelector('.modal-title');
            if (titleElement) titleElement.textContent = title;
        }
        
        if (body) {
            const bodyElement = modalElement.querySelector('.modal-body');
            if (bodyElement) bodyElement.innerHTML = body;
        }
        
        if (footer) {
            const footerElement = modalElement.querySelector('.modal-footer');
            if (footerElement) footerElement.innerHTML = footer;
        }
    }
    
    // 销毁模态框
    destroy(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.dispose();
            this.modals.delete(id);
            
            const modalElement = document.getElementById(id);
            if (modalElement) {
                modalElement.remove();
            }
        }
    }
}

// 导出工具
window.DOMUtils = {
    $,
    $$,
    createElement,
    EventManager,
    FormHandler,
    ModalManager
};

// 创建全局实例
window.eventManager = new EventManager();
window.modalManager = new ModalManager();
```

## 8.4 AJAX 和 Fetch API

### API 客户端封装

```javascript
// public/js/api-client.js

// API 基础配置
const API_CONFIG = {
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
};

// HTTP 状态码处理
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

// API 错误类
class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// API 客户端类
class APIClient {
    constructor(config = {}) {
        this.config = { ...API_CONFIG, ...config };
        this.interceptors = {
            request: [],
            response: []
        };
    }
    
    // 添加请求拦截器
    addRequestInterceptor(interceptor) {
        this.interceptors.request.push(interceptor);
    }
    
    // 添加响应拦截器
    addResponseInterceptor(interceptor) {
        this.interceptors.response.push(interceptor);
    }
    
    // 构建完整 URL
    buildURL(endpoint) {
        if (endpoint.startsWith('http')) {
            return endpoint;
        }
        return `${this.config.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    }
    
    // 处理请求拦截器
    async processRequestInterceptors(config) {
        let processedConfig = { ...config };
        
        for (const interceptor of this.interceptors.request) {
            processedConfig = await interceptor(processedConfig);
        }
        
        return processedConfig;
    }
    
    // 处理响应拦截器
    async processResponseInterceptors(response) {
        let processedResponse = response;
        
        for (const interceptor of this.interceptors.response) {
            processedResponse = await interceptor(processedResponse);
        }
        
        return processedResponse;
    }
    
    // 基础请求方法
    async request(endpoint, options = {}) {
        const url = this.buildURL(endpoint);
        
        // 合并配置
        let config = {
            method: 'GET',
            headers: { ...this.config.headers },
            ...options
        };
        
        // 处理请求拦截器
        config = await this.processRequestInterceptors(config);
        
        // 设置超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        config.signal = controller.signal;
        
        try {
            // 发送请求
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            
            // 处理响应拦截器
            const processedResponse = await this.processResponseInterceptors(response);
            
            // 检查响应状态
            if (!processedResponse.ok) {
                const errorData = await this.parseResponse(processedResponse);
                throw new APIError(
                    errorData.message || `HTTP ${processedResponse.status}`,
                    processedResponse.status,
                    errorData
                );
            }
            
            // 解析响应数据
            return await this.parseResponse(processedResponse);
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new APIError('请求超时', 408);
            }
            
            if (error instanceof APIError) {
                throw error;
            }
            
            throw new APIError('网络错误', 0, error);
        }
    }
    
    // 解析响应数据
    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        if (response.status === HTTP_STATUS.NO_CONTENT) {
            return null;
        }
        
        return await response.text();
    }
    
    // GET 请求
    async get(endpoint, params = {}) {
        const url = new URL(this.buildURL(endpoint));
        
        // 添加查询参数
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, value);
            }
        });
        
        return this.request(url.toString());
    }
    
    // POST 请求
    async post(endpoint, data = null) {
        const options = {
            method: 'POST'
        };
        
        if (data) {
            if (data instanceof FormData) {
                options.body = data;
                // 让浏览器自动设置 Content-Type
                delete options.headers;
            } else {
                options.body = JSON.stringify(data);
            }
        }
        
        return this.request(endpoint, options);
    }
    
    // PUT 请求
    async put(endpoint, data = null) {
        const options = {
            method: 'PUT'
        };
        
        if (data) {
            if (data instanceof FormData) {
                options.body = data;
                delete options.headers;
            } else {
                options.body = JSON.stringify(data);
            }
        }
        
        return this.request(endpoint, options);
    }
    
    // PATCH 请求
    async patch(endpoint, data = null) {
        const options = {
            method: 'PATCH'
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        return this.request(endpoint, options);
    }
    
    // DELETE 请求
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    
    // 文件上传
    async upload(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // 添加额外数据
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        return this.post(endpoint, formData);
    }
    
    // 批量请求
    async batch(requests) {
        const promises = requests.map(({ method, endpoint, data }) => {
            return this[method.toLowerCase()](endpoint, data).catch(error => ({ error }));
        });
        
        return Promise.all(promises);
    }
}

// 学生 API 服务
class StudentAPI {
    constructor(apiClient) {
        this.api = apiClient;
    }
    
    // 获取学生列表
    async getStudents(params = {}) {
        return this.api.get('/students', params);
    }
    
    // 获取单个学生
    async getStudent(id) {
        return this.api.get(`/students/${id}`);
    }
    
    // 创建学生
    async createStudent(studentData) {
        return this.api.post('/students', studentData);
    }
    
    // 更新学生
    async updateStudent(id, studentData) {
        return this.api.put(`/students/${id}`, studentData);
    }
    
    // 删除学生
    async deleteStudent(id) {
        return this.api.delete(`/students/${id}`);
    }
    
    // 批量删除学生
    async batchDeleteStudents(ids) {
        return this.api.post('/students/batch-delete', { ids });
    }
    
    // 搜索学生
    async searchStudents(query) {
        return this.api.get('/students/search', { q: query });
    }
    
    // 获取学生统计
    async getStudentStats() {
        return this.api.get('/students/stats');
    }
    
    // 导出学生数据
    async exportStudents(format = 'csv') {
        return this.api.get('/students/export', { format });
    }
    
    // 导入学生数据
    async importStudents(file) {
        return this.api.upload('/students/import', file);
    }
}

// 创建 API 客户端实例
const apiClient = new APIClient();

// 添加请求拦截器 - 添加认证令牌
apiClient.addRequestInterceptor(async (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 添加响应拦截器 - 处理认证错误
apiClient.addResponseInterceptor(async (response) => {
    if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        // 清除认证信息
        localStorage.removeItem('authToken');
        // 重定向到登录页面
        window.location.href = '/login';
    }
    return response;
});

// 创建学生 API 实例
const studentAPI = new StudentAPI(apiClient);

// 导出 API
window.API = {
    client: apiClient,
    students: studentAPI,
    APIError
};
```

### 实际应用示例

```javascript
// public/js/student-list.js

// 学生列表页面逻辑
class StudentListPage {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 12;
        this.totalPages = 1;
        this.isLoading = false;
        
        this.init();
    }
    
    // 初始化页面
    async init() {
        this.setupEventListeners();
        this.setupFilters();
        await this.loadStudents();
        this.setupInfiniteScroll();
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 搜索功能
        const searchInput = $('#search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
        }
        
        // 过滤器
        $$('.filter-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.handleFilter(e.target.name, e.target.value);
            });
        });
        
        // 排序
        $$('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sortBy = e.target.dataset.sort;
                const currentOrder = e.target.dataset.order || 'asc';
                const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
                
                this.handleSort(sortBy, newOrder);
                e.target.dataset.order = newOrder;
                
                // 更新排序图标
                this.updateSortIcons(e.target, newOrder);
            });
        });
        
        // 批量操作
        const selectAllCheckbox = $('#select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.handleSelectAll(e.target.checked);
            });
        }
        
        // 批量删除
        const batchDeleteBtn = $('#batch-delete-btn');
        if (batchDeleteBtn) {
            batchDeleteBtn.addEventListener('click', () => {
                this.handleBatchDelete();
            });
        }
        
        // 刷新按钮
        const refreshBtn = $('#refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshStudents();
            });
        }
    }
    
    // 设置过滤器
    setupFilters() {
        // 从 URL 参数恢复过滤器状态
        const urlParams = new URLSearchParams(window.location.search);
        
        urlParams.forEach((value, key) => {
            const element = $(`[name="${key}"]`);
            if (element) {
                element.value = value;
                studentManager.setFilter(key, value);
            }
        });
    }
    
    // 加载学生数据
    async loadStudents(append = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const params = {
                page: this.currentPage,
                limit: this.pageSize,
                search: studentManager.filters.search,
                major: studentManager.filters.major,
                grade: studentManager.filters.grade,
                status: studentManager.filters.status,
                sortBy: studentManager.sortBy,
                sortOrder: studentManager.sortOrder
            };
            
            const response = await API.students.getStudents(params);
            
            if (append) {
                // 追加数据（无限滚动）
                response.data.forEach(student => {
                    studentManager.addStudent(student);
                });
            } else {
                // 替换数据
                studentManager.students.clear();
                response.data.forEach(student => {
                    studentManager.addStudent(student);
                });
            }
            
            // 更新分页信息
            this.totalPages = response.pagination.totalPages;
            this.updatePaginationInfo(response.pagination);
            
            // 更新 URL
            this.updateURL();
            
        } catch (error) {
            console.error('加载学生数据失败:', error);
            this.showError('加载学生数据失败，请稍后重试');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    // 处理搜索
    async handleSearch(query) {
        studentManager.setFilter('search', query);
        this.currentPage = 1;
        await this.loadStudents();
    }
    
    // 处理过滤
    async handleFilter(key, value) {
        studentManager.setFilter(key, value);
        this.currentPage = 1;
        await this.loadStudents();
    }
    
    // 处理排序
    async handleSort(sortBy, sortOrder) {
        studentManager.setSorting(sortBy, sortOrder);
        this.currentPage = 1;
        await this.loadStudents();
    }
    
    // 处理全选
    handleSelectAll(checked) {
        $$('.student-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateBulkActions();
    }
    
    // 更新批量操作工具栏
    updateBulkActions() {
        const checkedBoxes = $$('.student-checkbox:checked');
        const bulkActions = $('#bulk-actions');
        const selectedCount = $('#selected-count');
        
        if (checkedBoxes.length > 0) {
            bulkActions.style.display = 'block';
            selectedCount.textContent = checkedBoxes.length;
        } else {
            bulkActions.style.display = 'none';
        }
    }
    
    // 处理批量删除
    async handleBatchDelete() {
        const checkedBoxes = $$('.student-checkbox:checked');
        const ids = Array.from(checkedBoxes).map(cb => cb.value);
        
        if (ids.length === 0) {
            showNotification('请选择要删除的学生', 'warning');
            return;
        }
        
        const confirmed = await this.showConfirmDialog(
            '批量删除确认',
            `确定要删除选中的 ${ids.length} 个学生吗？此操作不可恢复。`,
            'danger'
        );
        
        if (!confirmed) return;
        
        try {
            await API.students.batchDeleteStudents(ids);
            
            // 从本地缓存中移除
            ids.forEach(id => {
                studentManager.removeStudent(parseInt(id));
            });
            
            showNotification(`成功删除 ${ids.length} 个学生`, 'success');
            this.updateBulkActions();
            
        } catch (error) {
            console.error('批量删除失败:', error);
            showNotification('批量删除失败，请稍后重试', 'danger');
        }
    }
    
    // 刷新学生列表
    async refreshStudents() {
        this.currentPage = 1;
        await this.loadStudents();
        showNotification('数据已刷新', 'success');
    }
    
    // 设置无限滚动
    setupInfiniteScroll() {
        let isScrolling = false;
        
        window.addEventListener('scroll', async () => {
            if (isScrolling || this.isLoading) return;
            
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            
            // 距离底部 100px 时开始加载
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                if (this.currentPage < this.totalPages) {
                    isScrolling = true;
                    this.currentPage++;
                    await this.loadStudents(true);
                    isScrolling = false;
                }
            }
        });
    }
    
    // 显示加载状态
    showLoading() {
        const loadingElement = $('#loading-indicator');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
    }
    
    // 隐藏加载状态
    hideLoading() {
        const loadingElement = $('#loading-indicator');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    // 显示错误信息
    showError(message) {
        showNotification(message, 'danger');
    }
    
    // 显示确认对话框
    async showConfirmDialog(title, message, type = 'primary') {
        return new Promise((resolve) => {
            const modalId = 'confirm-modal';
            
            modalManager.create(modalId, {
                title: title,
                body: `<p>${message}</p>`,
                footer: `
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-${type}" id="confirm-btn">确认</button>
                `,
                backdrop: true,
                keyboard: true
            });
            
            const modal = modalManager.modals.get(modalId);
            const modalElement = document.getElementById(modalId);
            
            // 确认按钮事件
            modalElement.querySelector('#confirm-btn').addEventListener('click', () => {
                resolve(true);
                modal.hide();
            });
            
            // 模态框关闭事件
            modalElement.addEventListener('hidden.bs.modal', () => {
                resolve(false);
                modalManager.destroy(modalId);
            });
            
            modal.show();
        });
    }
    
    // 更新排序图标
    updateSortIcons(activeBtn, order) {
        // 清除所有排序图标
        $$('.sort-btn i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        
        // 设置当前排序图标
        const icon = activeBtn.querySelector('i');
        if (icon) {
            icon.className = order === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        }
    }
    
    // 更新分页信息
    updatePaginationInfo(pagination) {
        const paginationInfo = $('#pagination-info');
        if (paginationInfo) {
            paginationInfo.textContent = 
                `显示 ${pagination.offset + 1}-${Math.min(pagination.offset + pagination.limit, pagination.total)} 条，共 ${pagination.total} 条`;
        }
    }
    
    // 更新 URL
    updateURL() {
        const params = new URLSearchParams();
        
        Object.entries(studentManager.filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });
        
        if (studentManager.sortBy !== 'name') {
            params.set('sortBy', studentManager.sortBy);
        }
        
        if (studentManager.sortOrder !== 'asc') {
            params.set('sortOrder', studentManager.sortOrder);
        }
        
        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newURL);
    }
}

// 全局函数 - 供模板调用
window.viewStudent = (id) => {
    window.location.href = `/students/${id}`;
};

window.editStudent = (id) => {
    window.location.href = `/students/${id}/edit`;
};

window.deleteStudent = async (id, name) => {
    const confirmed = await studentListPage.showConfirmDialog(
        '删除确认',
        `确定要删除学生 "${name}" 吗？此操作不可恢复。`,
        'danger'
    );
    
    if (!confirmed) return;
    
    try {
        await API.students.deleteStudent(id);
        studentManager.removeStudent(id);
        showNotification(`学生 "${name}" 已删除`, 'success');
    } catch (error) {
        console.error('删除学生失败:', error);
        showNotification('删除失败，请稍后重试', 'danger');
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.studentListPage = new StudentListPage();
});
```

## 8.5 异步编程和 Promise

### Promise 和 async/await 最佳实践

```javascript
// public/js/async-utils.js

// Promise 工具函数
class PromiseUtils {
    // 延迟执行
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // 超时控制
    static timeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('操作超时')), ms)
            )
        ]);
    }
    
    // 重试机制
    static async retry(fn, maxAttempts = 3, delay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxAttempts) {
                    throw error;
                }
                
                console.warn(`尝试 ${attempt} 失败，${delay}ms 后重试:`, error.message);
                await this.delay(delay);
                
                // 指数退避
                delay *= 2;
            }
        }
        
        throw lastError;
    }
    
    // 并发控制
    static async concurrent(tasks, limit = 3) {
        const results = [];
        const executing = [];
        
        for (const [index, task] of tasks.entries()) {
            const promise = Promise.resolve().then(() => task()).then(
                result => ({ index, result, status: 'fulfilled' }),
                error => ({ index, error, status: 'rejected' })
            );
            
            results.push(promise);
            
            if (tasks.length >= limit) {
                executing.push(promise);
                
                if (executing.length >= limit) {
                    await Promise.race(executing);
                    executing.splice(executing.findIndex(p => p === promise), 1);
                }
            }
        }
        
        return Promise.all(results);
    }
    
    // 批处理
    static async batch(items, processor, batchSize = 10) {
        const results = [];
        
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(item => processor(item))
            );
            results.push(...batchResults);
        }
        
        return results;
    }
    
    // 缓存 Promise
    static memoize(fn, keyGenerator = (...args) => JSON.stringify(args)) {
        const cache = new Map();
        
        return async (...args) => {
            const key = keyGenerator(...args);
            
            if (cache.has(key)) {
                return cache.get(key);
            }
            
            const promise = fn(...args);
            cache.set(key, promise);
            
            try {
                return await promise;
            } catch (error) {
                // 失败时清除缓存
                cache.delete(key);
                throw error;
            }
        };
    }
    
    // 防抖
    static debounce(fn, delay) {
        let timeoutId;
        
        return (...args) => {
            clearTimeout(timeoutId);
            
            return new Promise((resolve, reject) => {
                timeoutId = setTimeout(async () => {
                    try {
                        const result = await fn(...args);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                }, delay);
            });
        };
    }
    
    // 节流
    static throttle(fn, delay) {
        let lastCall = 0;
        let timeoutId;
        
        return (...args) => {
            const now = Date.now();
            
            return new Promise((resolve, reject) => {
                if (now - lastCall >= delay) {
                    lastCall = now;
                    fn(...args).then(resolve).catch(reject);
                } else {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        lastCall = Date.now();
                        fn(...args).then(resolve).catch(reject);
                    }, delay - (now - lastCall));
                }
            });
        };
    }
}

// 异步队列
class AsyncQueue {
    constructor(concurrency = 1) {
        this.concurrency = concurrency;
        this.running = 0;
        this.queue = [];
    }
    
    // 添加任务
    add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                task,
                resolve,
                reject
            });
            
            this.process();
        });
    }
    
    // 处理队列
    async process() {
        if (this.running >= this.concurrency || this.queue.length === 0) {
            return;
        }
        
        this.running++;
        const { task, resolve, reject } = this.queue.shift();
        
        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.running--;
            this.process();
        }
    }
    
    // 清空队列
    clear() {
        this.queue.forEach(({ reject }) => {
            reject(new Error('队列已清空'));
        });
        this.queue = [];
    }
    
    // 获取队列状态
    getStatus() {
        return {
            running: this.running,
            pending: this.queue.length,
            concurrency: this.concurrency
        };
    }
}

// 数据加载器
class DataLoader {
    constructor(options = {}) {
        this.cache = new Map();
        this.loading = new Map();
        this.options = {
            cacheTimeout: 5 * 60 * 1000, // 5分钟
            maxCacheSize: 100,
            ...options
        };
    }
    
    // 加载数据
    async load(key, loader) {
        // 检查缓存
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            if (Date.now() - cached.timestamp < this.options.cacheTimeout) {
                return cached.data;
            } else {
                this.cache.delete(key);
            }
        }
        
        // 检查是否正在加载
        if (this.loading.has(key)) {
            return this.loading.get(key);
        }
        
        // 开始加载
        const promise = this.loadData(key, loader);
        this.loading.set(key, promise);
        
        try {
            const data = await promise;
            
            // 缓存数据
            this.setCache(key, data);
            
            return data;
        } finally {
            this.loading.delete(key);
        }
    }
    
    // 实际加载数据
    async loadData(key, loader) {
        try {
            return await loader();
        } catch (error) {
            console.error(`加载数据失败 [${key}]:`, error);
            throw error;
        }
    }
    
    // 设置缓存
    setCache(key, data) {
        // 检查缓存大小
        if (this.cache.size >= this.options.maxCacheSize) {
            // 删除最旧的缓存
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    // 清除缓存
    clearCache(key) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
    
    // 预加载数据
    async preload(key, loader) {
        if (!this.cache.has(key) && !this.loading.has(key)) {
            this.load(key, loader).catch(() => {
                // 预加载失败不抛出错误
            });
        }
    }
}

// 实际应用示例
const studentDataLoader = new DataLoader({
    cacheTimeout: 2 * 60 * 1000, // 2分钟缓存
    maxCacheSize: 50
});

// 加载学生数据
const loadStudentData = async (id) => {
    return studentDataLoader.load(`student-${id}`, async () => {
        return API.students.getStudent(id);
    });
};

// 预加载相关学生数据
const preloadRelatedStudents = async (currentStudentId) => {
    const relatedIds = await getRelatedStudentIds(currentStudentId);
    
    relatedIds.forEach(id => {
        studentDataLoader.preload(`student-${id}`, () => {
            return API.students.getStudent(id);
        });
    });
};

// 导出工具
window.AsyncUtils = {
    PromiseUtils,
    AsyncQueue,
    DataLoader
};
```

## 8.6 错误处理和用户反馈

### 统一错误处理机制

```javascript
// public/js/error-handler.js

// 错误类型定义
const ERROR_TYPES = {
    NETWORK: 'network',
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    NOT_FOUND: 'not_found',
    SERVER: 'server',
    UNKNOWN: 'unknown'
};

// 错误处理器类
class ErrorHandler {
    constructor() {
        this.handlers = new Map();
        this.setupDefaultHandlers();
        this.setupGlobalErrorHandling();
    }
    
    // 设置默认错误处理器
    setupDefaultHandlers() {
        // 网络错误
        this.addHandler(ERROR_TYPES.NETWORK, (error) => {
            showNotification('网络连接失败，请检查网络设置', 'danger', 5000);
            console.error('网络错误:', error);
        });
        
        // 验证错误
        this.addHandler(ERROR_TYPES.VALIDATION, (error) => {
            if (error.data && error.data.errors) {
                this.showValidationErrors(error.data.errors);
            } else {
                showNotification(error.message || '数据验证失败', 'warning');
            }
        });
        
        // 认证错误
        this.addHandler(ERROR_TYPES.AUTHENTICATION, (error) => {
            showNotification('登录已过期，请重新登录', 'warning');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        });
        
        // 授权错误
        this.addHandler(ERROR_TYPES.AUTHORIZATION, (error) => {
            showNotification('您没有权限执行此操作', 'danger');
        });
        
        // 资源不存在
        this.addHandler(ERROR_TYPES.NOT_FOUND, (error) => {
            showNotification('请求的资源不存在', 'warning');
        });
        
        // 服务器错误
        this.addHandler(ERROR_TYPES.SERVER, (error) => {
            showNotification('服务器内部错误，请稍后重试', 'danger');
            console.error('服务器错误:', error);
        });
        
        // 未知错误
        this.addHandler(ERROR_TYPES.UNKNOWN, (error) => {
            showNotification('发生未知错误，请稍后重试', 'danger');
            console.error('未知错误:', error);
        });
    }
    
    // 设置全局错误处理
    setupGlobalErrorHandling() {
        // 未捕获的 Promise 错误
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的 Promise 错误:', event.reason);
            this.handle(event.reason);
            event.preventDefault();
        });
        
        // 全局 JavaScript 错误
        window.addEventListener('error', (event) => {
            console.error('全局 JavaScript 错误:', event.error);
            this.handle(event.error);
        });
    }
    
    // 添加错误处理器
    addHandler(type, handler) {
        this.handlers.set(type, handler);
    }
    
    // 处理错误
    handle(error) {
        const errorType = this.getErrorType(error);
        const handler = this.handlers.get(errorType);
        
        if (handler) {
            handler(error);
        } else {
            console.error('未知错误类型:', errorType, error);
            this.handlers.get(ERROR_TYPES.UNKNOWN)(error);
        }
    }
    
    // 确定错误类型
    getErrorType(error) {
        if (error instanceof API.APIError) {
            switch (error.status) {
                case 0:
                    return ERROR_TYPES.NETWORK;
                case 400:
                    return ERROR_TYPES.VALIDATION;
                case 401:
                    return ERROR_TYPES.AUTHENTICATION;
                case 403:
                    return ERROR_TYPES.AUTHORIZATION;
                case 404:
                    return ERROR_TYPES.NOT_FOUND;
                case 500:
                case 502:
                case 503:
                case 504:
                    return ERROR_TYPES.SERVER;
                default:
                    return ERROR_TYPES.UNKNOWN;
            }
        }
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return ERROR_TYPES.NETWORK;
        }
        
        return ERROR_TYPES.UNKNOWN;
    }
    
    // 显示验证错误
    showValidationErrors(errors) {
        Object.entries(errors).forEach(([field, messages]) => {
            const fieldElement = document.querySelector(`[name="${field}"]`);
            if (fieldElement) {
                fieldElement.classList.add('is-invalid');
                
                let feedback = fieldElement.parentNode.querySelector('.invalid-feedback');
                if (!feedback) {
                    feedback = createElement('div', { className: 'invalid-feedback' });
                    fieldElement.parentNode.appendChild(feedback);
                }
                
                feedback.textContent = Array.isArray(messages) ? messages[0] : messages;
                feedback.style.display = 'block';
            }
        });
    }
}

// 用户反馈系统
class FeedbackSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = new Map();
        this.maxNotifications = 5;
    }
    
    // 创建通知容器
    createContainer() {
        let container = document.getElementById('notifications');
        if (!container) {
            container = createElement('div', {
                id: 'notifications',
                className: 'position-fixed top-0 end-0 p-3',
                style: 'z-index: 1055;'
            });
            document.body.appendChild(container);
        }
        return container;
    }
    
    // 显示通知
    show(message, type = 'info', duration = 3000, options = {}) {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const notification = this.createNotification(id, message, type, options);
        
        // 限制通知数量
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.remove(oldestId);
        }
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);
        
        // 显示动画
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // 自动移除
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }
        
        return id;
    }
    
    // 创建通知元素
    createNotification(id, message, type, options) {
        const {
            title = '',
            closable = true,
            actions = []
        } = options;
        
        const notification = createElement('div', {
            id: id,
            className: `alert alert-${type} alert-dismissible fade`,
            role: 'alert'
        });
        
        let content = '';
        
        if (title) {
            content += `<h6 class="alert-heading">${title}</h6>`;
        }
        
        content += `<div>${message}</div>`;
        
        if (actions.length > 0) {
            content += '<div class="mt-2">';
            actions.forEach(action => {
                content += `<button type="button" class="btn btn-sm btn-outline-${type} me-2" 
                                   onclick="${action.handler}">${action.text}</button>`;
            });
            content += '</div>';
        }
        
        if (closable) {
            content += '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>';
        }
        
        notification.innerHTML = content;
        
        // 添加关闭事件
        notification.addEventListener('closed.bs.alert', () => {
            this.notifications.delete(id);
        });
        
        return notification;
    }
    
    // 移除通知
    remove(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
                this.notifications.delete(id);
            }, 150);
        }
    }
    
    // 清除所有通知
    clear() {
        this.notifications.forEach((notification, id) => {
            this.remove(id);
        });
    }
    
    // 显示加载提示
    showLoading(message = '加载中...') {
        return this.show(
            `<div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                ${message}
            </div>`,
            'primary',
            0,
            { closable: false }
        );
    }
    
    // 显示进度提示
    showProgress(message, progress = 0) {
        const id = `progress-${Date.now()}`;
        
        const content = `
            <div>${message}</div>
            <div class="progress mt-2" style="height: 6px;">
                <div class="progress-bar" role="progressbar" 
                     style="width: ${progress}%" 
                     aria-valuenow="${progress}" 
                     aria-valuemin="0" 
                     aria-valuemax="100"></div>
            </div>
        `;
        
        return this.show(content, 'info', 0, { closable: false });
    }
    
    // 更新进度
    updateProgress(id, progress, message) {
        const notification = this.notifications.get(id);
        if (notification) {
            const progressBar = notification.querySelector('.progress-bar');
            const messageElement = notification.querySelector('div');
            
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
                progressBar.setAttribute('aria-valuenow', progress);
            }
            
            if (message && messageElement) {
                messageElement.textContent = message;
            }
            
            // 完成时自动移除
            if (progress >= 100) {
                setTimeout(() => {
                    this.remove(id);
                }, 1000);
            }
        }
    }
}

// 创建全局实例
const errorHandler = new ErrorHandler();
const feedbackSystem = new FeedbackSystem();

// 全局通知函数
window.showNotification = (message, type = 'info', duration = 3000, options = {}) => {
    return feedbackSystem.show(message, type, duration, options);
};

// 导出错误处理
window.ErrorHandler = {
    handler: errorHandler,
    feedback: feedbackSystem,
    ERROR_TYPES
};
```

## 8.7 实时数据更新

### WebSocket 和 Server-Sent Events

```javascript
// public/js/realtime.js

// 实时连接管理器
class RealtimeManager {
    constructor() {
        this.connections = new Map();
        this.reconnectAttempts = new Map();
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }
    
    // 创建 WebSocket 连接
    createWebSocket(url, options = {}) {
        const {
            protocols = [],
            onOpen = () => {},
            onMessage = () => {},
            onError = () => {},
            onClose = () => {},
            autoReconnect = true
        } = options;
        
        const ws = new WebSocket(url, protocols);
        const connectionId = `ws-${Date.now()}`;
        
        ws.onopen = (event) => {
            console.log('WebSocket 连接已建立:', url);
            this.reconnectAttempts.set(connectionId, 0);
            onOpen(event);
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data, event);
            } catch (error) {
                console.error('WebSocket 消息解析失败:', error);
                onMessage(event.data, event);
            }
        };
        
        ws.onerror = (event) => {
            console.error('WebSocket 错误:', event);
            onError(event);
        };
        
        ws.onclose = (event) => {
            console.log('WebSocket 连接已关闭:', event.code, event.reason);
            onClose(event);
            
            if (autoReconnect && !event.wasClean) {
                this.handleReconnect(connectionId, url, options);
            }
        };
        
        this.connections.set(connectionId, ws);
        return { ws, connectionId };
    }
    
    // 处理重连
    async handleReconnect(connectionId, url, options) {
        const attempts = this.reconnectAttempts.get(connectionId) || 0;
        
        if (attempts >= this.maxReconnectAttempts) {
            console.error('WebSocket 重连次数已达上限');
            return;
        }
        
        const delay = this.reconnectDelay * Math.pow(2, attempts);
        console.log(`${delay}ms 后尝试重连 WebSocket (${attempts + 1}/${this.maxReconnectAttempts})`);
        
        await PromiseUtils.delay(delay);
        
        this.reconnectAttempts.set(connectionId, attempts + 1);
        this.createWebSocket(url, options);
    }
    
    // 创建 Server-Sent Events 连接
    createEventSource(url, options = {}) {
        const {
            onOpen = () => {},
            onMessage = () => {},
            onError = () => {},
            events = {},
            autoReconnect = true
        } = options;
        
        const eventSource = new EventSource(url);
        const connectionId = `sse-${Date.now()}`;
        
        eventSource.onopen = (event) => {
            console.log('SSE 连接已建立:', url);
            this.reconnectAttempts.set(connectionId, 0);
            onOpen(event);
        };
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data, event);
            } catch (error) {
                onMessage(event.data, event);
            }
        };
        
        eventSource.onerror = (event) => {
            console.error('SSE 错误:', event);
            onError(event);
            
            if (autoReconnect && eventSource.readyState === EventSource.CLOSED) {
                this.handleSSEReconnect(connectionId, url, options);
            }
        };
        
        // 注册自定义事件
        Object.entries(events).forEach(([eventType, handler]) => {
            eventSource.addEventListener(eventType, handler);
        });
        
        this.connections.set(connectionId, eventSource);
        return { eventSource, connectionId };
    }
    
    // 处理 SSE 重连
    async handleSSEReconnect(connectionId, url, options) {
        const attempts = this.reconnectAttempts.get(connectionId) || 0;
        
        if (attempts >= this.maxReconnectAttempts) {
            console.error('SSE 重连次数已达上限');
            return;
        }
        
        const delay = this.reconnectDelay * Math.pow(2, attempts);
        console.log(`${delay}ms 后尝试重连 SSE (${attempts + 1}/${this.maxReconnectAttempts})`);
        
        await PromiseUtils.delay(delay);
        
        this.reconnectAttempts.set(connectionId, attempts + 1);
        this.createEventSource(url, options);
    }
    
    // 关闭连接
    closeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            if (connection instanceof WebSocket) {
                connection.close();
            } else if (connection instanceof EventSource) {
                connection.close();
            }
            
            this.connections.delete(connectionId);
            this.reconnectAttempts.delete(connectionId);
        }
    }
    
    // 关闭所有连接
    closeAllConnections() {
        this.connections.forEach((connection, connectionId) => {
            this.closeConnection(connectionId);
        });
    }
}

// 学生数据实时更新
class StudentRealtimeUpdater {
    constructor() {
        this.realtimeManager = new RealtimeManager();
        this.connectionId = null;
        this.init();
    }
    
    // 初始化实时连接
    init() {
        // 使用 Server-Sent Events 接收实时更新
        const { eventSource, connectionId } = this.realtimeManager.createEventSource('/api/students/events', {
            onOpen: () => {
                console.log('学生数据实时更新已连接');
                showNotification('实时更新已启用', 'success', 2000);
            },
            
            onError: (event) => {
                console.error('实时更新连接错误:', event);
                showNotification('实时更新连接失败', 'warning', 3000);
            },
            
            events: {
                'student-created': (event) => {
                    const student = JSON.parse(event.data);
                    this.handleStudentCreated(student);
                },
                
                'student-updated': (event) => {
                    const student = JSON.parse(event.data);
                    this.handleStudentUpdated(student);
                },
                
                'student-deleted': (event) => {
                    const { id } = JSON.parse(event.data);
                    this.handleStudentDeleted(id);
                },
                
                'students-batch-updated': (event) => {
                    const { students } = JSON.parse(event.data);
                    this.handleBatchUpdate(students);
                }
            }
        });
        
        this.connectionId = connectionId;
    }
    
    // 处理学生创建
    handleStudentCreated(student) {
        if (window.studentManager) {
            studentManager.addStudent(student);
            
            showNotification(
                `新学生 "${student.name}" 已添加`,
                'info',
                3000,
                {
                    actions: [{
                        text: '查看',
                        handler: `viewStudent(${student.id})`
                    }]
                }
            );
        }
    }
    
    // 处理学生更新
    handleStudentUpdated(student) {
        if (window.studentManager) {
            studentManager.updateStudent(student.id, student);
            
            // 如果当前正在查看该学生，更新页面
            if (window.location.pathname.includes(`/students/${student.id}`)) {
                this.updateStudentDetailPage(student);
            }
            
            showNotification(
                `学生 "${student.name}" 信息已更新`,
                'info',
                2000
            );
        }
    }
    
    // 处理学生删除
    handleStudentDeleted(id) {
        if (window.studentManager) {
            const student = studentManager.students.get(id);
            const studentName = student ? student.name : '未知学生';
            
            studentManager.removeStudent(id);
            
            // 如果当前正在查看该学生，重定向到列表页
            if (window.location.pathname.includes(`/students/${id}`)) {
                showNotification(
                    `学生 "${studentName}" 已被删除，即将返回列表页`,
                    'warning',
                    3000
                );
                
                setTimeout(() => {
                    window.location.href = '/students';
                }, 3000);
            } else {
                showNotification(
                    `学生 "${studentName}" 已被删除`,
                    'info',
                    2000
                );
            }
        }
    }
    
    // 处理批量更新
    handleBatchUpdate(students) {
        if (window.studentManager) {
            students.forEach(student => {
                studentManager.updateStudent(student.id, student);
            });
            
            showNotification(
                `${students.length} 个学生信息已更新`,
                'info',
                2000
            );
        }
    }
    
    // 更新学生详情页面
    updateStudentDetailPage(student) {
        // 更新基本信息
        const nameElement = document.querySelector('[data-field="name"]');
        if (nameElement) nameElement.textContent = student.name;
        
        const emailElement = document.querySelector('[data-field="email"]');
        if (emailElement) emailElement.textContent = student.email;
        
        const majorElement = document.querySelector('[data-field="major"]');
        if (majorElement) majorElement.textContent = student.major || '未设置';
        
        const gradeElement = document.querySelector('[data-field="grade"]');
        if (gradeElement) gradeElement.textContent = student.grade || '未设置';
        
        // 更新状态徽章
        const statusElement = document.querySelector('[data-field="status"]');
        if (statusElement) {
            statusElement.className = `badge ${
                student.status === 'active' ? 'bg-success' :
                student.status === 'inactive' ? 'bg-warning' :
                student.status === 'graduated' ? 'bg-info' :
                'bg-danger'
            }`;
            
            statusElement.textContent = {
                'active': '活跃',
                'inactive': '非活跃',
                'graduated': '已毕业',
                'suspended': '已暂停'
            }[student.status] || student.status;
        }
        
        // 更新头像
        const avatarElement = document.querySelector('[data-field="avatar"]');
        if (avatarElement && student.avatar) {
            avatarElement.src = student.avatar;
        }
    }
    
    // 断开连接
    disconnect() {
        if (this.connectionId) {
            this.realtimeManager.closeConnection(this.connectionId);
            this.connectionId = null;
        }
    }
}

// 导出实时更新工具
window.RealtimeUtils = {
    RealtimeManager,
    StudentRealtimeUpdater
};

// 页面加载时启动实时更新
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.startsWith('/students')) {
        window.studentRealtimeUpdater = new StudentRealtimeUpdater();
    }
});

// 页面卸载时清理连接
window.addEventListener('beforeunload', () => {
    if (window.studentRealtimeUpdater) {
        window.studentRealtimeUpdater.disconnect();
    }
});
```

## 8.8 本章小结

### 核心知识点

1. **现代 JavaScript 特性**
   - ES6+ 语法和特性
   - 箭头函数、模板字符串、解构赋值
   - Promise 和 async/await
   - 类和模块系统

2. **DOM 操作和事件处理**
   - 现代 DOM 查询和操作方法
   - 事件委托和管理
   - 表单处理和验证
   - 模态框管理

3. **AJAX 和 API 交互**
   - Fetch API 的使用
   - API 客户端封装
   - 请求和响应拦截器
   - 错误处理和重试机制

4. **异步编程最佳实践**
   - Promise 工具函数
   - 异步队列和并发控制
   - 数据加载和缓存
   - 防抖和节流

5. **错误处理和用户反馈**
   - 统一错误处理机制
   - 用户友好的错误提示
   - 加载状态和进度反馈
   - 通知系统

6. **实时数据更新**
   - WebSocket 和 Server-Sent Events
   - 自动重连机制
   - 实时数据同步
   - 用户体验优化

### 实践成果

通过本章学习，你已经掌握了：

- 现代前端 JavaScript 开发技能
- 完整的 AJAX 交互解决方案
- 健壮的错误处理机制
- 优秀的用户体验设计
- 实时数据更新能力

## 8.9 课后练习

### 基础练习

1. **表单验证增强**
   - 为学生表单添加实时验证
   - 实现自定义验证规则
   - 添加验证错误动画效果

2. **搜索功能优化**
   - 实现搜索建议功能
   - 添加搜索历史记录
   - 实现高级搜索过滤器

3. **数据缓存机制**
   - 实现学生数据本地缓存
   - 添加缓存过期策略
   - 实现离线数据访问

### 进阶练习

1. **批量操作优化**
   - 实现批量编辑功能
   - 添加操作进度显示
   - 实现撤销/重做功能

2. **性能优化**
   - 实现虚拟滚动
   - 添加图片懒加载
   - 优化大数据量渲染

3. **用户体验提升**
   - 添加骨架屏加载
   - 实现拖拽排序
   - 添加键盘快捷键支持

### 挑战练习

1. **实时协作功能**
   - 实现多用户同时编辑
   - 添加冲突检测和解决
   - 实现操作历史追踪

2. **PWA 功能**
   - 添加 Service Worker
   - 实现离线功能
   - 添加推送通知

3. **数据可视化**
   - 实现学生统计图表
   - 添加数据导出功能
   - 实现报表生成

## 下一章预告

下一章我们将学习《用户认证和授权》，内容包括：

- 用户注册和登录系统
- JWT 令牌认证
- 权限控制和角色管理
- 会话管理和安全性
- 密码加密和验证
- 第三方登录集成

## 学习资源

### 官方文档

- [MDN JavaScript 指南](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide)
- [Fetch API 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)
- [WebSocket API 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)

### 推荐阅读

- 《JavaScript 高级程序设计》
- 《你不知道的 JavaScript》
- 《JavaScript 异步编程》

### 在线教程

- [JavaScript.info](https://zh.javascript.info/)
- [ES6 入门教程](https://es6.ruanyifeng.com/)
- [现代 JavaScript 教程](https://zh.javascript.info/)

### 实用工具

- [Can I Use](https://caniuse.com/) - 浏览器兼容性查询
- [JSFiddle](https://jsfiddle.net/) - 在线代码测试
- [CodePen](https://codepen.io/) - 前端代码展示