const crypto = require('crypto');

const HASH_SIZE = 64;

const hash = (pw, salt) => {
    return crypto
        .pbkdf2Sync(pw, salt, 10_000, HASH_SIZE, 'sha512')
        .toString('hex');
};

const generateSalt = () => {
    return crypto.randomBytes(HASH_SIZE).toString('hex');
};

module.exports = { hash, generateSalt };
