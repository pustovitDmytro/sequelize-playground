import { assert } from 'chai';
import Sequelize from 'sequelize';
import { retry } from 'myrmidon';
import sequelize from '../sequelize';
import Test, { planes } from '../Test';

const factory = new Test();

suite.only('Sequelize trigger on row create');
let Ticket;

before(async () => {
    try {
        await factory.cleanup();
        await factory.setTickets();
    } catch (error) {
        console.error(error);
        throw error;
    }
    Ticket = sequelize.model('Ticket');

    Ticket.addHook('beforeCreate', 'check_dublicate_tickets_on_plane', async (ticket, { transaction }) => {
        const Plane = sequelize.model('Plane');

        const plane = await Plane.findOne({
            where : { id: ticket.plane },
            transaction
        });

        if (plane.type === 'SOFT_CHECK_SINGLE_TICKET') {
            const dublicate = await Ticket.findOne({
                where : { place: ticket.place, plane: ticket.plane },
                transaction
            });

            if (dublicate) throw new Error('Place dublicate');
        }
    });

    Ticket.createTicket = async function () {
        try {
            const res = await retry(
                (abort) => Ticket._createTicket(...arguments)
                    .catch(error => {
                        const isSerializeError = error.name === 'SequelizeDatabaseError' && error.message === 'could not serialize access due to read/write dependencies among transactions';

                        if (isSerializeError) {
                            throw error;
                        } else {
                            throw abort(error);
                        }
                    }),
                {
                    retry   : 3,
                    timeout : 500
                }
            );

            return { status: 1, data: res.id };
        } catch (error) {
            return { status: 0 };
        }
    };

    Ticket._createTicket = async function (
        planeId,
        place,
        level = Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    ) {
        const transaction = await sequelize.transaction({
            isolationLevel : level
        });

        try {
            const ticket = await Ticket.create({
                plane : planeId,
                place
            }, { transaction });

            await transaction.commit();

            return ticket;
        } catch (error) {
            await sequelize.getQueryInterface().rollbackTransaction(transaction, transaction.options);
            throw error;
        }
    };
});

test('Negative: handle in application level', async function () {
    const attempts = 3;
    const softPlane = planes.find(p => p.type === 'SOFT_CHECK_SINGLE_TICKET');

    const results = await Promise.all(
        Array.from(new Array(attempts))
            .map(() => Ticket.createTicket(softPlane.id, 101))
    );
    const passed = results.filter(r => r.status);

    assert.lengthOf(passed, 1);
});

test('Positive: add normal tickets for soft app check', async function () {
    const attempts = 3;
    const softPlane = planes.find(p => p.type === 'SOFT_CHECK_SINGLE_TICKET');
    const places = Array.from(new Array(attempts)).map((item, index) => 200 + index);
    const softResults = await Promise.all(
        places.map(place => Ticket.createTicket(softPlane.id, place))
    );

    const softPassed = softResults.filter(r => r.status);

    assert.lengthOf(softPassed, 3);


    const tickets = await Ticket.findAll({
        where : {
            plane : softPlane.id,
            place : places
        }
    });

    assert.lengthOf(tickets, places.length);
});

test('Positive: add normal tickets for hard db check', async function () {
    const attempts = 3;
    const hardPlane = planes.find(p => p.type === 'HARD_CHECK_SINGLE_TICKET');

    const hardResults = await Promise.all([
        ...Array.from(new Array(attempts))
            .map((item, index) => Ticket.createTicket(hardPlane.id, 150 + index))
    ]);
    const hardPassed = hardResults.filter(r => r.status);

    assert.lengthOf(hardPassed, 3);
});

test('Positive: db trigger', async function () {
    const attempts = 3;
    const plane = planes.find(p => p.type === 'HARD_CHECK_SINGLE_TICKET');

    const results = await Promise.all(
        Array.from(new Array(attempts))
            .map(() => Ticket.createTicket(plane.id, 101))
    );
    const passed = results.filter(r => r.status);

    assert.lengthOf(passed, 1);
});
