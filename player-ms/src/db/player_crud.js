const { generateSalt, hash } = require('./hashing');
const sql = require('./pg');
const cr = require('./responses');
const {
    generateAuthenticationToken,
    verifyAuthenticationToken
} = require('./token');

/**
 * Authenticates the login credentials of a player. The primary identifier
 * can be either the username or the email address of the player, and is case
 * insensitive. The password must be exactly as it appears in the database.
 * @param {string} unOrEmail The username or email address of a player account.
 * @param {string} password The password of a player account.
 * @returns A CrudResponse object providing a token on success, and either an
 *      error object (for a 500 code) or an error message (400 | 401).
 */
const authenticatePlayerLogin = async (unOrEmail, password) => {
    if (!unOrEmail || !password)
        return cr(400, 'username and password are required!');

    const accts = await sql`
        SELECT password, salt, username, player_id FROM players
            WHERE username = ${unOrEmail}
            OR email = ${unOrEmail};
    `;
    if (accts.length !== 1) {
        return cr(401, 'Authentication failed!');
    }
    const acct = accts[0];
    const hashedPw = hash(password, acct.salt);
    if (hashedPw === acct.password) {
        const authToken = generateAuthenticationToken(acct);
        return cr(200, { token: authToken });
    } else {
        return cr(401, 'Authentication failed!');
    }
};

/**
 * Creates a new player in the database.
 * @param {string} username The username of the new account (unique).
 * @param {string} password The password of the new account (unique).
 * @param {string} email The email address of the new account (optional).
 * @returns A CrudResponse object providing a 201 code on success, and either a
 * message (201 | 400 | 500 (due to id generation)) or an error object (500 due to postgres error).
 */
const createNewPlayer = async (username, password, email = null) => {
    // FAILURE NUMBER ONE: 400 BAD REQUEST
    if (!username || !password)
        return cr(400, 'username and password are required.');
    // TODO: eventually, I should check for valid username and password
    //      according to rules I haven't determined yet.
    /** generate a player_id which does not yet exist in the db. */
    const generatePlayerId = async () => {
        /** generates a `random hex string` 16 characters long */
        const rhs = () => require('crypto').randomBytes(8).toString('hex');

        /** checks if an id already exists in the database. */
        const exists = async (playerId) => {
            const result =
                await sql`SELECT player_id FROM players WHERE player_id = ${playerId};`;
            return result.length > 0;
        };

        const start = Date.now();

        // generate a random id until you get one that does not yet exist.
        let id;
        let inv = true;
        while (inv) {
            id = rhs();
            inv = await exists(id);
            if (Date.now() - start > 10_000) {
                // It has been 10 seconds and we have not generated a player id.
                // fail.
                return false;
            }
        }

        // id does not exist in db. return it.
        return id;
    };

    const playerId = await generatePlayerId();
    // FAILURE NUMBER TWO: 500 SERVER SIDE ERROR
    if (!playerId)
        return cr(500, 'Took longer than 10 seconds generating a player_id.');

    const salt = generateSalt();
    const hashedPw = hash(password, salt);

    const player = {
        player_id: playerId,
        username: username,
        salt: salt,
        password: hashedPw,
        email: email,
        created: new Date()
    };
    const cols = Object.keys(player);
    try {
        await sql`INSERT INTO players ${sql(player, cols)}`;
        return cr(201, `player ${username} has been created successfully!`);
    } catch (e) {
        console.error(e);
        // FAILURE NUMBER THREE: 500 SERVER SIDE ERROR
        return cr(500, e);
    }
};

/**
 * Fetch all players from the database. This fetches only what is considered to
 * be 'safe' information: `player_id`, `username`, `email`, and `created`.
 * @returns A CrudResponse object providing a 200 code and an array of players on success,
 * or an Error object on a 500 code.
 */
const fetchAllPlayers = async () => {
    try {
        const players = await sql`
            SELECT player_id, username, email, created FROM players;
        `;
        return cr(200, { players });
    } catch (e) {
        return cr(500, e);
    }
};

/**
 * Fetches a single player account from the database, based on an authentication
 * token (provided by a successful login using the authenticatePlayerLogin function).
 * Provides only what is considered to be 'safe' information: `player_id`, `username`, `email`, and `created`.
 * @param {string} token The JSON web token authorizing the player account.
 * @returns A CrudResponse object containing a single player object on success, and
 * a message on 401 and an error object on 500.
 */
const fetchPlayerByToken = async (token) => {
    const verification = verifyAuthenticationToken(token);
    if (verification.success) {
        const { payload } = verification;
        const { username, player_id } = payload;
        try {
            const player = await sql`
                SELECT player_id, username, email, created FROM players
                    WHERE player_id = ${player_id}
                        AND username = ${username};
            `;
            if (player.length === 1) {
                return cr(200, player[0]);
            } else {
                // There were no players found (player deleted account?)
                // or too many found (impossible?).
                return cr(401, {
                    code: 'NPF',
                    message: 'Token does not represent a valid player account.'
                });
            }
        } catch (e) {
            return cr(500, e);
        }
    } else {
        // The token was not verified successfully.
        const { code, message } = verification;
        return cr(401, { code, message });
    }
};

module.exports = {
    authenticatePlayerLogin,
    createNewPlayer,
    fetchAllPlayers,
    fetchPlayerByToken
};
