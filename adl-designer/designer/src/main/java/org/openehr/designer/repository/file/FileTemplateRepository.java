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

import com.google.common.base.Charsets;
import org.apache.commons.lang.ObjectUtils;
import org.openehr.adl.util.ArchetypeWrapper;
import org.openehr.designer.io.TemplateDeserializer;
import org.openehr.designer.io.TemplateSerializer;
import org.openehr.designer.repository.TemplateInfo;
import org.openehr.designer.repository.TemplateRepository;
import org.openehr.jaxb.am.Archetype;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Required;

import javax.annotation.PostConstruct;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * @author Marko Pipan
 */
public class FileTemplateRepository implements TemplateRepository {
    private static final Logger LOG = LoggerFactory.getLogger(FileTemplateRepository.class);

    private Path repositoryLocation;

    private ConcurrentHashMap<String, List<Archetype>> templateMap = new ConcurrentHashMap<>();



    @Required
    public void setRepositoryLocation(String repositoryLocation) {
        this.repositoryLocation = Paths.get(repositoryLocation);
    }

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(repositoryLocation);


        Files.list(repositoryLocation)
                .filter(path -> path.getFileName().toString().endsWith(".adlt") && !Files.isDirectory(path))
                .forEach(path -> {
                    try {

                        List<Archetype> archetypes = TemplateDeserializer.deserialize(Files.newInputStream(path));
                        templateMap.put(archetypes.get(0).getArchetypeId().getValue(), archetypes);

                    } catch (Exception e) {
                        LOG.error("Error parsing template {}. Will be ignored", path.getFileName(), e);
                    }
                });
    }

    @Override
    public List<TemplateInfo>  listTemplates() {
        List<TemplateInfo> result = templateMap.entrySet().stream()
                .map(e -> {
                    Archetype template = e.getValue().get(0);
                    ArchetypeWrapper wrapper = new ArchetypeWrapper(template);

                    String templateId = e.getKey();
                    String rmType = template.getDefinition().getRmTypeName();
                    String name = wrapper.getTermText(template.getDefinition().getNodeId());

                    return new TemplateInfo(templateId, rmType, name);
                })
                .collect(Collectors.toList());
        result.sort((t, o) -> ObjectUtils.compare(t.getName(), o.getName()));
        return result;
    }

    @Override
        public void saveTemplate(List<Archetype> archetypes) {
        String templateId = archetypes.get(0).getArchetypeId().getValue();
        String adltContent = TemplateSerializer.serialize(archetypes);
        // Check to see if the template can still be deserialized
        TemplateDeserializer.deserialize(adltContent);
        try {
            try (Writer w = new OutputStreamWriter(new FileOutputStream(repositoryLocation.resolve(templateId + ".adlt").toFile()),
                    Charsets.UTF_8)) {
                w.append(adltContent);
            }
            templateMap.put(templateId, archetypes);
        } catch (IOException e) {
            throw new RuntimeException("Error saving template", e);
        }
    }
  /*  public void saveTemplate(List<Archetype> archetypes) {
        String templateId = archetypes.get(0).getArchetypeId().getValue();
        String adltContent = TemplateSerializer.serialize(archetypes);
        // Check to see if the template can still be deserialized
        TemplateDeserializer.deserialize(adltContent);
        try {
            try (Writer w = new OutputStreamWriter(new FileOutputStream(repositoryLocation.resolve(templateId + ".adlt").toFile()),
                    Charsets.UTF_8)) {
                w.append(adltContent);
            }
            templateMap.put(templateId, archetypes);
        } catch (IOException e) {
            throw new RuntimeException("Error saving template", e);
        }
    }*/


    @Override
    public List<Archetype> loadTemplate(String templateId) {
        final List<Archetype> result = templateMap.get(templateId);
        if (result == null) {
            throw new IllegalArgumentException("No such template: " + templateId);
        }
        return result;
    }
}
