import { LayerType } from '../_models/layer-type.enum';

export interface ILayer {
    type: LayerType;
    label: string;
    background: boolean;
    format: string;
    attribution: string;
    attributionUrl: string;
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
}
