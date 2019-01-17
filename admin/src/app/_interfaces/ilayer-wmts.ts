import { ILayer } from './ilayer';

export interface ILayerWmts extends ILayer {
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
}
