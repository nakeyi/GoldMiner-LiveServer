import { AcGameObject } from "/static/js/src/playground/ac_game_objects/zbase.js";

export class ScoreNumber extends AcGameObject {
    constructor(playground, ctx, root_name) {
        super();
        this.playground = playground;
        this.ctx = ctx;
        this.root_name = root_name;
        this.is_start = false;
        this.time = 0;
        this.images = [];

        this.increment_target_number = 275;
        this.target_number = 375;
        this.level_number = 0;

        this.time_left = 60;
        this.shop_bomb_number = 0;
        this.numbers = [];

        this.add_POS();
        this.load_image();
    }

    start() {
        this.resize();
        this.get_player_money_number();

        for (let img of this.images) {
            img.onload = function () {
                img.is_load = true;
            };
        }
    }

    restart() {
        this.increment_target_number = 275;
        this.target_number = 375;
        this.level_number = 0;
    }

    start_new_level() {
        this.level_number += 1;
        this.update_target_number();
        this.render();
    }

    update_target_number() {
        this.target_number += this.increment_target_number;
        if (this.level_number < 10) {
            this.increment_target_number += 270;
        }
    }

    add_POS() {
        this.POS = new Array();
        this.POS["digital"] = [
            [0, 0, 30, 50], [30, 0, 25, 50], [60, 0, 30, 50], [90, 0, 30, 50],
            [2, 50, 28, 50], [30, 50, 30, 50], [60, 50, 30, 50], [90, 50, 30, 50],
            [0, 102, 30, 50], [30, 102, 30, 50], [60, 100, 30, 50],
        ];

        this.POS["money"] = [100, 30, 1];
        this.POS["target"] = [100, 110, 1];
        this.POS["level"] = [840, 30, 1];
        this.POS["timer"] = [840, 110, 1];

        this.POS["shop_money"] = [650, 30, 0.6];
        this.POS["shop_bomb"] = [365, 30, 0.6];
        this.POS["shop_level"] = [100, 30, 0.6];
        this.POS["shop_skill_price"] = [
            [515, 610, 0.6],
            [870, 610, 0.6],
            [1230, 610, 0.6],
            [690, 983, 0.6],
            [1045, 983, 0.6],
        ];

        this.POS["pop_up_money"] = [710, 395, 0.6];
        this.POS["pop_up_target"] = [710, 497, 0.6];
    }

    load_image() {
        this.topfont = new Image();
        this.topfont.src = "/static/image/playground/topfont.png";
        this.gamefontgreen = new Image();
        this.gamefontgreen.src = "/static/image/playground/gamefontgreen.png";

        this.images = [
            this.topfont, this.gamefontgreen,
        ];
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

    resize() {
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.render();
    }

    player_buy_skill(skill_number) {
        let shop = this.playground.game_map.shop;
        let skill_price = shop.shop_skill_price;
        if (this.shop_money_number < skill_price[skill_number]) {
            return false;
        }
        if (skill_number === 0) {
            this.shop_bomb_number += 1;
            this.set_player_bomb_number();
        }
        this.shop_money_number -= skill_price[skill_number];
        this.set_player_money_number();
        this.render();
        return true;
    }

    set_player_bomb_number() {
        this.playground.players[0].bomb.number = this.shop_bomb_number;
    }

    get_player_bomb_number() {
        if (!this.playground.players) {
            this.shop_bomb_number = 0;
        } else {
            this.shop_bomb_number = this.playground.players[0].bomb.number;
        }
    }

    set_player_money_number() {
        this.playground.players[0].money = this.shop_money_number;
    }

    get_player_money_number() {
        if (!this.playground.players) {
            this.shop_money_number = 0;
        } else {
            this.shop_money_number = this.playground.players[0].money;
        }
    }

    render() {
        this.get_player_money_number();
        this.get_player_bomb_number();
        let canvas = {
            width: this.ctx.canvas.width,
            height: this.ctx.canvas.height,
            scale: this.ctx.canvas.height / 820,
        };

        if (this.root_name === "pop up") {
            return false;
        } else {
            this.ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (this.playground.character === "shop") {
                this.render_shop_score_number(canvas);
            } else {
                this.render_game_score_number(canvas);
            }
        }
    }

    render_pop_up_score_number(canvas) {
        this.get_numbers(this.shop_money_number);
        this.draw_numbers(canvas, this.POS["pop_up_money"], 0);
        this.get_numbers(this.target_number);
        this.draw_numbers(canvas, this.POS["pop_up_target"], 0);
    }

    render_shop_score_number(canvas) {
        this.get_numbers(this.shop_money_number);
        this.draw_numbers(canvas, this.POS["shop_money"], 10);
        this.get_numbers(this.shop_bomb_number);
        this.draw_numbers(canvas, this.POS["shop_bomb"], 10);
        this.get_numbers(this.level_number);
        this.draw_numbers(canvas, this.POS["shop_level"], 10);
        this.render_shop_skill_price(canvas);
    }

    render_shop_skill_price(canvas) {
        let shop = this.playground.game_map.shop;
        let skill_is_selling = shop.shop_skill_is_selling;
        let skill_price = shop.shop_skill_price;
        for (let i = 0; i < 5; i++) {
            if (skill_is_selling[i]) {
                this.get_numbers(skill_price[i]);
                this.draw_numbers(canvas, this.POS["shop_skill_price"][i], 0);
            }
        }
    }

    render_game_score_number(canvas) {
        this.get_numbers(this.shop_money_number);
        this.draw_numbers(canvas, this.POS["money"], 10);
        this.get_numbers(this.target_number);
        this.draw_numbers(canvas, this.POS["target"], 10);
        this.get_numbers(this.level_number);
        this.draw_numbers(canvas, this.POS["level"], 10);
        this.get_numbers(this.time_left);
        this.draw_numbers(canvas, this.POS["timer"], 10);
        this.render_word_banner(canvas);
    }

    render_word_banner(canvas) {
        let title = "本次单词";
        let prompt_text = this.playground.get_current_prompt_text();
        let book_name = `词书：${this.playground.get_selected_word_book_name()}`;
        let box_x = canvas.scale * 270;
        let box_y = canvas.scale * 15;
        let box_width = canvas.scale * 420;
        let box_height = canvas.scale * 105;

        this.ctx.save();
        this.ctx.fillStyle = "rgba(51, 26, 7, 0.84)";
        this.ctx.fillRect(box_x, box_y, box_width, box_height);
        this.ctx.strokeStyle = "rgba(255, 213, 115, 0.95)";
        this.ctx.lineWidth = 3 * canvas.scale;
        this.ctx.strokeRect(box_x, box_y, box_width, box_height);

        this.ctx.fillStyle = "#ffd271";
        this.ctx.font = `bold ${20 * canvas.scale}px sans-serif`;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(title, box_x + box_width / 2, box_y + 22 * canvas.scale);

        let prompt_font_size = prompt_text.length > 10 ? 26 : 32;
        this.ctx.fillStyle = "#fff8d8";
        this.ctx.font = `bold ${prompt_font_size * canvas.scale}px sans-serif`;
        this.ctx.fillText(prompt_text, box_x + box_width / 2, box_y + 56 * canvas.scale);

        this.ctx.fillStyle = "#ffd271";
        this.ctx.font = `${16 * canvas.scale}px sans-serif`;
        this.ctx.fillText(book_name, box_x + box_width / 2, box_y + 86 * canvas.scale);

        if (this.playground.roundFeedback) {
            this.ctx.fillStyle = "rgba(20, 11, 4, 0.88)";
            this.ctx.fillRect(box_x, box_y + box_height + 8 * canvas.scale, box_width, 34 * canvas.scale);
            this.ctx.strokeStyle = this.playground.roundFeedbackColor;
            this.ctx.strokeRect(box_x, box_y + box_height + 8 * canvas.scale, box_width, 34 * canvas.scale);
            this.ctx.fillStyle = this.playground.roundFeedbackColor;
            this.ctx.font = `bold ${18 * canvas.scale}px sans-serif`;
            this.ctx.fillText(
                this.playground.roundFeedback,
                box_x + box_width / 2,
                box_y + box_height + 25 * canvas.scale
            );
        }
        this.ctx.restore();
    }

    draw_numbers(canvas, icon_pos, spacing) {
        let img = this.topfont;
        if (icon_pos === this.POS["money"] && this.shop_money_number >= this.target_number) {
            img = this.gamefontgreen;
        }
        for (let num of this.numbers) {
            let num_pos = this.POS["digital"][num];
            this.ctx.drawImage(
                img, num_pos[0], num_pos[1],
                num_pos[2], num_pos[3],
                canvas.scale * icon_pos[2] * (icon_pos[0] + spacing + 12),
                canvas.scale * icon_pos[2] * (icon_pos[1] + 3),
                canvas.scale * icon_pos[2] * num_pos[2],
                canvas.scale * icon_pos[2] * num_pos[3]
            );
            spacing += num_pos[2];
        }
    }

    get_numbers(number) {
        let digits = number.toString().split('');
        this.numbers = digits.map(Number);
    }
}
