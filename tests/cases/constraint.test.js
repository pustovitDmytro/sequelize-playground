import { assert } from 'chai';
import sequelize, { Sequelize } from '../sequelize';

import Test from '../Test';

const factory = new Test();

suite('Sequelize constraints');
let accounts;

let Account;

before(async () => {
    await factory.cleanup();
    accounts = await factory.setAccounts();
    Account = sequelize.model('Account');

    Account.prototype.debit = async function () {
        try {
            await this.decrement('balance');
            console.log(`current balance: ${this.balance}`);
        } catch (error) {
            if (error instanceof Sequelize.DatabaseError) {
                if (error.original.constraint === 'accounts_blance_check') throw new Error('Balance exceeded limit');
            }
            throw error;
        }
    };
});

test('Positive: check constraint relative to db field', async function () {
    const  account = accounts.find(a => a.limit < 0);
    const left = account.balance - account.limit;

    try {
        await Promise.all(Array.from(new Array(left * 5)).map(() => account.debit()));
        assert.fail('expected to fail');
    } catch (error) {
        assert.equal(error.message, 'Balance exceeded limit');
        const current = await Account.findOne({ where: { id: account.id } });

        assert.equal(current.balance, current.limit);
    }
});

