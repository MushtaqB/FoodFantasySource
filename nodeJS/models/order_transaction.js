module.exports = function (sequelize, DataTypes) {

  const OrderTransaction = sequelize.define('order_transactions', {
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
      status_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      freezeTableName: true,
      underscored: true,

      instanceMethods: {
        toJSON: function () {
          const values = this.get();
          return values;
        }
      },

      classMethods: {
        associate: function (models) {
          OrderTransaction.belongsTo(models.orders, {foreignKey: 'order_id', allowNull: false});
          OrderTransaction.belongsTo(models.statuses, {foreignKey: 'status_id', allowNull: false});
        }
      }
    });

  return OrderTransaction
};
