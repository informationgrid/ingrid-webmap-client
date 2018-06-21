export class Category {
    constructor(
        public id: string = '',
        public defaultBackground: string = '',
        public selectedLayers = [],
        public backgroundLayers = [],
        public activatedLayers = []
    ) { }
}
