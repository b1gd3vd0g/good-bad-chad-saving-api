const sql = require('./pg');
const cr = require('./responses');
const { fetchPlayerByToken } = require('./player_crud');

/**
 * Creates a new save document in the database.
 * @param {object} chad The Chad object from the game, at the point of save.
 * @param {object} inventory The Inventory object from the game, at the point of save.
 * @param {object} story The Story object from the game, at the point of save.
 * @param {object} zone The Zone object from the game, at the point of save.
 * @param {string} authToken The JWT authenticating the player.
 * @returns a CrudResponse object with an empty 201 response upon success, else a message or an
 * error object.
 */
const createNewSave = async (chad, inventory, story, zone, authToken) => {
    // Make sure the token is valid.
    const player = await fetchPlayerByToken(authToken);
    if (player.code !== 200) {
        // player could not be found!
        return player; // This is a CrudResponse object representing the failure of the `fetchPlayerByToken` function.
    }
    // player was found!
    const { player_id } = player.info;

    /** Returns a function which returns whether the type field of the parameter is equal to type. */
    const typeFinder = (type) => {
        return (c) => c.type === type;
    };

    const generateSaveId = async () => {
        /** generates a `random hex string` 16 characters long */
        const rhs = () => require('crypto').randomBytes(8).toString('hex');

        /** checks if an id already exists in the database. */
        const exists = async (saveId) => {
            const result =
                await sql`SELECT save_id FROM saves WHERE save_id = ${saveId};`;
            return result.length > 0;
        };

        const start = Date.now();

        // generate a random id until you get one that does not yet exist.
        let id;
        let inv = true;
        while (inv) {
            id = rhs();
            inv = await exists(id);
            if (Date.now() - start > 10_000) {
                // It has been 10 seconds and we have not generated a save id.
                // fail.
                return false;
            }
        }

        // id does not exist in db. return it.
        return id;
    };

    const saveId = await generateSaveId();
    if (!saveId) {
        return cr(500, 'It took longer than 10 seconds to generate a save_id.');
    }

    /** An object identical to a row in the database. */
    const dbObj = {
        save_id: saveId,
        player: player_id,
        saved_at: new Date(),
        zone: zone.name ?? null,
        bunnies_killed: story.bunniesKilled ?? null,
        bots_killed: story.botsKilled ?? null,
        finished_hunting: story.finishedHunting ?? null,
        hunting_inst_received: story.huntingInstructionsReceived ?? null,
        invited_hunting: story.invitedHunting ?? null,
        slimes_killed: story.slimesKilled ?? null,
        snakes_killed: story.snakesKilled ?? null,
        tutorial_complete: story.tutorialComplete ?? null,
        village_attack_ended: story.villageAttackEnded ?? null,
        bomb_count: inventory.ammoBag.find(typeFinder('bomb')).amount ?? null,
        broccoli_count:
            inventory.ammoBag.find(typeFinder('broccoli')).amount ?? null,
        rock_count: inventory.ammoBag.find(typeFinder('rock')).amount ?? null,
        slimeball_count:
            inventory.ammoBag.find(typeFinder('slimeball')).amount ?? null,
        snowball_count:
            inventory.ammoBag.find(typeFinder('snowball')).amount ?? null,
        sus_snowball_count:
            inventory.ammoBag.find(typeFinder('sus_snowball')).amount ?? null,
        water_balloon_count:
            inventory.ammoBag.find(typeFinder('water_balloon')).amount ?? null,
        bacon_count: inventory.foodBag.find(typeFinder(0)).amount ?? null,
        beef_count: inventory.foodBag.find(typeFinder(6)).amount ?? null,
        burger_count: inventory.foodBag.find(typeFinder(1)).amount ?? null,
        chicken_count: inventory.foodBag.find(typeFinder(5)).amount ?? null,
        energy_drink_count:
            inventory.foodBag.find(typeFinder(2)).amount ?? null,
        ham_count: inventory.foodBag.find(typeFinder(4)).amount ?? null,
        steak_count: inventory.foodBag.find(typeFinder(3)).amount ?? null,
        rune_count: inventory.runes ?? null,
        action: chad.action ?? null,
        already_landed: chad.alreadyLanded ?? null,
        bb_pos_x: chad.boundingBox.pos.x ?? null,
        bb_pos_y: chad.boundingBox.pos.y ?? null,
        bb_size_x: chad.boundingBox.size.x ?? null,
        bb_size_y: chad.boundingBox.size.y ?? null,
        can_dash: chad.canDash ?? null,
        can_double_jump: chad.canDoubleJump ?? null,
        damage_mult: chad.damageMultiplier ?? null,
        dash_cooldown: chad.dashCooldownTimer ?? null,
        dash_stop: chad.dashStopTimer ?? null,
        facing: chad.facing ?? null,
        first_jump_timer: chad.firstJumpTimer ?? null,
        first_jump_vel: chad.firstJumpVelocity ?? null,
        has_dashed: chad.hasDashed ?? null,
        has_double_jumped: chad.hasDoubleJumped ?? null,
        health: chad.health ?? null,
        is_dashing: chad.isDashing ?? null,
        is_jumping: chad.isJumping ?? null,
        is_on_ground: chad.isOnGround ?? null,
        lbb_pos_x: chad.lastBoundingBox.pos.x ?? null,
        lbb_pos_y: chad.lastBoundingBox.pos.y ?? null,
        lbb_size_x: chad.lastBoundingBox.size.x ?? null,
        lbb_size_y: chad.lastBoundingBox.size.y ?? null,
        max_health: chad.maxHealth ?? null,
        pos_x: chad.pos.x ?? null,
        pos_y: chad.pos.y ?? null,
        prev_y_on_ground: chad.prevYPosOnGround ?? null,
        scale_x: chad._scale.x ?? null,
        scale_y: chad._scale.y ?? null,
        scaled_size_x: chad.scaledSize.x ?? null,
        scaled_size_y: chad.scaledSize.y ?? null,
        second_jump_vel: chad.secondJumpVelocity ?? null,
        speed: chad.speed ?? null,
        vel_x: chad.velocity.x ?? null,
        vel_y: chad.velocity.y ?? null
    };
    const cols = Object.keys(dbObj);

    try {
        await sql`
            INSERT INTO saves ${sql(dbObj, cols)}
        `;
        return cr(201);
    } catch (e) {
        return cr(500, e);
    }
};

/**
 * Fetch a single, entire save document from the database.
 * @param {string} saveId The `save_id` of the document to be fetched.
 * @param {string} authToken A JWT authenticating the player.
 * @returns A CrudResponse containing a single, entire save document upon success;
 * else, an error message or object.
 */
const fetchOneSaveById = async (saveId, authToken) => {
    // Make sure the token is valid.
    const player = await fetchPlayerByToken(authToken);
    if (player.code !== 200) {
        // player could not be found!
        return player; // This is a CrudResponse object representing the failure of the `fetchPlayerByToken` function.
    }
    // player was found!
    const { player_id } = player.info;

    try {
        const result = await sql`
            SELECT * FROM saves 
                WHERE save_id = ${saveId}
                    AND player = ${player_id};
        `;
        if (result.length === 1) return cr(200, result[0]);
        else return cr(404, 'Save document not found.');
    } catch (e) {
        return cr(500, e);
    }
};

/**
 * Fetch all the saves of a certain player based off an authentication token.
 * @param {string} authToken The JWT authenticating the player.
 * @returns A CrudResponse object with the save files upon success, or an error object
 * or message upon failure.
 */
const fetchSavesByToken = async (authToken) => {
    // Make sure the token is valid.
    const player = await fetchPlayerByToken(authToken);
    if (player.code !== 200) {
        // player could not be found!
        return player; // This is a CrudResponse object representing the failure of the `fetchPlayerByToken` function.
    }
    // player was found!
    const { player_id } = player.info;

    const cols = ['save_id', 'saved_at', 'zone', 'health', 'rune_count'];
    try {
        const saves = await sql`
            SELECT ${sql(cols)} FROM saves 
                WHERE player = ${player_id};
        `;
        if (saves.length === 0) {
            return cr(404, 'No saves were found');
        }
        return cr(200, saves);
    } catch (e) {
        return cr(500, e);
    }
};

module.exports = {
    createNewSave,
    fetchOneSaveById,
    fetchSavesByToken
};
