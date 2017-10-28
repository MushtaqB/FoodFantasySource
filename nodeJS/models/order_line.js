
module.exports = function (sequelize, DataTypes) {

  const OrderLine = sequelize.define('order_lines', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      recipe_id: {
          type: DataTypes.INTEGER,
          allowNull: false
      },
      serving_number: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true
      },
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
          OrderLine.belongsTo(models.recipes, {foreignKey: 'recipe_id', allowNull: false});
          OrderLine.belongsTo(models.orders, {foreignKey: 'order_id', allowNull: false});
          OrderLine.belongsTo(models.users, {foreignKey: 'user_id', allowNull: false});
        }
      }
    });

  return OrderLine
};
