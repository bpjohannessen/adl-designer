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

import com.google.common.base.Joiner;
import org.openehr.adl.serializer.ArchetypeSerializer;
import org.openehr.jaxb.am.Archetype;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Marko Pipan
 */
public class TemplateSerializer {
    public static String serialize(List<Archetype> archetypes) {
        List<String> serializedArchetypes = new ArrayList<>();
        for (Archetype archetype : archetypes) {
            serializedArchetypes.add(ArchetypeSerializer.serialize(archetype));
        }

        return Joiner.on("\n---------------------------------------------------------------------------------\n").join(serializedArchetypes);
    }
}
