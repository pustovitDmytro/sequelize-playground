import { assert } from 'chai';
import sequelize from '../sequelize';
import Test from '../Test';

const factory = new Test();

suite('Custom Sort');
let Account;

before(async () => {
    await factory.cleanup();
    await factory.setAccounts();
    Account = sequelize.model('Account');

    Account.getSortedByCurrency = async function (array, order = 'ASC') {
        return Account.findAll({
            order : [ [ sequelize.fn('sortByArray', array, sequelize.cast(sequelize.col('currency'), 'text')), order ] ]
        });
    };

    Account.getSortedByBalance = async function (order = 'ASC') {
        return Account.findAll({
            order : [ [ sequelize.fn('balanceSort', sequelize.col('balance'), sequelize.col('limit')), order ] ]
        });
    };
});

async function testCurrencyOrder(array, order, expected) {
    const accounts = await Account.getSortedByCurrency(array, order);

    accounts.forEach((firstAcc, firstIndex) => {
        accounts.forEach((secAcc, secIndex) => {
            const actualOrder = Math.sign(firstIndex - secIndex);
            const expectedOrder = Math.sign(
                expected.findIndex(i => i === firstAcc.currency) - expected.findIndex(i => i === secAcc.currency)
            );

            assert.equal(actualOrder, expectedOrder, `${firstAcc.currency } <-> ${secAcc.currency}`);
        });
    });
}

test('Positive: check array order in enums', async function () {
    await testCurrencyOrder([ 'GBR', 'USD', 'EUR' ], 'ASC', [ 'GBR', 'USD', 'EUR' ]);
    await testCurrencyOrder([ 'EUR', 'USD', 'GBR' ], 'DESC', [ 'GBR', 'USD', 'EUR' ]);
    await testCurrencyOrder([ 'EUR', 'USD', 'GBR' ], 'ASC', [ 'EUR', 'USD', 'GBR' ]);
});


test('Positive: check function order in integers', async function () {
    const accounts = await Account.getSortedByBalance();

    accounts.forEach(a => {
        console.log(a.owner, a.balance - a.limit);
    });
    accounts.forEach((firstAcc, firstIndex) => {
        accounts.forEach((secAcc, secIndex) => {
            const actualOrder = Math.sign(firstIndex - secIndex);
            const expectedOrder = Math.sign((firstAcc.balance - firstAcc.limit) - (secAcc.balance - secAcc.limit));

            assert.equal(actualOrder, expectedOrder, `${firstAcc.owner} (${firstAcc.balance} of ${firstAcc.limit}) <-> ${secAcc.owner} (${firstAcc.balance} of ${firstAcc.limit})`);
        });
    });
});

