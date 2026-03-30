import { GameMap } from "/static/js/src/playground/game_map/zbase.js";
import { Player } from "/static/js/src/playground/player/zbase.js";
import { WORD_BOOKS, get_default_word_book_id, get_word_book_by_id } from "/static/js/src/playground/word_books.js";

export class AcGamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`<div class="ac-game-playground"></div>`);
        this.operator = "pc";
        this.base_scale = 1140;
        this.character = "pop up";

        this.hide();
        this.init_word_mode();

        this.root.$ac_game.append(this.$playground);

        this.start();
    }

    init_word_mode() {
        this.word_books = WORD_BOOKS;
        this.selectedWordBookId = get_default_word_book_id();
        this.currentRound = null;
        this.promptLanguage = "zh";
        this.labelLanguage = "en";
        this.targetMineralUuid = null;
        this.roundResolved = false;
        this.roundFeedback = "";
        this.roundFeedbackColor = "#ffffff";
        this.roundFeedbackTimer = null;
        this.canSelectWordBook = true;

        this.levelStarted = false;
        this.levelWrongCount = 0;
        this.levelAskedWords = [];
        this.levelAskedWordKeys = {};
    }

    get_random_color() {
        let colors = ["blue", "red", "pink", "grey", "green"];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    create_uuid() {
        let res = "";
        for (let i = 0; i < 8; i++) {
            let x = parseInt(Math.floor(Math.random() * 10));
            res += x;
        }
        return res;
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

    get_selected_word_book() {
        return get_word_book_by_id(this.selectedWordBookId);
    }

    get_selected_word_book_name() {
        return this.get_selected_word_book().name;
    }

    set_selected_word_book(id) {
        let word_book = get_word_book_by_id(id);
        if (!word_book) {
            return false;
        }

        this.selectedWordBookId = word_book.id;
        if (this.miners && this.miners.length > 0) {
            this.prepare_word_round();
        } else {
            this.render_word_mode();
        }
        return true;
    }

    set_wordbook_selection_enabled(enabled) {
        this.canSelectWordBook = enabled;
        if (this.character === "pop up" && this.game_map && this.game_map.pop_up) {
            this.game_map.pop_up.render();
            this.game_map.pop_up.score_number.render();
        }
    }

    start_level_word_session() {
        this.levelStarted = false;
        this.levelWrongCount = 0;
        this.levelAskedWords = [];
        this.levelAskedWordKeys = {};
        this.clear_round_feedback(false);
    }

    mark_level_started() {
        this.levelStarted = true;
        this.record_current_round_word();
    }

    record_current_round_word() {
        if (!this.currentRound || !this.currentRound.targetWordPair) {
            return;
        }

        let word_pair = this.currentRound.targetWordPair;
        let key = `${word_pair.zh}__${word_pair.en}`;
        if (!this.levelAskedWordKeys[key]) {
            this.levelAskedWordKeys[key] = true;
            this.levelAskedWords.push({
                zh: word_pair.zh,
                en: word_pair.en,
            });
        }
    }

    get_level_summary() {
        return {
            wrongCount: this.levelWrongCount,
            words: this.levelAskedWords.slice(),
        };
    }

    clear_round_feedback(need_render = true) {
        if (this.roundFeedbackTimer) {
            clearTimeout(this.roundFeedbackTimer);
            this.roundFeedbackTimer = null;
        }
        this.roundFeedback = "";
        if (need_render) {
            this.render_word_mode();
        }
    }

    show_round_feedback(text, color) {
        this.clear_round_feedback(false);
        this.roundFeedback = text;
        this.roundFeedbackColor = color;
        this.render_word_mode();

        let outer = this;
        this.roundFeedbackTimer = setTimeout(function () {
            outer.roundFeedback = "";
            outer.roundFeedbackTimer = null;
            outer.render_word_mode();
        }, 1200);
    }

    clear_word_round() {
        if (this.miners) {
            for (let miner of this.miners) {
                if (miner) {
                    miner.clear_word_pair();
                }
            }
        }
        this.currentRound = null;
        this.targetMineralUuid = null;
        this.roundResolved = false;
    }

    get_current_prompt_text() {
        if (!this.currentRound || !this.currentRound.targetWordPair) {
            if (!this.miners || this.miners.length === 0) {
                return "本关矿物已抓完";
            }
            return "准备开始";
        }
        return this.currentRound.targetWordPair[this.promptLanguage];
    }

    is_target_mineral(miner) {
        return !!(miner && this.currentRound && miner.uuid === this.targetMineralUuid);
    }

    prepare_word_round() {
        if (!this.miners) {
            this.clear_word_round();
            this.render_word_mode();
            return;
        }

        let living_miners = [];
        for (let miner of this.miners) {
            if (miner && !miner.isBeingCarried) {
                living_miners.push(miner);
            }
        }

        if (living_miners.length === 0) {
            this.clear_word_round();
            this.render_word_mode();
            return;
        }

        let prompt_language = Math.random() < 0.5 ? "zh" : "en";
        let label_language = prompt_language === "zh" ? "en" : "zh";
        let word_book = this.get_selected_word_book();
        let selected_words = this.shuffle_array(word_book.words).slice(0, living_miners.length);
        let shuffled_miners = this.shuffle_array(living_miners);
        let assigned_mineral_word_map = {};

        for (let i = 0; i < shuffled_miners.length; i++) {
            let miner = shuffled_miners[i];
            let word_pair = selected_words[i % selected_words.length];
            miner.set_word_pair(word_pair, label_language);
            assigned_mineral_word_map[miner.uuid] = word_pair;
        }

        let target_mineral = shuffled_miners[Math.floor(Math.random() * shuffled_miners.length)];
        this.currentRound = {
            promptLanguage: prompt_language,
            labelLanguage: label_language,
            targetMineralUuid: target_mineral.uuid,
            targetWordPair: target_mineral.wordPair,
            assignedMineralWordMap: assigned_mineral_word_map,
        };
        this.promptLanguage = prompt_language;
        this.labelLanguage = label_language;
        this.targetMineralUuid = target_mineral.uuid;
        this.roundResolved = false;
        this.render_word_mode();
    }

    finish_word_round(result = {}) {
        this.roundResolved = true;
        if (!result.skipFeedback) {
            if (result.correct) {
                this.show_round_feedback(`回答正确 +${result.reward}`, "#7ce08a");
            } else {
                this.levelWrongCount += 1;
                this.show_round_feedback("回答错误，本次不得分", "#ff907d");
            }
        }

        this.prepare_word_round();
        if (this.levelStarted) {
            this.record_current_round_word();
        }
    }

    start() {
        let outer = this;
        let uuid = this.create_uuid();

        $(window).on(`resize.${uuid}`, function () {
            outer.resize();
        });

        if (this.root.AcWingOS) {
            this.root.AcWingOS.api.window.on_close(function () {
                $(window).off(`resize.${uuid}`);
                outer.hide();
            });
        }

        this.operator = this.check_operator();
        this.load_audio();
    }

    check_operator() {
        let sUserAgent = navigator.userAgent.toLowerCase();
        let pc = sUserAgent.match(/windows/i) == "windows";
        if (!pc) {
            return "phone";
        }
        return "pc";
    }

    resize() {
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        let unit = Math.min(this.width / 12, this.height / 9);
        this.width = unit * 12;
        this.height = unit * 9;
        this.scale = this.height;

        if (this.game_map) {
            this.game_map.resize();
        }
    }

    show(mode) {
        this.$playground.show();
        this.resize();

        this.game_map = new GameMap(this.root, this);

        this.mode = mode;
        this.player_count = 0;
        this.players = [];
        this.miners = [];
        this.players.push(new Player(this, this.width / 2 / this.scale, 4.3 / 16, 0.04, "me", "test", "https://cdn.acwing.com/media/user/profile/photo/84494_lg_29c89a778e.jpg"));
    }

    load_audio() {
        this.audio_bag = new Audio("/static/audio/bag.ogg");
        this.audio_counter = new Audio("/static/audio/counter.ogg");
        this.audio_explode = new Audio("/static/audio/explode.ogg");
        this.audio_fail = new Audio("/static/audio/fail.ogg");
        this.audio_getbomb = new Audio("/static/audio/getbomb.ogg");
        this.audio_getpower = new Audio("/static/audio/getpower.ogg");
        this.audio_good = new Audio("/static/audio/good.ogg");
        this.audio_great = new Audio("/static/audio/great.ogg");
        this.audio_low = new Audio("/static/audio/low.ogg");
        this.audio_machine = new Audio("/static/audio/machine.ogg");
        this.audio_music = new Audio("/static/audio/music.ogg");
        this.audio_point = new Audio("/static/audio/point.ogg");
        this.audio_pop = new Audio("/static/audio/pop.ogg");
        this.audio_puff = new Audio("/static/audio/puff.ogg");
        this.audio_purchase = new Audio("/static/audio/purchase.ogg");
        this.audio_rattle = new Audio("/static/audio/rattle.ogg");
        this.audio_start = new Audio("/static/audio/start.ogg");
        this.audio_success = new Audio("/static/audio/success.ogg");
    }

    render_word_mode() {
        if (!this.game_map) {
            return;
        }

        if (this.game_map.game_background) {
            this.game_map.game_background.render();
        }
        if (this.game_map.score_number) {
            this.game_map.score_number.render();
        }
        if (this.character === "pop up" && this.game_map.pop_up) {
            this.game_map.pop_up.render();
            if (this.game_map.pop_up.score_number) {
                this.game_map.pop_up.score_number.render();
            }
        }
    }

    hide() {
        this.clear_round_feedback(false);
        this.clear_word_round();

        while (this.players && this.players.length > 0) {
            this.players[0].destroy();
        }

        if (this.score_board) {
            this.score_board.destroy();
            this.score_board = null;
        }

        if (this.game_map) {
            this.game_map.destroy();
            this.game_map = null;
        }

        if (this.notice_board) {
            this.notice_board.destroy();
            this.notice_board = null;
        }

        this.$playground.empty();
        this.$playground.hide();
    }
}
