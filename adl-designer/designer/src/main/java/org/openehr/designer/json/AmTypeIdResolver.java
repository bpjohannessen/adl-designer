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

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.jsontype.TypeIdResolver;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.google.common.base.CaseFormat;
import com.google.common.collect.ImmutableBiMap;
import org.openehr.am.AmObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

/**
 * @author Marko Pipan
 */
public class AmTypeIdResolver implements TypeIdResolver {
    private static final Logger LOG = LoggerFactory.getLogger(AmTypeIdResolver.class);
    public static final JavaType[] EMPTY_PARAMETER_TYPES = new JavaType[]{};
    private ImmutableBiMap<String, Class> typeToClassMap;

    @Override
    public void init(JavaType baseType) {
        Map<String, Class> builder = new HashMap<>();
        addClassesFromObjectFactory(builder, org.openehr.jaxb.am.ObjectFactory.class);
        addClassesFromObjectFactory(builder, org.openehr.jaxb.rm.ObjectFactory.class);
        typeToClassMap = ImmutableBiMap.copyOf(builder);
    }

    private void addClassesFromObjectFactory(Map<String,Class> target, Class<?> objectFactory) {
        for (Method method : objectFactory.getMethods()) {
            if (method.getName().startsWith("create")) {
                if (method.getParameterCount() == 0) {
                    Class c = method.getReturnType();
                    target.put(CaseFormat.UPPER_CAMEL.to(CaseFormat.UPPER_UNDERSCORE, c.getSimpleName()), c);
                } else {
                    Class c = method.getParameterTypes()[0];
                    target.put(CaseFormat.UPPER_CAMEL.to(CaseFormat.UPPER_UNDERSCORE, c.getSimpleName()), c);
                }
            }
        }
    }

    @Override
    public String idFromValue(Object value) {
        String id = typeToClassMap.inverse().get(value.getClass());
        if (id == null) throw new IllegalArgumentException("Unknown class: " + value.getClass().getName());
        return id;
    }

    @Override
    public String idFromValueAndType(Object value, Class<?> suggestedType) {
        String id = typeToClassMap.inverse().get(value.getClass());
        if (id == null) throw new IllegalArgumentException("Unknown class: " + value.getClass().getName());
        return id;
    }

    @Override
    public String idFromBaseType() {
        return typeToClassMap.inverse().get(AmObject.class);
    }

    @Override
    public JavaType typeFromId(String id) {
        Class cls = typeToClassMap.get(id);
        if (cls == null) return null;
        return TypeFactory.defaultInstance().constructSimpleType(cls, EMPTY_PARAMETER_TYPES);
    }

    @Override
    public JsonTypeInfo.Id getMechanism() {
        return JsonTypeInfo.Id.CUSTOM;
    }
}
