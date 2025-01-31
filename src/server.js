require('dotenv').config();

const app = require('./app');
const fs = require('fs');

const { CERT_PATH, KEY_PATH } = process.env;

const options = {
    cert: fs.readFileSync(CERT_PATH),
    key: fs.readFileSync(KEY_PATH)
};

const server = require('https').createServer(options, app);

server.listen(6900, () => {
    console.log('Server listening on port 6900');
});
