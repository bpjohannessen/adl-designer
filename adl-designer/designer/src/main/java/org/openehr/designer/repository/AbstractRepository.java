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

package org.openehr.designer.repository;

import org.openehr.jaxb.am.Archetype;
import org.openehr.jaxb.am.ArchetypeTerm;
import org.openehr.jaxb.am.CodeDefinitionSet;
import org.openehr.jaxb.rm.StringDictionaryItem;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author markopi
 */
abstract public class AbstractRepository {
    public static String findTermText(Archetype archetype) {
        return findTermText(archetype, archetype.getDefinition().getNodeId());
    }

    public static String findTermText(Archetype archetype, String concept) {
        String lang = null;
        if (archetype.getOriginalLanguage() != null) {
            lang = archetype.getOriginalLanguage().getCodeString();
        }
        return findTermText(archetype, concept, lang);

    }

    public static String findTermText(Archetype archetype, String concept, String defaultLanguage) {
        if (archetype.getTerminology() == null || archetype.getTerminology().getTermDefinitions() == null) return null;
        CodeDefinitionSet cds = archetype.getTerminology()
                .getTermDefinitions()
                .stream()
                .filter((t) -> t.getLanguage().equals(defaultLanguage))
                .findFirst().orElse(null);
        if (cds == null) return null;

        ArchetypeTerm at = cds.getItems().stream().filter((t) -> t.getCode().equals(concept)).findFirst().orElse(null);
        if (at == null) return null;

        return at.getItems().stream().filter((t) -> t.getId().equals("text")).map(StringDictionaryItem::getValue).findFirst().orElse(null);

    }

    protected static List<String> extractLanguages(Archetype archetype) {
        List<String> result = new ArrayList<>();
        String defaultLanguage = archetype.getOriginalLanguage().getCodeString();
        result.add(defaultLanguage);
        result.addAll(archetype.getTranslations().stream()
                .map(details -> details.getLanguage().getCodeString())
                .collect(Collectors.toList()));
        return result;

    }

}
