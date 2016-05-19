Webmap Client (ingrid-mf-geoadmin3)
============= 

Vorwort
----------

Die Datei 'index.mako.html' Datei wird für den Build-Prozess benötigt um verschiedene HTML-Dateien für verschiedene Anwendungsfälle zu generieren. Die Anwendungsfälle lauten:

- Desktop (index.html): Für PC und Laptop.
- Mobil (mobile.html): Für Mobile-Endgeräte wie Smartphones und Tablets 
- Embed (embed.html): Für die Einbindung in iFrames.

Einstellungen
----------

Die Möglichkeiten der Einstellungen sind für alle drei Anwendungsfälle gleich. Nicht alle vorhandenen Einstellungen des Projektes MF-GEOADMIN3 werden für den Betrieb in InGrid benötigt. Die wesentlichen Einstellungen werden nun hier aufgelistet:

## publicUrl
REST-Schnittstelle für allgemeine Dateien (z.B. KML). (Wird mitgeliefert!)

    publicUrl : location.origin + '/ingrid-webmap-client/rest/data'

## ogcproxyUrl
REST-Schnittstelle für die Anfrage nach WMS-Diensten. (Wird mitgeliefert!)

    ogcproxyUrl : location.protocol + '//' + location.host + '/ingrid-webmap-client' + '/rest/wms/proxy/?url='

## imgproxyUrl
REST-Schnittstelle für die Anfrage nach Images. (Wird mitgeliefert!)

    imgproxyUrl : location.protocol + '//' + location.host + '/ingrid-webmap-client' + '/rest/data/images/?url='

## searchServiceUrl
Definition der OpenSearch URL für die InGrid-Suche nach WMS Diensten.

    searchServiceUrl : 'https://dev.informationgrid.eu/opensearch/query?q={query}+t011_obj_serv_op_connpoint.connect_point:http*+t011_obj_serv.type:view+cache:off+datatype:metadata+ranking:score%26ingrid=1%26h=100'

## shortURLService

    shortURLService : 'https://is.gd/create.php?format=json&url='

## defaultTopicId
Definition der Default-Rubrik per ID.

    defaultTopicId: 'themen'

## defaultExtent
Definition des Default-Extents der Karte (in WGS-84)

    defaultExtent: JSON.parse('[0.42587260523, 46.9672880527, 15.7908768234, 55.1764096793]')

## defaultEpsg
Definition der Karten-Projektion.

    defaultEpsg: 'EPSG:3857'

## languages
Definition von unterstützten Sprachen.

    languages: JSON.parse('["de", "en"]')

## defaultCrossOrigin

    defaultCrossOrigin: false

## gaLayersProvider.layersConfigUrlTemplate
URL zur Datei im JSON-Format mit den definierten Layers.

    gaLayersProvider.layersConfigUrlTemplate = '../data/layers.json';

## gaTopicProvider.topicsUrl
URL zur Datei im JSON-Format mit den definierten Rubriken.

    gaTopicProvider.topicsUrl = '../data/catalogs.json';
