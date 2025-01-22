const {
    authenticatePlayerLogin,
    createNewPlayer,
    fetchAllPlayers,
    fetchPlayerByToken
} = require('../db/player_crud');

const router = require('express').Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const authentication = await authenticatePlayerLogin(username, password);
    return res.status(authentication.code).json(authentication.info);
});

router.post('/', async (req, res) => {
    const { username, password, email } = req.body;
    const creation = await createNewPlayer(username, password, email ?? null);
    return res.status(creation.code).json(creation.info);
});

router.get('/all', async (req, res) => {
    const players = await fetchAllPlayers();
    return res.status(players.code).json(players.info);
});

router.get('/', async (req, res) => {
    const token = req.headers.authorization.substring('BEARER '.length);
    const player = await fetchPlayerByToken(token);
    return res.status(player.code).json(player.info);
});

module.exports = router;
