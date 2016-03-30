<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="text" omit-xml-declaration="yes" indent="no"/>

  <xsl:template match="/">
    <xsl:for-each select="conf/corpus">
      <xsl:text>&lt;option value="</xsl:text>
      <xsl:value-of select="@name" />
      <xsl:text>"&gt;</xsl:text>
      <xsl:value-of select="@name" />
      <xsl:text>&lt;/option&gt;&#xa;</xsl:text>
    </xsl:for-each>
  </xsl:template>
</xsl:stylesheet>

