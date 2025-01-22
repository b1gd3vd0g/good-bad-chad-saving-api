const pg = require('postgres');

// Do this primary stuff just so that it works even if I don't start the
// application up from `server.js`.
const env = process.env;
if (!(env.DBNAME && env.PGHOST && env.PGPASS && env.PGPORT && env.PGUSER)) {
    require('dotenv').config({
        path: '../../.env'
    });
}

const { DBNAME, PGHOST, PGPASS, PGPORT, PGUSER } = env;

// Error out if process.env actually isn't configured.
if (!(DBNAME && PGHOST && PGPASS && PGPORT && PGUSER)) {
    throw new Error(
        'ENVIRONMENT VARIABLE IS NOT CONFIGURED TO ACCESS THE DATABASE.'
    );
}

const sql = pg(
    `postgresql://${PGUSER}:${PGPASS}@${PGHOST}:${PGPORT}/${DBNAME}`
);

module.exports = sql;
