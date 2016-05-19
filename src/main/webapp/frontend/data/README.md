Webmap Client (ingrid-mf-geoadmin3)
============= 

Vorwort
----------

Für die Verwaltung von Layern und Rubriken sollen die nächsten Abschnitte eine groben Überblick erschaffen. Die verwendeten Daten des MapClients bestehen aus sogenannten Dateien im JSON-Format. In diesen Dateien werden alle gepflegten Layer, vorhandene Rubriken und die Struktur einer Rubrik je definierter Rubrik hinterlegt. 

Folgende Dateien im JSON-Format müssen vorhanden sein:

- layers.json 
- catalogs.json
- catalog-<TOPICS-ID>.json 

Daten-Struktur
----------

## Layer (layers.json)

Die JSON-Datei 'layers.json' listet alle Karten-Layers im MapClient auf, d.h. Basis-Layers für den Mapclient und Layers, die ggfs. einer Rubrik zugeordnet sind.

Die Struktur des JSON-Formats sieht folgendermaßen aus:

    {
        "sg_geodatenzentrum_de_wms_webatlasde_light_webatlasde_light": {
        // URL des Layers
            "wmsUrl": "http://sg.geodatenzentrum.de/wms_webatlasde.light?",
        // 'NAME' des Layers
            "wmsLayers": "webatlasde.light",
        // Rand in Pixel um Tiles
            "gutter": 0,
        // Titel für die URL unter 'attributionUrl' (wird in der Karte (unten rechts) angezeigt, wenn der Layer aktiv ist)
            "attribution": "geodatenzentrum",
        // URL für weitere Infos zum Layer
            "attributionUrl": "http://www.bkg.bund.de/DE/Home/homepage__node.html__nnn=true",
        // Layer ist ein Hintergrund-Layer 
            "background": true,
        // GetMap Bild-Format
            "format": "png",
        // Layer-Name für WMTS
            "serverLayerName": "sg_geodatenzentrum_de_wms_webatlasde_light_webatlasde_light",
        // WIRD NICHT BEI INGRID VERWENDET
            "selectbyrectangle": true,
        // WIRD NICHT BEI INGRID VERWENDET
            "timeBehaviour": "last",
        // Zugehörigen Rubriken
            "topics": "themen,anbieter",
        // Titel des Layers
            "label": "webatlasde.light",
        // Layer wird per SingleTile (Wert: true) geladen oder in Kacheln (Wert: false) 
            "singleTile": false,
        // WIRD NICHT BEI INGRID VERWENDET
            "highlightable": true,
        // WIRD NICHT BEI INGRID VERWENDET
            "chargeable": false, 
        // WIRD NICHT BEI INGRID VERWENDET
            "hasLegend": true,
        // Typ des Layers
            "type": "wms",
        // WIRD NICHT BEI INGRID VERWENDET
            "timeEnabled": false,
        // GetFeature-Info-Abfrage ist möglich
            "queryable": false,
        // Version des Layers (Wert: 1.1.1 oder 1.3.0)
            "version": "1.1.1",
        // Tooltip ist vorhanden
            "tooltip": false,
        // Per default Sichtbarkeit/Transparenz des Layers setzen (Wert: 0 - 1)
            "opacity": 1,
        // Layer kann in der Suche recherchiert werden (Wert: false oder true)
            "searchable": true,
        // GetMap-Anfrage auf Layer liefert im Response-Header 'Access-Control-Allow-Origin: * || <HOST>'
            "crossOrigin": false
        },
        ... 
    }

Diese Datei ist auch in der Suche integriert, um schneller nach einem gepflegten Layer über den definierten 'label' zu suchen und der Karte hinzuzufügen.

## Rubriken (catalogs.json)

In der Datei 'catalogs.json' werden alle vorhanden Rubriken definiert. Die Definition einer Rubrik kann folgendermaßen aussehen:

    {
        "topics": [{
            // Definition Hintergrund-Layer per default
                "defaultBackground": "osmLayer",
            // Vorhandene Sprachen der Rubrik 
                "langs": "de,en",
            // Definition von per Default selektierten Layern
                "selectedLayers": [],
            // Definition von per Default sichtbaren Layern
                "activatedLayers": [],
            // Definition von auswählbaren Hintergrund-Layern
                "backgroundLayers": ["osmLayer", "sg_geodatenzentrum_de_wms_webatlasde_light_webatlasde_light"],
            // ID der Rubrik 
                "id": "themen"
            },
            ...
        ]
    }

## Rubrik (catalog-<TOPIC-ID>.json)

Zu jeder definierten Rubrik unter 'catalogs.json' muss eine weitere JSON-Datei erstellt werden. Von der Benennung der Datei muss diese folgende Syntax vorweisen:

    catalog-<TOPIC-ID>.json

In der erstellten Datei wird die Struktur der Rubrik im JSON-Format hinterlegt. Wie der Inhalt des JSON-Formats aussehen kann, zeigt folgendes Beispiel:

    {
        "results": {
            "root": {
            // Root Rubrik ID (immer 'root')
                "category": "root",
            // WIRD NICHT BEI INGRID VERWENDET
                "staging": "prod",
            
                "id": 1,
            // Definition von Unterknoten
                "children": [{
                // WIRD NICHT BEI INGRID VERWENDET
                    "category": "cat70",
                // WIRD NICHT BEI INGRID VERWENDET
                    "staging": "prod",
                // Knoten-Status per Default
                    "selectedOpen": false,
                // Titel des Knotens
                    "label": "Geobasisdaten",
                // Eindeutige und einmalige Rubrik-Knoten ID, erweitert URL-Parameter 'catalogNodes' (Wiederherstellung Knoten-Status)
                    "id": 2, 
                // Definition von Unterknoten
                    "children": [{
                    // WIRD NICHT BEI INGRID VERWENDET
                        "category": "cat71",
                    // WIRD NICHT BEI INGRID VERWENDET
                        "staging": "prod",
                    // Knoten-Status per Default
                        "selectedOpen": false,
                    // Titel des Knotens
                        "label": "Bestandsübersicht Geodatendienste VKV",
                    // Eindeutige und einmalige Rubrik-Knoten ID, erweitert URL-Parameter 'catalogNodes' (Wiederherstellung Knoten-Status)
                        "id": 3,
                    // Definition von Unterknoten
                        "children": [{
                        // WIRD NICHT BEI INGRID VERWENDET
                            "category": "layer",
                        // WIRD NICHT BEI INGRID VERWENDET
                            "staging": "prod",
                        // Titel des Knotens
                            "label": "LGLN-Bestand",
                        // ID des Layers (definiert in layers.json)
                            "layerBodId": "-652009786_bestand",
                        // Eindeutige und einmalige Rubrik-Knoten ID, erweitert URL-Parameter 'catalogNodes' (Wiederherstellung Knoten-Status)
                            "id": 4,
                        // Definition von Unterknoten
                            "children":[]
                        },
                        ...
                        ]
                    },
                    ...
                    ]
                },
                ...
                ]
            }
        }
    }

