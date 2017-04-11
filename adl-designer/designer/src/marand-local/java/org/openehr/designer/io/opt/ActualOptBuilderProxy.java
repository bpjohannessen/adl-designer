/*
 * ADL2-core
 * Copyright (c) 2013-2014 Marand d.o.o. (www.marand.com)
 *
 * This file is part of ADL2-core.
 *
 * ADL2-core is free software: you can redistribute it and/or modify
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

import com.google.common.base.Charsets;
import org.openehr.adl.FlatArchetypeProvider;
import org.openehr.adl.rm.OpenEhrRmModel;
import org.openehr.designer.repository.ArchetypeRepository;
import org.openehr.designer.repository.FlatArchetypeRepository;
import org.openehr.jaxb.am.Archetype;
import org.openehr.jaxb.am14.Template;
import org.openehr.optexporter14.Opt14TemplateBuilder;
import org.openehr.optexporter14.Template14Serializer;

import java.util.List;


/**
 * @author Marko Pipan
 */
class ActualOptBuilderProxy extends OptBuilderProxy {
    private final Template14Serializer serializer;
    private final Opt14TemplateBuilder builder;

    public ActualOptBuilderProxy(ArchetypeRepository repository) {
        FlatArchetypeProvider archetypeProvider = new FlatArchetypeRepository(repository, OpenEhrRmModel.getInstance());
        this.builder = new Opt14TemplateBuilder(archetypeProvider);
        this.serializer = new Template14Serializer();
    }

    @Override
    boolean enabled() {
        return true;
    }

    @Override
    OptBuilder.Opt build(List<Archetype> archetypes) {
        Template template14 = builder.build(archetypes);
        return new OptBuilder.Opt(
                template14.getTemplateId().getValue(),
                serializer.serialize(template14).getBytes(Charsets.UTF_8));
    }
}
