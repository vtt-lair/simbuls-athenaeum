import { logger } from '../logger.js';
import { HELPER } from '../helper.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Simple form app that allows you to list abilities for a combatant
 * Migrated to ApplicationV2 for Foundry V14.
 */
export class ActionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    
    constructor(combatants, options = {}) {
        super(options);
        this.combatants = combatants;
        this.actionConfig = foundry.utils.mergeObject(
            { action: true, bonus: true, reaction: true, legendary: true, lair: true, special: true }, 
            options
        );
        
        // Restore previous position if it exists in the static map
        const lastPos = ActionDialog._lastPosition.get(this.options.id);
        if (lastPos) {
            this.position.top = lastPos.top;
            this.position.left = lastPos.left;
        }
    }

    static DEFAULT_ID = 'simbuls-athenaeum-action-dialog';
    static _lastPosition = new Map(); 

    static DEFAULT_OPTIONS = {
        id: ActionDialog.DEFAULT_ID,
        classes: ["simbuls-athenaeum", "action-dialog"],
        window: {
            title: "Action Dialog",
            resizable: false
        },
        position: {
            height: "100%",
            width: 400
        }
    };

    static PARTS = {
        main: {
            template: `modules/simbuls-athenaeum/templates/ActionDialog.html`
        }
    };

    get title() {
        return this.options.window.title;
    }

    _generateCombatantData() {
        return this.combatants.map((combatant) => {
            return {
                id : combatant.id,
                combatId: combatant.combat.id,
                img : combatant.img,
                name : combatant.name,
                items : {
                    action : this.actionConfig?.action ? this.getCombatantItemData(combatant, "action") : undefined,
                    bonus : this.actionConfig?.bonus ? this.getCombatantItemData(combatant, "bonus") : undefined,
                    reaction : this.actionConfig?.reaction ? this.getCombatantItemData(combatant, "reaction"): undefined,
                    legendary : this.actionConfig?.legendary ? this.getCombatantItemData(combatant, "legendary") : undefined,
                    lair : this.actionConfig?.lair ? this.getCombatantItemData(combatant, "lair") : undefined,
                    special : this.actionConfig?.special ? this.getCombatantItemData(combatant, "special") : undefined,
                }
            }
        });
    }

    getCombatantItemData(combatant, type){
        return combatant.actor.items
        .filter(item => item?.system?.activation?.type === type)
        .map((item) => {
            let data = {
                name : item.name, 
                id : item.id,
                activation : foundry.utils.mergeObject(foundry.utils.getProperty(item,'system.activation'), {canUse: true}),
                description : foundry.utils.getProperty(item ,'system.description.value'), 
                img : item.img, 
                uuid : item.uuid,
            };

            if (type === 'legendary') {
                foundry.utils.mergeObject(data.activation, { available : foundry.utils.getProperty(combatant.actor, 'system.resources.legact.value') } ); 
                data.activation.canUse = data.activation.available >= data.activation.cost;
            }

            return data;
        });
    }

    /** ApplicationV2 uses _prepareContext instead of getData */
    async _prepareContext(options) {
        return {
            combatants: this._generateCombatantData()
        };
    }

    /** ApplicationV2 replaces activateListeners with _onRender */
    _onRender(context, options) {
        super._onRender(context, options);

        // Map native DOM clicks since ApplicationV2 drops mandatory jQuery
        this.combatants.forEach((combatant) => {
            const imgEl = this.element.querySelector(`#${combatant.id}`);
            if (imgEl) {
                imgEl.addEventListener('click', this._onImgClick.bind(this));
            }
        });

        this.element.querySelectorAll('.item').forEach(el => {
            el.addEventListener('click', this._onButtonClick.bind(this));
        });
    }

    _onImgClick(event){
        logger.debug("_onImgClick | DATA | ", { event });
        const combatantID = event.currentTarget.id;
        if (!combatantID || !game.combats.active) return;

        const token = game.combats.active.combatants.get(combatantID)?.token.object;
        if (!token) return;

        token.control({ releaseOthers : true });
        canvas.animatePan({ x : token.x, y : token.y });
    }

    async _onButtonClick(event){
        const itemUUID = event.currentTarget.id;
        const item = await fromUuid(itemUUID);

        if (!item || !(item instanceof Item)) return;

        await item.use();
        logger.debug("onButtonClick | DATA | ", { event, itemUUID, item });

        if (this.combatants.length == 1) {
            return this.close();
        } else {
            return this.render({ force: true });
        }
    }

    /** Save the position state on close */
    async close(options={}) {
        const position = this.position;
        ActionDialog._lastPosition.set(this.options.id, { top: position.top, left: position.left });
        return super.close(options);
    }
}