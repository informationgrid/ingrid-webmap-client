import { Layer } from './layer';
import { LayerType } from './layer-type.enum';
import { LayerItem } from './layer-item';
import { ILayerWms } from '../_interfaces/ilayer-wms';
import { UtilsLayers } from '../_shared/utils/utils-layers';

export class Wmslayer extends Layer implements ILayerWms {

    id: string;
    wmsUrl: string;
    wmsLayers: string;
    singleTile: boolean;
    gutter: number;
    minScale: number;
    maxScale: number;

    constructor() {
        super(LayerType.wms);
        this.singleTile = false;
        this.gutter = 0;
        this.background = false;
        this.crossOrigin = false;
        this.highlightable = false;
        this.opacity = 1;
        this.searchable = true;
        this.timestamps = [];
        this.timeEnabled = false;
        this.timeBehaviour = '';
        this.queryLayers = '';
        this.featureCount = 10;
    }

    generateId(layers: LayerItem[]) {
        let id = '';
        if (this.wmsUrl) {
            id += this.wmsUrl.split('//')[1].split('/')[0];
        }
        if (this.wmsLayers) {
            id += '_' + this.wmsLayers;
        }
        id = UtilsLayers.replaceIdChar(id);
        return UtilsLayers.getUniqueId(layers, id, 0, id);
    }
}
