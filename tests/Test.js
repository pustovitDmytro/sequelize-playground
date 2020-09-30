import fse from 'fs-extra';
import { tickets, accounts } from '../fixtures';
import { tmpFolder } from './constants';
import sequelize, { Sequelize } from './sequelize';

export default class Test {
    async setTmpFolder() {
        await fse.ensureDir(tmpFolder);
    }
    async cleanTmpFolder() {
        await fse.remove(tmpFolder);
    }

    async setTickets() {
        const Ticket = sequelize.define('Ticket', {
            id     : { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            status : { type: Sequelize.ENUM('available', 'booked', 'bought', 'returned', 'pending'), allowNull: false, defaultValue: 'pending' },
            owner  : { type: Sequelize.STRING, allowNull: true }
        }, { timestamps: false });

        return Ticket.bulkCreate(tickets);
    }

    async setAccounts() {
        const Account = sequelize.define('Account', {
            id       : { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            balance  : { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            limit    : { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            currency : { type: Sequelize.ENUM('USD', 'EUR', 'GBR'), allowNull: false },
            owner    : { type: Sequelize.STRING, allowNull: true }
        }, { timestamps: false });


        return Account.bulkCreate(accounts);
    }

    async cleanup() {
        const tables = [
            'Tickets',
            'Accounts'
        ];

        for (const table of tables) {
            await sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
        }
    }
}

export {
    tmpFolder
};
