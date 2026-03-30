import { AcGameObject } from "/static/js/src/playground/ac_game_objects/zbase.js";
import { Explode } from "/static/js/src/playground/skill/explode.js";

export class Mineral extends AcGameObject {
    constructor(playground, x, y, name, icon_pos) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.game_background.ctx;
        this.x = x;
        this.y = y;
        this.origin_x = x;
        this.origin_y = y;
        this.name = name;
        this.icon_pos = icon_pos;
        this.money = this.icon_pos[1];
        this.radius = this.icon_pos[3];
        this.weight = this.icon_pos[4];

        this.is_catched = false;
        this.isBeingCarried = false;
        this.wordPair = null;
        this.displayLabel = "";
        if (this.name === "tnt") {
            this.tnt_explode_radius = this.radius * 5;
        }

        this.base_scale = this.playground.base_scale;
        this.eps = 0.01;
    }

    start() {
    }

    update() {
    }

    set_word_pair(word_pair, label_language) {
        this.wordPair = word_pair;
        this.displayLabel = word_pair ? word_pair[label_language] : "";
    }

    clear_word_pair() {
        this.wordPair = null;
        this.displayLabel = "";
    }

    set_being_carried(is_being_carried) {
        this.isBeingCarried = is_being_carried;
    }

    restore_position() {
        this.x = this.origin_x;
        this.y = this.origin_y;
        this.isBeingCarried = false;
    }

    early_render() {
        let scale = this.playground.scale;
        // this.draw_collision_volume(scale);
    }

    render() {
        if (this.isBeingCarried) {
            return false;
        }

        let scale = this.playground.scale;
        let canvas = {
            width: this.ctx.canvas.width,
            height: this.ctx.canvas.height,
            scale: this.ctx.canvas.height / this.base_scale,
        };

        this.draw_mineral_img(canvas, scale);
        this.draw_word_label(canvas, scale);
    }

    draw_collision_volume(scale) {
        if (this.name === "tnt") {
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.tnt_explode_radius * scale, 0, Math.PI * 2, false);
            this.ctx.fillStyle = "blue";
            this.ctx.fill();
        }

        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = "red";
        this.ctx.fill();
    }

    draw_mineral_img(canvas, scale) {
        let img = this.icon_pos[0];
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(-this.icon_pos[2]);
        this.ctx.drawImage(
            img, 0, 0, img.width, img.height,
            this.x * scale - img.width / 2 * canvas.scale,
            this.y * scale - img.height / 2 * canvas.scale,
            img.width * canvas.scale,
            img.height * canvas.scale
        );
        this.ctx.restore();
    }

    draw_word_label(canvas, scale) {
        if (!this.displayLabel) {
            return false;
        }

        let center_x = this.x * scale;
        let center_y = this.y * scale - (this.icon_pos[0].height * canvas.scale) / 2 - 22 * canvas.scale;
        let font_size = this.displayLabel.length > 8 ? 18 : 22;

        this.ctx.save();
        this.ctx.font = `bold ${font_size * canvas.scale}px sans-serif`;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        let text_width = this.ctx.measureText(this.displayLabel).width;
        let box_width = Math.max(text_width + 28 * canvas.scale, 80 * canvas.scale);
        let box_height = 32 * canvas.scale;

        this.ctx.fillStyle = "rgba(26, 15, 5, 0.90)";
        this.ctx.fillRect(
            center_x - box_width / 2,
            center_y - box_height / 2,
            box_width,
            box_height
        );

        this.ctx.strokeStyle = "rgba(255, 231, 162, 0.98)";
        this.ctx.lineWidth = 2.5 * canvas.scale;
        this.ctx.strokeRect(
            center_x - box_width / 2,
            center_y - box_height / 2,
            box_width,
            box_height
        );

        this.ctx.fillStyle = "#fffaf0";
        this.ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        this.ctx.shadowBlur = 4 * canvas.scale;
        this.ctx.fillText(this.displayLabel, center_x, center_y);
        this.ctx.restore();
    }

    explode_tnt() {
        new Explode(this.playground, this.x, this.y);

        let tnts = [];
        let will_destroy = [];
        for (let miner of this.playground.miners) {
            if (miner.name === "tnt") {
                if (miner !== this && this.is_will_exploded(miner)) {
                    tnts.push(miner);
                }
                continue;
            } else if (this.is_will_exploded(miner)) {
                will_destroy.push(miner);
            }
        }

        for (let miner of will_destroy) {
            miner.destroy();
        }
        this.destroy();

        for (let tnt of tnts) {
            if (tnt) {
                tnt.explode_tnt();
            }
        }
    }

    is_will_exploded(miner) {
        let distance = this.get_dist(this.x, this.y, miner.x, miner.y);
        if (distance <= this.tnt_explode_radius + miner.radius) {
            return true;
        }
        return false;
    }

    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    on_destroy() {
        for (let i = 0; i < this.playground.miners.length; i++) {
            let miner = this.playground.miners[i];
            if (miner === this) {
                this.playground.miners.splice(i, 1);
                break;
            }
        }

        this.playground.game_map.game_background.render();
    }
}
