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

package org.openehr.designer.user;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * @author markopi
 */
public class UserRepositoriesConfiguration {
    private List<UserRepositoryConfiguration> repositories;
    private String lastRepository;

    public String getLastRepository() {
        return lastRepository;
    }

    public void setLastRepository(String lastRepository) {
        this.lastRepository = lastRepository;
    }

    public List<UserRepositoryConfiguration> getRepositories() {
        if (repositories == null) {
            repositories = new ArrayList<>();
        }
        return repositories;
    }

    public void setRepositories(List<UserRepositoryConfiguration> repositories) {
        this.repositories = repositories;
    }


    public Optional<UserRepositoryConfiguration> findByName(String name) {
        return getRepositories().stream().filter(r -> r.getName().equals(name)).findFirst();
    }
}
