'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('roles', [{
      role_id: 0,
      role_name_en: 'Regular user',
      role_name_ar: 'مستخدم عادي',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      role_id: 1,
      role_name_en: 'Recipe Owner',
      role_name_ar: 'صاحب وصفة',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      role_id: 2,
      role_name_en: 'Supervisor',
      role_name_ar: 'مشرف',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      role_id: 3,
      role_name_en: 'Admin',
      role_name_ar: 'مدير نظام',
      created_at: new Date(),
      updated_at: new Date()
    }

    ], {});

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
