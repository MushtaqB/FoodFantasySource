module.exports = function(sequelize, DataTypes) {
  const MobileCodes = sequelize.define('mobile_codes', {
    mobile: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    expire_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    classMethods: {
      associate: function(models) {
      }
    }
  });
  return MobileCodes;
};
