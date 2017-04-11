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

package org.openehr.designer.io.opt;

import org.openehr.designer.repository.ArchetypeRepository;
import org.openehr.jaxb.am.Archetype;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.lang.reflect.Constructor;
import java.util.List;

/**
 * @author Marko Pipan
 */
public class OptBuilder {
    private static final Logger LOG = LoggerFactory.getLogger(OptBuilder.class);

    private OptBuilderProxy proxy;
    private ArchetypeRepository archetypeRepository;

    public void setArchetypeRepository(ArchetypeRepository archetypeRepository) {
        this.archetypeRepository = archetypeRepository;
    }

    @PostConstruct
    public void init() {

        try {
            Class cls = Class.forName("org.openehr.designer.io.opt.ActualOptBuilderProxy");
            Constructor<OptBuilderProxy> constructor = cls.getConstructor(ArchetypeRepository.class);
            proxy = constructor.newInstance(archetypeRepository);
        } catch (ClassNotFoundException e) {
            proxy = new OptBuilderProxy.DummyOptBuilderProxy();
        } catch (Exception e) {
            LOG.warn("Error creating opt exporter. Functionality will not be available", e);
            proxy = new OptBuilderProxy.DummyOptBuilderProxy();
        }
    }

    public Opt build(List<Archetype> archetypes) {
        return proxy.build(archetypes);
    }

    public boolean enabled() {
        return proxy.enabled();
    }


    public static class Opt {
        private final String templateId;
        private final byte[] content;

        public Opt(String templateId, byte[] content) {
            this.templateId = templateId;
            this.content = content;
        }

        public String getTemplateId() {
            return templateId;
        }

        public byte[] getContent() {
            return content;
        }
    }
}
