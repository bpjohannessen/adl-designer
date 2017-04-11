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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * @author Marko Pipan
 */
public class ValueSetListToMapConverter extends StdConverter<List, Map> {
    @Override
    public Map convert(List value) {
        List<ValueSetItem> from = value;
        Map<String, Map<String, Object>> result = new LinkedHashMap<>();
        for (ValueSetItem valueSetItem : from) {
            result.put(valueSetItem.getId(), convertItemToMap(valueSetItem));

        }
        return result;
    }

    private Map<String, Object> convertItemToMap(ValueSetItem valueSetItem) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", valueSetItem.getId());
        result.put("members", valueSetItem.getMembers());
        return result;
    }
}
