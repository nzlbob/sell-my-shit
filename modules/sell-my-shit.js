//import { ELRegionConfig } from "./el-region-config.js";
import { SMS } from "./npcdata.js"
// console.log("Hello World! This code runs immediately when the file is loaded.");

Hooks.on("init", function () {
  // console.log("This code runs once the Foundry VTT software begins its initialization workflow.");
  game.settings.register("sell-my-shit", "itemSellRate", {
    name: "Sell Rate",
    hint: "The percentage of an item's value that is received when sold. (SFRPG standard = 10%",
    scope: "world",
    type: Number,
    default: 10,
    config: true
  });

  CONFIG.SFRPG.combatRoles = {
    trap: "SMS.CombatRoles.Trap",
    combatant: "SFRPG.CombatRoles.Combatant",
    expert: "SFRPG.CombatRoles.Expert",
    spellcaster: "SFRPG.CombatRoles.Spellcaster"
  }
  CONFIG.SFRPG.combatRolesDescriptions = {
    trap: "SMS.CombatRoles.Descriptions.Trap",
    combatant: "SFRPG.CombatRoles.Descriptions.Combatant",
    expert: "SFRPG.CombatRoles.Descriptions.Expert",
    spellcaster: "SFRPG.CombatRoles.Descriptions.Spellcaster"
  }
  CONFIG.SFRPG.combatRoleImages = {
    trap: "systems/sfrpg/images/cup/gameplay/combatant.webp",
    combatant: "systems/sfrpg/images/cup/gameplay/combatant.webp",
    expert: "systems/sfrpg/images/cup/gameplay/expert.webp",
    spellcaster: "systems/sfrpg/images/cup/gameplay/spellcaster.webp"
  }



});

Hooks.on("ready", function () {
  // console.log("This code runs once core initialization is ready and game data is available.");

});

Hooks.on("renderActorSheet", function (app, html, data) {

  const actor = app.actor;


  if (["drone", "character"].includes(app.actor.type) && actor.name.toLowerCase().includes("loot")) {

    const middleColumn = html.find(".inventory-filters");
    const button = '<div class="sell-my-shit" data-id = "' + actor.id + '"data-type = "sell"> <button type="button"> Sell My Shit</button> </div>'//  $(`<button class="npc-button" title="NPC"><i class="fas fa-dollar-sign"></i></button>`);

    middleColumn.append(button);


    html.find(".sell-my-shit").click(sellMyShit.bind(html));

  }

  if (["npc", "npc2"].includes(app.actor.type)) {
    const tokenid = actor.token ? actor.token.id : "null";
    const skillList = html.find(".skills-list");
    console.log("Skills List:", app);
    const HPButton = '<div class="setmaxhp" data-id = "' + actor.id + '" data-token = "' + actor.isToken + '" data-tokenid = "' + tokenid + '"> <button type="button"> Set Max HP</button> </div>'//  $(`<button class="npc-button" title="NPC"><i class="fas fa-dollar-sign"></i></button>`);
    skillList.append(HPButton);
    html.find(".setmaxhp").click(setNPC.bind(html));
  }
});

async function setNPC(event) {
  console.log("Set NPC HP clicked");
  var actor
  const button = $(event.currentTarget);
  const actorId = button.data("id");
  const isToken = button.data("token");
  const tokenId = button.data("tokenid");
  console.log("Actor ID:", actorId, "Is Token:", isToken, "Token ID:", tokenId);
  if (isToken) {
    const token = await canvas.tokens.get(tokenId);
    if (token) {
      console.log("Token found:", token);
      actor = token.actor;
    } else {
      console.error("Token not found with ID:", tokenId);
      return;
    }
  } else {
    actor = await game.actors.get(actorId);
    if (!actor) {
      console.error("Actor not found with ID:", actorId);
      return;
    }
  }

  console.log("Actor:", actor);


  let templateData = {
    actor: actor,
    npctype: actor.system.details.combatRole,
    extrahp: actor.flags.sms?.extrahp || false,
    hp: actor.system.attributes.hp.value,
    maxhp: actor.system.attributes.hp.max,
    gmnotes: actor.system.gmnotes || "",
    name: actor.name
  }

  //  console.log(templateData)


  const content = await renderTemplate("modules/sell-my-shit/templates/set-npc-hp.html", templateData);



  const updateNPCHP = async (data) => {
    const hp = foundry.utils.duplicate(templateData.actor.system.attributes.hp);
    if (templateData.npctype) {
      const maxhp = SMS.HP[templateData.npctype][templateData.actor.system.details.cr];
      hp.max = maxhp;
      hp.value = maxhp;
      if (templateData.extrahp) {
        hp.max += Math.floor(hp.max * 0.2);
        hp.value += Math.floor(hp.max * 0.2);
      }




      return hp;
    }

    const result = await Dialog.prompt({
      title: "Set NPC Max HP",
      content: content,

      label: "Set Max HP",
      callback: (html, s) => {

        const form = html[0].querySelector("form");
        let formDataExtended = new FormDataExtended(form);
        foundry.utils.mergeObject(templateData, formDataExtended.object);
        console.log(templateData, formDataExtended);

        if (templateData.npctype) {
          const maxhp = SMS.HP[templateData.npctype][templateData.actor.system.details.cr];
          hp.max = maxhp;
          hp.value = maxhp;
          if (templateData.extrahp) {
            hp.max += Math.floor(hp.max * 0.2);
            hp.value += Math.floor(hp.max * 0.2);
          }
        }
        else {
          hp.value = hp.max;
        }

        //hp.tooltip = ["Set to Max HP"];



        //  actor.update({ "system.attributes.hp": hp });
      }
    });
    return hp;
  };
  updateNPCHP(templateData).then((reply) => {

    actor.update({

      "system.attributes.hp.max": reply.max,
      "system.attributes.hp.value": reply.value,
      "system.details.combatRole": templateData.npctype,
      "flags.sms.extrahp": templateData.extrahp === "extrahp" ? true : false,
    });
    console.log(`HP Updated`, templateData);

  });
}



async function sellMyShit(event) {
  const rate = await game.settings.get("sell-my-shit", "itemSellRate") / 100;
  const saleableItems = CONFIG.SFRPG.physicalItemTypes;
  let salevalue = 0
  const button = $(event.currentTarget);
  const actorId = button.data("id");
  const actor = game.actors.get(actorId);
  const sellItems = [];
  //  console.log("Sell My Shit clicked for actor:", actor);
  // Implement your selling logic here



  const sellableItems = actor.items.contents.filter(item => {

    if (!saleableItems.includes(item.type)) return false;
    if (item.system.price === 0) return false;
    if (item.system.quantity === 0) return false;
    if (item.system.equipped === true) return false;
    if (item.parentItem && (item.parentItem.type !== "container")) {
      console.log("Parent Item found:", item.parentItem);
      if (item.parentItem.system.price === 0) return false;
      if (item.parentItem.system.quantity === 0) return false;
      if (item.parentItem.system.equipped === true) return false;
    }
    const packsize = item.system.quantityPerPack > 0 ? item.system.quantityPerPack : 1;

    let sellRate = rate
    if (item.type === "goods") sellRate = 1;

    salevalue += (item.system.price * item.system.quantity * sellRate / packsize);
    //console.log(salevalue);
    sellItems.push(item.id);
    return true;
  });

  const sellItem = async (items) => {
    const result = await Dialog.prompt({
      title: "Sell Items",
      content: "Are you sure you want to sell " + items.length + " items for " + salevalue + " Cr.?",
      label: "Sell",
      callback: () => {
        // Logic to sell the item
        console.log(`Selling items:`, items);
        //items.forEach(item => item.delete());
        actor.deleteEmbeddedDocuments("Item", sellItems);

        actor.update({ "system.currency.credit": actor.system.currency.credit + salevalue });



      }
    });
  };
  sellItem(sellableItems).then((reply) => console.log(`Selling items:`, reply, sellableItems)
  );
}
