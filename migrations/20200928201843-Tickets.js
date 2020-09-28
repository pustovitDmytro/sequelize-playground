module.exports = {
    up : async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Tickets', {
            id     : { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            status : { type: Sequelize.ENUM('available', 'booked', 'bought', 'returned', 'pending'), allowNull: false, defaultValue: 'pending' },
            owner  : { type: Sequelize.STRING, allowNull: true }
        });
    },

    down : async (queryInterface) => {
        await queryInterface.dropTable('Tickets');
    }
};
