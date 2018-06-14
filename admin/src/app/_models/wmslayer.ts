import { Layer } from './layer';
import { LayerType } from './layer-type.enum';
import { LayerItem } from './layer-item';
import { ILayerWms } from '../_interfaces/ilayer-wms';

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
        this.gutter = 150;
    }

    generateId(layers: LayerItem[]) {
        let id = '';
        if (this.wmsUrl) {
            id += this.wmsUrl.split('//')[1].split('/')[0];
        }
        if (this.wmsLayers) {
            id += '_' + this.wmsLayers;
            for (let index = 0; index < id.length; index++) {
                id = id.replace(',', '_');
                id = id.replace('.', '_');
            }
        }
        return this.getUniqueId(layers, id, 0);
    }

    getUniqueId(layers: LayerItem[], id: string, i: number) {
        layers.forEach(layer => {
            if (layer.id === id) {
                i++;
                id += '_' + i;
                return this.getUniqueId(layers, id, i);
            }
        });
        return id;
    }
}
