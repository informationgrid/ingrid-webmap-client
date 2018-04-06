import { ILayer } from './ilayer';

export interface ILayerWms extends ILayer {
    wmsUrl: string;
    wmsLayers: string;
    singleTile: boolean;
    gutter: number;
    minScale: number;
    maxScale: number;
}

