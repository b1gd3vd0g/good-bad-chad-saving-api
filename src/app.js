const express = require('express');
const cors = require('cors');

const app = express();

app.use(
    cors({
        credentials: true,
        origin: '*'
    })
);

app.use(express.json());

app.use('/player', require('./routers/player_router'));
app.use('/save', require('./routers/save_router'));

module.exports = app;
