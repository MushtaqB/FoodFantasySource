const i18n = require('i18n');

module.exports = function (sequelize, DataTypes) {
  const Role = sequelize.define('roles', {
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      role_name_ar: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role_name_en: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      instanceMethods: {
        toJSON: function () {
          let values = this.get();
          let role_name;

          if (i18n.getLocale() === 'en') {
            role_name = values['role_name_en'];
          } else {
            role_name = values['role_name_ar'];
          }

          values['role_name'] = role_name;

          delete values.role_name_ar;
          delete values.role_name_en;
          delete values.created_at;
          delete values.updated_at;

          return values;
        }
      },
      classMethods: {
        associate: function (models) {
        }
      }
    });

  return Role;
};
