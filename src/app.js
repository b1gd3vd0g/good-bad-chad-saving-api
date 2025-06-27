const express = require('express');
const cors = require('cors');

const { FEHOST } = process.env;
if (!FEHOST) {
  throw new Error('ENVIRONMENT VARIABLE IS NOT CONFIGURED TO SET UP CORS.');
}

const app = express();

app.use(
  cors({
    credentials: true,
    origin: [`https://${FEHOST}`, `https://www.${FEHOST}`],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600
  })
);

app.use(express.json());

app.use('/player', require('./routers/player_router'));
app.use('/save', require('./routers/save_router'));

module.exports = app;
