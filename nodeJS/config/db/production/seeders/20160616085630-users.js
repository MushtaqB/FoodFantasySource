'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('users', [{
      user_id: "1",
      full_name: 'Admin',
      mobile: '+966547771884',
      role_id: 2,
      mobile_activated: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
  }
};
