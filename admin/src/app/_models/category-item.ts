export class CategoryItem {
    constructor (
        public id: number = null,
        public label = '',
        public staging = 'prod',
        public layerBodId = '',
        public selectedOpen = false,
        public children: CategoryItem[] = []
    ) {}
}
