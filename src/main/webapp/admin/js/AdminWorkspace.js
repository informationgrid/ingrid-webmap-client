/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 wemove digital solutions GmbH
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
/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin");

/**
 * @class AdminWorkspace is the main gui component for the administration application.
 */
de.ingrid.mapclient.admin.AdminWorkspace = Ext.extend(Ext.Viewport, {
	id: 'adminWorkspace',
	layout: 'border',
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {

		var moduleContainer = new de.ingrid.mapclient.admin.modules.ModuleContainer();
	    var toolbar = Ext.create('Ext.toolbar.Toolbar', {
	        items: [{
				xtype: 'tbtext',
				text: 'InGrid Map Client Administration',
				cls: 'title'
			}/*, '->', {
				text: 'Abmelden'
			}*/],
	        height: 40
	    });

		Ext.apply(this, {
			items: [{
				region: 'north',
				tbar: toolbar
			}, {
				region: 'center',
				layout: 'fit',
				items: moduleContainer
			}]
		});
		de.ingrid.mapclient.admin.AdminWorkspace.superclass.initComponent.call(this);
	}
});