// global shortcut function for retrieving a localized string
function i18n(key, arrInsertValues) {
    return Local.getLocalizedString(key, Local.languageCode, arrInsertValues);
}

// "Local" is a simple "static" object containing methods and localization strings
Local = {

    // Default locale code - set based on cookie at the bottom of this script
    languageCode: 'en',
    languageCodeDefault: 'en',
    charset: 'utf-8',

    languages: [
        ['en', 'English', 'utf-8'],
        ['de', 'Deutsch', 'utf-8']
    ],

    getLocalizedString: function(key, languageCode, arrInsertValues) {
        if (!this.localizedStrings[key]) {
            // return key if key is undefined in localization list
            return key;
        }
        if (!this.localizedStrings[key][languageCode]) {
            // return default language string or empty string if the string for the specified language is undefined
            return this.formatString(this.localizedStrings[key][this.lcDefault] || '', arrInsertValues);
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
    	tAdministrativeAuswahl: { en: 'Select administrative entity', de: 'Administrative Auswahl' },
    	tAdministrativeEinheit : { en: 'Administrative entity', de: 'Administrative Einheit' },
    	tAktiveDienste: { en: 'Active services', de: 'Aktive Dienste' },
    	tAlleZuAufklappen: { en: 'Expand/Collaps all', de: 'Alle auf/zuklappen' },
    	tAuswahlZuSuchanfrageHinzufuegen: { en: 'Add to query', de: 'Auswahl zu Suchanfrage hinzuf&uuml;gen' },
    	tBeschreibung: { en: 'Description', de: 'Beschreibung' },
    	tDatum: { en: 'Date', de: 'Datum' },
    	tDatumDerRegistrierung: { en: 'Date of registration', de: 'Datum der Registrierung' },
    	tDienste : { en: 'Services', de: 'Dienste' },
    	tDienstEntfernen: { en: 'Remove service', de: 'Dienst Entfernen' },
    	tDienstHinzufuegen : { en: 'Add service', de: 'Dienst hinzuf&uuml;gen' },
    	tDrucken : { en: 'Print', de: 'Drucken' },
    	tFeatureInfo: { en: 'Feature Info', de: 'Feature Info' },
    	tFlaeche : { en: 'Area', de: 'Fl&auml;che' },
        tGebietAuswaehlen : { en: 'Select area', de: 'Gebiet ausw&auml;hlen' },
        tHilfe : { en: 'Help', de: 'Hilfe' },
        tInfo : { en: 'Info', de: 'Info' },
        tKarteHerunterladen: { en: 'Download map', de: 'Karte herunterladen' },
        tKarteLaden: { en: 'Load map', de: 'Karte laden' },
        tKeineKartenVorhanden: { en: 'No maps available', de: 'Keine Karten vorhanden' },
        tKoordinatensysteme: { en: 'Coordinate system', de: 'Koordinatensysteme' },
        tKurzUrl: { en: 'Short-Url', de: 'Kurz-Url' },
        tLaden : { en: 'Load', de: 'Laden' },
        tLayers: { en: 'Layers', de: 'Layers' },
        tLayerTransparenz : { en: 'Layer transparency', de: 'LayerTransparenz' },
        tLegende : { en: 'Legend', de: 'Legende' },
        tloeschen: { en: 'delete', de: 'löschen' },
        tMessen : { en: 'Measurement', de: 'Messen' },
        tMetadaten : { en: 'Metadata', de: 'Metadaten' },
        tMsgServiceAdded: { en: '<p><strong>Service added successfully</strong></p> Please choose a layer for display.', de: '<p><strong>Dienst erfolgreich hinzugef&uuml;gt</strong></p> Bitte w&auml;hlen sie einen Layer aus, um sich etwas anzeigen zu lassen.' },
        tMsgCannotRemoveBaselayer: { en: '<p><strong>The base layer cannot be removed.</strong></p>', de: '<p><strong>Basisdienst kann nicht entfernt werden.</strong></p>' },
        tMsgServiceRemoved: { en: 'Service removed successfully!', de: 'Dienst erfolgreich entfernt!' },
        tObjektinformationen : { en: 'Object information', de: 'Objektinformationen' },
        tPleaseWait: { en: 'Please wait', de: 'Bitte warten' },
        tRaumbezugAuszerhalbDesFeldes: { en: 'Spatial reference outside field', de: 'Raumbezug au&szlig;erhalb des Feldes' },
        tRegistrierendeStelle: { en: 'Registering authority', de: 'Registrierende Stelle' },
        tRequestingData: { en: 'Requesting data', de: 'Daten werden angefordert' },
        tSollDieKarteGeloeschtWerden: { en: 'Really delete map?', de: 'Soll die Karte wirklich gel&ouml;scht werden?' },
        tSpeichern : { en: 'Save', de: 'Speichern' },
        tStrecke : { en: 'Distance', de: 'Strecke' },
        tSuchbegriffEingeben : { en: 'Enter search query', de: 'Suchbegriff eingeben' },
        tSuche : { en: 'Search', de: 'Suche' },
        tSuchen : { en: 'Search', de: 'Suchen' },
        tTitle: { en: 'Title', de: 'Titel' },
        tUmDerSucheEinenRaumbezugHinzuzufuegenBitteEineAuswahlTreffen: { en: 'Please make a selection to add a spatial reference. <br/>The Icon to make a selection is situated in the upper left of the map.', de: 'Um der Suche einen Raumbezug hinzuzuf&uuml;gen, bitte eine Auswahl treffen. <br/>Das Icon um ein Gebiet zu umspannen befindet sich in der linken obereren Ecke der Karte' },
        tVor: { en: 'Forward', de: 'Vor' },
        tWmsId: { en: 'WMS ID', de: 'WMS ID' },
        tZeigePunktkoordinaten: { en: 'Show point coordinates', de: 'Zeige Punktkoordinaten' },
        tZumSpeichernErstEinloggen: { en: 'Login to save.', de: 'Zum Speichern erst einloggen.' },
        tZurueck: { en: 'Back', de: 'Zur&uuml;ck' },
        tZusammenfassung: { en: 'Abstract', de: 'Zusammenfassung' },
        tDateFormat : { en: 'Y\/m\/d - g\:iA', ja: 'G\:i - Y年m月d日' },    
        tGoodMorning: { en: 'Good morning, {0}.', ja: '{0}様、おはようございます。' }
    }
}

// this is the first script to run, so we can set default language here based on cookie
var cookie = new Ext.state.CookieProvider();
Local.languageCode = cookie.get('languageCode') ? cookie.get('languageCode') : Local.languageCodeDefault;