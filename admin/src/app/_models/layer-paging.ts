import { LayerItem } from "./layer-item";

export class LayerPaging {
    constructor(
        public firstPage: number,
        public lastPage: number,
        public totalItemsNum: number,
        public items: LayerItem[]){           
    }        
}
