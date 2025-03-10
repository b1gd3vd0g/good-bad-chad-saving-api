const sql = require('./pg');

/**
 * Creates the table `players` in the database, if it does not already exist.
 * @throws An error if, for some reason, the db connection can't be made.
 */
const createPlayersTable = async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS players(
            player_id       text                        PRIMARY KEY UNIQUE NOT NULL,
            username        text                        UNIQUE NOT NULL,
            password        text,
            salt            text,
            email           text                        UNIQUE,
            created         timestamp with time zone    NOT NULL
        )
    `;
};

/**
 * Creates the table `saves` in the database, if it does not already exist.
 * @throws An error if, for some reason, the db connection can't be made.
 */
const createSavesTable = async () => {
    // This MUST be done before the saves table is created, as the `player` field
    // must correspond to a valid `player_id` from the `player` table.
    // If the table does already exist, this function won't do anything.
    await createPlayersTable();
    await sql`
        CREATE TABLE IF NOT EXISTS saves(
            save_id                 text                        PRIMARY KEY UNIQUE NOT NULL,
            player                  text                        REFERENCES players(player_id),
            saved_at                timestamp with time zone    NOT NULL,               
            zone                    text                        NOT NULL,
            bunnies_killed          integer                     DEFAULT 0,
            bots_killed             integer                     DEFAULT 0,
            finished_hunting        boolean                     DEFAULT false,
            hunting_inst_received   boolean                     DEFAULT false,
            invited_hunting         boolean                     DEFAULT false,
            slimes_killed           integer                     DEFAULT 0,
            snakes_killed           integer                     DEFAULT 0,
            tutorial_complete       boolean                     DEFAULT false,
            village_attack_ended    boolean                     DEFAULT false,
            bomb_count              integer                     DEFAULT 0,
            broccoli_count          integer                     DEFAULT 0,
            rock_count              integer                     DEFAULT 0,
            slimeball_count         integer                     DEFAULT 0,
            snowball_count          integer                     DEFAULT 0,
            sus_snowball_count      integer                     DEFAULT 0,
            water_balloon_count     integer                     DEFAULT 0,
            bacon_count             integer                     DEFAULT 0,
            beef_count              integer                     DEFAULT 0,
            burger_count            integer                     DEFAULT 0,
            chicken_count           integer                     DEFAULT 0,
            energy_drink_count      integer                     DEFAULT 0,
            ham_count               integer                     DEFAULT 0,
            steak_count             integer                     DEFAULT 0,
            rune_count              integer                     DEFAULT 0,
            action                  text                        DEFAULT 'idle',
            already_landed          boolean                     DEFAULT false,
            bb_pos_x                double precision            NOT NULL,
            bb_pos_y                double precision            NOT NULL,
            bb_size_x               double precision            NOT NULL,
            bb_size_y               double precision            NOT NULL,
            can_dash                boolean                     DEFAULT true,
            can_double_jump         boolean                     DEFAULT false,
            damage_mult             double precision            DEFAULT 1.0,
            dash_cooldown           double precision            DEFAULT 1.3,
            dash_stop               double precision            DEFAULT 0,
            facing                  text                        DEFAULT 'right',
            first_jump_timer        double precision            DEFAULT 0,
            first_jump_vel          double precision            NOT NULL,
            has_dashed              boolean                     DEFAULT false,
            has_double_jumped       boolean                     DEFAULT false,
            health                  double precision            NOT NULL,
            is_dashing              boolean                     DEFAULT false,
            is_jumping              boolean                     DEFAULT false,
            is_on_ground            boolean                     DEFAULT false,
            lbb_pos_x               double precision            NOT NULL,
            lbb_pos_y               double precision            NOT NULL,
            lbb_size_x              double precision            NOT NULL,
            lbb_size_y              double precision            NOT NULL,
            max_health              double precision            NOT NULL,
            pos_x                   double precision            NOT NULL,
            pos_y                   double precision            NOT NULL,
            prev_y_on_ground        double precision            DEFAULT 0,
            scale_x                 double precision            DEFAULT 2.2,
            scale_y                 double precision            DEFAULT 2.2,
            scaled_size_x           double precision            NOT NULL,
            scaled_size_y           double precision            NOT NULL,
            second_jump_vel         double precision            NOT NULL,
            speed                   double precision            DEFAULT 0,
            vel_x                   double precision            DEFAULT 0,
            vel_y                   double precision            DEFAULT 0
        ) 
    `;
};

module.exports = { createPlayersTable, createSavesTable };
