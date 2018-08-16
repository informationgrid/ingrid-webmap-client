export class CategoryItem {
    children;
    layerBodId;
    constructor (
        public id: number = null,
        public label = '',
        public staging = 'prod',
        public selectedOpen = false
    ) {}

    getNextCategoryNodeId(nodes: any[] , nodeId) {
        let id = nodeId;
        if (this.checkCategoryNodeId(nodes, id)) {
            id++;
            nodeId = this.getNextCategoryNodeId(nodes, id);
        }
        return nodeId;
    }

    checkCategoryNodeId(nodes: any[], nodeId) {
        let exist = false;
        if (nodes) {
            nodes.forEach(node => {
            if (node.id) {
                if (node.id === nodeId) {
                exist = true;
                }
                if (!exist) {
                if (node.children) {
                    exist = this.checkCategoryNodeId(node.children, nodeId);
                }
                }
            }
            });
        }
        return exist;
    }
}
