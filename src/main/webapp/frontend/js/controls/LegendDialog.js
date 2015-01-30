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
Ext.namespace("de.ingrid.mapclient.frontend.controls");

/**
 * @class LegendDialog is the dialog for displaying meta data about a wms or wms layer.
 */

Ext.define('de.ingrid.mapclient.frontend.controls.LegendDialog', {
	extend: 'Ext.Window',
	id: 'legendDialog',
	bodyCls: 'mapclientLegendPanel',
	title: i18n('tLegende'),
	layout: {
	    type: 'vbox',
	    pack: 'start',
	    align: 'stretch'
	},
	closable: true,
	draggable: true,
	resizable: true,
	width: 590,
	height:400,
	shadow: false,
	initHidden: false,
	autoScroll:true,
	constrain: true,
	windowContent: null,
	layerStore: null,
	legendPanel: null,
	/**
	 * Initialize the component (called by Ext)
	 */
	initComponent: function() {
		/**
		 * 
		 * @override GeoExt.WMSLegend
		 * we overide this method, because some WmsServer have trouble with multiple format paramters
		 * so we make sure this paramters is only once in the request 
		 * 
		*/ 
		GeoExt.container.WmsLegend.prototype.getLegendUrl = function(layerName, layerNames) {
		    var rec = this.layerRecord;
		    var url;
		    var styles = rec && rec.raw.metadata.styles;
		    var layer = rec.getLayer();
		    layerNames = layerNames || [layer.params.LAYERS].join(",").split(",");

		    var styleNames = layer.params.STYLES && [layer.params.STYLES].join(",").split(",");
		    var idx = layerNames.indexOf(layerName);
		    var styleName = styleNames && styleNames[idx];
		    // check if we have a legend URL in the record's
		    // "styles" data field
		    if(styles && styles.length > 0) {
		        if(styleName) {
		            Ext.each(styles, function(s) {
		                url = (s.name == styleName && s.legend) && s.legend.href;
		                return !url;
		            });
		        } else if(this.defaultStyleIsFirst === true && !styleNames &&
		                  !layer.params.SLD && !layer.params.SLD_BODY) {
		            url = styles[0].legend && styles[0].legend.href;
		        }
		    }
		    if(!url) {
		        url = layer.getFullRequestString({
		            REQUEST: "GetLegendGraphic",
		            WIDTH: null,
		            HEIGHT: null,
		            EXCEPTIONS: "application/vnd.ogc.se_xml",
		            LAYER: layerName,
		            LAYERS: null,
		            STYLE: (styleName !== '') ? styleName: null,
		            STYLES: null,
		            SRS: null,
		            FORMAT: null
		        });
		    }
		    // add scale parameter - also if we have the url from the record's
		    // styles data field and it is actually a GetLegendGraphic request.
		    if(this.useScaleParameter === true && url.toLowerCase().indexOf("request=getlegendgraphic") != -1) {
		        var scale = layer.map.getScale();
		        url = Ext.urlAppend(url, "SCALE=" + scale);
		    }
		    var params = this.baseParams || {};
		    //TODO we change this part since we are having trouble on some servers with the mutliple occurence format parameter
		    var formatAlreadyThere = false
		    if(url.indexOf("&FORMAT=") != -1  || url.indexOf("&format=") != -1 || url.indexOf("%26FORMAT=") != -1 || url.indexOf("%26format=") != -1)
		    	formatAlreadyThere = true;
		    Ext.applyIf(params, {FORMAT: 'image/gif'});
		    if(url.indexOf('?') > 0 && !formatAlreadyThere) {
		        url = Ext.urlEncode(params, url);
		    }

		    return url;
		};
		
		var self = this;
		this.on('close', function(){
			this.hide();
		});
		
		this.legendPanel = Ext.create('GeoExt.panel.Legend', {
			autoScroll : true,
			border : false,
			dynamic : true,
			cls: "mapclientLegendPanel",
			flex: 1
		});
		
		this.legendPanel.doLayout();
		
		Ext.apply(this, {
			items: this.legendPanel,
			doClose : function(){
		        this.fireEvent('close', this);
		    }
		});

		this.superclass.initComponent.call(this);
	}
});


