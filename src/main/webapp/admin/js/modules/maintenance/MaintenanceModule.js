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
Ext.namespace("de.ingrid.mapclient.admin.modules.maintenance");

/**
 * @class BaseModule provides configuration for the default
 * map parameters.
 */
Ext.define('de.ingrid.mapclient.admin.modules.maintenance.MaintenanceModule', { 
	extend:'de.ingrid.mapclient.admin.modules.ModuleBase', 
	id: 'maintenance',
	title: 'Dienste',
	layout: 'accordion',
	defaults: {
		autoScroll: true
	},
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		// add the accordion panels
		Ext.apply(this, {
			items: [
			        Ext.create('de.ingrid.mapclient.admin.modules.maintenance.ServicePanel')
			]
		});
		de.ingrid.mapclient.admin.modules.maintenance.MaintenanceModule.superclass.initComponent.call(this);
	},
	/**
	 * @see de.ingrid.mapclient.admin.modules.ModuleBase.prototype.getId
	 */
	getId: function() {
		return this.id;
	}
});

/**
 * Register the module
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule(Ext.create('de.ingrid.mapclient.admin.modules.maintenance.MaintenanceModule'));
