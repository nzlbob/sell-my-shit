//import { ELRegionConfig } from "./el-region-config.js";
// console.log("Hello World! This code runs immediately when the file is loaded.");

Hooks.on("init", function() {
 // console.log("This code runs once the Foundry VTT software begins its initialization workflow.");

});

Hooks.on("ready", function() {
 // console.log("This code runs once core initialization is ready and game data is available.");
});

Hooks.on("renderActorSheet", function(app, html, data) {
  const actor = app.actor;
 // console.log("This code runs when the Actor Sheet is rendered.", app, html, data);
  // Example: Add a button to the Actor Sheet

 if ( ["drone","character"].includes(app.actor.type) && actor.name.toLowerCase().includes("loot")) {
   // const currentStarship = game.settings.get("sfrpg-galactic-trade", "myShip") ?? {};
  //  const myShip = game.actors.directory.documents.find((actor) => actor.uuid === currentStarship )
//console.log(actor)

 // const buttonclass = myShip.id === app.actor.id? "ISSHIPSETCLICK" : "NOTSHIPSETCLICK"
//const tradetext = myShip.id === app.actor.id? "My Trade Ship" : "Set as My Ship"



    const middleColumn = html.find(".inventory-filters");
    const button = '<div class="sell-my-shit" data-id = "'+actor.id+'"data-type = "sell"> <button type="button"> Sell My Shit</button> </div>'//  $(`<button class="npc-button" title="NPC"><i class="fas fa-dollar-sign"></i></button>`);
      //const button = '<div class="NPCSETCLICK" data-id = "'+app.actor.id+'"> <button type="button"> Set NPC Skills</button> </div>'//  $(`<button class="npc-button" title="NPC"><i class="fas fa-dollar-sign"></i></button>`);
      //  button.click(() => {
   middleColumn.append(button);
    //   console.log("Trade Button Clicked")
    //   console.log("middleColumn", middleColumn)
  
       html.find(".sell-my-shit").click(sellMyShit.bind(html));
   //    html.find(".NOTSHIPSETCLICK").click(onSetShip.bind(html));
   
       //    Operations.buyCargo(app.actor)
   //   });
    //  html.find(".sheet-header").append(button);
    }


});

async function sellMyShit(event) {
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
  if (item.system.equipped === true ) return false;
salevalue += (item.system.price * item.system.quantity * 0.1);
sellItems.push(item.id)
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
sellItem(sellableItems).then( (reply) => console.log(`Selling items:`, reply,sellableItems)
);
}
