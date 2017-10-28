
module.exports = function (sequelize, DataTypes) {

  const Order = sequelize.define('orders', {
      order_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      schedule_id: {
        allowNull: false,
        type: DataTypes.INTEGER
      },
      status_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      address_name: {
        type: DataTypes.STRING
      },
      address_desc: {
        type: DataTypes.STRING
      },
      latitude: {
        type: DataTypes.DECIMAL(18,12)
      },
      longitude: {
        type: DataTypes.DECIMAL(18,12)
      },
      delivery_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      delivery_time: {
        type: DataTypes.STRING,
        allowNull: false
      },
      delivery_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      total_price: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false
      },
      notes: {
        type: DataTypes.STRING,
      },
      jack: {
        type: DataTypes.TEXT,
      },
      jack_id: {
        type: DataTypes.STRING,
      }
    },
    {
      freezeTableName: true,
      underscored: true,

      instanceMethods: {
        toJSON: function () {
          const values = this.get();
          delete values.user_id;
          return values;
        }
      },

      classMethods: {
        associate: function (models) {
          Order.belongsTo(models.statuses, {foreignKey: 'status_id', allowNull: false});
          Order.belongsTo(models.users, {foreignKey: 'user_id', allowNull: false});
          Order.hasMany(models.order_lines, {foreignKey: 'order_id', allowNull: false});
          Order.hasMany(models.order_transactions, { as: 'transactions', foreignKey: 'order_id'});
          Order.belongsTo(models.schedules, {foreignKey: 'schedule_id', allowNull: false});
        }
      }
    });

  return Order
};
