/**
 * @class
 * @property {Function} patch
 */
export class HELPER {
    static localize(...args){
        return game.i18n.localize(...args);
    }

    static format(...args){
        return game.i18n.format(...args);
    }

    static setting(moduleName, key){
        return game.settings.get(moduleName, key);
    }

    static isTurnChange(combat, changed){
        /* we need a turn change or a round change to consider this a live combat */
        const liveCombat = !!combat.started && (("turn" in changed) || ('round' in changed));
        const anyCombatants = (combat.combatants.size ?? 0) !== 0;
        const notFirstTurn = !(((changed.turn ?? undefined) === 0) && (changed.round ?? 0) === 1)
    
        return liveCombat && anyCombatants && notFirstTurn;
    }

    static isFirstTurn(combat, changed){
        return combat.started && changed.round === 1;
    }
    
    static firstGM() {
        return game.users.find(u => u.isGM && u.active);
    }
    
    static isFirstGM() {
        return game.user.id === HELPER.firstGM()?.id;
    }

    static sanitizeTokenName(moduleName, token, feature, label, capitalize = true){
        const name = ((HELPER.setting(moduleName, feature) && token.actor.type === "npc") ? HELPER.format(label) : token.name)
        return capitalize ? name.capitalize() : name;
    }

    static async wait(ms) {
        return new Promise((resolve)=> setTimeout(resolve, ms))
    }
    
    static async waitFor(fn, m = 200, w = 100, i = 0){
        while(!fn(i, ((i*w)/100)) && i < m) {
            i++;
            await HELPER.wait(w);
        }

        return i === m ? false : true;
    }

    static stringToDom(innerHTML, className){
        let dom = document.createElement("div");
        dom.innerHTML = innerHTML;
        dom.className = className;
        return dom;
    }

    /*
    * Helper function for quickly creating a simple dialog with labeled buttons and associated data. 
    * Useful for allowing a choice of actors to spawn prior to `warpgate.spawn`.
    *
    * @param `data` {Array of Objects}: Contains two keys `label` and `value`. Label corresponds to the 
    *     button's text. Value corresponds to the return value if this button is pressed. Ex. 
    *     `const data = buttons: [{label: 'First Choice, value: {token {name: 'First'}}, {label: 'Second Choice',
    *         value: {token: {name: 'Second}}}]`
    * @param `direction` {String} (optional): `'column'` or `'row'` accepted. Controls layout direction of dialog.
    */
    static async buttonDialog(data, direction = 'row') {
        return await new Promise(async (resolve) => {
            let buttons = {}, dialog;

            data.buttons.forEach((button) => {
                buttons[button.label] = {
                    label: button.label,
                    callback: () => resolve(button.value)
                }
            });

            dialog = new Dialog({
                title: data.title,
                content: data.content,
                buttons,
                close: () => resolve("Exit, No Button Click")
            }, {
                /*width: '100%',*/ height: '100%' 
            });

            await dialog._render(true);
            dialog.element.find('.dialog-buttons').css({'flex-direction': direction});
        });
  }
}
