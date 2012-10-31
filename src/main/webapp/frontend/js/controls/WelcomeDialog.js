/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class WelcomeDialog is the dialog for configuring the map view.
 */
de.ingrid.mapclient.frontend.controls.WelcomeDialog = Ext.extend(Ext.Window, {
    title: i18n('tWillkommen'),
    autoLoad:{
        url:'/ingrid-webmap-client/frontend/data/welcome_part.html'
    },
    closable: true,
    draggable: true,
    resizable: false,
    constrain: true,
    collapsible: false,
    collapsed: false,
    expandOnShow: false,
    width: 650,
    height: 500,
    shadow: false,
    initHidden: false,
    ctrls:null,
    windowContent: null,
    buttonAlign: 'left',

    /**
     * @cfg map The OpenLayers.Map instance to adjust
     */
    map: null,

    /**
     * The view configuration. The default configuration lists all known
     * properties:
     */
    viewConfig: {
        hasProjectionsList: true,
        hasScaleList: true,
        hasAreasList: true
    },

    /**
     * @cfg projectionsCombo The projections combobox
     */
    projectionsCombo: null,

    /**
     * @cfg scalesCombo The scales combobox
     */
    scalesCombo: null,

    /**
     * Registry for area comboboxes
     */
    areaComboBoxes: new Ext.util.MixedCollection
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.WelcomeDialog.prototype.initComponent = function() {
    var self = this;
    // register the baselayer change handler
    this.map.events.on({
        'changebaselayer': this.onBaseLayerChange,
        scope: this
    });
    
    var cookieState = Ext.util.Cookies.get("ingrid.webmap.client.welcome.dialog.hide") === "true";

    var self = this;
    this.buttons = [
              new Ext.form.Checkbox({id: 'disableWelcomeDialog', boxLabel: i18n('tDisableWelcome'), 
                  checked: cookieState, handler: self.handleDisableWelcomeDialog }),
              new Ext.Toolbar.Fill(),
              { 
                  text: 'Close', handler: function() {
                      self.close();
                  }
              }
    ];
    
    de.ingrid.mapclient.frontend.controls.WelcomeDialog.superclass.initComponent.call(this);
};


de.ingrid.mapclient.frontend.controls.WelcomeDialog.prototype.handleDisableWelcomeDialog = function(element, isActive) {
    Ext.util.Cookies.set("ingrid.webmap.client.welcome.dialog.hide", isActive);
}

de.ingrid.mapclient.frontend.controls.WelcomeDialog.prototype.onBaseLayerChange = function() {
    //console.debug("onBaseLayerChange fired.");
}

/**
 * Render callback (called by Ext)
 */
de.ingrid.mapclient.frontend.controls.WelcomeDialog.prototype.onRender = function() {
    de.ingrid.mapclient.frontend.controls.WelcomeDialog.superclass.onRender.apply(this, arguments);

    var self = this;

    // prevent dragging the underlying map
    this.getEl().swallowEvent('mousedown', false);

    
};

/**
 * Get the current projection of the map
 * @return OpenLayers.Projection instance
 */
de.ingrid.mapclient.frontend.controls.WelcomeDialog.prototype.getMapProjection = function() {
    return de.ingrid.mapclient.frontend.data.MapUtils.getMapProjection(this.map);
};

/**
 * Reset all area comboboxes and scale combobox (except the one given)
 * @param exception Ext.form.ComboBox instance that should not be reseted
 */
de.ingrid.mapclient.frontend.controls.WelcomeDialog.prototype.resetAreaComboBoxes = function(exception) {
    //this.scalesCombo.clearValue();
    this.areaComboBoxes.each(function(item) {
        if (item != exception) {
            item.clearValue();
        }
    });
};

/**
 * Change the map projection to the given one. We assume that the projection
 * definition is loaded already
 * @param newProjCode EPSG code
 */
de.ingrid.mapclient.frontend.controls.WelcomeDialog.prototype.changeProjection = function(newProjCode) {
    de.ingrid.mapclient.frontend.data.MapUtils.changeProjection(newProjCode, this.map, this);
};

/**
 * Get the configured maximal extent transformed by a projection.
 * 
 * @param protection A projection.
 * @return OpenLayers.Bounds instance
 */
de.ingrid.mapclient.frontend.controls.WelcomeDialog.prototype.getMaxExtent = function(protection) {
    return de.ingrid.mapclient.frontend.data.MapUtils.getMaxExtent(protection);
};



/** method[addThousandSeparator]
 *  Add the thousand separator to a string
 *  :param value: ``Number`` or ``String`` input value
 *  :param separator: ``String`` thousand separator
 */
de.ingrid.mapclient.frontend.controls.WelcomeDialog.prototype.addThousandSeparator = function(value, separator) {
    if (separator === null) {
        return value;
    }
    value = value.toString();
    var sRegExp = new RegExp('(-?[0-9]+)([0-9]{3})');
    while (sRegExp.test(value)) {
        value = value.replace(sRegExp, '$1' + separator + '$2');
    }
    // Remove the thousand separator after decimal separator
    if (this.decimalNumber > 3) {
        var decimalPosition = value.lastIndexOf(this.getLocalDecimalSeparator());
        if (decimalPosition > 0) {
            var postDecimalCharacter = value.substr(decimalPosition);
            value = value.substr(0, decimalPosition) + postDecimalCharacter.replace(separator, '');
        }
    }
    return value;
};
