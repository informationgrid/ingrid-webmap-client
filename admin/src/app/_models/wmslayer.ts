import { Layer } from "./layer";
import { LayerType } from "./layer-type.enum";
import { LayerItem } from "./layer-item";

export class Wmslayer extends Layer{

    id: string;
    wmsUrl: string;
    wmsLayers: string;
    singleTile: boolean;
    gutter: number;
    tooltip: boolean;
    minScale: number;
    maxScale: number
    
    constructor(){
        super(LayerType.wms);
        this.singleTile = false;
        this.gutter = 150;
    }

    generateId(layers: LayerItem[]){
        var id: string = "";
        var i: number = 0;
        if(this.wmsUrl){
            id += this.wmsUrl.split("//")[1].split("/")[0];
        }
        if(this.wmsLayers){
            id += "_" + this.wmsLayers;
            for (let index = 0; index < id.length; index++) {
                id = id.replace(",", "_");
            }
        }
        return this.getUniqueId(layers, id, i);
    }

    getUniqueId(layers: LayerItem[], id: string, i: number){
        layers.forEach(layer => {
            if(layer.id === id){
                i++;
                id += "_" + i;
                return this.getUniqueId(layers, id, i);
            }
        });
        return id;
    }
}