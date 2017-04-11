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

package org.openehr.designer.am;

import org.openehr.am.AmObject;

import javax.xml.bind.annotation.XmlType;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

/**
 * @author markopi
 */
public class AmTypeGraph {
    private static final AmTypeGraph INSTANCE = AmTypeGraph.build();

    private final Map<String, AmType> types;


    private AmTypeGraph(Map<String, AmType> types) {
        this.types = types;
    }


    public Map<String, AmType> getTypes() {
        return types;
    }


    public static AmTypeGraph getInstance() {
        return INSTANCE;
    }

    private static AmTypeGraph build() {
        Map<String, AmType> objectFactoryMappings = new HashMap<>();
        addObjectFactoryClasses(objectFactoryMappings, org.openehr.jaxb.am.ObjectFactory.class);
        return new AmTypeGraph(objectFactoryMappings);
    }

    private static void addObjectFactoryClasses(Map<String, AmType> target, Class objectFactoryClass) {
        Method[] methods = objectFactoryClass.getDeclaredMethods();
        for (Method m : methods) {
            if (m.getParameterTypes().length == 0) {
                Class<?> amClass = m.getReturnType();
                addObjectFactoryClass(target, amClass, null);
            }
        }
    }

    private static void addObjectFactoryClass(Map<String, AmType> target, Class<?> amClass, AmType child) {
        XmlType xmlType = amClass.getAnnotation(XmlType.class);
        if (xmlType == null && amClass != AmObject.class) return;
        String amType = xmlType != null ? xmlType.name() : "AM_OBJECT";
        if (amType.length() == 0) return;
        AmType node = target.get(amType);
        if (node == null) {
            node = new AmType(amType);
            target.put(amType, node);
        }
        if (child!=null) {
            child.setParent(amType);
        }
        addObjectFactoryClass(target, amClass.getSuperclass(), node);
    }

}
