const jwt = require('jsonwebtoken');

const { JWTSEC } = process.env;
if (!JWTSEC) {
  throw new Error('ENVIRONMENT VARIABLE IS NOT CONFIGURED FOR JSONWEBTOKENS');
}

/**
 * Generates a JWT containing the information necessary to authenticate a player.
 * @param {object} player An object containing a `username` and `player_id`
 * representative of a single player in the database.
 * @returns A JWT containing all the necessary information to be used for
 * authentication purposes.
 * @throws an Error if `player` does not have a `username` and a `player_id` field.
 */
const generateAuthenticationToken = (player) => {
  const { username, player_id } = player;
  if (!(username && player_id)) {
    throw new Error('player.username && player.player_id are required!');
  }
  return jwt.sign(
    {
      username,
      player_id
    },
    JWTSEC,
    {
      expiresIn: 60 * 60 * 24 * 30 // 30 days
    }
  );
};

/**
 * Verifies an authentication token, and returns the payload upon success.
 * @param {string} token The JSON web token (provided by the `generateAuthenticationToken` function) to be verified.
 * @returns An object with a success boolean, and if that is true, a payload from the token - otherwise, returns a
 * message explaining why the token was rejected, and a three digit code to make life easier coding the front end.
 */
const verifyAuthenticationToken = (token) => {
  if (!token) {
    return {
      success: false,
      code: 'ABS',
      message: 'Token is missing.'
    };
  }
  try {
    const payload = jwt.verify(token, JWTSEC);
    return {
      success: true,
      payload: payload
    };
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return {
        success: false,
        code: 'EXP',
        message: 'Token is expired!'
      };
    } else if (e instanceof jwt.NotBeforeError) {
      return {
        success: false,
        code: 'EAR',
        message: 'It is too early to use this token!'
      };
    } else {
      return {
        success: false,
        code: 'INV',
        message: 'Token could not be parsed.'
      };
    }
  }
};

module.exports = { generateAuthenticationToken, verifyAuthenticationToken };
