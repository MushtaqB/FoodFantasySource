module.exports = function (sequelize, DataTypes) {
  const device_tokens = sequelize.define('device_tokens', {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    device_token: {
      type: DataTypes.STRING,
      unique: 'CompositeIndex'
    },
    token_type: {
      type: DataTypes.ENUM('ANDROID', 'IOS'),
      unique: 'CompositeIndex'
    }
  }, {
    classMethods: {
      associate: function (models) {
        device_tokens.belongsTo(models.users, { as: 'user', foreignKey: 'user_id' });
      }
    }
  });
  return device_tokens;
};
