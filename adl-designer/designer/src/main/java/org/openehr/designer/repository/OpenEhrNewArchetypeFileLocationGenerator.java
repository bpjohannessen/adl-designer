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

package org.openehr.designer.repository;

import com.google.common.collect.ImmutableMap;
import org.openehr.adl.am.ArchetypeIdInfo;
import org.openehr.adl.rm.OpenEhrRmModel;
import org.openehr.adl.rm.RmModelException;
import org.openehr.adl.rm.RmType;
import org.openehr.jaxb.am.Archetype;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.function.Function;

/**
 * @author markopi
 */
public class OpenEhrNewArchetypeFileLocationGenerator implements Function<Archetype, Path> {
    private static final Map<String, String> rmTypeToPath = ImmutableMap.<String, String>builder()
            .put("CLUSTER", "cluster")
            .put("COMPOSITION", "composition")
            .put("DEMOGRAPHIC", "demographic")
            .put("ELEMENT", "element")
            .put("ACTION", "entry/action")
            .put("ADMIN_ENTRY", "entry/admin_entry")
            .put("EVALUATION", "entry/evaluation")
            .put("INSTRUCTION", "entry/instruction")
            .put("OBSERVATION", "entry/observation")
            .put("SECTION", "section")
            .put("ITEM_STRUCTURE", "structure")
            .build();

    @Override
    public Path apply(Archetype archetype) {
        Path dir = getStorageDir(archetype);
        ArchetypeIdInfo aidi = ArchetypeIdInfo.parse(archetype.getArchetypeId().getValue());
        return dir.resolve(aidi.toInterfaceString() + ".adls");

    }

    private Path getStorageDir(Archetype archetype) {
        String rmType = archetype.getDefinition().getRmTypeName();
        while (rmType != null) {
            String path = rmTypeToPath.get(rmType);
            if (path != null) {
                return Paths.get(path);
            }
            try {
                RmType type = OpenEhrRmModel.getInstance().getRmType(rmType);
                if (type.getParent() != null) {
                    rmType = type.getParent().getRmType();
                } else {
                    return getDefaultPath();
                }
            } catch (RmModelException e) {
                return getDefaultPath();
            }

        }
        return getDefaultPath();
    }

    private Path getDefaultPath() {
        return Paths.get("");
    }
}
