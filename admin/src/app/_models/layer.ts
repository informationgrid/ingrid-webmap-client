import { LayerType } from "./layer-type.enum";
import { LayerRestEncoding } from "./layer-rest-encoding.enum";

export class Layer {
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
     
    constructor(type: LayerType){
        this.type = type;
        this.background = false;
        this.attribution = '';
        this.attributionUrl = '';
        this.highlightable = false;
        this.hasLegend = false;
        this.legendUrl = '';
        this.searchable = true;
        this.opacity = 1;
        this.crossOrigin = false;
        this.timestamps = [];
        this.timeEnabled = false;
        this.timeBehaviour = 'last';
    }
}
