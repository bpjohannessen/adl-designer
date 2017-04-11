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

package org.openehr.designer.json;

import com.fasterxml.jackson.databind.util.StdConverter;
import org.openehr.adl.am.AmObjectFactory;
import org.openehr.jaxb.am.TermBindingItem;
import org.openehr.jaxb.am.TermBindingSet;
import org.openehr.jaxb.rm.CodePhrase;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import static org.openehr.adl.rm.RmObjectFactory.newTerminologyId;

/**
 * @author Marko Pipan
 */
public class TermBindingMapToListConverter extends StdConverter<Map<String, Map<String, String>>, List<TermBindingSet>> {

    @Override
    public List<TermBindingSet> convert(Map<String, Map<String, String>> value) {
        return value.entrySet()
                .stream()
                .map(tbsEntry -> AmObjectFactory.newTermBindingSet(tbsEntry.getKey(), buildTermBindingItem(tbsEntry.getValue())))
                .collect(Collectors.toList());
    }

    private List<TermBindingItem> buildTermBindingItem(Map<String, String> value) {
        return value.entrySet()
                .stream()
                .map(tbiEntry -> AmObjectFactory.newTermBindingItem(tbiEntry.getKey(), tbiEntry.getValue()))
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private CodePhrase parseCodePhrase(Map<String, Object> cp) {
        if (cp == null) return null;
        CodePhrase result = new CodePhrase();
        result.setCodeString(Objects.toString(cp.get("code_string")));
        Map<String, Object> ti = (Map<String, Object>) cp.get("terminology_id");
        if (ti != null) {
            result.setTerminologyId(newTerminologyId(Objects.toString(ti.get("value"))));
        }

        return result;
    }
}
