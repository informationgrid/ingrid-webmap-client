/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class BWaStr is the dialog used for BWaStr Locator.
 */
de.ingrid.mapclient.frontend.controls.BWaStr = Ext.extend(Ext.Window, {
	title: 'BWaStr-Suche',
	closable: true,
	draggable: true,
	constrain: true,
	resizable: false,
	width: 500,
	height: 500,
	shadow: false,
	initHidden: false,
	ctrls:null,

	record: null,
	map: null,
	exampleCoordinates: [13.13542133, 51.48756133], 
	/**
     * Initialize the component (called by Ext)
     */
    initComponent: function() {
    	var self = this;
    	
    	var exampleLonLat = new OpenLayers.LonLat(this.exampleCoordinates[0],this.exampleCoordinates[1]);
    	var newProj = new OpenLayers.Projection(this.map.getProjection());
		if(newProj){
			var oldProj = new OpenLayers.Projection("EPSG:4326");
			exampleLonLat.transform(oldProj, newProj);
		}
		
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
    			    				// Render Layer
    			    		        de.ingrid.mapclient.frontend.data.BWaStrUtils.renderLayer(self.record, self);
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
                        			// Render Layer
    			    		        de.ingrid.mapclient.frontend.data.BWaStrUtils.renderLayer(self.record, self);
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
    		                        fieldLabel: 'Von [km] (' + data.km_von + ')',
    		                        allowNegative: false,
    		                        decimalPrecision: 3,
    		                        decimalSeparator: '.',
    		                        invalidText: 'Dieser Wert liegt au&szlig;erhalb des g&uuml;ltigen Bereiches oder ist nicht g&uuml;ltig.',
    		                        minLength: 1,
    		                        emptyText : data.km_von + "",
    		                        validator: function(value){
		                        		var v = parseFloat(value.replace("\,","."));
		                        		if(v == data.km_bis){
    		                        		return false;
		                        		}else if(v < data.km_von || v > data.km_bis){
    		                        		return false;
    		                        	}else if(value == Ext.getCmp("textfield_singleQueryTo").getValue()){
    		                        		return false;
    		                        	}
    		                        	return true;
    		                        }
    		                    },
    		                    {
    		                        xtype: 'numberfield',
    		                        id:'textfield_singleQueryTo',
    		                        labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    		                        fieldLabel: 'Bis [km] (' + data.km_bis + ')',
    		                        allowNegative: false,
    		                        decimalPrecision: 3,
    		                        decimalSeparator: '.',
    		                        invalidText: 'Dieser Wert liegt au&szlig;erhalb des g&uuml;ltigen Bereiches oder ist nicht g&uuml;ltig.',
    		                        minLength: 1,
    		                        emptyText: data.km_bis + "",
    		                        validator: function(value){
		                        		var v = parseFloat(value.replace("\,","."));
		                        		if(v == data.km_von){
    		                        		return false;
		                        		}else if(v < data.km_von || v > data.km_bis){
    		                        		return false;
    		                        	}else if(value == Ext.getCmp("textfield_singleQueryFrom").getValue()){
    		                        		return false;
    		                        	}
    		                        	return true;
    		                        }
    		                    },
    		                    {
    		                        xtype: 'numberfield',
    		                        id:'textfield_singleQueryOffset',
    		                        labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    		                        fieldLabel: 'Seitlicher Abstand [m]',
    		                        allowNegative: false,
    		                        decimalPrecision: 3,
    		                        decimalSeparator: '.',
    		                        invalidText: 'Dieser Wert liegt au&szlig;erhalb des g&uuml;ltigen Bereiches oder ist nicht g&uuml;ltig.',
    		                        minLength: 1,
    		                        emptyText: "0"
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
    		                        	var content = '{'
    		                        		+ '"limit":200,'
    		                        		+ '"queries":['
    		                        		+ '{'
    		                        		+ '"qid":1,'
    		                        		+ '"bwastrid":"'+ data.bwastrid +'",'
    		                        		+ '"stationierung":{';
    		                        	if(textfield_singleQueryFrom.getValue() == "" 
    		                        		&& textfield_singleQueryTo.getValue() == ""
    		                        		&& textfield_singleQueryOffset.getValue() == ""){
    		                        		content = content + '"km_wert":'+ textfield_singleQueryFrom.emptyText;
    		                        	}else{
    		                        		
    		                        		if(textfield_singleQueryFrom.getValue() != ""
    		                        			&& textfield_singleQueryTo.getValue() == ""){
    		                        			content = content + '"km_wert":'+ textfield_singleQueryFrom.getValue();
    		                        		}else{
    		                        			if(textfield_singleQueryFrom.getValue() != ""){
        		                        			content = content + '"km_von":'+ textfield_singleQueryFrom.getValue();
        		                        		}
    		                        			
    		                        			if(textfield_singleQueryTo.getValue() != ""){
        		                        			if(textfield_singleQueryFrom.getValue() == ""){
        		                        				content = content + '"km_von":'+ textfield_singleQueryFrom.emptyText;
        		                        			}
        		                        			content = content + ',';
        		                        			content = content + '"km_bis":'+ textfield_singleQueryTo.getValue();
        		                        		}
    		                        		}
    		                        		
    		                        		if(textfield_singleQueryOffset.getValue() != ""){
    		                        			if(textfield_singleQueryFrom.getValue() == ""){
    		                        				content = content + '"km_von":'+ textfield_singleQueryFrom.emptyText;
    		                        				content = content + ',';
    		                        			}
    		                        			if(textfield_singleQueryTo.getValue() == ""){
    		                        				content = content + '"km_bis":'+ textfield_singleQueryTo.emptyText;
    		                        				content = content + ',';
    		                        			}
    		                        			content = content + ',';
    		                        			content = content + '"offset":'+ textfield_singleQueryOffset.getValue();
    		                        		}
    		                        	}
    		                        	content = content + '},'
    		                        		+ '"spatialReference":{'
    		                        		+ '"wkid":'+ projection.split(":")[1]
    		                        		+ '}'
    		                        		+ '}'
    		                        		+ ']'
    		                        		+ '}';
    		                        	
    		                        	de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVectorTmp");
    		                        	de.ingrid.mapclient.frontend.data.BWaStrUtils.clearMarker(self.map, "bWaStrVectorMarker");
    		                        	
    		                        	self.loadData("/ingrid-webmap-client/rest/jsonCallback/queryPost?url=" + de.ingrid.mapclient.Configuration.getSettings("viewBWaStrGeokodierung")+ "&data=" + content);
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
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>170.001&#8626;<br>185.255&#8626;</span>');
    			        		            	}else if(comboBox.value == "2"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe: <br>170.001 2.5&#8626;<br>185.255 2.3&#8626;</span>');
    			        		            	}else if(comboBox.value == "3"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>170.001 173.445&#8626;<br>185.255 201.113&#8626;</span>');
    			        		            	}else if(comboBox.value == "4"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe: <br>170.001 173.445 2.5&#8626;<br>185.255 201.113 2.3&#8626;</span>');
    			        		            	}else if(comboBox.value == "5"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe: <br>3901 170.001&#8626;<br>3902 1.44&#8626;</span>');
    			        		            	}else if(comboBox.value == "6"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe: <br>3901 170.001 2.5&#8626;<br>3902 1.44 2.3&#8626;</span>');
    			        		            	}else if(comboBox.value == "7"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>3901 170.001 180.123&#8626;<br>3902 1.441 190.565&#8626;</span>');
    			        		            	}else if(comboBox.value == "8"){
    			        		            		label_multiQueryHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>3901 170.001 180.123 2.5&#8626;<br>3902 1.441 190.565 2.3&#8626;</span>');
    			        		            	}
    		        		            	}
    		        		            	var textarea_multiQuery = Ext.getCmp('textarea_multiQuery');
    		        		            	textarea_multiQuery.validate();
    		        		            }
    		        		       }
    		                    },
    		                    {
    		                        xtype: 'textarea',
    		                        id:'textarea_multiQuery',
    		                        labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    		                        fieldLabel: 'Kopieren Sie Ihre Datens&auml;tze in das Eingabefeld',
    		                        invalidText: 'Bitte Eingabe &uuml;berpr&uuml;fen.',
    		                        validator: function(value){
    		                        	var v = value.trim();
    		                        	var vList = value.split("\n");
    		                        	var comboBox = Ext.getCmp('combo_multiQuery');
    		                        	
    		                        	for(var i=0; i<vList.length;i++){
    		                        		var vListEntry = vList[i].trim();
    		                        		var vListEntries = vListEntry.split(" ");
    		                        		if(comboBox){
    	    		                        	if(comboBox.value == "1"){
    	    		                        		if(vListEntries.length !=  1){
    	    		                        			return false;
    	    		                        		}
    	    		                        	}else if(comboBox.value == "2"){
    	    		                        		if(vListEntries.length != 2){
    	    		                        			return false;
    	    		                        		}
    	    		                        	}else if(comboBox.value == "3"){
    	    		                        		if(vListEntries.length != 2){
    	    		                        			return false;
    	    		                        		}
    	    		                        	}else if(comboBox.value == "4"){
    	    		                        		if(vListEntries.length != 3){
    	    		                        			return false;
    	    		                        		}
    	    		                        	}else if(comboBox.value == "5"){
    	    		                        		if(vListEntries.length != 2){
    	    		                        			return false;
    	    		                        		}
    	    		                        	}else if(comboBox.value == "6"){
    	    		                        		if(vListEntries.length != 3){
    	    		                        			return false;
    	    		                        		}
    	    		                        	}else if(comboBox.value == "7"){
    	    		                        		if(vListEntries.length != 3){
    	    		                        			return false;
    	    		                        		}
    	    		                        	}else if(comboBox.value == "8"){
    	    		                        		if(vListEntries.length != 4){
    	    		                        			return false;
    	    		                        		}
    	    		                        	}
        		                        	}
    		                        	}
    		                        	return true;
    		                        }
    		                    },
    		                    {
    		            			xtype: 'container',
    		            			height: 20
    		            	    },
    		                    {
    		                        xtype: 'label',
    		                        id: 'label_multiQueryHelp',
    		                        html: '<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span>Beispieleingabe:<br>170.001&#8626;<br>185.255&#8626;</span>'
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
                						
                						//de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVector");
    		                        	//de.ingrid.mapclient.frontend.data.BWaStrUtils.clearMarker(self.map, "bWaStrVectorMarker");

                						de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVectorTmp");
    		                        	de.ingrid.mapclient.frontend.data.BWaStrUtils.clearMarker(self.map, "bWaStrVectorMarker");
    		                        	
    		                        	self.loadData("/ingrid-webmap-client/rest/jsonCallback/queryPost?url=" + de.ingrid.mapclient.Configuration.getSettings("viewBWaStrGeokodierung")+ "&data=" + content);
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
    	        		            			label_coordsToKmHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>' + de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(exampleLonLat.lon) + ' '+ de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(exampleLonLat.lat) + '&#8626;</span>');
    		        		            	}else if(comboBox.value == "2"){
    		        		            		label_coordsToKmHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe: <br>3901 ' + de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(exampleLonLat.lon) + ' '+ de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(exampleLonLat.lat) + '&#8626;</span>');
    		        		            	}else if(comboBox.value == "3"){
    		        		            		label_coordsToKmHelp.update('<div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>' + de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(exampleLonLat.lon) + ' '+ de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(exampleLonLat.lat) + '&#8626;</span>');
    		        		            	}
    	        		            	}
    	        		            }
    	        		       }
    	                    },
    	                    {
    	                        xtype: 'textarea',
    	                        id:'textarea_coordsToKmQuery',
    	                        labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    	                        fieldLabel: 'Kopieren Sie Ihre Datens&auml;tze in das Eingabefeld.',
    	                        invalidText: 'Bitte Eingabe &uuml;berpr&uuml;fen.',
		                        validator: function(value){
		                        	if(value != ""){
		                        		var v = value.trim();
			                        	var vList = value.split("\n");
			                        	var comboBox = Ext.getCmp('combo_coordsToKmQuery');
			                        	
			                        	for(var i=0; i<vList.length;i++){
			                        		var vListEntry = vList[i].trim();
			                        		var vListEntries = vListEntry.split(" ");
			                        		if(comboBox){
		    		                        	if(comboBox.value == "1"){
		    		                        		if(vListEntries.length != 2){
		    		                        			return false;
		    		                        		}
		    		                        	}else if(comboBox.value == "2"){
		    		                        		if(vListEntries.length != 3){
		    		                        			return false;
		    		                        		}
		    		                        	}else if(comboBox.value == "3"){
		    		                        		if(vListEntries.length != 2){
		    		                        			return false;
		    		                        		}
		    		                        	}
	    		                        	}
			                        	}
		                        	}
		                        	return true;
		                        }
    	                    },{
    	                    	xtype: 'checkbox',
    	                    	labelStyle: 'width:150px !important;font-weight:bold;font-size:11px;',
    	                        fieldLabel: 'Koordinaten durch Kartenklick aktivieren',
    	                        handler: function(chb, status){
    	                        	if(status){
    	                        		var mapPin = Ext.getCmp("mapPin");
    	                        		mapPin.toggle(true);
    	                        		Ext.getCmp("featureInfoControl").deactivate();
    	            		        	Ext.getCmp("positionControl").activate(true);
    	                        	}else{
    	                        		var btnDragMap = Ext.getCmp("btnDragMap");
    	                        		btnDragMap.toggle(true);
    	                        		Ext.getCmp("featureInfoControl").deactivate();
    	            		        	Ext.getCmp("positionControl").deactivate();
    	                        	}
    	                        }
    	                    },
    	                    {
    	            			xtype: 'container',
    	            			height: 20
    	            	    },
    	                    {
    	                        xtype: 'label',
    	                        id: 'label_coordsToKmHelp',
    	                        html: '<div><div>Eingabewerte werden durch ein Leerzeichen getrennt.</div><span >Beispieleingabe:<br>' + de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(exampleLonLat.lon) + ' '+ de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(exampleLonLat.lat) + '&#8626;</span>'
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
                					
                					//de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVector");
		                        	//de.ingrid.mapclient.frontend.data.BWaStrUtils.clearMarker(self.map, "bWaStrVectorMarker");

                					de.ingrid.mapclient.frontend.data.BWaStrUtils.clearVectorLayer(self.map, "bWaStrVectorTmp");
                			    	de.ingrid.mapclient.frontend.data.BWaStrUtils.clearMarker(self.map, "bWaStrVectorMarker");
                			    	
                			    	self.loadData("/ingrid-webmap-client/rest/jsonCallback/queryPost?url=" + de.ingrid.mapclient.Configuration.getSettings("viewBWaStrStationierung")+ "&data=" + content);
		                        }
    	                    }
    	             ]
                }]
    		}]
    	});
        	
    	Ext.apply(this, {
            plain:true,
            layout: 'border',
            items: [panelCenter]
    	});
    	de.ingrid.mapclient.frontend.controls.BWaStr.superclass.initComponent.call(this);
	},
	/**
	 * Render callback (called by Ext)
	 */
	onRender: function() {
		var self = this;
		// Render Layer
        de.ingrid.mapclient.frontend.data.BWaStrUtils.renderLayer(self.record, self);
		de.ingrid.mapclient.frontend.controls.BWaStr.superclass.onRender.apply(this, arguments);
	},
	loadData: function(url, callback){
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
						var panelResults = [];
						var winItems = [];
						if(data){
							if(data.result){
					    		var results = data.result;
					    		var isAddResult = false;
					    		if(Ext.getCmp("radio_bwastrKmToCoords").checked){
					    			for(var i=0; i<results.length; i++){
						    			var result = results[i]
						    			if(result.error){
						    				Ext.MessageBox.alert('Fehler', 'Fehler bei der Abfrage! (' + result.message + ')');
						    			}else{
					    					var title = result.strecken_name + ' (';

							    			if(result.stationierung){
												if(result.stationierung.km_von){
													title = title + ' ';
													title = title + result.stationierung.km_von;
												}
												if(result.stationierung.km_bis){
													title = title + ' ';
													title = title + result.stationierung.km_bis;
												}
												if(result.stationierung.km_wert){
													title = title + ' ';
													title = title + result.stationierung.km_wert;
												}
												if(result.stationierung.offset){
													title = title + ' ';
													title = title + result.stationierung.offset;
												}
											}
											
											title = title + ' )';
											
											var resultPanel = new de.ingrid.mapclient.frontend.controls.BWaStrPanelResult({
												data: result,
												title: title,
												height: 500,
												autoWidth: true,
												map: self.map
											});
											winItems.push(resultPanel);
											isAddResult = true;
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
					    	                header   : self.map.displayProjection.proj.units == "degrees" ? 'L&auml;nge [Dezimalgrad]' : 'Rechtswert [m]', 
					    	                sortable : true, 
					    	                dataIndex: 'rechtswert'
					    	            },
					    	            {
					    	                header   : self.map.displayProjection.proj.units == "degrees" ? 'Breite [Dezimalgrad]' : 'Hochwert [m]', 
					    	                sortable : true, 
					    	                dataIndex: 'hochwert'
					    	            },
					    	            {
					    	                header   : 'Station [km]', 
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
				    				var pointData = [];
				    				for(var i=0; i<results.length; i++){
						    			var result = results[i]
					    		    	if(result){
					    		    		if(result.error){

					    		    		}else{
					    		    			var entry = []
							    	            entry.push(result.bwastrid);
						    		    		entry.push(result.bwastr_name);
						    		    		entry.push(result.strecken_name);
						    		    		entry.push(de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(result.geometry.coordinates[0]));
						    		    		entry.push(de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(result.geometry.coordinates[1]));
						    		    		entry.push(result.stationierung.km_wert);
						    		    		entry.push(de.ingrid.mapclient.frontend.data.BWaStrUtils.convertStringFloatValue(result.stationierung.offset, 3));
							    	            tableData.push(entry);
							    	            pointData.push([result.geometry.coordinates[0], result.geometry.coordinates[1], de.ingrid.mapclient.frontend.data.BWaStrUtils.createPopUpTemplate([result.geometry.coordinates[0], result.geometry.coordinates[1], result.stationierung.km_wert], self)]);
					    		    		}
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
				    		    	winItems.push(resultPanel);
				    				isAddResult = true; 
				    				
				    				// Create Layer
				    				var bWaStrMarker = self.map.getLayersByName("bWaStrVectorMarker");
				    				if(bWaStrMarker.length == 0){
				    					bWaStrMarker = new OpenLayers.Layer.Markers( "bWaStrVectorMarker" );
				    					self.map.addLayer(bWaStrMarker);
				    				}else{
				    					bWaStrMarker = bWaStrMarker[0];
				    				}
				    				
				    				for(var i=0; i < pointData.length; i++){
				    					var point = pointData[i];
				    					if(point){
					    					var marker = de.ingrid.mapclient.frontend.data.BWaStrUtils.addMarker(self, bWaStrMarker ,point[0],point[1],point[2], "blue");
					    					bWaStrMarker.addMarker(marker);
					    				}
				    				}
				    				if(bWaStrMarker){
				    					if(bWaStrMarker.markers){
				    						if(bWaStrMarker.markers.length > 1){
				    							self.map.zoomToExtent(bWaStrMarker.getDataExtent());
				    							self.map.zoomTo(self.map.getZoom() - 1);
				    						}else{
				    							var point = bWaStrMarker.markers[0];
				    							self.map.setCenter(point.lonlat, 5);
				    						}
				    					}
				    				}
					    		}
					    		if(isAddResult){
					    			var win = new Ext.Window({
					    				title: 'BWaStr-Suchergebnis',
					    				resizable: false,
					    				constrain: true,
					    				layout: 'accordion',
						                width: 500,
						                height: 500,
						                plain: true,
						                x: 20,
						                y: 110,
						                items: winItems
						    		});
						    		win.show();
					    		}
							}else if(data.error){
			    				Ext.MessageBox.alert('Fehler bei der Abfrage', 'Bitte pr&uuml;fen Sie Ihre Eingabe! (' + data.error.message + ')');
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
	}
});