const config = require('../config/app_config');

module.exports = function (sequelize, DataTypes) {

  let User = exports.userSchema = sequelize.define('users', {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    full_name: {
      type: DataTypes.STRING
    },
    mobile: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    avatar_image: DataTypes.STRING,
    s3_id: DataTypes.STRING,
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    email_activated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    mobile_activated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    instanceMethods: {
      toJSON: function () {
        let values = Object.assign({}, this.get());

        if (values['s3_id']) {
          values['url'] = config.getAvatarThumbUrl(values['s3_id']);
        }

        delete values.avatar_image;
        delete values.s3_id;
        delete values.created_at;
        delete values.updated_at;
        delete values.role_id;
        return values;
      }
    },

    classMethods: {
      associate: function (models) {
        User.hasMany(models.tokens, {foreignKey: 'user_id', allowNull: false});
        User.hasMany(models.orders, {foreignKey: 'user_id', allowNull: false});
        User.belongsTo(models.roles, {foreignKey: 'role_id', allowNull: false});
      }
    }
  });

  return User;
};
