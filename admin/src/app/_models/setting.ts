export class Setting {
    constructor (
        public settingDefaultTopicId = '',
        public settingEpsg = '',
        public settingExtent: number[] = [],
        public settingEpsgExtent: number[] = [],
        public settingLanguages: string[] = [],
        public settingShortURLService = '',
        public settingSearchServiceUrl = '',
        public settingGazetterZoom = 0,
        public settingSearchNominatimUrl = '',
        public settingSearchBwaLocatorUrl = '',
        public settingSearchBwaLocatorGeoUrl = '',
        public settingSearchBwaLocatorStationUrl = '',
        public settingCopyrightURL = '',
        public settingSitemapURL = '',
        public settingUseGeodesic = false,
        public settingDefaultMouseProjections = false,
        public settingDefaultImportList: string[] = [],
        public settingShareFacebook = false,
        public settingShareMail = false,
        public settingShareGoogle = false,
        public settingShareTwitter = false,
        public settingShareIFrame = false,
        public settingShareLink = false,
        public settingShareQR = false,
        public settingShareWhatsapp = false,
        public settingPrintLogo = new Map<string, any>(),
        public settingPrintNorthArrow = '',
        public settingPrintGraticuleLayer = false,
        public settingPrintFilename = '',
        public settingPrintDependOnMouseProj = false,
        public settingKMLName = '',
        public settingHideCatalog = false,
        public settingEnableW3W = false,
        public w3wUrl = '',
        public w3wApiKey = '',
        public settingShowLayerServiceTree = false,
        public settingShowLayerServiceName = false,
        public settingCheckLayerInRange = false,
        public settingShowISOXML = false,
        public settingSearchCoordsXY = false,
        public settingSearchCoordsZoom = 16,
        public settingEnable3D = false,
        public settingDefaultTerrain = ''
    ) {}
}
