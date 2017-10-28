'use strict';
const i18n = require("i18n");

module.exports = function(sequelize, DataTypes) {
  const Category = sequelize.define('categories', {
    category_id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    category_name_en: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category_name_ar: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {

    instanceMethods: {
      toJSON: function () {
        let values = this.get();
        values['category_name'] = (i18n.getLocale() === 'en') ? values['category_name_en'] : values['category_name_ar'];
        delete values.category_name_ar;
        delete values.category_name_en;
        delete values.created_at;
        delete values.updated_at;

        return values;
      }
    },

    classMethods: {
      associate: function(models) {
        Category.hasMany(models.recipes, {foreignKey: 'category_id'});
      }
    }
  });
  return Category;
};
