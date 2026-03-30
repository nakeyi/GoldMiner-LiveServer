import { AcGameObject } from "/static/js/src/playground/ac_game_objects/zbase.js";
import { Mineral } from "/static/js/src/playground/mineral/zbase.js";

export class GameBackground extends AcGameObject {
    constructor(playground, game_background_ctx) {
        super();
        this.playground = playground;
        this.ctx = game_background_ctx;
        this.is_start = false;
        this.time = 0;

        this.eps = 0.01;
        this.base_scale = this.playground.base_scale;

        this.load_image();
        this.add_POS();
    }

    start() {
        this.resize();

        for (let img of this.images) {
            img.onload = function () {
                img.is_load = true;
            };
        }

        this.start_new_level();
    }

    start_new_level() {
        this.test_draw_minerable();
        this.playground.start_level_word_session();
        this.playground.prepare_word_round();
        this.render();
    }

    resize() {
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.render();
    }

    click_button(tx, ty) {
        let icon_pos = this.POS["game_backgorund_button"];
        for (let i = 0; i < icon_pos.length; i++) {
            if (
                tx >= icon_pos[i][0] && ty >= icon_pos[i][1] &&
                tx <= icon_pos[i][2] && ty <= icon_pos[i][3]
            ) {
                if (i === 0 && this.playground.character === "game") {
                    this.click_next_level_button();
                    return true;
                }
            }
        }
        return false;
    }

    click_next_level_button() {
        this.playground.game_map.time_left = 0;
    }

    test_draw_minerable() {
        while (this.playground.miners && this.playground.miners.length > 0) {
            this.playground.miners[0].destroy();
        }

        if (!this.playground.players || this.playground.players.length === 0) {
            return false;
        }

        let player = this.playground.players[0];
        let slots = this.get_accessible_mineral_slots(player);
        let shuffled_names = this.shuffle_array(this.MINERS_NAME);

        for (let i = 0; i < slots.length; i++) {
            let slot = slots[i];
            let mineral_name = shuffled_names[i % shuffled_names.length];
            let x = player.x + Math.sin(slot.angle) * slot.length;
            let y = player.y + Math.cos(slot.angle) * slot.length;
            this.playground.miners.push(new Mineral(this.playground, x, y, mineral_name, this.MINERS[mineral_name]));
        }
    }

    get_accessible_mineral_slots(player) {
        let base_angles = [-0.82, -0.60, -0.38, -0.16, 0.16, 0.38, 0.60, 0.82];
        let base_lengths = [0.34, 0.46, 0.58, 0.40, 0.40, 0.58, 0.46, 0.34];
        let slots = [];

        for (let i = 0; i < base_angles.length; i++) {
            slots.push({
                angle: player.hook.max_angle * base_angles[i],
                length: base_lengths[i],
            });
        }

        return this.shuffle_array(slots);
    }

    shuffle_array(array) {
        let result = array.slice();
        for (let i = result.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let tmp = result[i];
            result[i] = result[j];
            result[j] = tmp;
        }
        return result;
    }

    is_create_collision(random_x, random_y, random_length, min_length, mineral_name) {
        if (!random_x || !random_y || random_x === 0 || random_y === 0) {
            return false;
        }

        if (random_length <= min_length) {
            return false;
        }

        let random_mineral_radius = this.MINERS[mineral_name][3];
        let label_safe_gap = 0.05;
        for (let mineral of this.playground.miners) {
            if (this.get_dist(mineral.x, mineral.y, random_x, random_y) - (mineral.radius + random_mineral_radius + label_safe_gap) <= this.eps) {
                return false;
            }
        }

        return true;
    }

    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    update() {
        if (!this.is_start && this.is_all_images_loaded()) {
            this.is_start = true;
            this.render();
        }
    }

    is_all_images_loaded() {
        for (let img of this.images) {
            if (!img.is_load) {
                return false;
            }
        }
        return true;
    }

    load_image() {
        this.groundtile = new Image();
        this.groundtile.src = "/static/image/playground/groundtile.png";
        this.purpletile = new Image();
        this.purpletile.src = "/static/image/playground/purpletile.png";
        this.bgtile3 = new Image();
        this.bgtile3.src = "/static/image/playground/bgtile3.png";
        this.bgtile2 = new Image();
        this.bgtile2.src = "/static/image/playground/bgtile2.png";
        this.bgtile1 = new Image();
        this.bgtile1.src = "/static/image/playground/bgtile1.png";
        this.bgtile4 = new Image();
        this.bgtile4.src = "/static/image/playground/bgtile4.png";
        this.gametopbg = new Image();
        this.gametopbg.src = "/static/image/playground/gametopbg.png";
        this.uisymbols_sheet0 = new Image();
        this.uisymbols_sheet0.src = "/static/image/playground/uisymbols-sheet0.png";
        this.gamepatch = new Image();
        this.gamepatch.src = "/static/image/playground/gamepatch.png";
        this.miner_roll_sheet0 = new Image();
        this.miner_roll_sheet0.src = "/static/image/playground/miner_miner_roll-sheet0.png";
        this.next_level_button = new Image();
        this.next_level_button.src = "/static/image/playground/pausebuttons-sheet2.png";

        this.gold_1 = new Image();
        this.gold_1.src = "/static/image/playground/g1-sheet0.png";
        this.gold_2 = new Image();
        this.gold_2.src = "/static/image/playground/g2-sheet0.png";
        this.gold_3 = new Image();
        this.gold_3.src = "/static/image/playground/g3-sheet0.png";
        this.gold_4 = new Image();
        this.gold_4.src = "/static/image/playground/g4-sheet0.png";
        this.rock_1 = new Image();
        this.rock_1.src = "/static/image/playground/r1-sheet0.png";
        this.rock_2 = new Image();
        this.rock_2.src = "/static/image/playground/r2-sheet0.png";
        this.bone = new Image();
        this.bone.src = "/static/image/playground/bone-sheet0.png";
        this.skull = new Image();
        this.skull.src = "/static/image/playground/skull-sheet0.png";
        this.diamond = new Image();
        this.diamond.src = "/static/image/playground/diamond-sheet0.png";
        this.tnt = new Image();
        this.tnt.src = "/static/image/playground/tnt-sheet0.png";
        this.bag = new Image();
        this.bag.src = "/static/image/playground/bag-sheet0.png";

        this.images = [
            this.groundtile, this.purpletile, this.bgtile1, this.bgtile2,
            this.bgtile3, this.bgtile4, this.gametopbg, this.uisymbols_sheet0,
            this.gamepatch, this.miner_roll_sheet0, this.next_level_button,
            this.gold_1, this.gold_2, this.gold_3, this.gold_4, this.rock_1, this.rock_2,
            this.bone, this.skull, this.diamond, this.tnt, this.bag,
        ];
    }

    add_POS() {
        let rad = Math.PI / 180;

        this.POS = new Array();
        this.POS["money"] = [0, 0, 64, 48, 100, 30, 5];
        this.POS["target"] = [65, 0, 50, 50, 100, 110, 5];
        this.POS["level"] = [0, 49, 51, 51, 840, 30, 3];
        this.POS["timer"] = [52, 50, 46, 55, 840, 110, 3];
        this.POS["gamepatch_head"] = [0, 0, 14, 64];
        this.POS["gamepatch_item"] = [15, 0, 39, 64];
        this.POS["gamepatch_tile"] = [56, 0, 14, 64];
        this.POS["game_backgorund_button"] = [
            [1.23, 0.06, 1.32, 0.16],
        ];

        this.MINERS = new Array();
        this.MINERS["gold_1"] = [this.gold_1, 30, 0 * rad, 0.014 / this.base_scale * 920, 500];
        this.MINERS["gold_2"] = [this.gold_2, 100, 0 * rad, 0.029 / this.base_scale * 920, 750];
        this.MINERS["gold_3"] = [this.gold_3, 250, 0 * rad, 0.06 / this.base_scale * 920, 800];
        this.MINERS["gold_4"] = [this.gold_4, 500, 0 * rad, 0.076 / this.base_scale * 920, 900];
        this.MINERS["rock_1"] = [this.rock_1, 11, 0 * rad, 0.03 / this.base_scale * 920, 800];
        this.MINERS["rock_2"] = [this.rock_2, 20, 0 * rad, 0.033 / this.base_scale * 920, 940];
        this.MINERS["bone"] = [this.bone, 7, 0 * rad, 0.024 / this.base_scale * 920, 300];
        this.MINERS["skull"] = [this.skull, 20, 0 * rad, 0.024 / this.base_scale * 920, 400];
        this.MINERS["diamond"] = [this.diamond, 500, 0 * rad, 0.016 / this.base_scale * 920, 500];
        this.MINERS["tnt"] = [this.tnt, 1, 0 * rad, 0.04 / this.base_scale * 920, 1];
        this.MINERS["bag"] = [this.bag, 114, 0 * rad, 0.032 / this.base_scale * 920, 300];

        this.MINERS_NAME = new Array();
        for (let miner in this.MINERS) {
            this.MINERS_NAME.push(miner);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        let canvas = {
            width: this.ctx.canvas.width,
            height: this.ctx.canvas.height,
            scale: this.ctx.canvas.height / 820,
        };

        this.draw_sky_ground(canvas);
        this.draw_dirt_color(canvas);
        this.draw_bg_tile(canvas);
        this.draw_ground_tile(canvas);
        this.draw_miner_roll(canvas, this.miner_roll_sheet0);
        this.draw_scoreboard_background(canvas);
        this.draw_all_minerals();
        this.draw_next_level_button(canvas);
        this.render_player_skill();
    }

    draw_next_level_button(canvas) {
        let img = this.next_level_button;
        this.ctx.drawImage(
            img, 0, 0, img.width, img.height,
            canvas.scale * 1000,
            canvas.scale * 48,
            canvas.scale * img.width * 0.6,
            canvas.scale * img.height * 0.6
        );
    }

    render_player_skill() {
        this.render_player_skill_bomb();
    }

    render_player_skill_bomb() {
        if (this.playground.players) {
            for (let player of this.playground.players) {
                if (player.bomb) {
                    player.bomb.render();
                }
            }
        }
    }

    draw_all_minerals() {
        if (this.playground.miners) {
            for (let miner of this.playground.miners) {
                miner.early_render();
            }
            for (let miner of this.playground.miners) {
                miner.render();
            }
        }
    }

    draw_scoreboard_background(canvas) {
        this.draw_scoreboard_background_item(canvas, this.POS["money"]);
        this.draw_scoreboard_background_item(canvas, this.POS["target"]);
        this.draw_scoreboard_background_item(canvas, this.POS["level"]);
        this.draw_scoreboard_background_item(canvas, this.POS["timer"]);
    }

    draw_miner_roll(canvas, img) {
        let scale = this.playground.scale;
        if (this.playground.players && this.playground.players.length > 0) {
            for (let player of this.playground.players) {
                player.render();
                this.ctx.drawImage(
                    img, 0, 0, img.width, img.height,
                    player.x * scale - img.width / 2 * canvas.scale,
                    player.y * scale - img.height / 2 * canvas.scale,
                    img.width * canvas.scale, img.height * canvas.scale
                );
            }
        }
    }

    draw_scoreboard_background_item(canvas, icon_pos) {
        this.ctx.drawImage(
            this.uisymbols_sheet0, icon_pos[0], icon_pos[1], icon_pos[2], icon_pos[3],
            canvas.scale * (icon_pos[4] - icon_pos[2]), canvas.scale * icon_pos[5],
            icon_pos[2] * canvas.scale, icon_pos[3] * canvas.scale
        );
        this.draw_scoreboard_background_number_slot(canvas, icon_pos[6], icon_pos);
    }

    draw_scoreboard_background_number_slot(canvas, number, icon_pos) {
        let spacing = 10;

        let patch_head = this.POS["gamepatch_head"];
        this.ctx.drawImage(
            this.gamepatch, patch_head[0], patch_head[1],
            patch_head[2], patch_head[3],
            canvas.scale * icon_pos[4] + canvas.scale * spacing,
            canvas.scale * icon_pos[5] - canvas.scale * 5,
            patch_head[2] * canvas.scale,
            patch_head[3] * canvas.scale
        );

        let patch_item = this.POS["gamepatch_item"];
        for (let i = 0; i < number; i++) {
            this.ctx.drawImage(
                this.gamepatch, patch_item[0], patch_item[1],
                patch_item[2], patch_item[3],
                canvas.scale * icon_pos[4] + canvas.scale * (spacing + patch_head[2] + patch_item[2] * i),
                canvas.scale * icon_pos[5] - canvas.scale * 5,
                patch_item[2] * canvas.scale,
                patch_item[3] * canvas.scale
            );
        }

        let patch_tile = this.POS["gamepatch_tile"];
        this.ctx.drawImage(
            this.gamepatch, patch_tile[0], patch_tile[1],
            patch_tile[2], patch_tile[3],
            canvas.scale * icon_pos[4] + canvas.scale * (spacing + patch_head[2] + patch_item[2] * number),
            canvas.scale * icon_pos[5] - canvas.scale * 5,
            patch_tile[2] * canvas.scale,
            patch_tile[3] * canvas.scale
        );
    }

    draw_bg_tile(canvas) {
        for (let i = 0; i < 3; i++) {
            this.ctx.drawImage(
                this.bgtile2, 0, 0, this.bgtile2.width, this.bgtile2.height,
                canvas.width / 3 * i, canvas.height * 0.42,
                canvas.width / 3, canvas.height * 0.12
            );
        }

        for (let i = 0; i < 3; i++) {
            this.ctx.drawImage(
                this.bgtile1, 0, 0, this.bgtile1.width, this.bgtile1.height,
                canvas.width / 3 * i, canvas.height * 0.58,
                canvas.width / 3, canvas.height * 0.1
            );
        }

        for (let i = 0; i < 3; i++) {
            this.ctx.drawImage(
                this.bgtile3, 0, 0, this.bgtile3.width, this.bgtile3.height,
                canvas.width / 3 * i, canvas.height * 0.70,
                canvas.width / 3, canvas.height * 0.1
            );
        }

        let num = 6;
        for (let i = 0; i < num; i++) {
            this.ctx.drawImage(
                this.bgtile4, 0, 0, this.bgtile4.width, this.bgtile4.height,
                canvas.width / num * i, canvas.height * 0.8,
                canvas.width / num, canvas.height * 0.2
            );
        }
    }

    draw_ground_tile(canvas) {
        for (let i = 0; i < 3; i++) {
            this.ctx.drawImage(
                this.groundtile, 0, 0, this.groundtile.width, this.groundtile.height,
                canvas.width / 3 * i, canvas.height * 0.28,
                canvas.width / 3, canvas.height * 0.058
            );
        }
    }

    draw_dirt_color(canvas) {
        this.ctx.fillStyle = "rgb(86,52,37)";
        this.ctx.fillRect(0, canvas.height * 0.30, canvas.width, canvas.height);
    }

    draw_sky_ground(canvas) {
        let num = 8;
        for (let i = 0; i < num; i++) {
            this.ctx.drawImage(
                this.purpletile, 0, 0, this.purpletile.width, this.purpletile.height,
                canvas.width / num * i, canvas.height * 0,
                canvas.width / num, canvas.height * 0.30
            );
        }

        num = 3;
        for (let i = 0; i < num; i++) {
            this.ctx.drawImage(
                this.gametopbg, 0, 0, this.gametopbg.width, this.gametopbg.height,
                canvas.width / num * i, canvas.height * 0.13,
                canvas.width / num, canvas.height * 0.159
            );
        }
    }
}
