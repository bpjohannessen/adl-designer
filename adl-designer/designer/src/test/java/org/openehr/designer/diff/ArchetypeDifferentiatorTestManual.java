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

package org.openehr.designer.diff;

import com.google.common.base.Charsets;
import org.openehr.adl.rm.OpenEhrRmModel;
import org.openehr.adl.serializer.ArchetypeSerializer;
import org.openehr.designer.repository.FlatArchetypeRepository;
import org.openehr.designer.repository.file.FileArchetypeRepository;
import org.openehr.jaxb.am.Archetype;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class ArchetypeDifferentiatorTestManual {
    private FileArchetypeRepository archetypeRepository;
    private FlatArchetypeRepository flatArchetypeRepository;


    @BeforeClass
    public void init() throws Exception {

        URL myTestURL = ClassLoader.getSystemResource("differentiator/openEHR-EHR-OBSERVATION.bodily_output.v1.adls");
        Path repositoryPath = Paths.get(myTestURL.toURI()).getParent();

        archetypeRepository = new FileArchetypeRepository();
        archetypeRepository.setRepositoryLocation(repositoryPath.toString());
        archetypeRepository.init();
        flatArchetypeRepository = new FlatArchetypeRepository(archetypeRepository, OpenEhrRmModel.getInstance());

    }

    @Test
    public void testBuild() throws Exception {
        Archetype parent = flatArchetypeRepository.getFlatArchetype("openEHR-EHR-OBSERVATION.bodily_output.v1.0.0");
        Archetype flatChild = flatArchetypeRepository.getFlatArchetype("openEHR-EHR-OBSERVATION.bodily_output-urination.v1.0.0");
        Archetype diff = ArchetypeDifferentiator.differentiate(OpenEhrRmModel.getInstance(), parent, flatChild);
        String archetype = ArchetypeSerializer.serialize(diff);

        Path targetDir = Paths.get("target");
        Files.createDirectories(targetDir);
        Files.write(targetDir.resolve("diff.adls"), archetype.getBytes(Charsets.UTF_8));
    }
}