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

package org.openehr.designer.support.units;

import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import org.openehr.designer.util.WtUtils;
import org.springframework.util.StringUtils;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.SAXException;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author markopi
 */
public class UnitsProvider {
    private final List<Property> properties;

    private UnitsProvider(List<Property> properties) {
        this.properties = properties;
    }

    public List<Property> getProperties() {
        return properties;
    }

    public static UnitsProvider fromXml(InputStream inputStream) throws IOException, SAXException {
        Document document = WtUtils.defaultDocumentBuilder().parse(inputStream);

        List<Element> elements = WtUtils.children(document.getDocumentElement());

        Map<String, Property> propertyMap = Maps.newLinkedHashMap();

        elements.stream().filter(element -> element.getLocalName().equals("Property")).forEach(element -> {
            Property property = new Property();
            property.setLabel(element.getAttribute("Text"));
            property.setOpenEhrId(element.getAttribute("openEHR"));
            property.setUnits(new ArrayList<>());
            propertyMap.put(element.getAttribute("id"), property);
        });

        elements.stream().filter(element -> element.getLocalName().equals("Unit")).forEach(element -> {
            Unit unit = new Unit();
            unit.setCode(element.getAttribute("Text"));
            unit.setLabel(element.getAttribute("name"));
            if (StringUtils.isEmpty(unit.getLabel())) {
                unit.setLabel(unit.getCode());
            }
            unit.setPrimary(Boolean.parseBoolean(element.getAttribute("primary")));
            Property property = propertyMap.get(element.getAttribute("property_id"));

            property.getUnits().add(unit);
        });

        return new UnitsProvider(Lists.newArrayList(propertyMap.values()));
    }
}
