const pg = require('postgres');

const { DBNAME, PGHOST, PGPASS, PGPORT, PGUSER } = process.env;

// Error out if process.env actually isn't configured.
if (!(DBNAME && PGHOST && PGPASS && PGPORT && PGUSER)) {
  throw new Error(
    'ENVIRONMENT VARIABLE IS NOT CONFIGURED TO ACCESS THE DATABASE.'
  );
}

/** A connection to the postgres database. */
const sql = pg(
  `postgresql://${PGUSER}:${PGPASS}@${PGHOST}:${PGPORT}/${DBNAME}`
);

module.exports = sql;
