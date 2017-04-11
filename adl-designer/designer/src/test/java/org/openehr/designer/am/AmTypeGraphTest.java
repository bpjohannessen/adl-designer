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

import com.fasterxml.jackson.databind.ObjectMapper;
import org.testng.annotations.Test;

import static org.fest.assertions.Assertions.assertThat;
import static org.testng.Assert.*;

public class AmTypeGraphTest {

    @Test
    public void testAmTypeGraph() throws Exception {
        AmTypeGraph graph = AmTypeGraph.getInstance();
        AmType type = graph.getTypes().get("C_STRING");
        assertThat(type.getType()).isEqualTo("C_STRING");
        assertThat(type.getParent()).isEqualTo("C_PRIMITIVE_OBJECT");
        type = graph.getTypes().get("C_PRIMITIVE_OBJECT");
        assertThat(type.getParent()).isEqualTo("C_DEFINED_OBJECT");
        type = graph.getTypes().get("C_DEFINED_OBJECT");
        assertThat(type.getParent()).isEqualTo("C_OBJECT");
        type = graph.getTypes().get("C_OBJECT");
        assertThat(type.getParent()).isEqualTo("ARCHETYPE_CONSTRAINT");
        type = graph.getTypes().get("ARCHETYPE_CONSTRAINT");
        assertThat(type.getParent()).isEqualTo("AM_OBJECT");
        type = graph.getTypes().get("AM_OBJECT");
        assertThat(type.getParent()).isNull();
    }
    @Test(enabled = false)
    public void testPrintAmGraph() throws Exception {
        AmTypeGraph graph = AmTypeGraph.getInstance();
        ObjectMapper om = new ObjectMapper();
        System.out.println(om.writerWithDefaultPrettyPrinter().writeValueAsString(graph));
    }
}