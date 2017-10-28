const i18n = require("i18n");

module.exports = function (sequelize, DataTypes) {
  const Recipe = sequelize.define('recipes', {
    recipe_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cuisine_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER
    },
    title_en: {
      type: DataTypes.STRING,
    },
    title_ar: {
      type: DataTypes.STRING,
    },
    subtitle_en: {
      type: DataTypes.STRING,
    },
    subtitle_ar: {
      type: DataTypes.STRING,
    },
    desc_en: {
      type: DataTypes.TEXT,
    },
    desc_ar: {
      type: DataTypes.TEXT,
    },
    ingredient_image: {
      type: DataTypes.TEXT,
    },
    ingredients_ar: {
      type: DataTypes.TEXT,
    },
    ingredients_en: {
      type: DataTypes.TEXT,
    },
    steps_ar: {
      type: DataTypes.TEXT,
    },
    steps_en: {
      type: DataTypes.TEXT,
    },
    duration: {
      type: DataTypes.STRING,
    },
    preparation: {
      type: DataTypes.STRING,
    },
    servings: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    calories: {
      type: DataTypes.INTEGER,
    },
    rating: {
      type: DataTypes.INTEGER
    },
    image: {
      type: DataTypes.TEXT
    },
    thumbnail_image: {
      type: DataTypes.TEXT
    }
  }, {

    instanceMethods: {
      toJSON: function () {
        const values = this.get();

        values['title'] = (i18n.getLocale() === 'en') ? values['title_en'] : values['title_ar'];

        if (values['subtitle_en'] && values['subtitle_ar']) {
          values['subtitle'] = (i18n.getLocale() === 'en') ? values['subtitle_en'] : values['subtitle_ar'];
        }

        if (values['desc_en'] && values['desc_ar']) {
          values['desc'] = (i18n.getLocale() === 'en') ? values['desc_en'] : values['desc_ar'];
        }

        if (values['ingredients_en'] && values['ingredients_ar']) {
          values['ingredients'] = (i18n.getLocale() === 'en') ? JSON.parse(values['ingredients_en']) : JSON.parse(values['ingredients_ar']);
        }

        if (values['steps_en'] && values['steps_ar']) {
          values['steps'] = (i18n.getLocale() === 'en') ? JSON.parse(values['steps_en']) : JSON.parse(values['steps_ar']);
        }

        delete values.title_en;
        delete values.title_ar;
        delete values.subtitle_en;
        delete values.subtitle_ar;
        delete values.desc_en;
        delete values.desc_ar;
        delete values.ingredients_ar;
        delete values.ingredients_en;
        delete values.steps_ar;
        delete values.steps_en;
        delete values.cuisine_id;
        delete values.user_id;
        delete values.created_at;
        delete values.updated_at;

        return values;
      }
    },

    classMethods: {
      associate: function (models) {
        Recipe.belongsTo(models.users, {foreignKey: 'user_id', allowNull: false});
        Recipe.belongsTo(models.cuisines, {foreignKey: 'cuisine_id', allowNull: false});
        // Recipe.belongsToMany(models.order_lines, {as: { singular: 'order_line', plural: 'order_lines'}, through: 'order_lines', foreignKey: 'recipe_id'});
      }
    }
  });

  return Recipe;
};
