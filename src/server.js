const app = require('./app');
const server = require('http').createServer(app);
const port = 6900;
server.listen(port, () => console.log(`Server listening on port ${port}.`));
