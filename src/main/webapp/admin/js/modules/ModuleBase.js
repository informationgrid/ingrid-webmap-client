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
Ext.namespace("de.ingrid.mapclient.admin.modules");

/**
 * @class ModuleBase is the base class for administration modules.
 * Each module is represented by a tab panel in the administration tab container and is required to call the
 * de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule() method to register itself.
 *
 * According to the Extjs component lifecycle two methods are useful to implement:
 * - initComponent: Use this method to define the items contained in the module's panel
 * - onRender: Use this method to initialize the items contained in the module's panel
 * Note that the de.ingrid.mapclient.Configuration instance is not initialized before onRender
 */
Ext.define('de.ingrid.mapclient.admin.modules.ModuleBase', {
	extend: 'Ext.panel.Panel',
	id:'moduleBase',
	/**
	 * Get the id of the module. Subclasses must implement this method
	 * to provide a unique module id.
	 * @return String
	 */
	getId: function() {
		return this.id;
	}
});