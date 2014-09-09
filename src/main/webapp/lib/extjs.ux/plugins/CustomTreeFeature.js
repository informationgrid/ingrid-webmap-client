Ext.view.Table.prototype.processSpecialEvent =  Ext.Function.createSequence(Ext.view.Table.prototype.processSpecialEvent, function (e) {
	var me       = this,
    cellNode = e.getTarget(me.cellSelector),
    rowNode  = e.getTarget(me.itemSelector),
    record   = me.getRecord(rowNode),
    header   = me.getHeaderByCell(cellNode);
	if(this.node){
		var tree = this.node.getOwnerTree();
	    if (tree.allowNodeOver) {
	    	if(record){
	    		if(record.raw){
	    			if(record.raw.plugins || record.raw.service){
	    				if(e.type == "mouseover"){
	    		    		tree.fireEvent('nodeover', me, e);
	    		    	}else if(e.type == "mouseout"){
	    		    		 tree.fireEvent('nodeout', me, e);
	    		    	}
	    			}
	    		}
	    	}
	    }
	}
});

Ext.define('Ext.ux.HoverActions', {
	mixins:{
		observable: 'Ext.util.Observable'
	},
    defaults : {
        actions : []
    },

    constructor : function (config) {
        Ext.apply(this, config || {}, this.defaults);
        this.addEvents('action');
        this.superclass.constructor.call(this);
    },

    init : function (tree) {
        this.tree = tree;
        tree.addEvents('nodeover', 'nodeout');
        tree.on({
            scope : this,
            nodeover : this.onNodeOver,
            nodeout : this.onNodeOut,
            destroy : this.destroy
        });

        this.createElement();
    },

    destroy : function () {
    },
    template: '<div class="x-hoveractions-outer"><table class="" cellspacing="0"><tbody><tr><tpl for="."><td><button type="button" id="{id}" class="x-hoveractions-img {iconCls}" title="{tooltip}">&nbsp;</button></tpl></tr></tbody></table></div>',
    createElement : function () {
        var tpl = new Ext.XTemplate(this.template);

        this.element = tpl.append(document.body, this.actions);
        this.extElement = Ext.get(this.element);
        this.extElement.hide();
        this.extElement.on("click", this.onClick, this);
    },

    onNodeOver : function (me, e) {
    	var cellNode = e.getTarget(me.cellSelector),
        rowNode  = e.getTarget(me.itemSelector),
        record   = me.getRecord(rowNode),
        header   = me.getHeaderByCell(cellNode);
    	
		var nodeEl = Ext.fly(rowNode).child("td").child("div");
		if(nodeEl){
			nodeEl.first().insertFirst(this.element);
	        this.extElement.show();
		}
		this.currentRecord = record;
    },

    onNodeOut : function (node, e) {
    	this.extElement.hide();
    },

    onClick : function (e) {
        var record = this.currentRecord,
            actionId = Ext.fly(e.getTarget()).getAttribute("id");
        Ext.each(this.actions, function (action) {
            if (action.id === actionId) {
                action.handler(record, e);
            }
        });
    }
});

Ext.tree.Column.prototype.treeRenderer = function(value, metaData, record, rowIdx, colIdx, store, view){
    var me = this,
        cls = record.get('cls'),
        renderer = me.origRenderer,
        data = record.data,
        parent = record.parentNode,
        rootVisible = view.rootVisible,
        lines = [],
        parentData;

    if (cls) {
        metaData.tdCls += ' ' + cls;
    }

    while (parent && (rootVisible || parent.data.depth > 0)) {
        parentData = parent.data;
        lines[rootVisible ? parentData.depth : parentData.depth - 1] =
                parentData.isLast ? 0 : 1;
        parent = parent.parentNode;
    }

    var tpl = me.getTpl('cellTpl').apply({
        record: record,
        baseIconCls: me.iconCls,
        iconCls: data.iconCls,
        icon: data.icon,
        checkboxCls: me.checkboxCls,
        checked: data.checked,
        elbowCls: me.elbowCls,
        expanderCls: me.expanderCls,
        textCls: me.textCls,
        leaf: data.leaf,
        expandable: record.isExpandable(),
        isLast: data.isLast,
        blankUrl: Ext.BLANK_IMAGE_URL,
        href: data.href,
        hrefTarget: data.hrefTarget,
        lines: lines,
        metaData: metaData,
        // subclasses or overrides can implement a getChildCls() method, which can
        // return an extra class to add to all of the cell's child elements (icon,
        // expander, elbow, checkbox).  This is used by the rtl override to add the
        // "x-rtl" class to these elements.
        childCls: me.getChildCls ? me.getChildCls() + ' ' : '',
        value: renderer ? renderer.apply(me.origScope, arguments) : value
    });
    if(record.getOwnerTree().allowNodeOver){
    	if(record.raw.service){
    		return "<div class='buttonSpan' style="+ record.getOwnerTree().buttonSpanElStyle +"></div>" + tpl;
    	}else if (record.getData().container){
    		if(record.getData().container.service){
    			return "<div class='buttonSpan' style="+ record.getOwnerTree().buttonSpanElStyle +"></div>" + tpl;
    		}else{
    			return tpl;
    		}
    	}else if (record.getData().layer){
    		return "<div class='buttonSpan' style="+ record.getOwnerTree().buttonSpanElStyle +"></div>" + tpl;
    	}else{
    		return tpl;
    	}
    }else{
    	return tpl;
    }

}