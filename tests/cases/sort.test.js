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
});

async function testOrder(array, order, expected) {
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

test('Positive: check constraint relative to db field', async function () {
    await testOrder([ 'GBR', 'USD', 'EUR' ], 'ASC', [ 'GBR', 'USD', 'EUR' ]);
    await testOrder([ 'EUR', 'USD', 'GBR' ], 'DESC', [ 'GBR', 'USD', 'EUR' ]);
    await testOrder([ 'EUR', 'USD', 'GBR' ], 'ASC', [ 'EUR', 'USD', 'GBR' ]);
});

