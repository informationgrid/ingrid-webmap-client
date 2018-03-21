export class CategoryItem {
    id: number;
    label: string;
    category: string;
    staging: string;
    layerBodId: string;
    selectedOpen: boolean;
    children: CategoryItem[];
    
    constructor(label: string, layerBodId: string, category: string, id: number){
        this.id = id;
        this.label = label;
        this.category = category;
        this.staging = 'prod';
        if (layerBodId) {
            this.layerBodId = layerBodId;
        }
        this.selectedOpen = false;
        this.children = new Array();
    }
}
