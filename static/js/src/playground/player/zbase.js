import { AcGameObject } from "/static/js/src/playground/ac_game_objects/zbase.js";
import { Hook } from "/static/js/src/playground/hook/zbase.js";
import { Bomb } from "/static/js/src/playground/skill/bomb.js";
import { Explode } from "/static/js/src/playground/skill/explode.js";

export class Player extends AcGameObject {
    constructor(playground, x, y, radius, character, username, photo) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.game_background = this.playground.game_map.game_background;
        this.shop = this.playground.game_map.shop;
        this.pop_up = this.playground.game_map.pop_up;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.character = character;
        this.username = username;
        this.photo = photo;

        this.photo_x = this.x + this.radius * 2;
        this.photo_y = this.y - this.radius * 0.5;
        this.money = 0;

        this.img = new Image();
        this.img.src = this.photo;
        this.bomb = new Bomb(this.playground, this);
        this.hook = new Hook(this.playground, this, this.playground.game_map.score_number);
    }

    start() {
        this.add_listening_events();
    }

    create_uuid() {
        let res = "";
        for (let i = 0; i < 8; i++) {
            let x = parseInt(Math.floor(Math.random() * 10));
            res += x;
        }
        return res;
    }

    add_listening_events() {
        if (this.playground.operator === "pc") {
            this.add_pc_listening_events(this.playground.game_map.$score_number_canvas);
            this.add_pc_listening_events(this.playground.game_map.$pop_up_canvas);
        } else {
            this.add_phone_listening_events();
        }
    }

    add_phone_listening_events() {
    }

    add_pc_listening_events(focus_canvas) {
        let outer = this;

        this.playground.game_map.$canvas.on("contextmenu", function () {
            return false;
        });

        focus_canvas.mousedown(function (e) {
            const rect = outer.ctx.canvas.getBoundingClientRect();
            let tx = (e.clientX - rect.left) / outer.playground.scale;
            let ty = (e.clientY - rect.top) / outer.playground.scale;
            if (e.which === 1) {
                if (outer.playground.character === "shop") {
                    outer.shop.click_skill(tx, ty);
                } else if (outer.playground.character === "pop up") {
                    outer.pop_up.click_button(tx, ty);
                } else if (outer.playground.character === "game") {
                    let is_click_button = outer.game_background.click_button(tx, ty);
                    if (!is_click_button) {
                        outer.hook.tick();
                    }
                }
            }
        });

        focus_canvas.keydown(function (e) {
            if (e.which === 38) {
                outer.use_bomb();
                return false;
            } else if (e.which === 13) {
                if (outer.playground.character === "shop") {
                    outer.shop.use_item_control_player_behavior_in_shop(5);
                } else if (outer.playground.character === "pop up") {
                    outer.pop_up.player_click_start_game_button();
                } else if (outer.playground.character === "game") {
                    outer.game_background.click_next_level_button();
                }
            } else if (e.which >= 49 && e.which <= 53) {
                outer.shop.use_item_control_player_behavior_in_shop(e.which - 49);
            }

            return true;
        });
    }

    use_bomb() {
        if (this.bomb.number <= 0 || !this.hook.catched) {
            return false;
        }

        this.hook.discard_caught_mineral_by_bomb();
        this.bomb.number -= 1;
        this.game_background.render();
        this.draw_explode_gif();
        return true;
    }

    draw_explode_gif() {
        new Explode(this.playground, this.hook.x, this.hook.y);
    }

    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    update() {
        this.render();
    }

    render() {
        let scale = this.playground.scale;

        if (this.img) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.photo_x * scale, this.photo_y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.photo_x - this.radius) * scale, (this.photo_y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale);
            this.ctx.restore();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(this.photo_x * scale, this.photo_y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.fillStyle = "white";
            this.ctx.fill();
        }
    }

    on_destroy() {
        for (let i = 0; i < this.playground.players.length; i++) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
                break;
            }
        }
    }
}
