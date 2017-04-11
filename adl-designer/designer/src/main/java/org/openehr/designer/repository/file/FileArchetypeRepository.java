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

package org.openehr.designer.repository.file;

import org.openehr.designer.repository.AbstractFileBasedArchetypeRepository;
import org.openehr.jaxb.am.Archetype;
import org.springframework.beans.factory.annotation.Required;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

// todo remove cache

/**
 * @author Marko Pipan
 */
public class FileArchetypeRepository extends AbstractFileBasedArchetypeRepository {

    private String repositoryLocation;

    @PostConstruct
    public void init() throws IOException {
        parseRepository();
    }


    @Override
    public Archetype getDifferentialArchetype(String archetypeId) {
        return loadDifferentialArchetype(archetypeId);
    }

    @Override
    public void saveDifferentialArchetype(Archetype archetype) {
        saveArchetypeToFile(archetype);
    }

    @Override
    protected Path getRepositoryLocation() {
        return Paths.get(repositoryLocation);
    }

    @Required
    public void setRepositoryLocation(String repositoryLocation) {
        this.repositoryLocation = repositoryLocation;
    }
}
