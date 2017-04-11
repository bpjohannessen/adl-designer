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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.module.jaxb.JaxbAnnotationModule;
import com.google.common.base.Charsets;
import com.google.common.io.CharStreams;
import org.openehr.adl.parser.AdlDeserializer;
import org.openehr.adl.parser.BomSupportingReader;
import org.openehr.jaxb.am.Archetype;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import java.io.IOException;
import java.util.Map;

import static org.fest.assertions.Assertions.assertThat;

/**
 * @author Marko Pipan
 */
public class JsonSerializerTest {
    ObjectMapper objectMapper;
    AdlDeserializer deserializer;
    Archetype differentialAlert;
    Archetype differentialAlertZn;

    @BeforeClass
    public void init() throws IOException {
        objectMapper = new ObjectMapper();

        JaxbAnnotationModule jaxbModule = new JaxbAnnotationModule();
        objectMapper.registerModule(jaxbModule);
        objectMapper.registerModule(new AmMixinModule());

        deserializer = new AdlDeserializer();

        differentialAlert = deserializer.parse(readArchetype("repository/openEHR-EHR-EVALUATION.alert.v1.adls"));
        differentialAlertZn = deserializer.parse(readArchetype("repository/openEHR-EHR-EVALUATION.alert-zn.v1.adls"));
    }

    private String readArchetype(String file) throws IOException {
        return CharStreams.toString(new BomSupportingReader(
                getClass().getClassLoader().getResourceAsStream(file),
                Charsets.UTF_8));
    }


    @Test
    public void serializeDifferentialAsJson() throws IOException {
        String jsonString = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(differentialAlert);
        Map<String, Object> archetypeMap = objectMapper.readValue(jsonString, Map.class);
        Map<String, Object> descriptionMap = (Map<String, Object>) archetypeMap.get("description");
        assertThat(descriptionMap.get("lifecycle_state")).isEqualTo("AuthorDraft");

        jsonString = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(differentialAlertZn);
        //System.out.println(jsonString);

        Object object = objectMapper.readValue(jsonString, Archetype.class);


    }

    @Test
    public void testConstraintBindings() throws IOException {
        String jsonString = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(differentialAlert);
        Map<String, Object> archetypeMap = objectMapper.readValue(jsonString, Map.class);
        Map<String, Object> descriptionMap = (Map<String, Object>) archetypeMap.get("description");
        assertThat(descriptionMap.get("lifecycle_state")).isEqualTo("AuthorDraft");
        //System.out.println(jsonString);

        jsonString = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(differentialAlertZn);

        Archetype a = objectMapper.readValue(jsonString, Archetype.class);
    }

    @Test
    public void flattenAndSerializeAsJson() throws IOException {
        Archetype bp = deserializer.parse(readArchetype("repository/openEHR-EHR-EVALUATION.alert.v1.adls"));

        String jsonString = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(bp);
        //System.out.println(jsonString);

        Archetype a = objectMapper.readValue(jsonString, Archetype.class);
    }
}
