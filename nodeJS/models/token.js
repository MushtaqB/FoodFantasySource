
module.exports = function (sequelize, DataTypes) {

  const Token = sequelize.define('tokens', {
      access_token: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      expire_at: {
        type: DataTypes.DATE,
        allowNull: false
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
          Token.belongsTo(models.users, {foreignKey: 'user_id', allowNull: false});
        }
      }
    });

  return Token
};
