import fse from 'fs-extra';
import { tickets } from '../fixtures';
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

        return Ticket.bulkCreate(tickets).catch(err => console.error(err));
    }

    async cleanup() {
        const tables = [
            'Tickets'
        ];

        for (const table of tables) {
            await sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
        }
    }
}

export {
    tmpFolder
};
