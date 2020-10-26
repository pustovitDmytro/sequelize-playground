const params = [ {
    name : 'anyarray',
    type : 'anyarray'
}, {
    name : 'anyelement',
    type : 'anyelement'
} ];

module.exports = {
    up : async (queryInterface) => {
        await queryInterface.createFunction(
            'sortByArray',
            params,
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
        // [limit, limit+10) DESC
        // [limit+10, limit+100] DESC
        // await queryInterface.createFunction(
        //     'balanceSort',
        //     params,
        //     'INT',
        //     'plpgsql',
        //     "RETURN date_trunc('day', date at time zone '0' + INTERVAL '1 day');"
        // );
    },

    down : async (queryInterface) => {
        await queryInterface.dropFunction('sortByArray', params);
    }
};
