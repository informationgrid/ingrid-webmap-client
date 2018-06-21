import { Layer } from './layer';
import { LayerType } from './layer-type.enum';
import { ILayerWmts } from '../_interfaces/ilayer-wmts';

export class Wmtslayer extends Layer implements ILayerWmts {
    serviceUrl: string;
    template: string;
    serverLayerName: string;
    origin: number[];
    matrixSet: string;
    tileSize: number[];
    scales: number[];
    matrixIds: string[];
    requestEncoding: string;

    constructor() {
        super(LayerType.wmts);
        this.background = false;
        this.crossOrigin = false;
        this.searchable = true;
        this.hasLegend = false;
        this.legendUrl = '';
        this.tooltip = false;
        this.opacity = 1;
        this.timestamps = [];
        this.timeEnabled = false;
        this.timeBehaviour = '';
        this.singleTile = false;
    }

    generateId() {
        let id = '';
        if (this.serviceUrl) {
            id += this.serviceUrl.split('//')[1].split('/')[0];
        }
        if (this.matrixSet) {
            id += '_' + this.matrixSet.replace(',', '_');
        }
        return id.replace(/\./gi, '_');
    }
}
