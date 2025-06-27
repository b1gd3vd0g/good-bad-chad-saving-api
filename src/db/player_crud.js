const { generateSalt, hash } = require('./hashing');
const sql = require('./pg');
const cr = require('./responses');
const { createPlayersTable } = require('./tables');
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

  await createPlayersTable();

  const acct = await sql`
        SELECT password, salt, username, player_id FROM players
            WHERE username = ${unOrEmail}
            OR email = ${unOrEmail};
    `;
  if (acct.length !== 1) {
    return cr(401, 'Authentication failed!');
  }
  const thisAcct = acct[0];
  const hashedPw = hash(password, thisAcct.salt);
  if (hashedPw === thisAcct.password) {
    const authToken = generateAuthenticationToken(thisAcct);
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

  const salt = generateSalt();
  const hashedPw = hash(password, salt);

  const player = {
    username: username,
    salt: salt,
    password: hashedPw,
    email: email,
    created: new Date()
  };
  const cols = Object.keys(player);

  await createPlayersTable();

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
  await createPlayersTable();
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

    await createPlayersTable();

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
