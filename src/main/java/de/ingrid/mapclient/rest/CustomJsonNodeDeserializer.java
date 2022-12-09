package de.ingrid.mapclient.rest;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.deser.std.JsonNodeDeserializer;
import com.fasterxml.jackson.dataformat.xml.deser.FromXmlParser;

import java.io.IOException;

public class CustomJsonNodeDeserializer extends JsonNodeDeserializer {

    @Override
    public JsonNode deserialize(JsonParser p, DeserializationContext context) throws IOException {
        //first deserialize
        JsonNode rootNode = super.deserialize(p, context);
        //then get the root name
        String rootName = ((FromXmlParser)p).getStaxReader().getLocalName();
        return context.getNodeFactory().objectNode().set(rootName, rootNode);
    }
}
