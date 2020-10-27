const sortByArrayParams = [ {
    name : 'anyarray',
    type : 'anyarray'
}, {
    name : 'anyelement',
    type : 'anyelement'
} ];

const balanceSortParams = [ {
    name : 'balance',
    type : 'integer'
}, {
    name : 'lim',
    type : 'integer'
} ];


module.exports = {
    up : async (queryInterface) => {
        await queryInterface.createFunction(
            'sortByArray',
            sortByArrayParams,
            'INT',
            'plpgsql',
            `RETURN(
              SELECT i FROM (
                  SELECT generate_series(array_lower($1,1),array_upper($1,1))
              ) g(i)
              WHERE $1[i] = $2
              LIMIT 1
            );
            `
        );
        await queryInterface.createFunction(
            'balanceSort',
            balanceSortParams,
            'INT',
            'plpgsql',
            'RETURN balance - lim;'
        );
    },

    down : async (queryInterface) => {
        await queryInterface.dropFunction('sortByArray', sortByArrayParams);
        await queryInterface.dropFunction('balanceSort', balanceSortParams);
    }
};
