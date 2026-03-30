import { AcGameObject } from "/static/js/src/playground/ac_game_objects/zbase.js";
import { GameBackground } from "/static/js/src/playground/game_map/game_background/zbase.js";
import { ScoreNumber } from "/static/js/src/playground/game_map/score_number/zbase.js";
import { Shop } from "/static/js/src/playground/game_map/shop/zbase.js";
import { PopUp } from "/static/js/src/playground/game_map/pop_up/zbase.js";

export class GameMap extends AcGameObject {
    constructor(root, playground) {
        super();
        this.root = root;
        this.playground = playground;
        this.last_time_left = 0;
        this.time_left = 60000;

        this.$canvasDiv = $(`<div id="canvasDiv" class="canvasDiv"></div>`);
        this.$background_canvas = $(`<canvas></canvas>`);
        this.$score_number_canvas = $(`<canvas tabindex=0></canvas>`);
        this.$shop_canvas = $(`<canvas></canvas>`);
        this.$pop_up_canvas = $(`<canvas tabindex=0></canvas>`);
        this.$canvas = $(`<canvas></canvas>`);

        this.game_background_ctx = this.$background_canvas[0].getContext('2d');
        this.game_score_number_ctx = this.$score_number_canvas[0].getContext('2d');
        this.game_shop_ctx = this.$shop_canvas[0].getContext('2d');
        this.$pop_up_ctx = this.$pop_up_canvas[0].getContext('2d');
        this.ctx = this.$canvas[0].getContext('2d');

        this.game_background = new GameBackground(this.playground, this.game_background_ctx);
        this.score_number = new ScoreNumber(this.playground, this.game_score_number_ctx, "game map");
        this.shop = new Shop(this.playground, this.game_shop_ctx);
        this.pop_up = new PopUp(this.playground, this.$pop_up_ctx);

        this.initScreen();
    }

    start() {
        this.$score_number_canvas.focus();
        this.add_listening_events(this.playground.game_map.$score_number_canvas);
        this.start_new_level();
    }

    restart() {
        this.playground.character = "pop up";
        this.playground.players[0].money = 0;
        this.playground.set_wordbook_selection_enabled(true);
        this.playground.clear_round_feedback(false);
        this.score_number.restart();
        this.pop_up.score_number.restart();
        this.start_new_level();
    }

    initScreen() {
        this.$canvasDiv.css({ "width": `${this.playground.width}px` });
        this.$canvasDiv.css({ "height": `${this.playground.height}px` });
        this.$canvasDiv.css({ "background-color": "lightgreed" });
        this.$canvasDiv.css({ "margin": "auto" });

        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;

        this.$canvasDiv.append(this.$background_canvas);
        this.$canvasDiv.append(this.$canvas);
        this.$canvasDiv.append(this.$shop_canvas);
        this.$canvasDiv.append(this.$score_number_canvas);
        this.$canvasDiv.append(this.$pop_up_canvas);

        this.playground.$playground.append(this.$canvasDiv);
    }

    start_new_level() {
        this.time_left = 60000;
        this.last_time_left = this.time_left;
        this.score_number.time_left = Math.ceil(this.time_left / 1000);
        this.pop_up.start_new_pop_up("game");
        this.fresh_players_hook();
        this.score_number.start_new_level();
        this.pop_up.score_number.start_new_level();
    }

    fresh_players_hook() {
        if (this.playground.players) {
            for (let player of this.playground.players) {
                if (player.hook) {
                    player.hook.fresh();
                }
            }
        }
    }

    add_listening_events(focus_canvas) {
        focus_canvas.on("contextmenu", function () {
            return false;
        });
    }

    resize() {
        this.$canvasDiv.css({ "width": `${this.playground.width}px` });
        this.$canvasDiv.css({ "height": `${this.playground.height}px` });
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        if (this.game_background) this.game_background.resize();
        if (this.score_number) this.score_number.resize();
        if (this.pop_up) this.pop_up.resize();
        if (this.shop) this.shop.resize();
    }

    update() {
        if (this.playground.character === "game") {
            this.update_time_left();
        }
        this.render();
    }

    update_time_left() {
        if (this.timedelta / 1000 > 1 / 50) {
            return false;
        }
        this.time_left -= this.timedelta;

        if (Math.abs(this.time_left - this.last_time_left) >= 1000) {
            this.score_number.time_left = Math.ceil(this.time_left / 1000);
            this.score_number.render();
            this.last_time_left = this.time_left;
        }

        if (this.time_left < 0) {
            this.time_left = 0;
            this.playground.character = "pop up";
            if (this.playground.players[0].money >= this.score_number.target_number) {
                this.pop_up.start_new_pop_up("success");
                this.playground.audio_success.play();
            } else {
                this.pop_up.start_new_pop_up("fail");
                this.playground.audio_fail.play();
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}
