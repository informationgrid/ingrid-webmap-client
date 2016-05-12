Webmap Client (ingrid-mf-geoadmin3)
============= 

Vorwort
----------

Für die Verwaltung von Layern und Rubriken sollen die nächsten Abschnitte eine groben Überblick erschaffen. Die verwendeten Daten des MapClients bestehen aus sogenannten JSON-Dateien. In diesen Dateien werden alle gepflegten Layer, vorhandene Rubriken und die Struktur einer Rubrik je definierter Rubrik hinterlegt. 

Folgende JSON-Dateien müssen vorhanden sein:

- layers.json 
- catalogs.json
- catalog-<TOPICS-ID>.json 

Daten-Struktur
----------

## Layer (layers.json)

Die JSON-Datei 'layers.json' listet alle Karten-Layern im MapClient auf. Die Struktur des JSON sieht folgendermaßeb aus:

    {
        "sg_geodatenzentrum_de_wms_webatlasde_light_webatlasde_light": {
            "wmsUrl": "http://sg.geodatenzentrum.de/wms_webatlasde.light?",  // --> URL des Layers
            "wmsLayers": "webatlasde.light",  // --> 'NAME' des Layers
            "gutter": 0,
            "attribution": "geodatenzentrum", // --> Titel für die URL unter 'attributionUrl' (wird in der Karte (unten rechts) angezeigt, wenn der Layer aktiv ist)
            "background": true,  // --> Layer ist ein Hintergrund-Layer 
            "format": "png",  // --> GetMap Bild-Format
            "serverLayerName": "sg_geodatenzentrum_de_wms_webatlasde_light_webatlasde_light",
            "selectbyrectangle": true, // --> WIRD NICHT BEI INGRID verwendet
            "attributionUrl": "http://www.bkg.bund.de/DE/Home/homepage__node.html__nnn=true", // --> URL für weiter Infos zum Layer
            "timeBehaviour": "last", // --> WIRD NICHT BEI INGRID verwendet
            "topics": "themen,anbieter", // --> Zugehörigen Rubriken
            "label": "webatlasde.light", // -->Titel des Layers
            "singleTile": false,  // --> Layer wird per SingleTile (Wert: true) geladen oder in Kacheln (Wert: false)
            "highlightable": true, // --> WIRD NICHT BEI INGRID verwendet
            "chargeable": false, // --> WIRD NICHT BEI INGRID verwendet
            "hasLegend": true,
            "type": "wms", // --> Typ des Layers
            "timeEnabled": false, // --> WIRD NICHT BEI INGRID verwendet
            "queryable": false,
            "version": "1.1.1",  // --> Version des Layers (Wert: 1.1.1 oder 1.3.0)
            "tooltip": false,  // -->
            "opacity": 1,  // --> Per default Sichtbarkeit/Transparenz des Layers setzen (Wert: 0 - 1)
            "searchable": true, // --> Layer kann in der Suche recherchiert werden (Wert: false oder true)
            "crossOrigin": false
        },
        ... 
    }

Durch die Auflistung der Layern in dieser JSON-Datei ist es möglich einem definierten Layer per ID einer Rubrik zu zuordnen. Zu dem wird die Datei 'layers.json' verwendet um schneller nach einem Layer per definierten 'label' zu suchen. 

## Rubriken (catalogs.json)

In der Datei 'catalogs.json' werden alle vorhanden Rubriken definiert. Die Definition einer Rubrik kann folgendermaßen aussehen:

    {
        "topics": [{
                "defaultBackground": "osmLayer", // --> Definition Hintergrund-Layer per default
                "langs": "de,fr,it,rm,en", // --> Vorhandene Sprachen der Rubrik
                "selectedLayers": [], // --> Definition von per Default selektierten Layern
                "activatedLayers": [], // --> Definition von per Default sichtbaren Layern
                "backgroundLayers": ["osmLayer", "sg_geodatenzentrum_de_wms_webatlasde_light_webatlasde_light"], // --> Definition von auswählbaren Hintergrund-Layern
                "id": "themen" // --> ID der Rubrik
            },
            ...
        ]
    }

## Rubrik (catalog-<TOPIC-ID>.json)

Zu jeder definierten Rubrik unter 'catalogs.json' muss eine weitere JSON-Datei erstellt werden. Von der Benennung muss diese Datei folgende Syntay haben:

    catalog-<TOPIC-ID>.json



    {
        "results": {
            "root": {
                "category": "root",
                "staging": "prod",
                "id": 1,
                "children": [{
                    "category": "cat70",
                    "staging": "prod",
                    "selectedOpen": false, 
                    "label": "Geobasisdaten", // --> Titel der Unterrubrik
                    "id": 2, // --> Eindeutige und einmalige ID 
                    "children": [{
                        "category": "cat71",
                        "staging": "prod",
                        "selectedOpen": false,
                        "label": "Bestandsübersicht Geodatendienste VKV", // --> Titel der Unterrubrik
                        "id": 3, // --> Eindeutige und einmalige ID 
                        "children": [{
                            "category": "layer",
                            "staging": "prod",
                            "label": "LGLN-Bestand", // --> Titel der Layers
                            "layerBodId": "-652009786_bestand", // --> ID des Layers (definiert in layers.json)
                            "id": 4, // --> Eindeutige und einmalige ID 
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
