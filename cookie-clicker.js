// ==UserScript==
// @name         Cookie Clicker Magic
// @namespace    https://qronicle.be/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://orteil.dashnet.org/cookieclicker/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dashnet.org
// @grant        none
// ==/UserScript==

(function() {

    let tickInterval = null;
    let buildingBuffs = [];
    let grimoire = null;
    let FTHOF = null;

    const towersMax = 630;
    const towersMin = 30;
    const buildingSleep = 250;
    const castSleep = 100;
    const enableFthof = true;
    let tmpIgnoreWrath = false;

    const WIZARD_TOWER = 'Wizard tower';

    init();

    function tick()
    {
        // Pop golden cookies when not in a cookie storm situation
        if (!isCookieStorm()) {
            console.log(tmpIgnoreWrath);
            if (popGoldenCookies(!tmpIgnoreWrath)) {
                checkHandOfFate();
            }
        }

        // Remove cronerice plants
    }

    async function checkHandOfFate()
    {
        if (isFrenzyCombo()) {
            if (!grimoire || !enableFthof) return;

            console.log('IT IS HAPPENING !!!');
            PlaySound('snd/jingle.mp3');

            clearInterval(tickInterval);
            let quit = false;

            // First round of FTHOF

            await setBuildingAmount(WIZARD_TOWER, towersMax);
            await forceHandOfFate().catch(error => { quit = true; });
            if (quit) {
                console.log('And now our watch ends');
                return startTicking();
            }
            await setBuildingAmount(WIZARD_TOWER, towersMin);
            await forceHandOfFate().catch(error => { quit = true; });
            if (quit) {
                setBuildingAmount(WIZARD_TOWER, towersMax);
                console.log('And now our watch ends');
                return startTicking();
            };

            // Second round of FTHOF with sugar lump

            await setBuildingAmount(WIZARD_TOWER, towersMax);
            // Use sugar lump to refill magic
            await refillMagic().catch(error => { quit = true; });
            if (quit) {
                console.log('And now our watch ends');
                return startTicking();
            };
            // Back to using magic
            await forceHandOfFate().catch(error => { quit = true; });
            if (quit) {
                console.log('And now our watch ends');
                return startTicking();
            };
            await setBuildingAmount(WIZARD_TOWER, towersMin);
            await forceHandOfFate().catch(error => {});
            // Reset all
            setBuildingAmount(WIZARD_TOWER, towersMax);
            startTicking();
            console.log('And now our watch was completed');
        }
    }

    function refillMagic()
    {
        console.log('Refilling magic by using a sugar lump');
        const askLumps = Game.prefs.askLumps;
        Game.prefs.askLumps = 0;
        const magic = grimoire.magic;
        grimoire.lumpRefill.click();
        Game.prefs.askLumps = askLumps;
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.abs(grimoire.magic - magic) < 10) {
                    // We couldn't use a lump
                    console.log(' => Lump could not be used');
                    reject();
                    return;
                } else {
                    console.log(' => Lump was used successfully');
                }
                Game.gainLumps(1); // We don't want to spend "real" lumps
                resolve();
            }, castSleep);
        });
    }

    function forceHandOfFate()
    {
        return new Promise((resolve, reject) => {
            console.log('Casting "Force The Hand Of Fate" (magic available: ' + Math.round(grimoire.magic) + ' - needed: ' + grimoire.getSpellCost(FTHOF) + ')');
            const cast = grimoire.castSpell(FTHOF);
            if (!cast) {
                console.log(' => Casting failed');
                resolve();
                return;
            }
            if (popGoldenCookies()) {
                console.log(' => Popped golden cookie!');
            } else {
                console.log(' => No golden cookie to pop :(');
                tmpIgnoreWrath = true;
                setTimeout(() => {
                    tmpIgnoreWrath = false;
                }, 60000);
                reject();
                return;
            }
            if (isCookieStorm()) {
                console.log(' => A cookie storm started -_-');
                reject();
                return;
            }
            setTimeout(() => {
                resolve();
            }, castSleep);
        });
    }

    function popGoldenCookies(includeWrath)
    {
        let popped = false;
        for (var i in Game.shimmers) {
            if (Game.shimmers[i].type == "golden" && (includeWrath || !Game.shimmers[i].wrath)) {
                Game.shimmers[i].pop();
                popped = true;
            }
        }
        return popped;
    }

    function isFrenzyCombo()
    {
        if (!Game.hasBuff('Frenzy')) {
            return false;
        }
        if (isCookieStorm()) {
            return false;
        }
        for (var buff of buildingBuffs) {
            if (Game.hasBuff(buff)) {
                return true;
            }
        }
        return false;
    }

    function isCookieStorm()
    {
        return Game.hasBuff('Cookie storm');
    }

    function setBuildingAmount(building, amount)
    {
        return new Promise(resolve => {
            const currentAmount = Game.Objects[building].amount;
            console.log('Set ' + building + ' building amount to ' + amount + ' (current amount: ' + currentAmount + ')');
            const diff = amount - currentAmount;
            if (diff == 0) {
                resolve();
                return;
            }
            if (diff > 0) {
                Game.Objects[building].buy(diff);
                console.log(' => Buy ' + diff);
            } else if (diff < 0) {
                Game.Objects[building].sell(-diff);
                console.log(' => Sell ' + (-diff));
            }
            setTimeout(() => {
                resolve();
            }, buildingSleep);
        });
    }

    function init()
    {
        buildingBuffs = getBuildingBuffs();
        if (!buildingBuffs.length) {
            setTimeout(init, 1000);
            return;
        }
        grimoire = Game.Objects["Wizard tower"].minigame;
        FTHOF = grimoire ? grimoire.spellsById[1] : null;
        console.info('Cookie Clicker Magic initialized');
        startTicking();
    }

    function startTicking()
    {
        tickInterval = setInterval(tick, 5000);
    }

    function getBuildingBuffs()
    {
        const buildingBuffs = [];
        for (var i in Game.goldenCookieBuildingBuffs) {
            buildingBuffs.push(Game.goldenCookieBuildingBuffs[i][0]);
        }
        return buildingBuffs;
    }
})();
