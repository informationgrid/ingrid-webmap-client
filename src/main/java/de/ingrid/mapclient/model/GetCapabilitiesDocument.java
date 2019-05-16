package de.ingrid.mapclient.model;

import org.w3c.dom.Document;

public class GetCapabilitiesDocument {

    private String xml = null;
    private Document doc = null;

    public String getXml() {
        return xml;
    }
    public void setXml(String xml) {
        this.xml = xml;
    }
    public Document getDoc() {
        return doc;
    }
    public void setDoc(Document doc) {
        this.doc = doc;
    }
}
