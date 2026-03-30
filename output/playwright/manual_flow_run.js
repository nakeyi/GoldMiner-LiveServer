const { chromium } = require('C:/Users/zhangbh/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const screenshots = {
        start: 'output/playwright/step-start.png',
        correct: 'output/playwright/step-correct.png',
        wrong: 'output/playwright/step-wrong.png',
        summary: 'output/playwright/step-summary.png',
    };

    await page.goto('http://127.0.0.1:8000/templates/multiends/web.html');
    await page.evaluate(async () => {
        const mod = await import('/static/js/src/zbase.js');
        document.body.innerHTML = '<div id="ac_game_test" style="width:1280px;height:720px;overflow:hidden"></div>';
        window.__test_game = new mod.AcGame('ac_game_test');
    });

    await page.waitForFunction(() => {
        return !!(
            window.__test_game &&
            window.__test_game.playground &&
            window.__test_game.playground.game_map &&
            window.__test_game.playground.game_map.pop_up &&
            window.__test_game.playground.game_map.pop_up.wordbook_button_rects.length === 4
        );
    });

    const initialState = await page.evaluate(() => ({
        character: window.__test_game.playground.character,
        selectedWordBookId: window.__test_game.playground.selectedWordBookId,
        wordBookName: window.__test_game.playground.get_selected_word_book_name(),
        prompt: window.__test_game.playground.get_current_prompt_text(),
    }));
    await page.screenshot({ path: screenshots.start });

    const selectWordBookPoint = await page.evaluate(() => {
        const pg = window.__test_game.playground;
        const targetRect = pg.game_map.pop_up.wordbook_button_rects[1];
        const canvasRect = pg.game_map.ctx.canvas.getBoundingClientRect();
        return {
            x: canvasRect.left + ((targetRect.x1 + targetRect.x2) / 2) * pg.scale,
            y: canvasRect.top + ((targetRect.y1 + targetRect.y2) / 2) * pg.scale,
        };
    });
    await page.mouse.click(selectWordBookPoint.x, selectWordBookPoint.y);

    const selectedState = await page.evaluate(() => ({
        selectedWordBookId: window.__test_game.playground.selectedWordBookId,
        wordBookName: window.__test_game.playground.get_selected_word_book_name(),
    }));

    const startButtonPoint = await page.evaluate(() => {
        const pg = window.__test_game.playground;
        const canvasRect = pg.game_map.ctx.canvas.getBoundingClientRect();
        return {
            x: canvasRect.left + ((0.53 + 0.80) / 2) * pg.scale,
            y: canvasRect.top + ((0.51 + 0.58) / 2) * pg.scale,
        };
    });
    await page.mouse.click(startButtonPoint.x, startButtonPoint.y);

    await page.waitForFunction(() => window.__test_game.playground.character === 'game');
    await page.evaluate(() => {
        document.querySelectorAll('canvas')[3].focus();
    });

    const afterStart = await page.evaluate(() => ({
        character: window.__test_game.playground.character,
        selectedWordBookId: window.__test_game.playground.selectedWordBookId,
        levelStarted: window.__test_game.playground.levelStarted,
        prompt: window.__test_game.playground.get_current_prompt_text(),
    }));

    const correctSetup = await page.evaluate(() => {
        const pg = window.__test_game.playground;
        const player = pg.players[0];
        const hook = player.hook;
        const target = pg.miners.find(miner => miner.uuid === pg.targetMineralUuid);
        const others = pg.miners.filter(miner => miner.uuid !== pg.targetMineralUuid);

        hook.fresh();
        hook.angle = 0;
        target.x = player.x;
        target.y = player.y + 0.23;
        target.origin_x = target.x;
        target.origin_y = target.y;

        for (let i = 0; i < others.length; i++) {
            others[i].x = player.x + 0.45 + i * 0.02;
            others[i].y = player.y + 0.34;
            others[i].origin_x = others[i].x;
            others[i].origin_y = others[i].y;
        }

        return {
            moneyBefore: player.money,
            wrongBefore: pg.levelWrongCount,
            targetUuid: target.uuid,
            prompt: pg.get_current_prompt_text(),
            label: target.displayLabel,
            targetName: target.name,
        };
    });

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(2200);

    const correctResult = await page.evaluate((targetUuid) => {
        const pg = window.__test_game.playground;
        const player = pg.players[0];
        return {
            moneyAfter: player.money,
            wrongAfter: pg.levelWrongCount,
            targetStillExists: pg.miners.some(miner => miner.uuid === targetUuid),
            currentPrompt: pg.get_current_prompt_text(),
            currentWords: pg.get_level_summary().words.length,
        };
    }, correctSetup.targetUuid);
    await page.screenshot({ path: screenshots.correct });

    const wrongSetup = await page.evaluate(() => {
        const pg = window.__test_game.playground;
        const player = pg.players[0];
        const hook = player.hook;
        const wrongMiner = pg.miners.find(miner => miner.uuid !== pg.targetMineralUuid);
        const target = pg.miners.find(miner => miner.uuid === pg.targetMineralUuid);
        const others = pg.miners.filter(miner => miner.uuid !== pg.targetMineralUuid && miner.uuid !== wrongMiner.uuid);

        hook.fresh();
        hook.angle = 0;

        wrongMiner.x = player.x;
        wrongMiner.y = player.y + 0.23;
        wrongMiner.origin_x = wrongMiner.x;
        wrongMiner.origin_y = wrongMiner.y;

        target.x = player.x + 0.45;
        target.y = player.y + 0.34;
        target.origin_x = target.x;
        target.origin_y = target.y;

        for (let i = 0; i < others.length; i++) {
            others[i].x = player.x - 0.45 - i * 0.02;
            others[i].y = player.y + 0.34;
            others[i].origin_x = others[i].x;
            others[i].origin_y = others[i].y;
        }

        return {
            wrongMinerUuid: wrongMiner.uuid,
            moneyBefore: player.money,
            wrongBefore: pg.levelWrongCount,
            targetUuid: pg.targetMineralUuid,
            wrongMinerName: wrongMiner.name,
        };
    });

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(2200);

    const wrongResult = await page.evaluate((payload) => {
        const pg = window.__test_game.playground;
        const player = pg.players[0];
        const wrongMiner = pg.miners.find(miner => miner.uuid === payload.wrongMinerUuid);
        return {
            moneyAfter: player.money,
            wrongAfter: pg.levelWrongCount,
            wrongMinerExists: !!wrongMiner,
            wrongMinerRestored: wrongMiner ? !wrongMiner.isBeingCarried : false,
            askedWords: pg.get_level_summary().words.length,
            currentPrompt: pg.get_current_prompt_text(),
        };
    }, wrongSetup);
    await page.screenshot({ path: screenshots.wrong });

    const summaryState = await page.evaluate(() => {
        const pg = window.__test_game.playground;
        const gm = pg.game_map;
        pg.players[0].money = gm.score_number.target_number;
        gm.timedelta = 1;
        gm.time_left = -1;
        gm.update_time_left();
        return {
            character: pg.character,
            nextWindow: gm.pop_up.next_window,
            levelSummary: pg.get_level_summary(),
            popupSummary: gm.pop_up.level_summary,
        };
    });
    await page.screenshot({ path: screenshots.summary });

    const result = {
        initialState,
        selectedState,
        afterStart,
        correctSetup,
        correctResult,
        wrongSetup,
        wrongResult,
        summaryState,
        screenshots,
        assertions: {
            popupVisible: initialState.character === 'pop up',
            wordBookChanged: selectedState.selectedWordBookId === 'junior_high',
            gameStarted: afterStart.character === 'game' && afterStart.levelStarted === true,
            correctGrabAddsMoney: correctResult.moneyAfter > correctSetup.moneyBefore,
            correctGrabRemovesMineral: correctResult.targetStillExists === false,
            wrongGrabNoMoney: wrongResult.moneyAfter === wrongSetup.moneyBefore,
            wrongGrabAddsError: wrongResult.wrongAfter === wrongSetup.wrongBefore + 1,
            wrongGrabMineralRestored: wrongResult.wrongMinerExists === true && wrongResult.wrongMinerRestored === true,
            summaryOpens: summaryState.character === 'pop up' && summaryState.nextWindow === 'success',
            summaryCountsWrong: summaryState.levelSummary.wrongCount === 1 && summaryState.popupSummary.wrongCount === 1,
            summaryHasWords: summaryState.levelSummary.words.length > 0,
        },
    };

    console.log(JSON.stringify(result, null, 2));
    await browser.close();
})().catch(async (err) => {
    console.error(err);
    process.exit(1);
});
