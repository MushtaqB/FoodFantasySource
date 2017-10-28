const i18n = require("i18n");

module.exports = function (sequelize, DataTypes) {
  const Cuisine = sequelize.define('cuisines', {
    cuisine_id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    cuisine_name_en: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cuisine_name_ar: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {

    instanceMethods: {
      toJSON: function () {
        let values = this.get();

        values['cuisine_name'] = (i18n.getLocale() === 'en') ? values['cuisine_name_en'] : values['cuisine_name_ar'];

        delete values.cuisine_name_ar;
        delete values.cuisine_name_en;
        delete values.created_at;
        delete values.updated_at;

        return values;
      }
    },

    classMethods: {
      associate: function (models) {
        Cuisine.hasMany(models.recipes, {foreignKey: 'cuisine_id'});
      }
    }
  });

  return Cuisine;
};
