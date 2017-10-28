const i18n = require('i18n');
module.exports = function (sequelize, DataTypes) {
  const Status = sequelize.define('statuses', {
      status_id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      status_name_ar: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status_name_en: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      instanceMethods: {
        toJSON: function () {
          const values = this.get();

          let status_name;
          if (i18n.getLocale() === 'en') {
            status_name = values['status_name_en'];
          } else {
            status_name = values['status_name_ar'];
          }

          values['status_name'] = status_name;

          delete values.status_name_ar;
          delete values.status_name_en;
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
  return Status;
};
