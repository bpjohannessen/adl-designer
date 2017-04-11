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

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;

/**
 * @author markopi
 */
public class Configuration {
    private static Path appHome = Paths.get(".").toAbsolutePath();
    private volatile static Properties properties;

    public static Path getAppHome() {
        return appHome;
    }

    public static Path getConfDir() {
        return appHome.resolve("conf");
    }

    public static void setAppHome(Path appHome) {
        Configuration.appHome = appHome;
    }

    private static Properties loadProperties() {
        try {
            Properties props = new Properties();
            try (InputStreamReader reader = new InputStreamReader(
                    new FileInputStream(getConfDir().resolve("config.properties").toFile()),
                    StandardCharsets.UTF_8)) {
                props.load(reader);
            }
            return props;
        } catch (IOException e) {
            throw new RuntimeException("Error loading configuration properties", e);
        }
    }

    public static String get(String property) {
        if (properties == null) {
            properties = loadProperties();
        }
        String value = properties.getProperty(property);
        if (value == null) {
            throw new RuntimeException("Missing property " + property + " in config.properties");
        }
        return value;
    }

    public static int getInt(String property) {
        return Integer.parseInt(get(property));
    }

}
