/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class BWaStr is the dialog used for BWaStr Locator.
 */
de.ingrid.mapclient.frontend.controls.BWaStr = Ext.extend(Ext.Window, {
	title: i18n('tBWaStr'),
	closable: true,
	draggable: true,
	resizable: false,
	width: 500,
	height: 500,
	shadow: false,
	initHidden: false,
	ctrls:null,

	record: null,
	map: null,
	/**
     * Initialize the component (called by Ext)
     */
    initComponent: function() {
    	var self = this;
    	
    	var data = this.record.data;
    
    	var panelCenter = new Ext.Panel({
			id: 'panel_bwastrForm',
			border: false,
			region: 'center',
    		items:[	{
                bodyStyle: 'padding: 0 10px;',
                border: false,
        		items: [{
                    xtype: 'fieldset',
                    title: 'BWaStr-Info',
                    autoHeight: true,
                    items: [{
                        xtype: 'panel',
                        title: '',
                        layout: 'column',
                        border: false,
                        items: [{
                        	columnWidth:.33,
                            xtype: 'label',
                            style: {
                                fontWeight: 'bold'
                            },
                            text: 'BWaStr-IdNr:'
                    	},{
                    		columnWidth:.33,
                            xtype: 'label',
                            style: {
                                fontWeight: 'bold'
                            },
                            text: 'BWaStr-Bezeichnung:'
                    	},{
                    		columnWidth:.33,
                            xtype: 'label',
                            style: {
                                fontWeight: 'bold'
                            },
    	                    text: 'Streckenbezeichnung:'
                    	},{
                        	columnWidth:.33,
                            xtype: 'label',
                            text: data.bwastrid
                    	},{
                    		columnWidth:.33,
                            xtype: 'label',
                            text: data.bwastr_name
                    	},{
                    		columnWidth:.33,
                            xtype: 'label',
    	                    text: data.strecken_name
                    	}]
                    }]
                },{
                    xtype: 'fieldset',
                    title: 'Auswahl',
                    autoHeight: true,
                    defaultType: 'radio', // each item will be a radio button
                    layout: 'column',
                    items: [
                        {
    			    		id: 'radio_bwastrKmToCoords',
    			    		columnWidth:.5,
                            checked: true,
    			            fieldLabel: '',
    			            hideLabel: true,
    			            boxLabel: '<b>BWaStr-Kilometer &#8594; Koordinaten</b>',
    			            name: 'bwastr-selection',
    			            inputValue: 'bwastrKmToCoords',
    			            handler: function(el, status){
    			    			if(status == true){
    			    				var fieldset_bwastrKmToCoords = Ext.getCmp("fieldset_bwastrKmToCoords");
    			    				var fieldset_bwastrCoordsToKm = Ext.getCmp("fieldset_bwastrCoordsToKm");
    			    				if(fieldset_bwastrKmToCoords && fieldset_bwastrCoordsToKm){
    				    				fieldset_bwastrKmToCoords.show();
    				    				fieldset_bwastrCoordsToKm.hide();
    			    				}
    			    			}
    			        	}
    			        },
                        {
                    		id: 'radio_bwastrCoordsToKm',
                    		columnWidth:.5,
                            fieldLabel: '',
                            hideLabel: true,
                            labelSeparator: '',
                            boxLabel: '<b>Koordinaten &#8594; BWaStr-Kilometer</b>',
                            name: 'bwastr-selection',
                            inputValue: 'bwastrCoordsToKm',
                            handler: function(el, status){
                        		if(status == true){
                        			var fieldset_bwastrKmToCoords = Ext.getCmp("fieldset_bwastrKmToCoords");
                        			var fieldset_bwastrCoordsToKm = Ext.getCmp("fieldset_bwastrCoordsToKm");
                        			if(fieldset_bwastrKmToCoords && fieldset_bwastrCoordsToKm){
                        				fieldset_bwastrKmToCoords.hide();
                            			fieldset_bwastrCoordsToKm.show();
                        			}
                        			
                        			// Select first value of "combo_multiQuery"
                        			var combo_coordsToKmQuery = Ext.getCmp("combo_coordsToKmQuery");
                        			if(combo_coordsToKmQuery){
                        				combo_coordsToKmQuery.setValue('1');
                        			}
                        		}
                        	}
                    	}
                    ]
                },
                {
                	xtype: 'fieldset',
                	id: 'fieldset_bwastrKmToCoords',
                    title: 'BWaStr-Kilometer &#8594; Koordinaten',
                    autoHeight: true,
                    defaultType: 'radio', // each item will be a radio button
                    items: [{
                        xtype: 'fieldset',
                        title: '',
                        layout: 'column',
                        items: [{
                        	columnWidth:.5,
                            xtype: 'radio',
                            id: 'radio_singleQuery',
                            fieldLabel: '',
                            hideLabel: true,
                            labelSeparator: '',
                            boxLabel: '<b>Einfachabfrage</b>',
                            name: 'bwastr-query',
                            inputValue: 'singleQuery',
                        	checked: true,
                        	handler: function(el, status){
                        		if(status){
                        			var fieldset_singleQuery = Ext.getCmp("fieldset_singleQuery");
                        			var fieldset_multiQuery = Ext.getCmp("fieldset_multiQuery");
                        			if(fieldset_singleQuery && fieldset_multiQuery){
                        				fieldset_singleQuery.show();
                        				fieldset_multiQuery.hide();
                        			}
                        		}
                        	}
                    	},{
                    		columnWidth:.5,
                            xtype: 'radio',
                            id: 'radio_multiQuery',
                            fieldLabel: '',
                            hideLabel: true,
                            labelSeparator: '',
                            boxLabel: '<b>Mehrfachabfrage</b>', 
                            name: 'bwastr-query',
                            inputValue: 'multiQuery',
                        	handler: function(el, status){
                        		if(status){
                        			var fieldset_singleQuery = Ext.getCmp("fieldset_singleQuery");
                        			var fieldset_multiQuery = Ext.getCmp("fieldset_multiQuery");
                        			if(fieldset_singleQuery && fieldset_multiQuery){
                        				fieldset_singleQuery.hide();
                            			fieldset_multiQuery.show();     
                        			}
                        			
                        			// Select first value of "combo_multiQuery"
                        			var combo_multiQuery = Ext.getCmp("combo_multiQuery");
                        			if(combo_multiQuery){
                        				combo_multiQuery.setValue('1');
                        			}
                        		}
                            }
                    	}]
                    },
                    {
                    	xtype: 'fieldset',
                    	id: 'fieldset_singleQuery',
                        autoHeight: true,
                        defaultType: 'textfield', 
                        defaults: {width: 230},
                        items: [{
    		                        xtype: 'numberfield',
    		                        id:'textfield_singleQueryFrom',
    		                        labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    		                        fieldLabel: 'Von [km] (' + data.km_von + ')'
    		                    },
    		                    {
    		                        xtype: 'numberfield',
    		                        id:'textfield_singleQueryTo',
    		                        labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    		                        fieldLabel: 'Bis [km] (' + data.km_bis + ')'
    		                    },
    		                    {
    		                        xtype: 'numberfield',
    		                        id:'textfield_singleQueryOffset',
    		                        labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    		                        fieldLabel: 'Seitlicher Abstand [m]'
    		                    },
    		                    {
    		            			xtype: 'container',
    		            			height: 20
    		            	    },
    		                    {
    		                        xtype: 'button',
    		                        id:'button_singleQuery',
    		                        text: 'Geokodierung berechnen',
    		                        handler: function(btn, evt){
    		                        	var textfield_singleQueryFrom = Ext.getCmp("textfield_singleQueryFrom");
    		                        	var textfield_singleQueryTo = Ext.getCmp("textfield_singleQueryTo");
    		                        	var textfield_singleQueryOffset = Ext.getCmp("textfield_singleQueryOffset");
    		                        	var projection = self.map.projection;
    		                        	var content = '{"limit":200,"queries":[{"qid":1,"bwastrid":"'
    		                        		+ data.bwastrid +'","stationierung":{"km_von":'
    		                        		+ textfield_singleQueryFrom.getValue() + ',"km_bis":'
    		                        		+ textfield_singleQueryTo.getValue() + ',"offset":'
    		                        		+ textfield_singleQueryOffset.getValue() + '},"spatialReference":{"wkid":'
    		                        		+ projection.split(":")[1] + '}}]}';
    		                        	
    		                        	self.loadData("/ingrid-webmap-client/rest/jsonCallback/queryPost?url=http://atlas.wsv.bvbs.bund.de/bwastr-locator-qs/rest/geokodierung/query&data=" + content);
    		                        }
    		                    }
    		             ]
                    },
                    {
                    	xtype: 'fieldset',
                    	id: 'fieldset_multiQuery',
                        autoHeight: true,
                        hidden: true,
                        defaultType: 'textfield', 
                        defaults: {width: 230},
                        items: [{
    		                        xtype: 'combo',
    		                        id:'combo_multiQuery',
    		                        store: new Ext.data.ArrayStore({
    		                            fields: ['value', 'display'],
    		                            data : [['1','Km'],
    		                                    ['2','Km und Abstand'],
    		                                    ['3','Von und Bis'],
    		                                    ['4','Von und Bis und Abstand'],
    		                                    ['5','Id und Km'],
    		                                    ['6','Id und Km und Abstand'],
    		                                    ['7','Id und Von und Bis'],
    		                                    ['8','Id und Von und Bis und Abstand']]
    		                        }),
    		                        valueField: 'value',
    		        				displayField:'display',
    		        				editable: false,
    		        		        mode: 'local',
    		        		        triggerAction: 'all',
    		        		        fieldLabel: 'Eingabefelder',
    		        		        labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    		                        listeners:{
    		        		            'select': function(comboBox, record, index) {
    		        		            	var label_multiQueryHelp = Ext.getCmp('label_multiQueryHelp');
    		        		            	if(label_multiQueryHelp){
    		        		            		if(comboBox.value == "1"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>170,001&#8626;<br>185,255&#8626;</span>');
    			        		            	}else if(comboBox.value == "2"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe: <br>170,001 2,5&#8626;<br>185,255 2,3&#8626;</span>');
    			        		            	}else if(comboBox.value == "3"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>170,001 173,445&#8626;<br>185,255 201,113&#8626;</span>');
    			        		            	}else if(comboBox.value == "4"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe: <br>170,001 173,445 2,5&#8626;<br>185,255 201,113 2,3&#8626;</span>');
    			        		            	}else if(comboBox.value == "5"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe: <br>3901 170,001&#8626;<br>3902 1,44&#8626;</span>');
    			        		            	}else if(comboBox.value == "6"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe: <br>3901 170,001 2,5&#8626;<br>3902 1,44 2,3&#8626;</span>');
    			        		            	}else if(comboBox.value == "7"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>3901 170,001 180,123&#8626;<br>3902 1,441 190,565&#8626;</span>');
    			        		            	}else if(comboBox.value == "8"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>3901 170,001 180,123 2,5&#8626;<br>3902 1,441 190,565 2,3&#8626;</span>');
    			        		            	}
    		        		            	}
    		        		            }
    		        		       }
    		                    },
    		                    {
    		                        xtype: 'textarea',
    		                        id:'textarea_multiQuery',
    		                        labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    		                        fieldLabel: 'Kopieren Sie Ihre Datens&auml;tze in das Eingabefeld'
    		                    },
    		                    {
    		            			xtype: 'container',
    		            			height: 20
    		            	    },
    		                    {
    		                        xtype: 'label',
    		                        id: 'label_multiQueryHelp',
    		                        html: '<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span>Beispieleingabe:<br>170,001&#8626;<br>185,255&#8626;</span>'
    		                    },
    		                    {
    		            			xtype: 'container',
    		            			height: 20
    		            	    },
    		                    {
    		                        xtype: 'button',
    		                        id:'button_multiQuery',
    		                        text: 'Geokodierung berechnen',
    		                        handler: function(btn, evt){
    		                        	var combo_multiQuery = Ext.getCmp("combo_multiQuery");
    		                        	var textarea_multiQuery = Ext.getCmp("textarea_multiQuery");
    		                        	var projection = self.map.projection;
    		                        	
    		                        	var selection = combo_multiQuery.getValue();
    		                        	var input = textarea_multiQuery.getValue();
                						var inputList = input.trim().split("\n");
    		                        	var content = "";
		                        		content = content + '{"limit":200,"queries":[';
                						for(var i=0; i<inputList.length;i++){
                							var inputListEntry = inputList[i];
                							var inputListEntryValues = inputListEntry.split(" ");
                							for(var j=0; j<inputListEntryValues.length;j++){
                								inputListEntryValues[j] = inputListEntryValues[j].replace("\,", ".");
                							}
                							if(selection == "1"){
            		                        	content = content + '{"qid":'+(i+1)+',"bwastrid":"'+data.bwastrid+'","stationierung":{"km_wert":'+inputListEntryValues[0]+'},"spatialReference":{"wkid":'+ projection.split(":")[1] +'}}';
                							}else if(selection == "2"){
                								content = content + '{"qid":'+(i+1)+',"bwastrid":"'+data.bwastrid+'","stationierung":{"km_wert":'+inputListEntryValues[0]+',"offset":'+inputListEntryValues[1]+'},"spatialReference":{"wkid":'+ projection.split(":")[1] +'}}';
                							}else if(selection == "3"){
                								content = content + '{"qid":'+(i+1)+',"bwastrid":"'+data.bwastrid+'","stationierung":{"km_von":'+inputListEntryValues[0]+',"km_bis":'+inputListEntryValues[1]+'},"spatialReference":{"wkid":'+ projection.split(":")[1] +'}}';
                    						}else if(selection == "4"){
                    							content = content + '{"qid":'+(i+1)+',"bwastrid":"'+data.bwastrid+'","stationierung":{"km_von":'+inputListEntryValues[0]+',"km_bis":'+inputListEntryValues[1]+',"offset":'+inputListEntryValues[2]+'},"spatialReference":{"wkid":'+ projection.split(":")[1] +'}}';
                    						}else if(selection == "5"){
                    							content = content + '{"qid":'+(i+1)+',"bwastrid":"'+inputListEntryValues[0]+'","stationierung":{"km_wert":'+inputListEntryValues[1]+'},"spatialReference":{"wkid":'+ projection.split(":")[1] +'}}';
                    						}else if(selection == "6"){
                    							content = content + '{"qid":'+(i+1)+',"bwastrid":"'+inputListEntryValues[0]+'","stationierung":{"km_wert":'+inputListEntryValues[1]+',"offset":'+inputListEntryValues[2]+'},"spatialReference":{"wkid":'+ projection.split(":")[1] +'}}';
                    						}else if(selection == "7"){
                    							content = content + '{"qid":'+(i+1)+',"bwastrid":"'+inputListEntryValues[0]+'","stationierung":{"km_von":'+inputListEntryValues[1]+',"km_bis":'+inputListEntryValues[2]+'},"spatialReference":{"wkid":'+ projection.split(":")[1] +'}}';
                    						}else if(selection == "8"){
                    							content = content + '{"qid":'+(i+1)+',"bwastrid":"'+inputListEntryValues[0]+'","stationierung":{"km_von":'+inputListEntryValues[1]+',"km_bis":'+inputListEntryValues[2]+',"offset":'+inputListEntryValues[3]+'},"spatialReference":{"wkid":'+ projection.split(":")[1] +'}}';
                    						}
                							if(inputList[i+1]){
                								content = content + ',';	
                							}
                						}
                						content = content + ']}';
    		                        	self.loadData("/ingrid-webmap-client/rest/jsonCallback/queryPost?url=http://atlas.wsv.bvbs.bund.de/bwastr-locator-qs/rest/geokodierung/query&data=" + content);
    		                        }
    		                    }
    		             ]
                    }]
                },
                {
                	xtype: 'fieldset',
                	id: 'fieldset_bwastrCoordsToKm',
                    title: 'Koordinaten &#8594; BWaStr-Kilometer',
                    autoHeight: true,
                    hidden:true,
                    defaultType: 'textfield', 
                    defaults: {width: 230},
                    items: [{
    	                        xtype: 'combo',
    	                        id:'combo_coordsToKmQuery',
    	                        store: new Ext.data.ArrayStore({
    	                            fields: ['value', 'display'],
    	                            data : [['1','Koordinaten (BWaStr automatisch ermitteln)'],
    	                                    ['2','BWaStrId und Koordinaten'],
    	                                    ['3','Koordinaten']]
    	                        }),
    	                        valueField: 'value',
    	        				displayField:'display',
    	        				editable: false,
    	        		        mode: 'local',
    	        		        triggerAction: 'all',
    	        		        fieldLabel: 'Eingabefelder',
    	        		        labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    	                        listeners:{
    	        		            'select': function(comboBox, record, index) {
    	        		            	var label_coordsToKmHelp = Ext.getCmp('label_coordsToKmHelp');
    	        		            	if(label_coordsToKmHelp){
    	        		            		if(comboBox.value == "1"){
    	        		            			label_coordsToKmHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>13,13542133 51,48756133&#8626;</span>');
    		        		            	}else if(comboBox.value == "2"){
    		        		            		label_coordsToKmHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe: <br>3901 13,13542133 51,48756133&#8626;</span>');
    		        		            	}else if(comboBox.value == "3"){
    		        		            		label_coordsToKmHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>13,13542133 51,48756133&#8626;</span>');
    		        		            	}
    	        		            	}
    	        		            }
    	        		       }
    	                    },
    	                    {
    	                        xtype: 'textarea',
    	                        id:'textarea_coordsToKmQuery',
    	                        labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    	                        fieldLabel: 'Kopieren Sie Ihre Datens&auml;tze in das Eingabefeld.'
    	                    },
    	                    {
    	            			xtype: 'container',
    	            			height: 20
    	            	    },
    	                    {
    	                        xtype: 'label',
    	                        id: 'label_coordsToKmHelp',
    	                        html: '<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span>Beispieleingabe:<br>170,001&#8626;<br>185,255&#8626;</span>'
    	                    },
    	                    {
    	            			xtype: 'container',
    	            			height: 20
    	            	    },
    	                    {
    	                        xtype: 'button',
    	                        id:'button_coordsToKm',
    	                        text: 'Geokodierung berechnen',
    	                        handler: function(btn, evt){
    	                        	var combo_coordsToKmQuery = Ext.getCmp("combo_coordsToKmQuery");
		                        	var textarea_coordsToKmQuery = Ext.getCmp("textarea_coordsToKmQuery");
		                        	var projection = self.map.projection;
		                        	
		                        	var selection = combo_coordsToKmQuery.getValue();
		                        	var input = textarea_coordsToKmQuery.getValue();
            						var inputList = input.trim().split("\n");
            						var content = "";
	                        		content = content + '{"limit":200,"queries":[';
            						for(var i=0; i<inputList.length;i++){
            							var inputListEntry = inputList[i];
            							var inputListEntryValues = inputListEntry.split(" ");
            							for(var j=0; j<inputListEntryValues.length;j++){
            								inputListEntryValues[j] = inputListEntryValues[j].replace("\,", ".");
            							}
            							if(selection == "1"){
            								content = content + '{"qid":'+(i+1)+',"geometry":{"type":"Point","coordinates":['+ inputListEntryValues[0]+','+ inputListEntryValues[1]+'],"spatialReference":{"wkid":'+ projection.split(":")[1] +'}}}';	
            							}else if (selection == "2"){
            								content = content + '{"qid":'+(i+1)+',"bwastrid":"'+ inputListEntryValues[0]+'","geometry":{"type":"Point","coordinates":['+ inputListEntryValues[1]+','+ inputListEntryValues[2]+'],"spatialReference":{"wkid":'+ projection.split(":")[1] +'}}}';
            							}else if (selection == "3"){
            								content = content + '{"qid":'+(i+1)+',"bwastrid":"'+ data.bwastrid +'","geometry":{"type":"Point","coordinates":['+ inputListEntryValues[1]+','+ inputListEntryValues[2]+'],"spatialReference":{"wkid":'+ projection.split(":")[1] +'}}}';
            							}
            							if(inputList[i+1]){
            								content = content + ',';	
            							}
                					}
                					content = content + ']}';
		                        	self.loadData("/ingrid-webmap-client/rest/jsonCallback/queryPost?url=http://atlas.wsv.bvbs.bund.de/bwastr-locator-qs/rest/stationierung/query&data=" + content);
		                        }
    	                    }
    	             ]
                }]
    		}]
    	});
        	
    	var panelEast= new Ext.Panel({
			id: 'panel_bwastrResult',
			split: true,
            width: 470,
            collapsible: true,
            collapsed: true,
			region: 'east',
			layout: 'accordion',
			items:[]
    	});
        	
    	Ext.apply(this, {
            plain:true,
            layout: 'border',
            items: [panelCenter, panelEast]
    	});
    	de.ingrid.mapclient.frontend.controls.BWaStr.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		var self = this;
		de.ingrid.mapclient.frontend.controls.BWaStr.superclass.onRender.apply(this, arguments);
	},
	loadData: function(url){
		var self = this;
		var loadingMask = new Ext.LoadMask(Ext.getBody(), { msg:'Daten werden berechnet ...' });
		loadingMask.show();
		var ajax = Ext.Ajax.request({
			url: url,
			method: 'GET',
			success: function(response, request) {
				if(response){
					if(response.responseText){
						var data = JSON.parse(response.responseText);
						var panel_bwastrResult = Ext.getCmp("panel_bwastrResult");
						var panelResults = [];
						if(panel_bwastrResult){
							if(data){
								if(panel_bwastrResult.items){
									if(panel_bwastrResult.items.items){
										panel_bwastrResult.removeAll();
									}
								}
								
								if(data.result){
						    		var results = data.result;
						    		if(Ext.getCmp("radio_bwastrKmToCoords").checked){
						    			for(var i=0; i<results.length; i++){
							    			var result = results[i]
							    			if(result.error){
							    				
							    			}else{
						    					var title = result.strecken_name + ' (';

								    			if(result.stationierung){
													if(result.stationierung.km_von){
														title = title + result.stationierung.km_von + ' ';
													}
													if(result.stationierung.km_bis){
														title = title + result.stationierung.km_bis + ' ';
													}
													if(result.stationierung.km_wert){
														title = title + result.stationierung.km_wert + ' ';
													}
													if(result.stationierung.offset){
														title = title + result.stationierung.offset;
													}
												}
												
												title = title + ')';
												
												var resultPanel = new de.ingrid.mapclient.frontend.controls.BWaStrPanelResult({
													data: result,
													title: title,
													height: 500,
													autoWidth: true,
													map: self.map
												});
												panel_bwastrResult.add(resultPanel);
							    			}
						    			}
						    		}else{
						    			var columns = [{
						    	                header   : 'BWaStr-IdNr', 
						    	                sortable : false, 
						    	                dataIndex: 'bwastrid'
						    	            },
						    	            {
						    	                header   : 'BWaStr-Bezeichnung', 
						    	                sortable : true, 
						    	                dataIndex: 'bwastr_name'
						    	            },
						    	            {
						    	                header   : 'Streckenbezeichnung', 
						    	                sortable : true, 
						    	                dataIndex: 'strecken_name'
						    	            },
						    	            {
						    	                header   : 'L&auml;nge [Dezimalgrad', 
						    	                sortable : true, 
						    	                dataIndex: 'rechtswert'
						    	            },
						    	            {
						    	                header   : 'Breite [Dezimalgrad]', 
						    	                sortable : true, 
						    	                dataIndex: 'hochwert'
						    	            },
						    	            {
						    	                header   : 'Kilometer', 
						    	                sortable : true, 
						    	                dataIndex: 'km_wert'
						    	            },
						    	            {
						    	                header   : 'Abstand [m]', 
						    	                sortable : true, 
						    	                dataIndex: 'offset'
						    	            }
						    	    	];
					    				
					    				var store = new Ext.data.ArrayStore({
					    		    		fields:[
			    		    	              {name: 'bwastrid'},
			    		    	              {name: 'bwastr_name'},
			    		    	              {name: 'strecken_name'},
			    		    	              {name: 'rechtswert'},
			    		    	              {name: 'hochwert'},
			    		    	              {name: 'km_wert'},
			    		    	              {name: 'offset'}
			    		    	            ],
			    		    	            sortInfo: {
			    		    	                field: 'offset',
			    		    	                direction: 'ASC'
			    		    	            }
			    		    	        });
					    				
					    				var tableData = [];
					    				for(var i=0; i<results.length; i++){
							    			var result = results[i]
						    		    	if(result){
						    		    		var entry = []
							    	            entry.push(result.bwastrid);
						    		    		entry.push(result.bwastr_name);
						    		    		entry.push(result.strecken_name);
						    		    		entry.push(self.convertStringFloatValue(result.geometry.coordinates[0]));
						    		    		entry.push(self.convertStringFloatValue(result.geometry.coordinates[1]));
						    		    		entry.push(result.stationierung.km_wert);
						    		    		entry.push(self.convertStringFloatValue(result.stationierung.offset, 3));
							    	            tableData.push(entry);
						    		    	}
					    				}
					    		    	store.loadData(tableData);
					    				
					    				var resultPanel = new Ext.grid.GridPanel({
					    					title: 'Treffer',
					    		            store: store,
					    		            columns: columns,
					    		            stripeRows: true,
					    		            autoWidth: true,
					    		            height: 300,
					    		            autoScroll: true,
					    		            viewConfig: {
					    		    			forceFit: true
					    		            }
					    		        });
					    				panel_bwastrResult.add(resultPanel);
						    		}
								}
								panel_bwastrResult.collapse(true);
								panel_bwastrResult.expand(true);
								panel_bwastrResult.doLayout();
							}
						}
					}
				}
				loadingMask.hide();
			},
			failure: function(response, request) {
				loadingMask.hide();
			}
		});
	},
	convertStringFloatValue: function (value, index){
		if(value){
			if(index){
				value = Math.round(value * Math.pow(10,index)) / Math.pow(10,index) ;
			}else{
				if(value.toString().indexOf(".") > -1){
					var splitValue = value.toString().split(".");
					if(splitValue[0].length < 3){
						value = Math.round(value * Math.pow(10,8)) / Math.pow(10,8) ;
					}else{
						value = Math.round(value * Math.pow(10,2)) / Math.pow(10,2) ;
					}
				}
			}
		}
		return value;
	}
});