/*
 * ADL Designer
 * Copyright (c) 2013-2014 Marand d.o.o. (www.marand.com)
 *
 * This file is part of ADL2-tools.
 *
 * ADL2-tools is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.openehr.designer.io;

import com.google.common.base.Charsets;
import com.google.common.base.Splitter;
import com.google.common.io.CharStreams;
import org.openehr.adl.parser.AdlDeserializer;
import org.openehr.adl.parser.BomSupportingReader;
import org.openehr.jaxb.am.Archetype;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * @author Marko Pipan
 */
public class TemplateDeserializer {
    public static List<Archetype> deserialize(InputStream adltStream) throws IOException {
        try (Reader r = new BomSupportingReader(adltStream, Charsets.UTF_8)) {
            String adltContents = CharStreams.toString(r);
            return deserialize(adltContents);
        }
    }

    public static List<Archetype> deserialize(byte[] adltContent) {
        try(ByteArrayInputStream in = new ByteArrayInputStream(adltContent)) {
            return deserialize(in);
        } catch (IOException e) {
            throw new AssertionError(e);
        }
    }


    public static List<Archetype> deserialize(String adltContent) {
        Iterable<String> adls = Splitter.on(Pattern.compile("(\r|\n)+ *\\-{2,} *(\r|\n)+")).split(adltContent);

        List<Archetype> result = new ArrayList<>();
        AdlDeserializer deserializer = new AdlDeserializer();
        for (String adl : adls) {
            result.add(deserializer.parse(adl));
        }
        return result;
    }
}
