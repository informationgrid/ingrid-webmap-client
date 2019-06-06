import { LayerItem } from '../../_models/layer-item';

export class UtilsLayers {

    static cleanupLayersProps(layer: LayerItem) {
        const layerItem = layer.item;
        if (layerItem) {
            if (!layerItem.tileSize) {
                delete layerItem.tileSize;
            }
            if (!layerItem.timeBehaviour) {
                delete layerItem.timeBehaviour;
            }
            if (!layerItem.gutter) {
                delete layerItem.gutter;
            }
            if (this.isEmptyString(layerItem.queryLayers)) {
                delete layerItem.queryLayers;
            }
        }
    }

    static isEmptyString (value: string) {
        if (!value) {
            return true;
        } else if (value && value.trim().length === 0) {
            return true;
        }
        return false;
    }

    static isWMS(type: string) {
        if (type.toLowerCase() === 'wms') {
            return true;
        }
        return false;
    }

    static isWMTS(type: string) {
        if (type.toLowerCase() === 'wmts') {
            return true;
        }
        return false;
    }

    static addGetCapabilitiesParams(url: string) {
        if (url) {
            if (url.toLowerCase().indexOf('wmts') === -1) {
                if (!/service=/i.test(url)) {
                    url = this.appendUrl(url, /wmts/i.test(url) ?
                        'SERVICE=WMTS' :
                        'SERVICE=WMS');
                }
                if (!/request=/i.test(url)) {
                    url = this.appendUrl(url, 'REQUEST=GetCapabilities');
                }
                if (!/version=/i.test(url)) {
                    url = this.appendUrl(url, /wmts/i.test(url) ?
                        'VERSION=1.0.0' :
                        'VERSION=1.3.0');
                }
            }
        }
        return url;
    }

    static appendUrl(url: string, paramString) {
        if (paramString) {
            const parts = (url + ' ').split(/[?&]/);
            url += (parts.pop() === ' ' ? paramString :
                (parts.length > 0 ? '&' + paramString : '?' + paramString));
        }
        return url;
    }

    static onAddItem(value: any, list: any) {
        if (!list) {
            list = [];
        }
        if (value && list) {
            if (list.indexOf(value) === -1) {
                list.push(value);
            }
        }
        value = '';
    }

    static onAddItemNumber(value: any, list: any) {
        if (typeof value === 'string') {
          value = +value;
        }
        this.onAddItem(value, list);
    }


    static onRemoveItem(index, list: any) {
        if (list) {
            if (index > -1) {
                list.splice(index, 1);
            }
        }
    }

    static onUpItem(value: any, list: any) {
        if (value && list) {
            this.onMoveItem(value, list, -1);
        }
    }

    static onDownItem(value: any, list: any) {
        if (value && list) {
            this.onMoveItem(value, list, 1);
        }
    }

    static onMoveItem(value: string, list: any, delta: number) {
        const index = list.indexOf(value);
        const newIndex = index + delta;
        if (newIndex < 0 || newIndex === list.length) {
            return;
        }
        const indexes = [index, newIndex].sort();
        list.splice(indexes[0], 2, list[indexes[1]], list[indexes[0]]);
    }

    static replaceIdChar(id: string) {
        id = id.replace(/[^A-Z0-9]/gi, '_');
        return id;
    }

    static getUniqueId(layers: LayerItem[], id: string, i: number, defaultId: String) {
        layers.forEach(layer => {
            if (layer.id === id) {
                i++;
                id = defaultId + '_' + i;
                id = this.getUniqueId(layers, id, i, defaultId);
            }
        });
        return id;
    }
}
