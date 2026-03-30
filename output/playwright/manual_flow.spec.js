const { test, expect } = require('@playwright/test');

test.use({
    viewport: { width: 1280, height: 720 },
    channel: 'chrome',
});

test('黄金矿工单词模式实操', async ({ page }) => {
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

    expect(initialState.character).toBe('pop up');
    expect(initialState.selectedWordBookId).toBe('primary_school');

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
    expect(selectedState.selectedWordBookId).toBe('junior_high');

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
    }));
    expect(afterStart.character).toBe('game');
    expect(afterStart.selectedWordBookId).toBe('junior_high');
    expect(afterStart.levelStarted).toBe(true);

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
        };
    }, correctSetup.targetUuid);
    await page.screenshot({ path: screenshots.correct });

    expect(correctResult.moneyAfter).toBeGreaterThan(correctSetup.moneyBefore);
    expect(correctResult.wrongAfter).toBe(correctSetup.wrongBefore);
    expect(correctResult.targetStillExists).toBe(false);

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
            currentPrompt: pg.get_current_prompt_text(),
            askedWords: pg.get_level_summary().words.length,
        };
    }, wrongSetup);
    await page.screenshot({ path: screenshots.wrong });

    expect(wrongResult.moneyAfter).toBe(wrongSetup.moneyBefore);
    expect(wrongResult.wrongAfter).toBe(wrongSetup.wrongBefore + 1);
    expect(wrongResult.wrongMinerExists).toBe(true);
    expect(wrongResult.wrongMinerRestored).toBe(true);

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

    expect(summaryState.character).toBe('pop up');
    expect(summaryState.nextWindow).toBe('success');
    expect(summaryState.levelSummary.wrongCount).toBe(1);
    expect(summaryState.levelSummary.words.length).toBeGreaterThan(0);
    expect(summaryState.popupSummary.wrongCount).toBe(1);

    console.log(JSON.stringify({
        initialState,
        selectedState,
        afterStart,
        correctSetup,
        correctResult,
        wrongSetup,
        wrongResult,
        summaryState,
        screenshots,
    }, null, 2));
});
