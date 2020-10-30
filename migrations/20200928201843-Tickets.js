module.exports = {
    up : async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Planes', {
            id   : { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            name : { type: Sequelize.STRING, allowNull: false },
            type : { type: Sequelize.STRING, allowNull: true }
        });

        await queryInterface.createTable('Tickets', {
            id     : { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            status : { type: Sequelize.ENUM('available', 'booked', 'bought', 'returned', 'pending'), allowNull: false, defaultValue: 'pending' },
            place  : { type: Sequelize.INTEGER, allowNull: false },
            plane  : {
                type       : Sequelize.UUID,
                allowNull  : false,
                references : {
                    model : 'Planes',
                    key   : 'id'
                }
            },
            owner : { type: Sequelize.STRING, allowNull: true }
        });
    },

    down : async (queryInterface) => {
        await queryInterface.dropTable('Tickets');
        await queryInterface.dropTable('Planes');
    }
};
