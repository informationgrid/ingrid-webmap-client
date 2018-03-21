import { LayerRestEncoding } from "./layer-rest-encoding.enum";
import { Layer } from "./layer";
import { LayerType } from "./layer-type.enum";

export class Wmtslayer extends Layer{
    serviceUrl: string;
    template: string;
    serverLayerName: string;
    origin: number[];
    matrixSet: string;
    tileSize: number[];
    scales: number[];
    matrixIds: string[];
    requestEncoding: string;
      
    constructor(){
        super(LayerType.wmts);
    }

    generateId(){
        let id = ''
        if(this.serviceUrl){
            id += this.serviceUrl.split("//")[1].split("/")[0];
        }
        if(this.matrixSet){
            id += "_" + this.matrixSet.replace(",", "_");
        }
        return id;
    }
}
