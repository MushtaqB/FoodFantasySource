'use strict';
const i18n = require("i18n");

module.exports = function(sequelize, DataTypes) {
  const RecipeCategories = sequelize.define('recipe_categories', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    recipe_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {

    instanceMethods: {
      toJSON: function () {
        let values = this.get();
        delete values.created_at;
        delete values.updated_at;
        return values;
      }
    },

    classMethods: {
      associate: function(models) {
        RecipeCategories.belongsTo(models.recipes, {foreignKey: 'recipe_id', allowNull: false});
        RecipeCategories.belongsTo(models.categories, {foreignKey: 'category_id', allowNull: false});
      }
    }
  });
  return RecipeCategories;
};
