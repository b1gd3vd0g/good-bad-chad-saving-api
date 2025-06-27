const sql = require('./pg');
const cr = require('./responses');
const { fetchPlayerByToken } = require('./player_crud');
const { createSavesTable } = require('./tables');

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

  /** An object identical to a row in the database. */
  let dbObj;
  try {
    dbObj = {
      save_id: saveId,
      player: player_id,
      saved_at: new Date(),
      zone: zone.name,
      bunnies_killed: story.bunniesKilled ?? null,
      bots_killed: story.botsKilled ?? null,
      finished_hunting: story.finishedHunting ?? null,
      hunting_inst_received: story.huntingInstructionsReceived ?? null,
      invited_hunting: story.invitedHunting ?? null,
      slimes_killed: story.slimesKilled ?? null,
      snakes_killed: story.snakesKilled ?? null,
      tutorial_complete: story.tutorialComplete ?? null,
      village_attack_ended: story.villageAttackEnded ?? null,
      bomb_count: inventory.ammoBag.find(typeFinder('bomb')).amount,
      broccoli_count: inventory.ammoBag.find(typeFinder('broccoli')).amount,
      rock_count: inventory.ammoBag.find(typeFinder('rock')).amount,
      slimeball_count: inventory.ammoBag.find(typeFinder('slimeball')).amount,
      snowball_count: inventory.ammoBag.find(typeFinder('snowball')).amount,
      sus_snowball_count: inventory.ammoBag.find(typeFinder('sus_snowball'))
        .amount,
      water_balloon_count: inventory.ammoBag.find(typeFinder('water_balloon'))
        .amount,
      bacon_count: inventory.foodBag.find(typeFinder(0)).amount,
      beef_count: inventory.foodBag.find(typeFinder(6)).amount,
      burger_count: inventory.foodBag.find(typeFinder(1)).amount,
      chicken_count: inventory.foodBag.find(typeFinder(5)).amount,
      energy_drink_count: inventory.foodBag.find(typeFinder(2)).amount,
      ham_count: inventory.foodBag.find(typeFinder(4)).amount,
      steak_count: inventory.foodBag.find(typeFinder(3)).amount,
      rune_count: inventory.runes,
      action: chad.action,
      already_landed: chad.alreadyLanded,
      bb_pos_x: chad.boundingBox.pos.x,
      bb_pos_y: chad.boundingBox.pos.y,
      bb_size_x: chad.boundingBox.size.x,
      bb_size_y: chad.boundingBox.size.y,
      can_dash: chad.canDash,
      can_double_jump: chad.canDoubleJump,
      damage_mult: chad.damageMultiplier,
      dash_cooldown: chad.dashCooldownTimer,
      dash_stop: chad.dashStopTimer,
      facing: chad.facing,
      first_jump_timer: chad.firstJumpTimer,
      first_jump_vel: chad.firstJumpVelocity,
      has_dashed: chad.hasDashed,
      has_double_jumped: chad.hasDoubleJumped,
      health: chad.health,
      is_dashing: chad.isDashing,
      is_jumping: chad.isJumping,
      is_on_ground: chad.isOnGround,
      lbb_pos_x: chad.lastBoundingBox.pos.x,
      lbb_pos_y: chad.lastBoundingBox.pos.y,
      lbb_size_x: chad.lastBoundingBox.size.x,
      lbb_size_y: chad.lastBoundingBox.size.y,
      max_health: chad.maxHealth,
      pos_x: chad.pos.x,
      pos_y: chad.pos.y,
      prev_y_on_ground: chad.prevYPosOnGround,
      scale_x: chad._scale.x,
      scale_y: chad._scale.y,
      scaled_size_x: chad.scaledSize.x,
      scaled_size_y: chad.scaledSize.y,
      second_jump_vel: chad.secondJumpVelocity,
      speed: chad.speed,
      vel_x: chad.velocity.x,
      vel_y: chad.velocity.y
    };
  } catch (e) {
    // This means that the request must have been bad.
    return cr(400, e);
  }
  const cols = Object.keys(dbObj);

  await createSavesTable();

  try {
    await sql`
            INSERT INTO saves ${sql(dbObj, cols)}
        `;
    return cr(201);
  } catch (e) {
    return cr(500, e);
  }
};

const deleteSaveById = async (saveId, authToken) => {
  const player = await fetchPlayerByToken(authToken);
  if (player.code !== 200) {
    // player could not be found.
    return player;
  }
  const { player_id } = player.info;
  try {
    await createSavesTable();
    const result = await sql`
            DELETE FROM saves
                WHERE player = ${player_id}
                    AND save_id = ${saveId};
        `;
    if (result.count === 1) return cr(200);
    else if (result.count === 0) return cr(404);
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
    await createSavesTable();
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
    await createSavesTable();
    const saves = await sql`
            SELECT ${sql(cols)} FROM saves 
                WHERE player = ${player_id};
        `;
    if (saves.length === 0) {
      return cr(404, []);
    }
    return cr(200, saves);
  } catch (e) {
    return cr(500, e);
  }
};

module.exports = {
  createNewSave,
  deleteSaveById,
  fetchOneSaveById,
  fetchSavesByToken
};
