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

package org.openehr.designer;

import org.openehr.adl.rm.OpenEhrRmModel;
import org.openehr.designer.repository.ArchetypeRepository;
import org.openehr.designer.repository.FlatArchetypeRepository;
import org.openehr.designer.repository.file.FileArchetypeRepository;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * @author Marko Pipan
 */
public class TestArchetypeRespository {
    private static FileArchetypeRepository archetypeRepository;
    private static FlatArchetypeRepository flatArchetypeRepository;
    private static final String TEST_REPO_KEY = "test.repo";

    public static synchronized ArchetypeRepository getInstance() {
        if (archetypeRepository == null) {
            try {
                FileArchetypeRepository repo = new FileArchetypeRepository();
                repo.setRepositoryLocation(getPathFromRepoProperties());
                repo.init();
                archetypeRepository = repo;
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
        return archetypeRepository;

    }

    public static synchronized FlatArchetypeRepository getFlatInstance() {
        if (flatArchetypeRepository == null) {
            flatArchetypeRepository = new FlatArchetypeRepository(getInstance(), OpenEhrRmModel.getInstance());
        }
        return flatArchetypeRepository;

    }

    private static String getPathFromRepoProperties() throws IOException {
        InputStream is = TestArchetypeRespository.class.getClassLoader().getResourceAsStream("repo.properties");
        if (is == null) {
            return getPathFromRepoPropertiesTemplate();
        } else {
            Properties p = new Properties();
            p.load(is);
            is.close();
            return p.getProperty(TEST_REPO_KEY);
        }
    }

    private static String getPathFromRepoPropertiesTemplate() throws IOException {

        InputStream is = TestArchetypeRespository.class.getClassLoader().getResourceAsStream("repo.properties-TEMPLATE");
        if (is == null) {
            throw new RuntimeException("No repo.properties or repo.properties-TEMPLATE found");
        } else {
            Properties p = new Properties();
            p.load(is);
            is.close();
            return p.getProperty(TEST_REPO_KEY);

        }
    }
}
