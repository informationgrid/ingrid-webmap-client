export class Category {
    constructor(
        public id: string,
        public langs: string,
        public defaultBackground: string,
        public selectedLayers,
        public backgroundLayers,
        public activatedLayers){
    }
}
