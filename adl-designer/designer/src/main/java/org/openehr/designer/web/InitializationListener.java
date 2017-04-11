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

package org.openehr.designer.web;

import org.openehr.designer.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.context.ContextLoaderListener;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * @author markopi
 * @since 3.4.2013
 */
public class InitializationListener extends ContextLoaderListener implements ServletContextListener {
    public static final Logger LOG = LoggerFactory.getLogger(InitializationListener.class);


    public static final String ENV_VAR = "ADL_DESIGNER_APPHOME";


    @Override
    public void contextInitialized(ServletContextEvent event) {

        String appHomeStr = System.getenv(ENV_VAR);
        if (appHomeStr == null) {
            appHomeStr = System.getProperty(ENV_VAR);
            if (appHomeStr==null) {
                throw new RuntimeException(
                        String.format("Required environment variable not defined. Please define %s to point to the application home directory",
                                ENV_VAR));
            }
        }
        Path appHome = Paths.get(appHomeStr);
        if (!Files.isDirectory(appHome) && !Files.exists(appHome.resolve("conf/config.properties"))) {
            throw new RuntimeException(
                    String.format("Environment variable %s does not point to the application home directory. Value: %s",
                            ENV_VAR, appHome));
        }
        Configuration.setAppHome(appHome);



        super.contextInitialized(event);

    }

    @Override
    public void contextDestroyed(ServletContextEvent event) {
        super.contextDestroyed(event);
    }
}
