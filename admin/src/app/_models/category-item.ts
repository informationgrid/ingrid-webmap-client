export class CategoryItem {
    children;
    layerBodId;
    constructor (
        public id: number = null,
        public label = '',
        public staging = 'prod',
        public selectedOpen = false
    ) {}
}
