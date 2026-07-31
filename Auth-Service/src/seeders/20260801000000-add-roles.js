'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Custom idempotency check: only bulkInsert if Roles don't already exist
    const [existingRoles] = await queryInterface.sequelize.query(
      `SELECT name FROM Roles WHERE name IN ('ADMIN', 'CUSTOMER', 'AIRLINE_ADMIN')`
    );
    const existingNames = existingRoles.map(r => r.name);
    
    const rolesToInsert = [];
    if (!existingNames.includes('ADMIN')) {
      rolesToInsert.push({ name: 'ADMIN', description: 'System Administrator', createdAt: new Date(), updatedAt: new Date() });
    }
    if (!existingNames.includes('CUSTOMER')) {
      rolesToInsert.push({ name: 'CUSTOMER', description: 'Standard Customer Account', createdAt: new Date(), updatedAt: new Date() });
    }
    if (!existingNames.includes('AIRLINE_ADMIN')) {
      rolesToInsert.push({ name: 'AIRLINE_ADMIN', description: 'Airline Desk Clerk/Admin', createdAt: new Date(), updatedAt: new Date() });
    }

    if (rolesToInsert.length > 0) {
      await queryInterface.bulkInsert('Roles', rolesToInsert, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles', {
      name: ['ADMIN', 'CUSTOMER', 'AIRLINE_ADMIN']
    }, {});
  }
};
