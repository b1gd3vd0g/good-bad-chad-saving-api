require('dotenv').config();

const app = require('./app');

const server = require('http').createServer(app);

server.listen(6900, () => {
    console.log('Server listening on port 6900');
});
