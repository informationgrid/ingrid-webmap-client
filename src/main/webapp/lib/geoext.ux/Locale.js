// global shortcut function for retrieving a localized string
function i18n(key, arrInsertValues) {
    return Local.getLocalizedString(key, Local.languageCode, arrInsertValues);
}

// "Local" is a simple "static" object containing methods and localization strings
Local = {

    // Default locale code - set based on cookie at the bottom of this script
    languageCode: null,
    languageCodeDefault: 'en',

    supportedLanguages: {
		en: {},
		de: {}
	},
    
    getLocalizedString: function(key, languageCode, arrInsertValues) {
	if (!this.localizedStrings[key]) {
            // return key if key is undefined in localization list
            return key;
        }
        if (!this.localizedStrings[key][languageCode]) {
            // return default language string or empty string if the string for the specified language is undefined
            return this.formatString(this.localizedStrings[key][this.languageCodeDefault] || '', arrInsertValues);
        }
        // give 'em what they asked for
        return (this.formatString(this.localizedStrings[key][languageCode], arrInsertValues));
    },


    // returns a localized string formatted to replace values {0},{1} etc with values from the passed array
    formatString: function(string, arrInsertValues) {
        var formattedString = string;
        if (arrInsertValues && arrInsertValues.constructor.toString().indexOf("Array") != -1) {
            for (var i = 0; i < arrInsertValues.length; i++) {
                formattedString = formattedString.replace('{' + i + '}', arrInsertValues[i]);
            }
        }
        return formattedString;
    },

    localizedStrings: {
    	tAbbrechen: { en: 'Cancel', de: 'Abbrechen' },
    	tAdresse: { en: 'Address', de: 'Adresse' },
    	tAdministrativeAuswahl: { en: 'Select administrative entity', de: 'Administrative Auswahl' },
    	tAdministrativeEinheit : { en: 'Administrative entity', de: 'Administrative Einheit' },
    	tAktiveDienste: { en: 'Active services', de: 'Aktive Dienste' },
    	tAnsprechpartner: { en: 'Point of contact', de: 'Ansprechpartner' },
    	tAlleZuAufklappen: { en: 'Expand/Collaps all', de: 'Alle auf/zuklappen' },
    	tAuswahlZuSuchanfrageHinzufuegen: { en: 'Add to query', de: 'Auswahl zu Suchanfrage hinzuf&uuml;gen' },
    	tBeschreibung: { en: 'Description', de: 'Beschreibung' },
    	tBitteCapabilitiesExternerService: { en: 'Enter the GetCapabilities-URL of an external web map service (WMS):', de: 'Bitte geben Sie eine GetCapabilities-URL eines externen web map service (WMS) an:' },
    	tBundesland: { en: 'County', de: 'Bundesland' },
    	tDatum: { en: 'Date', de: 'Datum' },
    	tDatumDerRegistrierung: { en: 'Date of registration', de: 'Datum der Registrierung' },
    	tDienste : { en: 'Services', de: 'Dienste' },
    	tDienstEntfernen: { en: 'Remove service', de: 'Dienst Entfernen' },
    	tDienstHinzufuegen : { en: 'Add service', de: 'Dienst hinzuf&uuml;gen' },
    	tDrehung : { en: 'Rotation', de: 'Drehung' },
    	tDrucken : { en: 'Print', de: 'Drucken' },
    	tFax : { en: 'Fax', de: 'Fax' },
    	tEmail : { en: 'E-Mail', de: 'E-Mail' },
    	tEbenen : { en: 'Layer', de: 'Ebenen' },
    	tEbenenAktivieren : { en: 'Activate layers of this service.', de: 'Ebenen des Kartendienstes aktivieren.' },
    	tEbenenZoomen : { en: 'Zoom to extent of this service.', de: 'Auf Ebenenausdehnung des Kartendienstes heranzoomen.' },
    	tErweiterteEinstellungen : { en: 'Extended Preferences', de: 'Erweiterte Einstellungen' },
    	tFeatureInfo: { en: 'Feature Info', de: 'Feature Info' },
    	tFlaeche : { en: 'Area', de: 'Fl&auml;che' },
    	tFormat : { en: 'Format', de: 'Format' },
        tGebietAuswaehlen : { en: 'Select area', de: 'Gebiet ausw&auml;hlen' },
        tGebuehren : { en: 'Fees', de: 'Geb&uuml;hren' },
        tHilfe : { en: 'Help', de: 'Hilfe' },
        tHintZoomToView : { en: 'Hint: You may have to zoom into the map to see the layers of the external service. The provider of the service is responsible for the display of the service. PortalU has no influence here.', de: 'Hinweis: M&ouml;glicherweise m&uuml;ssen Sie die Ansicht vergr&ouml;&szlig;ern, um Ebenen von externen Kartendiensten betrachten zu k&oumlnnen. Der Betreiber des Kartendienstes ist f&uuml;r die Anzeige verantwortlich. PortalU hat keine Beteiligung an dessen Verhalten.' },
        tInfo : { en: 'Info', de: 'Info' },
        tKarteHerunterladen: { en: 'Download map', de: 'Karte herunterladen' },
        tKarteDrucken: { en: 'Print map', de: 'Karte drucken' },
        tKarteGespeichert: { en: 'Map succesfully stored', de: 'Karte erfolgreich gespeichert' },
        tKarteKonnteNichtSpeichern: { en: 'Map could not be stored', de: 'Konnte Karte nicht speichern' },         
        tKarteLaden: { en: 'Load map', de: 'Karte laden' },
        tKarteSpeichern: { en: 'Save map', de: 'Karte speichern' },
        tKarteZoomen: { en: 'Zoom to initial map', de: 'Auf initiale Kartenausdehnung zoomen' },
        tKeineKartenVorhanden: { en: 'No maps available', de: 'Keine Karten vorhanden' },
        tKommentar: { en: 'Comment', de: 'Kommentar' },

        tKoordinatensysteme: { en: 'Coordinate system', de: 'Koordinatensysteme' },
        tKurzUrl: { en: 'Short-Url', de: 'Kurz-Url' },
        tLaden : { en: 'Load', de: 'Laden' },
        tLadeDruckkonfiguration : { en: 'Loading print configuration...', de: 'Lade Druckkonfiguration...' },
        tLand : { en: 'Country', de: 'Land' },
        tLayers: { en: 'Layers', de: 'Layers' },
        tLayerTransparenz : { en: 'Layer transparency', de: 'Layer Transparenz' },
        tLegende : { en: 'Legend', de: 'Legende' },
        tloeschen: { en: 'delete', de: 'löschen' },
        tMaszstab : { en: 'Scale', de: 'Ma&szlig;tab' },
        tMessen : { en: 'Measurement', de: 'Messen' },
        tMetadaten : { en: 'Metadata', de: 'Metadaten' },
        tMsgServiceAdded: { en: '<p><strong>Service added successfully</strong></p> Please choose a layer for display.', de: '<p><strong>Dienst erfolgreich hinzugef&uuml;gt</strong></p> Bitte w&auml;hlen sie einen Layer aus, um sich etwas anzeigen zu lassen.' },
        tMsgCannotRemoveBaselayer: { en: '<p><strong>The base layer cannot be removed.</strong></p>', de: '<p><strong>Basisdienst kann nicht entfernt werden.</strong></p>' },
        tMsgServiceRemoved: { en: '<p><strong>Service removed successfully!</strong></p>', de: '<p><strong>Dienst erfolgreich entfernt!</strong></p>' },
        tObjektinformationen : { en: 'Object information', de: 'Objektinformationen' },
        tOrganisation : { en: 'Organisation', de: 'Organisation' },
        tPDFErstellen: { en: 'Create PDF', de: 'PDF Erstellen' },
        tPleaseWait: { en: 'Please wait', de: 'Bitte warten' },
        tPLZ: { en: 'ZIP', de: 'PLZ' },
        tRaumbezugAuszerhalbDesFeldes: { en: 'Spatial reference outside field', de: 'Raumbezug au&szlig;erhalb des Feldes' },
        tRaumbezugssystem: { en: 'Spatial reference system', de: 'Raumbezugssystem' },
        tRegistrierendeStelle: { en: 'Registering authority', de: 'Registrierende Stelle' },
        tRequestingData: { en: 'Requesting data', de: 'Daten werden angefordert' },
        tSollDieKarteGeloeschtWerden: { en: 'Really delete map?', de: 'Soll die Karte wirklich gel&ouml;scht werden?' },
        tSpeichern : { en: 'Save', de: 'Speichern' },
        tStadt : { en: 'City', de: 'Stadt' },
        tStrecke : { en: 'Distance', de: 'Strecke' },
        tSuchbegriffEingeben : { en: 'Enter search query', de: 'Suchbegriff eingeben' },
        tSuche : { en: 'Search', de: 'Suche' },
        tSuchergebnisseLoeschen : { en: 'Delete search results', de: 'Suchergebnisse l&ouml;schen' },
        tSuchergebnisse: { en: 'Search results', de: 'Suchergebnisse' },
        tSuchen : { en: 'Search', de: 'Suchen' },
        tTelefon: { en: 'Phone', de: 'Telefon' },
        tTitle: { en: 'Title', de: 'Titel' },
        tUmDerSucheEinenRaumbezugHinzuzufuegenBitteEineAuswahlTreffen: { en: '<p>Please make a selection to add a spatial reference.<br/>The Icon to make a selection is situated in the upper left of the map.</p>', de: '<p>Um der Suche einen Raumbezug hinzuzuf&uuml;gen, bitte eine Auswahl treffen. <br/>Das Icon um ein Gebiet zu umspannen befindet sich in der linken obereren Ecke der Karte</p>' },
        tVor: { en: 'Forward', de: 'Vor' },
        tWmsId: { en: 'WMS ID', de: 'WMS ID' },
        tWmsTitle: { en: 'WMS Title', de: 'WMS Titel' },
        tWmsAbstract: { en: 'WMS Abstract', de: 'WMS Abstract' },
        tZeigePunktkoordinaten: { en: 'Show point coordinates', de: 'Zeige Punktkoordinaten' },
        tZugriffsbeschraenkung: { en: 'Access restriction', de: 'Zugriffsbeschr&auml;nkung' },
        tZumSpeichernErstEinloggen: { en: 'Login to save.', de: 'Zum Speichern erst einloggen.' },
        tZurueck: { en: 'Back', de: 'Zur&uuml;ck' },
        tZusammenfassung: { en: 'Abstract', de: 'Zusammenfassung' }
    }
}

// initialize localizing
if (!(typeof languageCode === 'undefined')) {
	Local.languageCode = languageCode;
}
if (!(Local.languageCode)) {
	var getLang = decodeURIComponent((location.search.match(RegExp("[?|&]languageCode=(.+?)(&|$)"))||[,null])[1]);
	if (getLang) {
		Local.languageCode = getLang;
	}	
}
if (!(Local.languageCode)) {
	Local.languageCode = Local.languageCodeDefault;
}
if (!Local.supportedLanguages[Local.languageCode]) {
	Local.languageCode = Local.languageCodeDefault;
}


