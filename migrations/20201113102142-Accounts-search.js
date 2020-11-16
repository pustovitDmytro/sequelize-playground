const tsmatchParams = [
    { type: 'tsvector', name: 'vec' },
    { type: 'tsquery', name: 'qr' }
];

module.exports = {
    up : async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Accounts', 'fulltext_tsmatch', { type: Sequelize.TEXT, defaultValue: '' });
        await queryInterface.addColumn('Accounts', 'fulltext_trgm', { type: Sequelize.TEXT, defaultValue: '' });
        await queryInterface.createFunction(
            'tsmatch',
            tsmatchParams,
            'BOOLEAN',
            'plpgsql',
            'RETURN vec @@ qr;'
        );
        await queryInterface.addIndex('Accounts', [ 'fulltext_tsmatch' ], {
            indexName   : 'Accounts_fulltext_tsmatch_search_index',
            indicesType : 'FULLTEXT'
        });
        // await queryInterface.sequelize.query('CREATE EXTENSION if not exists pg_trgm;');
        await queryInterface.sequelize
            .query('CREATE INDEX Accounts_fulltext_trgm_search_index ON "Accounts" USING GIN (fulltext_trgm gin_trgm_ops);')
            .catch(err => {
                console.error(err);
                throw err;
            });

        // await queryInterface.addIndex('Accounts', [ queryInterface.sequelize.literal('fulltext_trgm gin_trgm_ops') ], {
        //     indexName : 'Accounts_fulltext_trgm_search_index',
        //     // indicesType : 'FULLTEXT',
        //     method    : 'gin'
        // }).catch(err => {
        //     console.error(err);
        //     throw err;
        // });
    },

    down : async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex('Accounts', 'Accounts_fulltext_tsmatch_search_index');
        await queryInterface.removeIndex('Accounts', 'Accounts_fulltext_trgm_search_index');
        await queryInterface.dropFunction('tsmatch', tsmatchParams);
        await queryInterface.removeColumn('Accounts', 'fulltext');
    }
};

