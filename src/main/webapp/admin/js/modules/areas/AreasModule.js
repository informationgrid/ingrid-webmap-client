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
 * @class ServicesModule provides configuration for predefined map areas.
 */
Ext.define('de.ingrid.mapclient.admin.modules.areas.AreasModule',  { 
	extend:'de.ingrid.mapclient.admin.modules.ModuleBase',
	title: 'Vordefinierte Bereiche',
	layout: 'form',
	labelAlign: 'top',
	labelSeparator: '',
	buttonAlign: 'right',
	border: false,
	padding: 10,
	autoScroll:true,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {

		Ext.apply(this, {
			items: Ext.create('de.ingrid.mapclient.admin.modules.areas.AreaCategoryPanel')
		});
		de.ingrid.mapclient.admin.modules.areas.AreasModule.superclass.initComponent.call(this);
	},
	/**
	 * @see de.ingrid.mapclient.admin.modules.ModuleBase.prototype.getId
	 */
	getId: function() {
		return "areas";
	}
});

/**
 * Register the module
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule(new de.ingrid.mapclient.admin.modules.areas.AreasModule());
