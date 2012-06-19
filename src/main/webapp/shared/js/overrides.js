/*
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 */

/**
 * @class Array
 */
Ext.applyIf(Array.prototype, {

    /**
     * One dimensional copy
     * @return {Array} New array that is copy of this
     */
     copy: function() {
        var a = [];
        for(var i = 0, l = this.length; i < l; i++) {
            a.push(this[i]);
        }
        return a;
    }
});