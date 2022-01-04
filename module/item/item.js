import { S } from "../sanctuary.js";
import * as roll from "../roll/roll.js";
import { actionTypes } from "../roll/display.js";
/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class GlogItem extends Item {
    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        // Get the Item's data
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;
        if (data.hasOwnProperty("quickslot")) {
            if (data.quickslot) {
                data.equipped = true;
            }
        };
        itemData.properties = itemData.properties || {};
    }

    // todo: precalculate a bunch of this ahead of time 
    // but sometimes fields don't exist until the item sheet
    // has been opened so initializing breaks.... later problem
    _getDamageType() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        return data.damageType;
    }

    _getAltDamageType() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        return data.formulaDamageType;
    }

    _getBonus() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        const maybeAbility = data.ability;
        return (maybeAbility) ? S.Just(maybeAbility) : S.Nothing;
    }

    _getSecondaryBonus() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (data.hasOwnProperty("secondaryAbility")) {
            const maybeAbility = data.secondaryAbility;
            return (maybeAbility) ? S.Just(maybeAbility) : S.Nothing;
        } else {
            return S.Nothing;
        }
    }

    _getAlternativeDamage() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        const alternative = data.formula;
        return ((alternative) ? S.Just(alternative) : S.Nothing);
    }

    _getRegularDamage() {

        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        const damage = data.damage;
        return ((damage) ? S.Just(damage) : S.Nothing);

    }

    _getParsedDamageFormula(alt) {
        return S.unchecked.fromMaybe(null)(S.unchecked.map(a => roll.getFormulaType(a, ""))(alt));
    }

    getWeaponModifier(mode) {
        if (mode === "melee") {
            return this.getLocalStatMods("meleeAttack");
        } else if (mode === "ranged" || mode === "range") {
            return this.getLocalStatMods("rangeAttack");
        } else {
            return S.Nothing;
        }
    }

    /** kind of stupid, wouldn't this be on the damage formula itself? */
    getWeaponDamageModifier(mode) {
        if (mode === "melee") {
            return this.getLocalStatMods("meleeDamage");
        } else if (mode === "ranged" || mode === "range") {
            return this.getLocalStatMods("rangeDamage");
        } else {
            return S.Nothing;
        }
    }

    getWeaponCritModifier(mode) {
        if (mode === "melee") {
            return S.fromMaybe(0)(S.map(v => v.value)(this.getLocalStatMods("meleeCritRange")));
        } else if (mode === "ranged" || mode === "range") {
            return S.fromMaybe(0)(S.map(v => v.value)(this.getLocalStatMods("rangeCritRange")));
        } else {
            0
        }
    }

    getWeaponFumbleModifier(mode) {
        if (mode === "melee") {
            return S.fromMaybe(0)(S.map(v => v.value)(this.getLocalStatMods("meleeFumbleRange")));
        } else if (mode === "ranged" || mode === "range") {
            return S.fromMaybe(0)(S.map(v => v.value)(this.getLocalStatMods("rangeFumbleRange")));
        } else {
            0
        }
    }

    getRangeModifiers() {
        return {
            "decay": S.fromMaybe(0)(S.map(v => v.value)(this.getLocalStatMods("rangeDecayMod"))),
            "distance": S.fromMaybe(0)(S.map(v => v.value)(this.getLocalStatMods("rangeDistanceMod")))
        };
    }

    /**
     * Returns statMods depending on meleeAttack or rangeAttack value 
     * @param type "meleeAttack" or "rangeAttack"
     */
    getLocalStatMods(type) {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        const statMods = data.statMods;
        let res = 0
        if (statMods.applied) {
            for (let elem of statMods.parts) {
                if (elem[0] === type && elem[4] === "weapon") {
                    res = res + (+elem[2])
                }
            }
        }
        if (res === 0) {
            return S.Nothing
        } else {
            return S.Just({
                "value": res,
                "text": `<p>Applied ${type} modifier of ${res}</p>`
            })
        }
    }

    // todo parse formulas/dice
    getWeaponDistance() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        const params = data.range;
        const value = (params.value) ? params.value : 0;
        return (params.units === "ft") ? +value : 0;
    }


    _weaponType() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        return data.weaponType;
    }
    _actionType() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        return data.actionType;
    }

    _secondaryAction() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        return data.secondaryAttackAction ? data.secondaryAttackAction : null;
    }
    _activationType() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        return data.activation.type;
    }
    _getTarget() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        return data.target;
    }

    _getRange() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        return data.range;
    }

    _getDuration() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        return data.duration;
    }

    getDialogModes() {
        if (this.type === "weapon") {
            return this.getWeaponDialogueModes();
        } else if (this.type === "spell") {
            return this.getSpellDialogueModes();
        } else {
            return this.getMiscDialogueModes();
        }
    }

    getWeaponDialogueModes() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        const res = [];
        const hasDamage = (data.damage) ? true : false;
        (data.weaponType === "melee") ? res.push(actionTypes.melee) : res.push(actionTypes.range);
        if (hasDamage) {
            (data.weaponType === "melee") ? res.push(actionTypes.effect("melee")) : res.push(actionTypes.effect("ranged"));
        };
        if (S.isJust(this._getAlternativeDamage())) {
            (data.weaponType === "melee") ? res.push(actionTypes.alt("melee")) : res.push(actionTypes.alt("ranged"));
        };
        return res;
    }

    getSpellDialogueModes() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        const res = [];
        const actionType = this._actionType();
        if (actionType) {
            (actionType === "melee") ? res.push(actionTypes.melee) : res.push(actionTypes.range);
        };
        res.push(actionTypes.effect("spell"));
        this.getSecondaryAttack(res);
        if (S.isJust(this._getAlternativeDamage())) {
            res.push(actionTypes.alt("spell"));
        };
        return res;
    }

    getSecondaryAttack(arr) {
        const secondaryType = this._secondaryAction()
        if (secondaryType) {
            (secondaryType === "melee") ? arr.push(actionTypes.melee) : arr.push(actionTypes.range);
        };
    }

    getMiscDialogueModes() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        const res = [];
        const actionType = this._actionType();
        const hasDamage = (data.damage) ? true : false
        if (actionType) {
            if (actionType === "melee" || actionType === "ranged") {
                (actionType === "melee") ? res.push(actionTypes.melee) : res.push(actionTypes.range);
                (data.weaponType === "melee") ? res.push(actionTypes.effect("melee")) : res.push(actionTypes.effect("ranged"));
                if (S.isJust(this._getAlternativeDamage())) {
                    (data.weaponType === "melee") ? res.push(actionTypes.alt("melee")) : res.push(actionTypes.alt("ranged"));
                };
            }
        }
        this.getSecondaryAttack(res);
        if (actionType === "formula") {
            if (hasDamage) {
                res.push(actionTypes.effect("spell"));
            };
            if (S.isJust(this._getAlternativeDamage())) {
                res.push(actionTypes.alt("spell"));
            };
        }
        return res;
    }

    getWeaponDamageComponents(isAlternative) {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        const weaponType = (this.type === "weapon") ? this.data.data.weaponType : "na"

        return {
            name: this.name,
            sourceItemType: this.type,
            "damageMod": S.fromMaybe(0)(S.map(v => v.value)(this.getWeaponDamageModifier(weaponType))), // why isn't this just on damage?
            "bonusAtr": (!isAlternative) ? this._getBonus() : this._getSecondaryBonus(),
            "formulas": (!isAlternative) ? this._getParsedDamageFormula(this._getRegularDamage()) : this._getParsedDamageFormula(this._getAlternativeDamage()),
            "damageType": (!isAlternative) ? this._getDamageType() : this._getAltDamageType(),
            "casting": data.casting || ""
        }
    }

    /** gets parameters ffor range, duration, consumption */
    getUsageFormulas() {
        if (this.type === "weapon") {
            return [];
        } else {
            const res = []
            const range = this._getRangeDetails();
            const duration = this._getDurationDetails();
            const template = this._getTemplateDetails();
            if (range) { res.push(range) };
            if (duration) { res.push(duration) };
            if (template) { res.push(template) };
            return res;
        }
    }

    // TODO
    // _hasTemplate() {
    //     const target = this._getTarget();
    //     if (target.value && target.units === "ft") {
    //         if (G.areaTargetTypes.includes(target.type)) {
    //             return true;
    //         } else {
    //             return false;
    //         }
    //     } else {
    //         return false;
    //     }
    // }

    _getRangeDetails() {
        const range = this._getRange();
        const applicableUnits = ["ft", "mi", "other"];
        if (range.value && applicableUnits.includes(range.units)) {
            const details = roll.getFormulaType(range.value, range.units);
            return {
                "type": "range",
                "data": details
            }
        } else {
            return null;
        }
    }

    _getDurationDetails() {
        const duration = this._getDuration();
        if (duration.value) {
            const details = roll.getFormulaType(duration.value, duration.units);
            return {
                "type": "duration",
                "data": details
            }
        } else {
            return null;
        }
    }

    _getTemplateDetails() {
        const target = this._getTarget();
        if (target.value) {
            const details = roll.getFormulaType(target.value, target.units);
            const targetType = { "targetType": target.type };
            return {
                "type": "template",
                "data": mergeObject(details, targetType)
            };
        } else {
            return null;
        }
    }
}
