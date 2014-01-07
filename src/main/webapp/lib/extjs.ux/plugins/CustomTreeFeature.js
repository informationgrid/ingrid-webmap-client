Ext.tree.TreeNodeUI.prototype.onOver = Ext.tree.TreeNodeUI.prototype.onOver.createSequence(function (e) {
    var tree = this.node.getOwnerTree();

    if (tree.allowNodeOver) {
        tree.fireEvent('nodeover', this.node);
        tree.allowNodeOver = false;
    }       
});

Ext.tree.TreeNodeUI.prototype.onOut = Ext.tree.TreeNodeUI.prototype.onOut.createSequence(function (e) {
    var tree = this.node.getOwnerTree();

    tree.fireEvent('nodeout', this.node);
    tree.allowNodeOver = true;    
});

Ext.ux.HoverActions = Ext.extend(Ext.util.Observable, {
    defaults : {
        actions : []
    },

    constructor : function (config) {
        Ext.apply(this, config || {}, this.defaults);
        this.addEvents('action');
        Ext.ux.HoverActions.superclass.constructor.call(this);
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
        document.removeChild(this.element);
    },
    template: '<div class="x-hoveractions-outer"><table class="" cellspacing="0"><tbody><tr><tpl for="."><td><button type="button" id="{id}" class="x-hoveractions-img {iconCls}">&nbsp;</button></tpl></tr></tbody></table></div>',
    createElement : function () {
        var tpl = new Ext.XTemplate(this.template);

        this.element = tpl.append(document.body, this.actions);
        this.extElement = Ext.get(this.element);
        this.extElement.hide();
        this.extElement.on("click", this.onClick, this);
    },

    onNodeOver : function (node, e) {
    	if(node.attributes.service){
    		var nodeEl = Ext.fly(node.ui.getEl()).child("div");
    		nodeEl.first().insertFirst(this.element);
            this.extElement.show();
    	}
        this.currentNode = node;
        this.tree.getSelectionModel().select(node);
    },

    onNodeOut : function (node, e) {
    	this.extElement.hide();
    },

    onClick : function (e) {
        var node = this.currentNode,
            actionId = Ext.fly(e.getTarget()).getAttribute("id");
        Ext.each(this.actions, function (action) {
            if (action.id === actionId) {
                action.handler(node, e);
            }
        });
    }
});

Ext.tree.TreeNodeUI.prototype.renderElements = function(n, a, targetNode, bulkRender){
    this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';

	var cb = Ext.isBoolean(a.checked),
    nel,
    href = this.getHref(a.href),
    buf = ['<li class="x-tree-node"><div ext:tree-node-id="',n.id,'" class="x-tree-node-el x-tree-node-leaf x-unselectable ', a.cls,'" unselectable="on">',
           '<span class="x-tree-node-indent">',this.indentMarkup,"</span>",
           '<img alt="" src="', this.emptyIcon, '" class="x-tree-ec-icon x-tree-elbow" />',
           '<img alt="" src="', a.icon || this.emptyIcon, '" class="x-tree-node-icon',(a.icon ? " x-tree-node-inline-icon" : ""),(a.iconCls ? " "+a.iconCls : ""),'" unselectable="on" />',
           cb ? ('<input class="x-tree-node-cb" type="checkbox" ' + (a.checked ? 'checked="checked" />' : '/>')) : '',
           '<a hidefocus="on" class="x-tree-node-anchor" href="',href,'" tabIndex="1" ',
            a.hrefTarget ? ' target="'+a.hrefTarget+'"' : "", '><span unselectable="on">',n.text,"</span></a></div>",
           '<ul class="x-tree-node-ct" style="display:none;"></ul>',
           "</li>"].join('');

    if(bulkRender !== true && n.nextSibling && (nel = n.nextSibling.ui.getEl())){
        this.wrap = Ext.DomHelper.insertHtml("beforeBegin", nel, buf);
    }else{
        this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, buf);
    }

    this.elNode = this.wrap.childNodes[0];
    this.ctNode = this.wrap.childNodes[1];
    var cs = this.elNode.childNodes;
    this.indentNode = cs[0];
    this.ecNode = cs[1];
    this.iconNode = cs[2];
    var index = 3;
    if(cb){
        this.checkbox = cs[3];
        
        this.checkbox.defaultChecked = this.checkbox.checked;
        index++;
    }
    this.anchor = cs[index];
    this.textNode = cs[index].firstChild;
    // Add div for hover elements
    if(a.service){
    	var dv = document.createElement("div");
    	dv.className = "buttonSpan";
    	if(this.node.ownerTree.buttonSpanEl){
    		var width = this.node.ownerTree.buttonSpanEl * 16;
    		dv.style.width = width + "px";
    	}
    	this.elNode.insertBefore(dv, this.elNode.firstChild);
    }
}

