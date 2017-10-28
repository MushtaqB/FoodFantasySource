'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('cuisines', [
      {
        cuisine_id: 1,
        cuisine_name_en: 'Arabic',
        cuisine_name_ar: 'عربي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 2,
        cuisine_name_en: 'Gulf',
        cuisine_name_ar: 'خليجي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 3,
        cuisine_name_en: 'Italian',
        cuisine_name_ar: 'ايطالي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 4,
        cuisine_name_en: 'INDIAN',
        cuisine_name_ar: 'هندي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 5,
        cuisine_name_en: 'Shami',
        cuisine_name_ar: 'شامي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 6,
        cuisine_name_en: 'Egyptian',
        cuisine_name_ar: 'مصري',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 7,
        cuisine_name_en: 'American',
        cuisine_name_ar: 'امريكي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 8,
        cuisine_name_en: 'French',
        cuisine_name_ar: 'فرنسي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 9,
        cuisine_name_en: 'Chinese',
        cuisine_name_ar: 'صيني',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 10,
        cuisine_name_en: 'Mexican',
        cuisine_name_ar: 'مكسيكي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 11,
        cuisine_name_en: 'Russian',
        cuisine_name_ar: 'روسي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 12,
        cuisine_name_en: 'Moroccan',
        cuisine_name_ar: 'مغربي',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        cuisine_id: 13,
        cuisine_name_en: 'Lebanese',
        cuisine_name_ar: 'لبناني',
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
