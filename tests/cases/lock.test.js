import { assert } from 'chai';
import sequelize from '../sequelize';

import Test from '../Test';

const factory = new Test();

suite('Sequelize locks');
let availableTickets;
const users = [ 'Louise Moreno', 'Patrick Walton', 'Isabella Norton', 'Lora Ray' ];

before(async () => {
    await factory.cleanup();
    await factory.setTickets();
    const Ticket = sequelize.model('Ticket');

    Ticket.prototype.book = async function (user) {
        if (this.status !== 'available') throw new Error(`Bad status ${this.status}`);
        const isAvailInDb = await Ticket.findOne({ where: { id: this.id, status: 'available' } });

        if (!isAvailInDb) throw new Error(`Not allowed to book ${this.id}`);

        await this.update({ status: 'booked', owner: user });
        console.log(`User '${user}' successfully booked a ticket`);
    };

    Ticket.prototype.buy = async function (user) {
        const transaction = await sequelize.transaction();
        const entity = await Ticket.findOne({
            where : { id: this.id },
            lock  : transaction.LOCK.UPDATE,
            transaction
        });

        if (entity.status !== 'available') {
            await transaction.rollback();

            throw new Error(`Bad status ${entity.status}`);
        }
        try {
            await entity.update({ status: 'bought', owner: user }, { transaction });

            console.log(`User '${user}' successfully bought a ticket`);
            await transaction.commit();

            return entity;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Not allowed to book ${this.id}`);
        }
    };
    availableTickets = await Ticket.findAll({ where: { status: [ 'available' ] } });
});


test('Negative: handle in application level', async function () {
    const [ ticket ] = availableTickets;

    await Promise.all(users.map(user => ticket.book(user)));
    assert.equal(ticket.status, 'booked');
    assert.equal(ticket.owner, users[users.length - 1]);
});

test('Positive: handle in db level', async function () {
    const [ , ticket ] = availableTickets;

    try {
        await Promise.all(users.map(async user => ticket.buy(user)));
        assert.fail('expected to fail');
    } catch (error) {
        assert.equal(error.message, 'Bad status bought');
        const current = await sequelize.model('Ticket').findOne({ where: { id: ticket.id } });

        assert.equal(current.owner, users[0]);
        await current.update({ status: 'returned' });
    }
});

