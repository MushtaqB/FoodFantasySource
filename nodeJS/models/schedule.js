'use strict';
const i18n = require('i18n');
const moment = require('moment');

module.exports = function (sequelize, DataTypes) {

  const Schedule = sequelize.define('schedules', {
      schedule_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      schedule_name: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        primaryKey: true
      },
      recipe_ids: {
        type: DataTypes.TEXT,
        allowNull: false,
      }
    },
    {
      freezeTableName: true,
      underscored: true,

      instanceMethods: {
        toJSON: function () {
          const values = this.get();
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

  return Schedule
};
