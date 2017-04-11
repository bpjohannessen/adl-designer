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
import org.openehr.jaxb.rm.ResourceAnnotationNodeItems;
import org.openehr.jaxb.rm.ResourceAnnotationNodes;
import org.openehr.jaxb.rm.StringDictionaryItem;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author Marko Pipan
 */
public class ResourceAnnotationNodesMapToListConverter extends StdConverter<Map, List> {
    @Override
    public List convert(Map value) {
        Map<String, Map<String, Map<String, String>>> from = value;
        List<ResourceAnnotationNodes> result = new ArrayList<>();

        for (Map.Entry<String, Map<String, Map<String, String>>> cdsEntry : from.entrySet()) {
            ResourceAnnotationNodes cds = new ResourceAnnotationNodes();
            cds.setLanguage(cdsEntry.getKey());
            addAnnotations(cds.getItems(), cdsEntry.getValue());
            result.add(cds);
        }

        return result;
    }

    private void addAnnotations(List<ResourceAnnotationNodeItems> target, Map<String, Map<String, String>> from) {
        for (Map.Entry<String, Map<String, String>> atEntry : from.entrySet()) {
            ResourceAnnotationNodeItems at = new ResourceAnnotationNodeItems();
            at.setPath(atEntry.getKey());
            addStringDictionaryItems(at.getItems(), atEntry.getValue());
            target.add(at);
        }
    }

    private void addStringDictionaryItems(List<StringDictionaryItem> target, Map<String, String> value) {
        for (Map.Entry<String, String> sdiEntry : value.entrySet()) {
            StringDictionaryItem sdi = new StringDictionaryItem();
            sdi.setId(sdiEntry.getKey());
            sdi.setValue(sdiEntry.getValue());
            target.add(sdi);
        }
    }
}
