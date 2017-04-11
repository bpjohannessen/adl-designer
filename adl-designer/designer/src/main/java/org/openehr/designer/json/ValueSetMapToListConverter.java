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
import org.openehr.jaxb.am.ValueSetItem;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * @author Marko Pipan
 */
public class ValueSetMapToListConverter extends StdConverter<Map, List> {
    @SuppressWarnings("unchecked")
    @Override
    public List convert(Map value) {
        Map<String, Map<String, Object>> from = value;
        List<ValueSetItem> result = new ArrayList<>();
        for (Map.Entry<String, Map<String, Object>> vsEntry : from.entrySet()) {
            ValueSetItem vs = new ValueSetItem();
            vs.setId(vsEntry.getKey());
            if (vsEntry.getValue() != null) {
                if (vsEntry.getValue().get("members") != null) {
                    vs.getMembers().addAll((Collection<String>) vsEntry.getValue().get("members"));
                }
            }
            result.add(vs);
        }
        return result;
    }

}
