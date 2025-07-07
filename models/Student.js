import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: '学号不能为空'
      },
      len: {
        args: [1, 20],
        msg: '学号长度必须在1-20个字符之间'
      }
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '姓名不能为空'
      },
      len: {
        args: [1, 50],
        msg: '姓名长度必须在1-50个字符之间'
      }
    }
  },
  gender: {
    type: DataTypes.ENUM('男', '女'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['男', '女']],
        msg: '性别必须是男或女'
      }
    }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: {
        msg: '年龄必须是整数'
      },
      min: {
        args: [1],
        msg: '年龄必须大于0'
      },
      max: {
        args: [150],
        msg: '年龄不能超过150'
      }
    }
  },
  major: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '专业不能为空'
      },
      len: {
        args: [1, 100],
        msg: '专业名称长度必须在1-100个字符之间'
      }
    }
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '年级不能为空'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: {
        msg: '请输入有效的邮箱地址'
      }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[1][3-9]\d{9}$/,
        msg: '请输入有效的手机号码'
      }
    }
  }
}, {
  tableName: 'students',
  indexes: [
    {
      unique: true,
      fields: ['studentId']
    }
  ]
});

export default Student;