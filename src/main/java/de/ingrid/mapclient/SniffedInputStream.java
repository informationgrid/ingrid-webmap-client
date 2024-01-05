/*
 * **************************************************-
 * InGrid Web Map Client
 * ==================================================
 * Copyright (C) 2014 - 2024 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.2 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
package de.ingrid.mapclient;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.Charset;

import org.apache.commons.lang.StringUtils;

/**
 * Specialized input stream that sneaks at the input stream to detect the
 * encoding of the input stream.<br/>
 * <b>INPUT STREAM CAN BE XML (GetCapabilities) OR HTML (GetFeatureInfo)</b>
 * <br/>
 * It uses the following strategies:
 * 
 * <li>check {@code<html>} header</li>
 * <li>use magic bytes</li>
 * <li>check {@code<xml>} header</li>
 * <li>presume UTF-8</li>
 * 
 */
public class SniffedInputStream extends BufferedInputStream {
    // We don't sniff more than 192 bytes.
    // We do ! Because we also extract encoding from HTML header ! 500 should be
    // enough !
    public static final int MAX_SNIFFED_BYTES = 500;

    /** Type of requested file */
    private enum FileType {
        XML, // GetCapabilities
        HTML // GetFeatureInfo
    }

    private String encoding;

    public SniffedInputStream(InputStream stream) throws IOException {
        super( stream );

        // First assume HTML (GetFeatureInfo) ! Sniff for encoding in HTML
        // header.
        // assuming we can read it as UTF-8.
        encoding = sniffForEncodingInfo( "UTF-8", FileType.HTML );

        if (StringUtils.isEmpty(encoding)) {
            // read byte order marks and detect EBCDIC etc
            encoding = sniffFourBytes();
        }

        if (StringUtils.isNotEmpty(encoding) && encoding.equals( "IBM037" )) {
            // First four bytes suggest EBCDIC with <?xm at start
            String enc = sniffForEncodingInfo( encoding, FileType.XML );
            if (StringUtils.isNotEmpty(enc))
                encoding = enc;
        }

        if (StringUtils.isEmpty(encoding)) {
            // Haven't yet determined encoding: sniff for <?xml encoding="..."?>
            // assuming we can read it as UTF-8.
            encoding = sniffForEncodingInfo( "UTF-8", FileType.XML );
        }

        if (StringUtils.isEmpty(encoding)) {
            // The XML spec says these two things:

            // (1) "In the absence of external character encoding information
            // (such as MIME headers), parsed entities which are stored in an
            // encoding other than UTF-8 or UTF-16 must begin with a text
            // declaration (see 4.3.1 The Text Declaration) containing an
            // encoding declaration:"

            // (2) "In the absence of information provided by an external
            // transport protocol (e.g. HTTP or MIME), it is an error
            // for an entity including an encoding declaration to be
            // presented to the XML processor in an encoding other than
            // that named in the declaration, or for an entity which begins
            // with neither a Byte Order Mark nor an encoding declaration
            // to use an encoding other than UTF-8."

            // Since we're using a sniffed stream, we do not have external
            // character encoding information.

            // Since we're here, we also don't have a recognized byte order
            // mark or an explicit encoding declaration that can be read in
            // either ASCII or EBDIC style.

            // Therefore, we must use UTF-8.

            encoding = "UTF-8";
        }
    }

    private int readAsMuchAsPossible(byte[] buf, int startAt, int len) throws IOException {
        int total = 0;
        while (total < len) {
            int count = read( buf, startAt + total, len - total );
            if (count < 0)
                break;
            total += count;
        }
        return total;
    }

    private String sniffFourBytes() throws IOException {
        mark( 4 );
        try {
            byte[] buf = new byte[4];
            if (readAsMuchAsPossible( buf, 0, 4 ) < 4)
                return "";
            long result = 0xFF000000 & (buf[0] << 24) | 0x00FF0000 & (buf[1] << 16) | 0x0000FF00 & (buf[2] << 8) | 0x000000FF & buf[3];

            if (result == 0x0000FEFF)
                return "UCS-4";
            else if (result == 0xFFFE0000)
                return "UCS-4";
            else if (result == 0x0000003C)
                return "UCS-4BE";
            else if (result == 0x3C000000)
                return "UCS-4LE";
            else if (result == 0x003C003F)
                return "UTF-16BE";
            else if (result == 0x3C003F00)
                return "UTF-16LE";
            else if (result == 0x3C3F786D)
                return ""; // looks like US-ASCII with <?xml: sniff
            else if (result == 0x4C6FA794)
                return "IBM037"; // Sniff for ebdic codepage
            else if ((result & 0xFFFF0000) == 0xFEFF0000)
                return "UTF-16";
            else if ((result & 0xFFFF0000) == 0xFFFE0000)
                return "UTF-16";
            else if ((result & 0xFFFFFF00) == 0xEFBBBF00)
                return "UTF-8";
            else
                return "";
        } finally {
            reset();
        }
    }

    // BUGBUG in JDK: Charset.forName is not threadsafe, so we'll prime it
    // with the common charsets.

    /**
     * Try to read encoding information from content of file, e.g.<br/>
     * XML: <br/>
     * {@code
     * <?xml version="1.0" encoding="UTF-8" standalone="no"?>
     * }<br/>
     * HTML:<br/>
     * {@code
     * <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
     * }
     * 
     * @param encoding
     *            Encoding for decoding content
     * @param fileType
     *            what kind of file, determines format of content.
     * @return determined encoding or null
     * @throws IOException
     */
    private String sniffForEncodingInfo(String encoding, FileType fileType) throws IOException {
        mark( MAX_SNIFFED_BYTES );
        byte[] bytebuf = new byte[MAX_SNIFFED_BYTES];
        int bytelimit = readAsMuchAsPossible( bytebuf, 0, MAX_SNIFFED_BYTES );

        // BUGBUG in JDK: Charset.forName is not threadsafe.
        Charset charset = Charset.forName( encoding );
        try (
            Reader reader = new InputStreamReader( new ByteArrayInputStream( bytebuf, 0, bytelimit ), charset );
        ){
            char[] buf = new char[bytelimit];
            int limit = 0;
            while (limit < bytelimit) {
                int count = reader.read( buf, limit, bytelimit - limit );
                if (count < 0)
                    break;
                limit += count;
            }

            String myEncoding = null;
            if (fileType == FileType.XML) {
                myEncoding = extractXmlDeclEncoding( buf, 0, limit );
            } else if (fileType == FileType.HTML) {
                myEncoding = extractHtmlHeaderEncoding( buf, 0, limit );
            }

            return myEncoding;
        } finally {
            reset();
        }
    }

    /**
     * Get Encoding of stream
     * 
     * @return determined encoding of input stream
     */
    public String getEncoding() {
        return encoding;
    }

    /**
     * Extracts encoding from something like: {@code
     * <?xml version="1.0" encoding="UTF-8" standalone="no"?>
     * }
     */
    static String extractXmlDeclEncoding(char[] buf, int offset, int size) {
        int limit = offset + size;
        int xmlpi = firstIndexOf( "<?xml", buf, offset, limit );
        if (xmlpi >= 0) {
            int i = xmlpi + 5;
            ScannedAttribute attr = new ScannedAttribute();
            while (i < limit) {
                i = scanAttribute( buf, i, limit, attr );
                if (i < 0)
                    return "";
                if (attr.name.equals( "encoding" ))
                    return attr.value;
            }
        }
        return "";
    }

    /**
     * Extracts encoding from something like: {@code
     * <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
     * }
     */
    static String extractHtmlHeaderEncoding(char[] buf, int offset, int size) {
        int limit = offset + size;
        int startIndex = firstIndexOf( "http-equiv=", buf, offset, limit );
        if (startIndex >= 0) {
            // use offset 25 cause we assume http-equiv="content-type"
            int i = startIndex + 25;
            ScannedAttribute attr = new ScannedAttribute();
            while (i < limit) {
                i = scanAttribute( buf, i, limit, attr );
                if (i < 0)
                    return "";
                if (attr.name.equals( "content" ))
                    startIndex = attr.value.indexOf( "charset=" );
                if (startIndex >= 0) {
                    startIndex += 8;
                    return attr.value.substring( startIndex );
                }
            }
        }
        return "";
    }

    private static int firstIndexOf(String s, char[] buf, int startAt, int limit) {
        assert (s.length() > 0);
        char[] lookFor = s.toCharArray();

        char firstchar = lookFor[0];
        searching: for (limit -= lookFor.length; startAt < limit; startAt++) {
            if (buf[startAt] == firstchar) {
                for (int i = 1; i < lookFor.length; i++) {
                    if (buf[startAt + i] != lookFor[i]) {
                        continue searching;
                    }
                }
                return startAt;
            }
        }

        return -1;
    }

    private static int nextNonmatchingByte(char[] lookFor, char[] buf, int startAt, int limit) {
        searching: for (; startAt < limit; startAt++) {
            int thischar = buf[startAt];
            for (int i = 0; i < lookFor.length; i++)
                if (thischar == lookFor[i])
                    continue searching;
            return startAt;
        }
        return -1;
    }

    private static int nextMatchingByte(char[] lookFor, char[] buf, int startAt, int limit) {
        for (; startAt < limit; startAt++) {
            int thischar = buf[startAt];
            for (int i = 0; i < lookFor.length; i++)
                if (thischar == lookFor[i])
                    return startAt;
        }
        return -1;
    }

    private static int nextMatchingByte(char lookFor, char[] buf, int startAt, int limit) {
        for (; startAt < limit; startAt++) {
            if (buf[startAt] == lookFor)
                return startAt;
        }
        return -1;
    }

    private static final char[] WHITESPACE = new char[] { ' ', '\r', '\t', '\n' };
    private static final char[] NOTNAME = new char[] { '=', ' ', '\r', '\t', '\n', '?', '>', '<', '\'', '\"' };

    private static class ScannedAttribute {
        private String name;
        private String value;
    }

    private static int scanAttribute(char[] buf, int startAt, int limit, ScannedAttribute attr) {
        int nameStart = nextNonmatchingByte( WHITESPACE, buf, startAt, limit );
        if (nameStart < 0)
            return -1;
        int nameEnd = nextMatchingByte( NOTNAME, buf, nameStart, limit );
        if (nameEnd < 0)
            return -1;
        int equals = nextNonmatchingByte( WHITESPACE, buf, nameEnd, limit );
        if (equals < 0)
            return -1;
        if (buf[equals] != '=')
            return -1;
        int valQuote = nextNonmatchingByte( WHITESPACE, buf, equals + 1, limit );
        if (buf[valQuote] != '\'' && buf[valQuote] != '\"')
            return -1;
        int valEndquote = nextMatchingByte( buf[valQuote], buf, valQuote + 1, limit );
        if (valEndquote < 0)
            return -1;
        attr.name = new String( buf, nameStart, nameEnd - nameStart );
        attr.value = new String( buf, valQuote + 1, valEndquote - valQuote - 1 );
        return valEndquote + 1;
    }
}
