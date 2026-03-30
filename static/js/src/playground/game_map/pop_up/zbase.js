import { AcGameObject } from "/static/js/src/playground/ac_game_objects/zbase.js";
import { ScoreNumber } from "/static/js/src/playground/game_map/score_number/zbase.js";

export class PopUp extends AcGameObject {
    constructor(playground, pop_up_ctx) {
        super();
        this.playground = playground;
        this.ctx = pop_up_ctx;
        this.score_number = new ScoreNumber(this.playground, this.ctx, "pop up");
        this.base_scale = this.playground.base_scale;

        this.is_start = false;
        this.wordbook_button_rects = [];
        this.action_button_rect = null;
        this.level_summary = { wrongCount: 0, words: [] };
        this.pop_up_origin = { x: 0, y: 0 };
        this.popup_metrics = null;

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
    }

    start_new_pop_up(next_window) {
        this.next_window = next_window;
        this.wordbook_button_rects = [];
        this.action_button_rect = null;
        this.level_summary = this.playground.get_level_summary();
        this.render();
        this.score_number.render();
    }

    add_POS() {
        this.POS = new Array();
    }

    load_image() {
        this.pop_up_background = new Image();
        this.pop_up_background.src = "/static/image/playground/popup-sheet0.png";
        this.button_background = new Image();
        this.button_background.src = "/static/image/playground/button-sheet0.png";
        this.home_button_icon = new Image();
        this.home_button_icon.src = "/static/image/playground/popupbuttons-sheet0.png";
        this.next_button_icon = new Image();
        this.next_button_icon.src = "/static/image/playground/popupbuttons-sheet1.png";
        this.pop_up_success_img = new Image();
        this.pop_up_success_img.src = "/static/image/playground/resultphoto-sheet0.png";
        this.pop_up_fail_img = new Image();
        this.pop_up_fail_img.src = "/static/image/playground/resultphoto-sheet1.png";

        this.images = [
            this.pop_up_background, this.button_background, this.next_button_icon,
            this.pop_up_fail_img, this.home_button_icon, this.pop_up_success_img,
        ];
    }

    click_button(tx, ty) {
        if (this.next_window === "game" && this.playground.canSelectWordBook) {
            for (let button of this.wordbook_button_rects) {
                if (this.is_point_in_rect(tx, ty, button)) {
                    this.playground.audio_pop.play();
                    this.playground.set_selected_word_book(button.id);
                    this.render();
                    this.score_number.render();
                    return true;
                }
            }
        }

        if (this.is_point_in_rect(tx, ty, this.action_button_rect)) {
            this.playground.audio_pop.play();
            this.player_click_start_game_button();
            return true;
        }
        return true;
    }

    is_point_in_rect(tx, ty, rect) {
        return !!(
            rect &&
            tx >= rect.x1 && ty >= rect.y1 &&
            tx <= rect.x2 && ty <= rect.y2
        );
    }

    player_click_start_game_button() {
        if (this.next_window === "success") {
            this.playground.character = "shop";
            this.playground.game_map.shop.start_new_shop();
            this.playground.game_map.game_background.start_new_level();
            this.clear();
        } else if (this.next_window === "game") {
            this.playground.character = "game";
            this.playground.set_wordbook_selection_enabled(false);
            this.playground.mark_level_started();
            this.clear();
        } else if (this.next_window === "fail") {
            this.playground.game_map.game_background.start_new_level();
            this.playground.game_map.restart();
        }
    }

    update() {
        if (!this.is_start && this.is_all_images_loaded()) {
            this.is_start = true;
            this.render();
            this.score_number.render();
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
        if (this.score_number) {
            this.score_number.render();
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    render() {
        if (this.playground.character !== "pop up") {
            return false;
        }

        let canvas = {
            width: this.ctx.canvas.width,
            height: this.ctx.canvas.height,
            scale: this.ctx.canvas.height / this.base_scale,
        };

        this.wordbook_button_rects = [];
        this.action_button_rect = null;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.60)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.render_pop_up(canvas);
    }

    get_popup_scale_factor() {
        return 1.52;
    }

    render_pop_up(canvas) {
        if (this.next_window === "success" || this.next_window === "fail") {
            this.render_centered_result_frame(canvas);
            return;
        }

        let img = this.pop_up_background;
        let unit = canvas.scale * this.get_popup_scale_factor();
        let popup_width = img.width * unit;
        let popup_height = img.height * unit;
        let popup_x = (canvas.width - popup_width) / 2;
        let popup_y = (canvas.height - popup_height) / 2;

        this.popup_metrics = {
            x: popup_x,
            y: popup_y,
            width: popup_width,
            height: popup_height,
            unit: unit,
            img_width: img.width,
            img_height: img.height,
        };
        this.pop_up_origin = { x: popup_x, y: popup_y };

        this.ctx.save();
        this.ctx.translate(popup_x, popup_y);
        this.ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, popup_width, popup_height);

        if (this.next_window === "success") {
            this.render_result_panel("闯关成功", this.pop_up_success_img);
        } else if (this.next_window === "fail") {
            this.render_result_panel("本关结束", this.pop_up_fail_img);
        } else {
            this.render_wordbook_panel();
        }

        this.render_pop_up_button();
        this.ctx.restore();
    }

    render_centered_result_frame(canvas) {
        let metrics = this.get_result_frame_metrics(canvas);
        this.popup_metrics = metrics;
        this.pop_up_origin = { x: metrics.x, y: metrics.y };

        this.ctx.save();
        this.ctx.translate(metrics.x, metrics.y);
        this.render_result_panel(
            this.next_window === "success" ? "闯关成功" : "本关结束",
            this.next_window === "success" ? this.pop_up_success_img : this.pop_up_fail_img
        );
        this.render_pop_up_button(metrics.height + 14 * metrics.unit);
        this.ctx.restore();
    }

    get_result_frame_metrics(canvas) {
        let frame_width = canvas.width * 0.8;
        let frame_height = canvas.height * 0.6;
        let frame_x = (canvas.width - frame_width) / 2;
        let frame_y = (canvas.height - frame_height) / 2;
        let unit = Math.min(frame_width / 760, frame_height / 360);

        return {
            x: frame_x,
            y: frame_y,
            width: frame_width,
            height: frame_height,
            unit: unit,
        };
    }

    draw_panel_box(x, y, width, height, fill_style = "rgba(76, 46, 17, 0.84)", stroke_style = "rgba(255, 212, 108, 0.95)") {
        this.ctx.fillStyle = fill_style;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = stroke_style;
        this.ctx.lineWidth = 3 * this.popup_metrics.unit;
        this.ctx.strokeRect(x, y, width, height);
    }

    render_wordbook_panel() {
        let metrics = this.popup_metrics;
        let unit = metrics.unit;
        let selected_id = this.playground.selectedWordBookId;
        let title_x = metrics.width / 2;
        let intro_x = 38 * unit;
        let intro_y = 56 * unit;
        let intro_width = metrics.width - 76 * unit;
        let intro_height = 62 * unit;
        let button_gap = 18 * unit;
        let button_width = (metrics.width - 110 * unit - button_gap) / 2;
        let button_height = 72 * unit;
        let first_row_y = 136 * unit;

        this.ctx.save();
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        this.ctx.fillStyle = "#ffe3a1";
        this.ctx.font = `bold ${28 * unit}px sans-serif`;
        this.ctx.fillText("选择本局词书", title_x, 34 * unit);

        this.draw_panel_box(intro_x, intro_y, intro_width, intro_height, "rgba(58, 33, 12, 0.72)");
        this.ctx.fillStyle = "#fff4cf";
        this.ctx.font = `${15 * unit}px sans-serif`;
        this.ctx.fillText("开始前选择阶段，本局跨关卡保持不变", title_x, intro_y + 22 * unit);
        this.ctx.fillStyle = "#f4c76a";
        this.ctx.font = `${14 * unit}px sans-serif`;
        this.ctx.fillText("题面会随机显示中文或英文，矿石显示另一种语言", title_x, intro_y + 44 * unit);

        for (let i = 0; i < this.playground.word_books.length; i++) {
            let word_book = this.playground.word_books[i];
            let column = i % 2;
            let row = Math.floor(i / 2);
            let button_x = 46 * unit + column * (button_width + button_gap);
            let button_y = first_row_y + row * (button_height + 18 * unit);
            let is_selected = selected_id === word_book.id;

            this.ctx.fillStyle = is_selected ? "rgba(140, 85, 24, 0.94)" : "rgba(64, 37, 15, 0.84)";
            this.ctx.fillRect(button_x, button_y, button_width, button_height);
            this.ctx.strokeStyle = is_selected ? "#ffd978" : "#d9a86a";
            this.ctx.lineWidth = 3 * unit;
            this.ctx.strokeRect(button_x, button_y, button_width, button_height);

            this.ctx.fillStyle = is_selected ? "#fff6d5" : "#f0d6a4";
            this.ctx.font = `bold ${22 * unit}px sans-serif`;
            this.ctx.fillText(word_book.name, button_x + button_width / 2, button_y + 25 * unit);
            this.ctx.font = `${13 * unit}px sans-serif`;
            this.ctx.fillText(`${word_book.words.length} 组词汇`, button_x + button_width / 2, button_y + 50 * unit);

            this.register_wordbook_button(button_x, button_y, button_width, button_height, word_book.id);
        }

        this.ctx.fillStyle = "#8f5d27";
        this.ctx.font = `${15 * unit}px sans-serif`;
        if (this.playground.canSelectWordBook) {
            this.ctx.fillText("点击下方开始按钮进入游戏", title_x, metrics.height - 28 * unit);
        } else {
            this.ctx.fillText(`当前沿用：${this.playground.get_selected_word_book_name()}`, title_x, metrics.height - 28 * unit);
        }
        this.ctx.restore();
    }

    render_result_panel(title, result_image) {
        let metrics = this.popup_metrics;
        let unit = metrics.unit;
        let current_money = this.playground.players && this.playground.players.length > 0 ? this.playground.players[0].money : 0;
        let target_money = this.playground.game_map.score_number.target_number;
        let summary = this.level_summary || { wrongCount: 0, words: [] };
        let outer_padding = 18 * unit;
        let section_gap = 14 * unit;
        let section_height = (metrics.height - outer_padding * 2 - section_gap) / 2;
        let score_box = {
            x: outer_padding,
            y: outer_padding,
            width: metrics.width - outer_padding * 2,
            height: section_height,
        };
        let words_box = {
            x: outer_padding,
            y: score_box.y + score_box.height + section_gap,
            width: metrics.width - outer_padding * 2,
            height: section_height,
        };
        let image_size = Math.min(score_box.height - 28 * unit, score_box.width * 0.18);
        let image_box = {
            x: score_box.x + score_box.width - image_size - 16 * unit,
            y: score_box.y + (score_box.height - image_size) / 2,
            width: image_size,
            height: image_size,
        };
        let content_left = score_box.x + 18 * unit;
        let content_right = image_box.x - 26 * unit;
        let title_font_size = Math.max(22, 30 * unit);
        let status_font_size = Math.max(14, 18 * unit);
        let score_label_font_size = Math.max(13, 16 * unit);
        let score_value_font_size = Math.max(38, 56 * unit);
        let meta_font_size = Math.max(14, 18 * unit);
        let meta_x = Math.max(content_left + 180 * unit, content_right - 188 * unit);

        this.ctx.save();
        this.draw_panel_box(0, 0, metrics.width, metrics.height, "rgba(70, 41, 16, 0.95)", "rgba(255, 215, 120, 0.98)");
        this.draw_panel_box(score_box.x, score_box.y, score_box.width, score_box.height, "rgba(97, 57, 22, 0.88)");

        this.ctx.fillStyle = "#ffe29a";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";
        this.ctx.font = `bold ${title_font_size}px sans-serif`;
        this.ctx.fillText(title, content_left, score_box.y + 24 * unit);

        this.ctx.fillStyle = this.next_window === "success" ? "#9cf08b" : "#ff9c86";
        this.ctx.font = `bold ${status_font_size}px sans-serif`;
        this.ctx.fillText(
            this.next_window === "success" ? "达到目标，准备进入商店" : "未达到目标，点击下方重新开始",
            content_left,
            score_box.y + 56 * unit
        );

        this.ctx.fillStyle = "#f7dca4";
        this.ctx.font = `${score_label_font_size}px sans-serif`;
        this.ctx.fillText("本关得分", content_left, score_box.y + 92 * unit);
        this.ctx.font = `bold ${score_value_font_size}px sans-serif`;
        this.ctx.fillStyle = "#fff7df";
        this.ctx.fillText(`${current_money}`, content_left, score_box.y + score_box.height - 30 * unit);

        this.ctx.fillStyle = "#f7dca4";
        this.ctx.font = `${meta_font_size}px sans-serif`;
        this.ctx.fillText(`目标分数：${target_money}`, meta_x, score_box.y + 90 * unit);
        this.ctx.fillText(`错误次数：${summary.wrongCount}`, meta_x, score_box.y + 122 * unit);
        this.ctx.fillText(`词书阶段：${this.playground.get_selected_word_book_name()}`, meta_x, score_box.y + 154 * unit);

        this.ctx.drawImage(
            result_image,
            0,
            0,
            result_image.width,
            result_image.height,
            image_box.x,
            image_box.y,
            image_box.width,
            image_box.height
        );

        this.render_level_summary(words_box);
        this.ctx.restore();
    }

    render_level_summary(words_box) {
        let metrics = this.popup_metrics;
        let unit = metrics.unit;
        let summary = this.level_summary || { wrongCount: 0, words: [] };
        let summary_words = summary.words.slice(0, 10);
        let header_font_size = Math.max(18, 22 * unit);
        let meta_font_size = Math.max(14, 17 * unit);
        let word_font_size = Math.max(13, 16 * unit);
        let top_offset = 56 * unit;
        let available_height = words_box.height - top_offset - 16 * unit;
        let row_height = Math.max(20, available_height / 5);
        let column_width = (words_box.width - 52 * unit) / 2;

        this.draw_panel_box(words_box.x, words_box.y, words_box.width, words_box.height, "rgba(66, 38, 14, 0.82)");

        this.ctx.save();
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = "#ffe29a";
        this.ctx.font = `bold ${header_font_size}px sans-serif`;
        this.ctx.fillText("本关单词情况", words_box.x + 16 * unit, words_box.y + 20 * unit);

        this.ctx.textAlign = "right";
        this.ctx.fillStyle = "#fff5d7";
        this.ctx.font = `bold ${meta_font_size}px sans-serif`;
        this.ctx.fillText(`错误次数：${summary.wrongCount}`, words_box.x + words_box.width - 16 * unit, words_box.y + 20 * unit);

        if (summary_words.length === 0) {
            this.ctx.textAlign = "left";
            this.ctx.fillStyle = "#f2dfb2";
            this.ctx.font = `${meta_font_size}px sans-serif`;
            this.ctx.fillText("本关还没有记录到单词。", words_box.x + 16 * unit, words_box.y + words_box.height / 2);
            this.ctx.restore();
            return;
        }

        this.ctx.textAlign = "left";
        this.ctx.fillStyle = "#fff7df";
        this.ctx.font = `${word_font_size}px sans-serif`;
        for (let i = 0; i < summary_words.length; i++) {
            let word_pair = summary_words[i];
            let column = Math.floor(i / 5);
            let row = i % 5;
            let text_x = words_box.x + 16 * unit + column * column_width;
            let text_y = words_box.y + top_offset + row * row_height;
            this.ctx.fillText(`${word_pair.zh} / ${word_pair.en}`, text_x, text_y);
        }

        if (summary.words.length > summary_words.length) {
            this.ctx.fillStyle = "#f4c76a";
            this.ctx.font = `${Math.max(12, 13 * unit)}px sans-serif`;
            this.ctx.fillText("更多词汇已省略...", words_box.x + 16 * unit, words_box.y + words_box.height - 12 * unit);
        }
        this.ctx.restore();
    }

    render_pop_up_button(custom_y = null) {
        let metrics = this.popup_metrics;
        let unit = metrics.unit;
        let button_scale = this.next_window === "game" ? unit * 1.05 : unit * 0.92;
        let button_width = this.button_background.width * button_scale;
        let button_height = this.button_background.height * button_scale;
        let button_x = (metrics.width - button_width) / 2;
        let button_y = custom_y !== null ? custom_y : metrics.height - button_height * 0.38;

        this.ctx.drawImage(
            this.button_background,
            0,
            0,
            this.button_background.width,
            this.button_background.height,
            button_x,
            button_y,
            button_width,
            button_height
        );

        let button_icon = this.next_window === "fail" ? this.home_button_icon : this.next_button_icon;
        let icon_scale = button_scale * 0.92;
        let icon_width = button_icon.width * icon_scale;
        let icon_height = button_icon.height * icon_scale;
        let icon_x = button_x + (button_width - icon_width) / 2;
        let icon_y = button_y + (button_height - icon_height) / 2 - 2 * unit;

        this.ctx.drawImage(
            button_icon,
            0,
            0,
            button_icon.width,
            button_icon.height,
            icon_x,
            icon_y,
            icon_width,
            icon_height
        );

        this.register_action_button(button_x, button_y, button_width, button_height);
    }

    register_wordbook_button(local_x, local_y, width, height, word_book_id) {
        this.wordbook_button_rects.push({
            id: word_book_id,
            x1: (this.pop_up_origin.x + local_x) / this.playground.scale,
            y1: (this.pop_up_origin.y + local_y) / this.playground.scale,
            x2: (this.pop_up_origin.x + local_x + width) / this.playground.scale,
            y2: (this.pop_up_origin.y + local_y + height) / this.playground.scale,
        });
    }

    register_action_button(local_x, local_y, width, height) {
        this.action_button_rect = {
            x1: (this.pop_up_origin.x + local_x) / this.playground.scale,
            y1: (this.pop_up_origin.y + local_y) / this.playground.scale,
            x2: (this.pop_up_origin.x + local_x + width) / this.playground.scale,
            y2: (this.pop_up_origin.y + local_y + height) / this.playground.scale,
        };
    }
}
