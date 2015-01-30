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
/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.admin.modules");

/**
 * @class ModuleContainer is a tab container that displays the
 * administration modules. Each module must call the de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule()
 * method to register itself. After the application configuration is loaded,
 * the de.ingrid.mapclient.admin.modules.ModuleContainer.initialize() method
 * must be called to initialize all modules.
 */
de.ingrid.mapclient.admin.modules.ModuleContainer = Ext.extend(Ext.TabPanel, {
	activeTab: 0
});

/**
 * Initialize the component (called by Ext)
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.prototype.initComponent = function() {
	this.items = [];
	var modules = de.ingrid.mapclient.admin.modules.ModuleContainer.modules;

	// get the module configuration
	var allowedModules = de.ingrid.mapclient.Configuration.getProperty("administration.modules").replace(/\s*,\s*/g, ",").split(",");

	for (var i=0, count=modules.length; i<count; i++) {
		var curModule = modules[i];
		if (allowedModules.indexOf(curModule.getId()) >= 0) {
			this.items.push(modules[i]);
		}
	}
	de.ingrid.mapclient.admin.modules.ModuleContainer.superclass.initComponent.call(this);
};

/**
 * Initialize the registered modules
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.prototype.initialize = function() {
	var modules = de.ingrid.mapclient.admin.modules.ModuleContainer.modules;
	for (var i=0, count=modules.length; i<count; i++) {
		modules[i].initialize();
	}
};

/**
 * Register a module instance
 * @param instance Instance of de.ingrid.mapclient.admin.modules.ModuleBase subclass
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.registerModule = function(instance) {
	if (instance instanceof de.ingrid.mapclient.admin.modules.ModuleBase) {
		de.ingrid.mapclient.admin.modules.ModuleContainer.modules.push(instance);
	}
	else {
		throw "Module '"+instance+"' must inherit from de.ingrid.mapclient.admin.modules.ModuleBase";
	}
};

/**
 * Module registry
 */
de.ingrid.mapclient.admin.modules.ModuleContainer.modules = [];
