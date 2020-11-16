import { assert } from 'chai';
import Sequelize from 'sequelize';
import { retry, pause } from 'myrmidon';
import sequelize from '../sequelize';
import Test, { planes } from '../Test';

const factory = new Test();

suite('Sequelize postgres search');
let Account;

let accounts;

before(async () => {
    try {
        await factory.cleanup();
        accounts = await factory.setAccounts();
    } catch (error) {
        console.error(error);
        throw error;
    }
    Account = sequelize.model('Account');
});

test.only('Positive: triagram similarity function calculation', async function () {
    console.log(accounts.map(a => `${a.id}: ${ a.fulltext_trgm}`));
    const searchWord = 'ost';
    const list = await Account.findAll({
        attributes : [ 'id', 'fulltext_trgm', [ sequelize.fn('similarity', sequelize.col('Account.fulltext_trgm'), searchWord), 'sml' ] ]
    });

    console.log('===========================');
    list.forEach(item => {
        console.log(item.dataValues);
        assert.isNumber(item.dataValues.sml);
    });
});


suite('Search performance');

before(async () => {
    await factory.cleanup();
});


// query.$and = sequelize.fn(
//   'tsmatch',
//   sequelize.fn('to_tsvector', 'english', sequelize.col(searchFields)),
//   sequelize.fn('to_tsquery', 'english', tsquery(search)),
// );
