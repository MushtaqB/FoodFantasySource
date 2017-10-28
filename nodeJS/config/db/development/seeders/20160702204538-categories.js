'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('categories', [
      {
        category_name_en: 'لحوم',
        category_name_ar: 'لحوم',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name_en: 'دجاج',
        category_name_ar: 'دجاج',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name_en: 'بطاطس',
        category_name_ar: 'بطاطس',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name_en: 'سمك',
        category_name_ar: 'سمك',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name_en: 'مكرونة',
        category_name_ar: 'مكرونة',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name_en: 'كوسا',
        category_name_ar: 'كوسا',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name_en: 'فطر',
        category_name_ar: 'فطر',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name_en: 'أرز',
        category_name_ar: 'أرز',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name_en: 'برجر',
        category_name_ar: 'برجر',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name_en: 'سلطة',
        category_name_ar: 'سلطة',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_name_en: 'خبز',
        category_name_ar: 'خبز',
        created_at: new Date(),
        updated_at: new Date()
      },

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
