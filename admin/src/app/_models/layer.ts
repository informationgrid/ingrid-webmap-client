import { LayerType } from './layer-type.enum';
import { ILayerWms } from '../_interfaces/ilayer-wms';
import { ILayerWmts } from '../_interfaces/ilayer-wmts';
import { ILayer } from '../_interfaces/ilayer';

export class Layer implements ILayer, ILayerWms, ILayerWmts {
    type: LayerType;
    label: string;
    background: boolean;
    format: string;
    attribution: string;
    attributionUrl: string;
    attributionUpdate: boolean;
    highlightable: boolean;
    hasLegend: boolean;
    legendUrl: string;
    searchable: boolean;
    version: string;
    opacity: number;
    crossOrigin: boolean;
    extent: number[];
    style: string;
    timestamps: string [];
    timeEnabled: boolean;
    timeBehaviour: string;
    tooltip: boolean;
    wmsUrl: string;
    wmsLayers: string;
    singleTile: boolean;
    gutter: number;
    minScale: number;
    maxScale: number;
    serviceUrl: string;
    template: string;
    serverLayerName: string;
    origin: number[];
    matrixSet: string;
    tileSize: number;
    scales: number[];
    matrixIds: string[];
    requestEncoding: string;
    featureInfoTpl: string;
    status: string;
    auth: string;
    queryLayers: string;
    featureCount: number;
    wmsWfsLabel: string;
    wmsWfsUrl: string;
    wmsWfsFeatureTypes: string;
    portalUrl: string;
    epsg: string;

    constructor(type: LayerType) {
        this.type = type;
    }
}
