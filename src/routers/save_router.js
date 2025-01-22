const {
    createNewSave,
    fetchOneSaveById,
    fetchSavesByToken
} = require('../db/save_crud');

const router = require('express').Router();

router.post('/', async (req, res) => {
    const { chad, inventory, story, zone } = req.body;
    const token = req.headers.authorization.substring('BEARER '.length);
    const creation = await createNewSave(chad, inventory, story, zone, token);
    return res.status(creation.code).json(creation.info);
});

router.get('/:save_id', async (req, res) => {
    const { save_id } = req.params;
    const token = req.headers.authorization.substring('BEARER '.length);
    const save = await fetchOneSaveById(save_id, token);
    return res.status(save.code).json(save.info);
});

router.get('/', async (req, res) => {
    const token = req.headers.authorization.substring('BEARER '.length);
    const saves = await fetchSavesByToken(token);
    return res.status(saves.code).json(saves.info);
});

module.exports = router;
