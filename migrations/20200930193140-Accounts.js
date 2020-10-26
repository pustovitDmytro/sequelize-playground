module.exports = {
    up : async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            await queryInterface.createTable('Accounts', {
                id       : { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
                balance  : { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
                limit    : { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
                currency : { type: Sequelize.ENUM('USD', 'EUR', 'GBR'), allowNull: false },
                owner    : { type: Sequelize.STRING, allowNull: true }
            }, { transaction });

            await queryInterface.addConstraint('Accounts', {
                fields : [ 'balance' ],
                type   : 'check',
                where  : {
                    balance : {
                        [Sequelize.Op.gte] : queryInterface.sequelize.col('limit')
                    }
                },
                name : 'accounts_blance_check',
                transaction
            });

            await transaction.commit();
        } catch (error) {
            console.error(error);
            await transaction.rollback();
            throw error;
        }
    },

    down : async (queryInterface) => {
        await queryInterface.removeConstraint('Accounts', 'accounts_blance_check');
        await queryInterface.dropTable('Accounts');
    }
};
