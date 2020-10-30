const triggerName = 'checkOnlyTicketInPlane';
const trigger = `
CREATE OR REPLACE FUNCTION ${triggerName}() RETURNS TRIGGER AS $$
declare
    planeType text;
    dublicates text;
BEGIN
  select type into planeType from "Planes" where id = NEW.plane;
  IF planeType = 'HARD_CHECK_SINGLE_TICKET' THEN
    select id into dublicates from "Tickets" where place = NEW.place and plane = NEW.plane LIMIT 1;
    IF dublicates IS NOT NULL THEN
      RAISE EXCEPTION '% place ticket dublicate on plane % ', NEW.place, NEW.plane;
    END IF;
  END IF;
  return NEW;
END;
$$ LANGUAGE plpgsql;
`;

module.exports = {
    up : async (queryInterface) => {
        await queryInterface.sequelize.query(trigger);
        await queryInterface.sequelize.query(`CREATE TRIGGER ${triggerName} BEFORE INSERT OR UPDATE ON "Tickets" FOR EACH ROW EXECUTE PROCEDURE ${triggerName}();`);
    },

    down : async (queryInterface) => {
        await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS ${triggerName} ON "Tickets"`);
        // await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS ${triggerName}`);
    }
};
