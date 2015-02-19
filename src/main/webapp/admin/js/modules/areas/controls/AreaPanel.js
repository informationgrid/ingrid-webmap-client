/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
Ext.namespace("de.ingrid.mapclient.admin.modules.areas");

/**
 * @class AreaPanel is used to manage a map area.
 */

Ext.define('de.ingrid.mapclient.admin.modules.areas.AreaPanel', { 
	extend: 'de.ingrid.mapclient.admin.controls.GridPanel',
	columns: [],
	dropBoxTitle:'Vordefinierten Bereich l&ouml;schen',
	/**
	 * @see de.ingrid.mapclient.admin.controls.GridPanel.createNewRecordFieldContainer
	 */
	createNewRecordFieldContainer: function() {

	    var newRecordFieldContainers = [];
		var container = Ext.create('Ext.panel.Panel', {
            layout: 'form',
			border: false,
			height: 50,
			columnWidth: .7,
			items: this.newRecordFields.get('name')
		});
		newRecordFieldContainers.push(container);

	    var buttons = this.createButtons();
	    for (var i=0, count=buttons.length; i<count; i++) {
	    	var btnContainer = Ext.create('Ext.panel.Panel', {
	    		columnWidth: .3,
				layout: 'form',
    			height: 50,
        		border: false,
	    		bodyStyle: 'padding-left:10px',
	    		items: buttons[i]
	    	});
	    	newRecordFieldContainers.push(btnContainer);
	    }
	    // use a MapExtendPanel to layout the new record fields
		var mapExtendPanel = Ext.create('de.ingrid.mapclient.admin.controls.MapExtendPanel', {
			columnWidth: 1,
			northField: this.newRecordFields.get('north'),
			westField: this.newRecordFields.get('west'),
			eastField: this.newRecordFields.get('east'),
			southField: this.newRecordFields.get('south')
		});
		newRecordFieldContainers.push(mapExtendPanel);

		var newRecordPanel = Ext.create('Ext.form.Panel', {
			layout: 'column',
			anchor: '100%',
			border: false,
	    	items: newRecordFieldContainers
	    });
	    return newRecordPanel;
	}
});