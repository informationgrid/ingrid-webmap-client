export class CategoryItem {
    children;

    constructor (
        public id: number = null,
        public label = '',
        public staging = 'prod',
        public layerBodId = '',
        public selectedOpen = false
    ) {}
}
