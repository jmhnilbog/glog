import { G } from "../config.js";
import BaseGlogSheet from "./base-sheet.js";
import { GlogActorTweaks } from "../dialog/actor-tweaks.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class GlogCharacterSheet extends BaseGlogSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["glog", "sheet", "actor", "character"],
      width: 720,
      height: 680
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const context = super.getData();

    context.data.collectedItems = this._collectItems(context);



    // Stats
    const rollAbleStats = new Set(CONFIG.G.rollableStats);
    for (let [s, stat] of Object.entries(context.data.stats)) {
      stat.label = CONFIG.G.stats[s];
      if (rollAbleStats.has(s)) {
        stat.rollable = true;
      } else {
        stat.rollable = false;
      }

    }

    for (let [s, stat] of Object.entries(context.data.primaryStats)) {
      stat.label = CONFIG.G.shortPrimaryStats[s];
      // stat.bonus = 0;  // makes life easier down the line and will never not be 0.
    }

    // Resources
    context.data.resources = ["primary", "secondary", "tertiary"].reduce((arr, r) => {
      const res = context.data.resources[r] || {};
      res.name = r;
      res.placeholder = r.titleCase();
      if (res && res.value === 0) delete res.value;
      if (res && res.max === 0) delete res.max;
      return arr.concat([res]);
    }, []);

    // Extra Resources
    context.data.extraResources = ["extra1", "extra2", "extra3"].reduce((arr, r) => {
      const res = context.data.resources[r] || {};
      res.name = r;
      res.placeholder = r.titleCase();
      if (res && res.value === 0) delete res.value;
      if (res && res.max === 0) delete res.max;
      return arr.concat([res]);
    }, []);

    const relevantStatMods = context.data.relevantStatMods;
    const equippedModSummary = context.data.equippedModSummary;

    console.log("CONTEXT (now)", context);
    // Calculate fatigue 
    context.data.aux.fatigue.mod = equippedModSummary["fatigueMod"]
    context.data.aux.fatigue.total = context.data.aux.fatigue.mod
      + context.data.aux.fatigue.value

    relevantStatMods.auto.mods.sort((a, b) => b.value - a.value);
    relevantStatMods.autoEffects.mods.sort((a, b) => b.value - a.value);

    // get the equip/not equip working 
    for (let item of relevantStatMods.autoEffects.mods) {
      this._prepareItemToggleState(item);
    };
    for (let item of relevantStatMods.manualEffects.mods) {
      this._prepareItemToggleState(item);
    };
    context.data.effects = Object.values(relevantStatMods);

    // Prepare owned items
    this._prepareItems(context.data);

    return context;
  }

  _prepareItems(data) {
    // Categorize items as inventory, spellbook, features, and classes
    const inventory = {
      weapon: { label: "Weapon", items: [], dataset: { type: "weapon" }, isPC: true },
      equipment: { label: "Equipment", items: [], dataset: { type: "equipment" }, isPC: true },
      consumable: { label: "Consumable", items: [], dataset: { type: "consumable" }, isPC: true },
      loot: { label: "Loot", items: [], dataset: { type: "loot" }, isLoot: true, isPC: true }
    };

    const items = data.collectedItems.items;
    const spells = data.collectedItems.spells;
    const feats = data.collectedItems.feats;
    const archetypes = data.collectedItems.archetypes;

    // Organize items
    for (let i of items) {
      i.data.quantity = i.data.quantity || 1;
      i.data.slots = i.data.slots || 0;
      i.totalSlots = (i.data.slots === 0) ? 0 : i.data.quantity * i.data.slots;
      inventory[i.type].items.push(i);
    }

    // Organize Features
    const features = {
      classes: { label: "Classes", items: [], hasActions: false, dataset: { type: "archetype" }, isClass: true, isPC: true },
      race: { label: "Race", items: [], hasActions: true, dataset: { type: "feat", "activation.type": "", "skillorrace": "race" }, isFeat: true, isRace: true, isPC: true },
      skills: { label: "Skills", items: [], hasActions: true, dataset: { type: "feat", "activation.type": "" }, isFeat: true, isPC: true }
    };

    features.classes.items = archetypes;
    for (let f of feats) {
      (f.data.skillorrace === "skill") ? features.skills.items.push(f) : features.race.items.push(f)
    };

    // organize spellbook
    const spellbook = {
      cantrips: { label: "Cantrips", items: [], hasActions: false, dataset: { type: "spell" }, isPC: true },
      spells: { label: "Spells", items: [], hasActions: false, dataset: { type: "spell" }, isPC: true },
      alt: { label: "Alternates", items: [], hasActions: false, dataset: { type: "spell" }, isPC: true },
      spellbook: { label: "Spellbook", items: [], hasActions: false, dataset: { type: "spell" }, isPC: true }
    };

    for (let s of spells) {
      s.order = G.spellOrder[s.data.type];
      s.levelLabel = G.spellLevels[s.data.level];
      if (s.data.type === "cantrip") {
        spellbook.cantrips.items.push(s);
      } else if (s.data.type === "brain") {
        spellbook.spells.items.push(s);
      } else if (s.data.type === "alternate") {
        spellbook.alt.items.push(s);
      } else {
        spellbook.spellbook.items.push(s);

      }
    }

    spellbook.spells.items.sort((a, b) => {
      if (a.name < b.name) { return -1; }
      if (a.name > b.name) { return 1; }
      return 0;
    })

    spellbook.spellbook.items.sort((a, b) => {
      if (a.name < b.name) { return -1; }
      if (a.name > b.name) { return 1; }
      return 0;
    })

    spellbook.alt.items.sort((a, b) => {
      if (a.name < b.name) { return -1; }
      if (a.name > b.name) { return 1; }
      return 0;
    })

    // Assign and return
    data.inventory = Object.values(inventory);
    data.spellbook = Object.values(spellbook);
    // data.preparedSpells = nPrepared;
    data.features = Object.values(features);

    data['classTitle'] = this._generateClassTitle(features.classes.items, features.race.items);

  }

  _generateClassTitle(archetypes, race) {
    const raceStr = (race.length) ? race[0].name : "???";
    const maybeClassStr = archetypes.reduce(function (acc, elem) {
      return acc + ` ${elem.name} (${elem.data.tier})`
    }, "");
    const classStr = (maybeClassStr) ? maybeClassStr : "???";

    return `The ${raceStr} ${classStr}`;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    // Short and Long Rest
    html.find('.short-rest').click(this._onShortRest.bind(this));
    html.find('.long-rest').click(this._onLongRest.bind(this));
  }

  /**
 * Take a short rest, calling the relevant function on the Actor instance
 * @param {Event} event   The triggering click event
 * @private
 */
  async _onShortRest(event) {
    event.preventDefault();
    await this._onSubmit(event);
    return this.actor.shortRest();
  }

  /* -------------------------------------------- */

  /**
   * Take a long rest, calling the relevant function on the Actor instance
   * @param {Event} event   The triggering click event
   * @private
   */
  async _onLongRest(event) {
    event.preventDefault();
    await this._onSubmit(event);
    return this.actor.longRest();
  }

  /**
  * Extend and override the sheet header buttons so we can add a 
  * popup to turn off specific automation things. 
  * 
  * @override
  */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();

    // Token Configuration
    const canConfigure = game.user.isGM || this.actor.owner;
    if (this.options.editable && canConfigure) {
      buttons = [
        {
          label: "tweaks",
          class: "configure-actor",
          icon: "fas fa-code",
          onclick: (ev) => this._onConfigureActor(ev),
        },
      ].concat(buttons);
    }
    return buttons;
  }

  _onConfigureActor(event) {
    event.preventDefault();
    new GlogActorTweaks(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }


}
