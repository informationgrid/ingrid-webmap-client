Ext.namespace("GeoExt.ux");

/**
 * @include OpenLayers/Lang.js
 */

Ext.define('GeoExt.ux.CloseFeatureDialog', {
	extend: 'Ext.util.Observable',
    controler: null,

    editFeatureForm: null,

    init: function(form) {
        this.controler = form.controler;

        var actionOptions = {
            handler: this.closeFeatureDialog,
            scope: this,
            tooltip: OpenLayers.i18n('Close')
        };

        actionOptions.text = OpenLayers.i18n("Close");

        var action = Ext.create('Ext.Action', actionOptions);

        var bbar = form.dockedItems.items[0];
        if (bbar.rendered || !bbar.buttons) {
            bbar.add('->');
            bbar.add(action);
        } else {
            bbar.buttons.push('->');
            bbar.buttons.push(action);
        }

        this.editFeatureForm = form;
    },

    closeFeatureDialog: function() {
        this.controler.triggerAutoSave();
        if(this.controler.popup) {
            this.controler.popup.close();
        }
        this.controler.reactivateDrawControl();
    }
});
