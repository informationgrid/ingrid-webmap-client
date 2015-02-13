<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" />

    <xsl:template match="/">
        <xsl:apply-templates select="@*|node()" />
    </xsl:template>

    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()" />
        </xsl:copy>
    </xsl:template>

    <xsl:template match="setting">

        <setting>
            <xsl:attribute name="key">
                <xsl:value-of select="key" />
            </xsl:attribute>
            <xsl:apply-templates select="@*|node()" />
        </setting>

    </xsl:template>

</xsl:stylesheet>