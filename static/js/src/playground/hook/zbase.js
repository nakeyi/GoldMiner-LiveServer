import { AcGameObject } from "/static/js/src/playground/ac_game_objects/zbase.js";

export class Hook extends AcGameObject {
    constructor(playground, player, score_number) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.player = player;
        this.score_number = score_number;

        this.x = null;
        this.y = null;
        this.radius = 0.019;
        this.angle = 0;
        this.max_angle = Math.PI * 7 / 18;

        this.direction_flag = 1;
        this.caught_item = "hook";
        this.direction_tmp = 0;
        this.direction = Math.PI / 2 * (this.timedelta / 1000);
        this.min_tile_length = 0.1;
        this.max_tile_length = 0.7;
        this.tile_length = this.min_tile_length;
        this.base_moved = 0.009;
        this.moved = 0;
        this.catched = false;
        this.catched_money = 0;
        this.money = 0;
        this.is_start = false;
        this.play_machine_audio_frequency = 200;

        this.caughtMineral = null;
        this.caughtMineralSnapshot = null;
        this.isAnswerCorrect = false;

        this.base_scale = this.playground.base_scale;
        this.eps = 0.01;
    }

    start() {
        this.load_image();
        this.add_POS();

        for (let img of this.images) {
            img.onload = function () {
                img.is_load = true;
            };
        }
    }

    tick() {
        if (this.direction_flag > 2 || this.playground.character !== "game") {
            return false;
        }
        this.direction_tmp = this.direction_flag;
        this.direction_flag = 3;
        this.moved = this.base_moved;
        this.time_left = 0;
        this.last_time_left = 0;
    }

    fresh() {
        if (this.caughtMineral && this.caughtMineral.isBeingCarried) {
            this.caughtMineral.restore_position();
        }
        this.direction_flag = 1;
        this.caught_item = "hook";
        this.tile_length = this.min_tile_length;
        this.catched = false;
        this.catched_money = 0;
        this.caughtMineral = null;
        this.caughtMineralSnapshot = null;
        this.isAnswerCorrect = false;
    }

    update() {
        if (this.playground.character !== "game") {
            return false;
        }

        this.update_tile_length();
        this.update_angle();
        this.update_position();
        this.update_catch();
    }

    late_update() {
        if (!this.is_start && this.is_all_images_loaded()) {
            this.is_start = true;
        } else {
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

    update_catch() {
        if (this.direction_flag !== 3 || this.catched) {
            return false;
        }

        for (let i = 0; i < this.playground.miners.length; i++) {
            let miner = this.playground.miners[i];
            if (miner.isBeingCarried) {
                continue;
            }
            if (this.is_collision(miner)) {
                this.catched = true;
                this.caughtMineral = miner;
                return miner;
            }
        }
        return false;
    }

    add_money() {
        this.player.money += this.catched_money;
        this.score_number.render();
    }

    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    is_collision(miner) {
        let distance = this.get_dist(this.x, this.y, miner.x, miner.y);
        if (distance < this.radius + miner.radius) {
            return true;
        }
        return false;
    }

    get_caught_item_name(miner_name) {
        if (miner_name === "tnt") {
            return "hook_tnt_fragment";
        }
        return "hook_" + miner_name;
    }

    capture_mineral_for_return() {
        if (!this.caughtMineral || this.caughtMineralSnapshot) {
            return false;
        }

        this.caughtMineralSnapshot = {
            uuid: this.caughtMineral.uuid,
            name: this.caughtMineral.name,
            money: this.caughtMineral.money,
            weight: this.caughtMineral.weight,
            caught_item: this.get_caught_item_name(this.caughtMineral.name),
        };
        this.caught_item = this.caughtMineralSnapshot.caught_item;
        this.caughtMineral.set_being_carried(true);
        this.isAnswerCorrect = this.playground.is_target_mineral(this.caughtMineral);
        this.catched_money = this.isAnswerCorrect ? this.caughtMineralSnapshot.money : 0;
        this.moved = this.base_moved * ((Math.abs(1000 - this.caughtMineralSnapshot.weight)) / 1000);
        this.playground.game_map.game_background.render();
        return true;
    }

    reset_caught_state() {
        this.caught_item = "hook";
        this.catched = false;
        this.catched_money = 0;
        this.caughtMineral = null;
        this.caughtMineralSnapshot = null;
        this.isAnswerCorrect = false;
    }

    resolve_caught_mineral() {
        if (!this.caughtMineralSnapshot) {
            this.reset_caught_state();
            return false;
        }

        let reward = 0;
        let caught_mineral = this.caughtMineral;
        let snapshot = this.caughtMineralSnapshot;
        let is_answer_correct = this.isAnswerCorrect;

        if (is_answer_correct) {
            reward = snapshot.money;
            if (caught_mineral) {
                if (snapshot.name === "tnt") {
                    caught_mineral.explode_tnt();
                } else {
                    caught_mineral.destroy();
                    this.play_mineral_caught_audio(snapshot.name);
                }
            }
            this.catched_money = reward;
            this.add_money();
            this.playground.audio_point.play();
        } else if (caught_mineral) {
            caught_mineral.restore_position();
        }

        this.reset_caught_state();
        this.playground.finish_word_round({
            correct: is_answer_correct,
            reward: reward,
        });
        return true;
    }

    discard_caught_mineral_by_bomb() {
        if (!this.caughtMineral) {
            return false;
        }

        if (this.caughtMineral.isBeingCarried) {
            this.caughtMineral.set_being_carried(false);
        }
        this.caughtMineral.destroy();
        this.direction_flag = 4;
        this.moved = this.base_moved * 2;
        this.reset_caught_state();
        this.playground.finish_word_round({
            skipFeedback: true,
        });
        return true;
    }

    update_tile_length() {
        if (this.direction_flag === 3) {
            this.tile_length += this.moved;
        } else if (this.direction_flag === 4) {
            this.tile_length -= this.moved;
        }

        if (this.direction_flag === 3 && (this.catched || Math.abs(this.max_tile_length - this.tile_length) < this.eps)) {
            this.direction_flag = 4;
            if (this.catched) {
                this.capture_mineral_for_return();
            } else {
                this.moved = this.base_moved * 2;
            }
        }

        if (this.direction_flag === 4 && Math.abs(this.tile_length - this.min_tile_length) < this.eps) {
            this.tile_length = this.min_tile_length;
            this.direction_flag = this.direction_tmp;
            if (this.catched) {
                this.resolve_caught_mineral();
            }
        }
    }

    play_mineral_caught_audio(name) {
        if (name === "gold_1" || name === "gold_2" || name === "gold_3") {
            this.playground.audio_good.play();
        } else if (name === "gold_4" || name === "diamond") {
            this.playground.audio_great.play();
        } else if (name === "bag") {
            this.playground.audio_bag.play();
        } else {
            this.playground.audio_low.play();
        }
    }

    update_angle() {
        if (this.timedelta / 1000 > 1 / 50) {
            return false;
        }

        this.direction = this.max_angle * (this.timedelta / 1000);

        if (this.direction_flag === 1) {
            this.angle -= this.direction;
        } else if (this.direction_flag === 2) {
            this.angle += this.direction;
        }

        if (this.angle < -this.max_angle) {
            this.direction_flag = 2;
        } else if (this.angle > this.max_angle) {
            this.direction_flag = 1;
        }
    }

    update_position() {
        this.x = this.player.x + Math.sin(this.angle) * this.tile_length;
        this.y = this.player.y + Math.cos(this.angle) * this.tile_length;
    }

    load_image() {
        this.hook_sheet1 = new Image();
        this.hook_sheet1.src = "/static/image/playground/hook-sheet1.png";

        this.hook_sheet0 = new Image();
        this.hook_sheet0.src = "/static/image/playground/hook-sheet0.png";

        this.ropetile = new Image();
        this.ropetile.src = "/static/image/playground/ropetile.png";

        this.images = [
            this.hook_sheet1, this.hook_sheet0, this.ropetile,
        ];
    }

    add_POS() {
        let rad = Math.PI / 180;

        this.POS = new Array();
        this.POS["hook"] = [139, 66, 53, 36, 0 * rad, this.hook_sheet1, 0];
        this.POS["hook_gold_3"] = [0, 0, 133, 128, 2 * rad, this.hook_sheet1, 250];
        this.POS["hook_gold_1"] = [201, 113, 44, 50, 4 * rad, this.hook_sheet1, 30];
        this.POS["hook_skull"] = [145, 0, 58, 66, 4 * rad, this.hook_sheet1, 20];
        this.POS["hook_bone"] = [142, 112, 61, 43, 4 * rad, this.hook_sheet1, 7];
        this.POS["hook_pig"] = [200, 58, 51, 55, 4 * rad, this.hook_sheet1, 2];
        this.POS["hook_pig_diamond"] = [199, 0, 53, 57, -2 * rad, this.hook_sheet1, 502];

        this.POS["hook_gold_4"] = [0, 0, 154, 158, 4 * rad, this.hook_sheet0, 500];
        this.POS["hook_gold_2"] = [146, 168, 64, 71, 4 * rad, this.hook_sheet0, 100];
        this.POS["hook_rock_1"] = [71, 157, 71, 74, 4 * rad, this.hook_sheet0, 11];
        this.POS["hook_rock_2"] = [164, 80, 74, 87, 4 * rad, this.hook_sheet0, 20];
        this.POS["hook_diamond"] = [210, 168, 48, 57, 4 * rad, this.hook_sheet0, 500];
        this.POS["hook_bag"] = [2, 159, 69, 85, 4 * rad, this.hook_sheet0, 111];
        this.POS["hook_tnt_fragment"] = [170, 0, 79, 81, 4 * rad, this.hook_sheet0, 1];

        this.caught_item = "hook";
    }

    render() {
        let scale = this.playground.scale;
        let canvas = {
            width: this.ctx.canvas.width,
            height: this.ctx.canvas.height,
            scale: this.ctx.canvas.height / this.base_scale,
        };
        let icon_pos = this.POS[this.caught_item];
        this.draw_tile_use_tile_length(canvas, scale, icon_pos);
    }

    draw_tile_use_tile_length(canvas, scale, icon_pos) {
        let num = Math.ceil(this.tile_length / this.min_tile_length * 24.5);
        this.draw_tile(canvas, scale, this.angle + 17.76 * Math.PI / 180, num);
        this.draw_hook_image(canvas, scale, icon_pos);
    }

    draw_collision_volume(scale) {
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = "blue";
        this.ctx.fill();
    }

    draw_tile(canvas, scale, angle, num) {
        this.ctx.save();
        this.ctx.translate(
            this.player.x * scale - (this.ropetile.width + 5) / 2 * canvas.scale,
            this.player.y * scale
        );
        this.ctx.rotate(-angle);
        for (let i = 1; i < num; i++) {
            this.ctx.drawImage(
                this.ropetile, 0, 0, this.ropetile.width, this.ropetile.height,
                -this.ropetile.height * Math.sin(20 * Math.PI / 180) * canvas.scale * i,
                this.ropetile.height / Math.cos(20 * Math.PI / 180) * canvas.scale * i,
                this.ropetile.width * canvas.scale,
                this.ropetile.height * canvas.scale
            );
        }
        this.ctx.restore();
    }

    draw_hook_image(canvas, scale, icon_pos) {
        this.ctx.save();
        this.ctx.translate(this.x * scale, this.y * scale);
        this.ctx.rotate(-this.angle - icon_pos[4]);
        this.ctx.drawImage(
            icon_pos[5], icon_pos[0], icon_pos[1], icon_pos[2], icon_pos[3],
            -icon_pos[2] / 2 * canvas.scale,
            -this.radius * scale,
            icon_pos[2] * canvas.scale,
            icon_pos[3] * canvas.scale
        );
        this.ctx.restore();
    }
}
