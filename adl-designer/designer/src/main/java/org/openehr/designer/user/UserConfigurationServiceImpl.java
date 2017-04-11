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

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.google.common.collect.Iterables;
import org.openehr.designer.Configuration;
import org.openehr.designer.util.WtUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

/**
 * @author markopi
 */
public class UserConfigurationServiceImpl implements UserConfigurationService {
    private final Path basePath = Configuration.getAppHome().resolve("data/user");
    private final ObjectMapper objectMapper;
    private final ObjectWriter writer;


    public UserConfigurationServiceImpl() {
        objectMapper = new ObjectMapper()
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .setSerializationInclusion(JsonInclude.Include.NON_NULL);
        writer = objectMapper.writerWithDefaultPrettyPrinter();
    }

    @Override
    public UserConfiguration getConfiguration(String username) {
        return readConfiguration(getConfigurationPath(username), UserConfiguration.class)
                .orElseGet(UserConfiguration::new);
    }


    @Override
    public void setConfiguration(String username, UserConfiguration configuration) {
        writeConfiguration(getConfigurationPath(username), configuration);
    }

    private <T> Optional<T> readConfiguration(Path path, Class<T> result) {
        if (!Files.exists(path)) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(path.toFile(), result));
        } catch (IOException e) {
            throw new RuntimeException("Error saving user configuration to file " + path, e);
        }

    }

    @Override
    public UserRepositoriesConfiguration getRepositoriesConfiguration(String username) {
        return readConfiguration(getRepositoriesConfigurationPath(username), UserRepositoriesConfiguration.class)
                .orElseGet(this::createNewRepositoryConfiguration);
    }

    @Override
    public void setRepositoriesConfiguration(String username, UserRepositoriesConfiguration configuration) {
        writeConfiguration(getRepositoriesConfigurationPath(username), configuration);
    }

    private UserRepositoriesConfiguration createNewRepositoryConfiguration() {
        try {
            Path defaultConf = Configuration.getAppHome().resolve("conf/default-repositories.json");
            return objectMapper.readValue(defaultConf.toFile(), UserRepositoriesConfiguration.class);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }


    @Override
    public void saveRepository(String username, UserRepositoryConfiguration configuration) {
        UserRepositoriesConfiguration conf = getRepositoriesConfiguration(username);
        int existingIndex = Iterables.indexOf(conf.getRepositories(), r -> r.getName().equals(configuration.getName()));
        if (existingIndex >= 0) {
            conf.getRepositories().set(existingIndex, configuration);
        } else {
            conf.getRepositories().add(configuration);
        }
        writeConfiguration(getRepositoriesConfigurationPath(username), conf);
    }


    @Override
    public boolean deleteRepositoryByName(String username, String name) {
        UserRepositoriesConfiguration conf = getRepositoriesConfiguration(username);
        int existingIndex = Iterables.indexOf(conf.getRepositories(), r -> r.getName().equals(name));
        if (existingIndex < 0) return false;

        conf.getRepositories().remove(existingIndex);
        writeConfiguration(getRepositoriesConfigurationPath(username), conf);
        return true;
    }


    private void writeConfiguration(Path path, Object configuration) {
        try {
            writer.writeValue(path.toFile(), configuration);
        } catch (IOException e) {
            throw new RuntimeException("Error writing to configuration file " + path, e);
        }
    }

    private Path getUserPath(String username) {
        return getOrCreatePath(basePath.resolve(WtUtils.sanitizeFilename(username)));
    }

    private Path getOrCreatePath(Path path) {
        try {
            Files.createDirectories(path);
            return path;
        } catch (IOException e) {
            throw new RuntimeException("Error creating data directory: " + path, e);
        }
    }


    private Path getConfigurationPath(String username) {
        Path fUser = getUserPath(username);
        return fUser.resolve("configuration.json");
    }

    private Path getRepositoriesConfigurationPath(String username) {
        return getUserPath(username).resolve("repositories.json");
    }
}
