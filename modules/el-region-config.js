export class ELRegionConfig extends foundry.applications.sheets.RegionConfig {
  /** @override */
  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    identity: {
      template: "templates/scene/parts/region-identity.hbs"
    },
    shapes: {
      template: "templates/scene/parts/region-shapes.hbs",
      scrollable: [".scrollable"]
    },
    behaviors: {
      template: "templates/scene/parts/region-behaviors.hbs",
      scrollable: [".scrollable"]
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  };

  /* -------------------------------------------- */

  /**
   * Handle button clicks to edit a behavior.
   * @param {PointerEvent} event
   * @this {RegionConfig}
   */
  static async #onBehaviorEdit(event) {
    preventdefault(event);
    console.log("ELRegionConfig#_onBehaviorEdit", event);
    const target = event.target;
    if ( target.closest(".region-element-name") && (event.detail !== 2) ) return; // Double-click on name
    const behavior = this.#getControlBehavior(event);
    await behavior.sheet.render(true);
  }
  
    /* -------------------------------------------- */

  /**
   * Get the RegionBehavior document from a control button click.
   * @param {PointerEvent} event    The button-click event
   * @returns {RegionBehavior}      The region behavior document
   */
  #getControlBehavior(event) {
    console.log("ELRegionConfig#_getControlBehavior", event);
    const button = event.target;
    const li = button.closest(".region-behavior");
    return this.document.behaviors.get(li.dataset.behaviorId);
  }


  getRegionDetails() {
    return {
      name: this.regionName,
      code: this.regionCode,
      type: this.regionType,
      description: this.regionDescription,
      url: this.regionUrl
    };
  }
  
}
