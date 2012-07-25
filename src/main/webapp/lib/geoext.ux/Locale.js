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
    	tBeimSpeichernDerDatenIstEinFehlerAufgetreten: { en: 'Error storing the Data.', de: 'Beim Speichern der Daten ist ein Fehler aufgetreten.' },
    	tBeschreibung: { en: 'Description', de: 'Beschreibung' },
    	tBitteCapabilitiesExternerService: { en: 'Enter the GetCapabilities-URL of an external web map service (WMS):', de: 'Bitte geben Sie eine GetCapabilities-URL eines externen web map service (WMS) an:' },
    	tBundesland: { en: 'County', de: 'Bundesland' },
    	tCouldNotObtainAdminInfo: { en: 'Could not obtain administrative information.', de: 'Konnte keine administrativen Informationen abrufen.' },
    	tDasLaderDerKonfigurationIstFehlgeschlagen: { en: 'Error while loading the configuration.', de: 'Das Laden der Konfiguration ist fehlgeschlagen.' },
    	tDatum: { en: 'Date', de: 'Datum' },
    	tDatumDerRegistrierung: { en: 'Date of registration', de: 'Datum der Registrierung' },
    	tDieAenderungenWurdenGespeichert: {en:'The changes have been saved successfully.', de: 'Die &Auml;nderungen wurden gespeichert.'},
    	tDienste : { en: 'Services', de: 'Dienste' },
    	tDienstEntfernen: { en: 'Remove service', de: 'Dienst Entfernen' },
    	tDienstHinzufuegen : { en: 'Add service', de: 'Dienst hinzuf&uuml;gen' },
    	tDrehung : { en: 'Rotation', de: 'Drehung' },
    	tDrucken : { en: 'Print', de: 'Drucken' },
    	tFax : { en: 'Fax', de: 'Fax' },
    	tEbenen : { en: 'Layer', de: 'Ebenen' },
    	tEbenenAktivieren : { en: 'Activate layers of this service.', de: 'Ebenen des Kartendienstes aktivieren.' },
    	tEbenenZoomen : { en: 'Zoom to extent of this service.', de: 'Auf Ebenenausdehnung des Kartendienstes heranzoomen.' },
    	tEmail : { en: 'E-Mail', de: 'E-Mail' },
    	tErweiterteEinstellungen : { en: 'Extended Preferences', de: 'Erweiterte Einstellungen' },
        tError: { en: 'Error', de: 'Fehler' },
    	tErrorLoadingCapability : { en: 'Error loading capability.', de: 'Das Laden des Capabilities Dokuments ist fehlgeschlagen.' },
    	tErrorLoadingProjectionDef : { en: 'Error loading projection definitions.', de: 'Das Laden der Projektionsdefinition ist fehlgeschlagen.' },
    	tErrorListingMap : { en: 'Error listing map.', de: 'Die Karten konnten nicht gelistet werden.' },
    	tErrorPrintingMap : { en: 'Error printing map.', de: 'Beim Drucken der Karte ist ein Fehler aufgetreten.' },
    	tErrorRemovingMap : { en: 'Error deleting map.', de: 'Beim L&ouml;schen der Karte ist ein Fehler aufgetreten.' },
    	tErrorSavingMap : { en: 'Error saving map.', de: 'Beim Speichern der Karte ist ein Fehler aufgetreten.' },
    	tErrorSearching : { en: 'Error while performing search.', de: 'Beim Suchen ist ein Fehler aufgetreten.' },
    	tFeatureInfo: { en: 'Feature Info', de: 'Feature Info' },
    	tFlaeche : { en: 'Area', de: 'Fl&auml;che' },
    	tFormat : { en: 'Format', de: 'Format' },
    	tFuerTransparenzErst : { en: 'Select a layer for transparency first.', de: 'F&uuml;r Transparenzfunktion einen Layer markieren.' },
    	tFuerMetadatenErst : { en: 'Select a layer or service to display metadata first.', de: 'F&uuml;r Metadatenanzeige Dienst oder Layer markieren.' },
        tGebietAuswaehlen : { en: 'Select area', de: 'Gebiet ausw&auml;hlen' },
        tGebuehren : { en: 'Fees', de: 'Geb&uuml;hren' },
        tHilfe : { en: 'Help', de: 'Hilfe' },
        tHintZoomToView : { en: 'Hint: You may have to zoom into the map to see the layers of the external service. The provider of the service is responsible for the display of the service. PortalU has no influence here.', de: 'Hinweis: M&ouml;glicherweise m&uuml;ssen Sie die Ansicht vergr&ouml;&szlig;ern, um Ebenen von externen Kartendiensten betrachten zu k&oumlnnen. Der Betreiber des Kartendienstes ist f&uuml;r die Anzeige verantwortlich. PortalU hat keine Beteiligung an dessen Verhalten.' },
		tIdAuswaehlen : { en: 'Select an ID of an administrative unit', de: 'ID einer Administrativen Einheit ausw&auml;hlen' },
        tInfo : { en: 'Info', de: 'Info' },
        tKarteHerunterladen: { en: 'Save map as WMC document', de: 'Karte als WMC abspeichern' },
        tKarteDrucken: { en: 'Print map', de: 'Karte drucken' },
        tKarteGespeichert: { en: 'Map succesfully stored', de: 'Karte erfolgreich gespeichert' },
        tKarteKonnteNichtSpeichern: { en: 'Map could not be stored', de: 'Konnte Karte nicht speichern' },         
        tKarteLaden: { en: 'Load map', de: 'Karte laden' },
        tKarteSpeichern: { en: 'Save map', de: 'Karte speichern' },
        tKarteVerschieben: { en: 'Move map', de: 'Karte verschieben' },
        tKarteZoomen: { en: 'Zoom to initial map', de: 'Auf initiale Kartenausdehnung zoomen' },
        tKeineKartenVorhanden: { en: 'No maps available', de: 'Keine Karten vorhanden' },
        tKommentar: { en: 'Comment', de: 'Kommentar' },
		tKonnteKarteNichtSpeichern: { en: 'Error saving map.', de: 'Beim Speichern der Karte ist ein Fehler aufgetreten.' },
        tKoordinatensysteme: { en: 'Coordinate system', de: 'Koordinatensysteme' },
        tKurzUrl: { en: 'Short-Url', de: 'Kurz-Url' },
        tKurzUrlMessage: { en: 'With this short-url the saved map can be accessed directly:', de: 'Mit dieser Url kann die gespeicherte Karte direkt aufgerufen werden:' },
        tLaden : { en: 'Load', de: 'Laden' },
        tLadeDruckkonfiguration : { en: 'Loading print configuration...', de: 'Lade Druckkonfiguration...' },
        tLand : { en: 'Country', de: 'Land' },
        tLayers: { en: 'Layers', de: 'Layers' },
        tLayerTransparenz : { en: 'Layer transparency', de: 'Layer Transparenz' },
        tLegende : { en: 'Legend', de: 'Legende' },
        tloeschen: { en: 'delete', de: 'l&ouml;schen' },
        tMaszstab : { en: 'Scale', de: 'Ma&szlig;stab' },
        tMessen : { en: 'Measure Tool', de: 'Messen' },
        tMetadaten : { en: 'Metadata', de: 'Metadaten' },
        tMsgServiceAdded: { en: '<p><strong>Service added successfully</strong></p> Please choose a layer for display.', de: '<p><strong>Dienst erfolgreich hinzugef&uuml;gt</strong></p> Sie k&ouml;nnen nun beim neu hinzugef&uuml;gten Dienst aus der Liste verf&uuml;gbarer Layer ausw&auml;hlen.' },
        tMsgCannotRemoveBaselayer: { en: '<p><strong>The base layer cannot be removed.</strong></p>', de: '<p><strong>Basisdienst kann nicht entfernt werden.</strong></p>' },
        tMsgServiceRemoved: { en: '<p><strong>Service removed successfully!</strong></p>', de: '<p><strong>Dienst erfolgreich entfernt!</strong></p>' },
        tObjektinformationen : { en: 'Object information', de: 'Objektinformationen' },
        tOrganisation : { en: 'Organisation', de: 'Organisation' },
        tPDFErstellen: { en: 'Create PDF', de: 'PDF Erstellen' },
        tPleaseWait: { en: 'Please wait', de: 'Bitte warten' },
        tPLZ: { en: 'ZIP', de: 'PLZ' },
        tProjectionNotSupported: { en: 'The spatial projection (EPSG) is not supported by the base map.', de: 'Das geladene Raumbezugssystem (EPSG) wird von der Basiskarte nicht unterst&uuml;tzt.' },
        tRaumbezugAuszerhalbDesFeldes: { en: 'Spatial reference outside field', de: 'Raumbezug au&szlig;erhalb des Feldes' },
        tRaumbezugssystem: { en: 'Spatial reference system', de: 'Raumbezugssystem' },
        tRegistrierendeStelle: { en: 'Registering authority', de: 'Registrierende Stelle' },
        tRequestingData: { en: 'Requesting data', de: 'Daten werden angefordert' },
        tServiceAlreadyAdded: { en: 'Service was already added.', de: 'Der Dienst wurde bereits hinzugef&uuml;gt.' },
        tSollDieKarteGeloeschtWerden: { en: 'Really delete map?', de: 'Soll die Karte wirklich gel&ouml;scht werden?' },
        tSpeichern : { en: 'Save', de: 'Speichern' },
        tStadt : { en: 'City', de: 'Stadt' },
        tStrecke : { en: 'Distance', de: 'Strecke' },
        tSuccessMapSaved : { en: 'The map has been saved.', de: 'Die Karte wurde gespeichert.' },
        tSuccessSearching : { en: 'Search successful.', de: 'Suche erfolgreich.' },
        tSuchbegriffEingeben : { en: 'Enter search query', de: 'Suchbegriff eingeben' },
        tSuche : { en: 'Search', de: 'Suche' },
        tSuchergebnisseLoeschen : { en: 'Delete search results', de: 'Suchergebnisse l&ouml;schen' },
        tSuchergebnisse: { en: 'Search results', de: 'Suchergebnisse' },
        tSuchen : { en: 'Search', de: 'Suchen' },
        tTelefon: { en: 'Phone', de: 'Telefon' },
        tTitle: { en: 'Title', de: 'Titel' },
        tUmDerSucheEinenRaumbezugHinzuzufuegenBitteEineAuswahlTreffen: { en: '<p><strong>With the following actions you can pick a spatial reference to which the search results will be limited:</strong><br/><br/>' 
				+'<strong>- "Move map"</strong> <span style="margin-bottom:-3px;border:0;padding-left:17px;" class="iconDefault"> : Move the map, while pressing the left mouse button.</span><br/><br/>' 
				+'<strong>- "Gebiet ausw&auml;hlen"</strong> <span style="margin-bottom:-3px;border:0;padding-left:17px;" class="iconSelectCoordinates"> : Choose an area which limits the search results. Consider the options at the bottom of the map also.</span><br/><br/>' 
				+'<strong>- "Select an ID of an administrative unit"</strong> <span style="margin-bottom:-3px;border:0;padding-left:17px;" class="iconInfo"> : With this option you can click on any position in the map and receive the official are area identification as area-ID.</span> </p>', 
				de: '<p><strong>Mit folgenden Aktionen k&ouml;nnen Sie einen Raumbezug ausw&auml;hlen, auf welchen dann die Suchergebnisse eingeschr&auml;nkt werden:</strong><br/><br/>' 
				+'<strong>- "Karte verschieben"</strong> <span style="margin-bottom:-3px;border:0;padding-left:17px;" class="iconDefault"> : Verschieben Sie den Kartenausschnitt, indem Sie bei gedr&uuml;ckter linker Maustaste die Karte bewegen.</span><br/><br/>' 
				+'<strong>- "Gebiet ausw&auml;hlen"</strong> <span class="iconSelectCoordinates" style="margin-bottom:-3px;border:0;padding-left:17px;"> : W&auml;hlen Sie ein Gebiet aus, welches r&auml;umlich die Suchergebnisse beschr&auml;nkt. Beachten Sie auch die Optionen unterhalb der Karte.</span><br/><br/>' 
				+'<strong>- "ID einer Administrativen Einheit ausw&auml;hlen"</strong> <span style="margin-bottom:-3px;border:0;padding-left:17px;" class="iconInfo"> : Mit dieser Option k&ouml;nnen Sie an beliebiger Stelle in die Karte klicken und erhalten die verf&uuml;gbaren offiziellen Gebietsbezeichnungen als Area-ID.</span> </p>' },
        tUnknownViewConfiguration: { en: 'Unknown view configuration.', de: 'Die View-Konfiguration ist unbekannt.' },
        tUnsupportedSpatialReferenceSystem: { en: 'The spatial reference system ({0}) is not supported by the service ({1}).', de: 'Das Raumbezugssystem ({0}) wird von den geladenen Diensten ({1}) nicht unterst&uuml;tzt.' },
        tVor: { en: 'Forward', de: 'Vor' },
        tWarning: { en: 'Warning', de: 'Warnung' },
        tWmsId: { en: 'WMS ID', de: 'WMS ID' },
        tWmsTitle: { en: 'WMS Title', de: 'WMS Titel' },
        tWmsAbstract: { en: 'WMS Abstract', de: 'WMS Abstract' },
        tZeigePunktkoordinaten: { en: 'Show point coordinates', de: 'Zeige Punktkoordinaten' },
        tZugriffsbeschraenkung: { en: 'Access restriction', de: 'Zugriffsbeschr&auml;nkung' },
        tZumSpeichernErstEinloggen: { en: 'Login to save.', de: 'Zum Speichern erst einloggen.' },
        tZumEntfernenErstEinenDienstMarkieren: { en: 'To remove a service first select one.', de: 'Zum Entfernen erst einen Dienst markieren.' },
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


