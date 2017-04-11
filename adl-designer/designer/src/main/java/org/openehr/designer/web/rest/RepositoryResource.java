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

package org.openehr.designer.web.rest;

import com.google.common.base.Charsets;
import org.openehr.adl.FlatArchetypeProvider;
import org.openehr.adl.serializer.ArchetypeSerializer;
import org.openehr.adl.util.ArchetypeWrapper;
import org.openehr.designer.FlatArchetypeProviderOverlay;
import org.openehr.designer.ReferenceModelDataBuilder;
import org.openehr.designer.diff.ArchetypeDifferentiator;
import org.openehr.designer.diff.TemplateDifferentiator;
import org.openehr.designer.io.TemplateSerializer;
import org.openehr.designer.io.opt.OptBuilder;
import org.openehr.designer.repository.*;
import org.openehr.designer.rm.ReferenceModels;
import org.openehr.designer.web.RepositoryProvider;
import org.openehr.designer.web.ResourceDownloadManager;
import org.openehr.designer.web.SessionContext;
import org.openehr.designer.web.SessionContextHolder;
import org.openehr.jaxb.am.Archetype;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author Marko Pipan
 */
@RestController
@RequestMapping(value = "/repo")
public class RepositoryResource extends AbstractResource {
    private static final Logger LOG = LoggerFactory.getLogger(RepositoryResource.class);


    @Resource
    private RepositoryProvider repositoryProvider;
    @Resource
    private ReferenceModels referenceModels;

    @Resource
    private ResourceDownloadManager resourceDownloadManager;


    @PostConstruct
    public void init() {
    }

    @RequestMapping(value = "/archetype/{archetypeId}/source")
    public Archetype getSourceArchetype(@PathVariable("archetypeId") String archetypeId) {
        SessionContext ctx = SessionContextHolder.get();
        return repositoryProvider.getArchetypeRepository(ctx)
                .getDifferentialArchetype(archetypeId);
    }

    @RequestMapping(value = "/archetype/{archetypeId}/flat", method = RequestMethod.GET)
    public Archetype getFlatArchetype(@PathVariable("archetypeId") String archetypeId) {
        return getFlatArchetypeRepository(SessionContextHolder.get()).getFlatArchetype(archetypeId);
    }

    @RequestMapping(value = "/archetype/{archetypeId}/flat", method = RequestMethod.PUT)
    public void saveFlatArchetype(@PathVariable("archetypeId") String archetypeId, @RequestBody Archetype archetype) {
        if (!archetypeId.equals(archetype.getArchetypeId().getValue())) {
            throw new IllegalArgumentException("Archetype id in path does not match archetype id in body");
        }
        SessionContext ctx = SessionContextHolder.get();

        Archetype differentialArchetype = ArchetypeDifferentiator.differentiate(
                referenceModels.getDefaultReferenceModel(), getFlatArchetypeRepository(ctx), archetype);
        differentialArchetype.setRmRelease(ReferenceModelDataBuilder.RM_VERSION);
        repositoryProvider.getArchetypeRepository(ctx).saveDifferentialArchetype(differentialArchetype);
    }

    @RequestMapping(value = "/list")
    public List<ArchetypeInfo> listArchetypeInfos() {
        SessionContext conf = SessionContextHolder.get();

        return repositoryProvider.getArchetypeRepository(conf).getArchetypeInfos();
    }


    @RequestMapping(value = "/template", method = RequestMethod.POST)
    public void saveTemplate(@RequestBody List<Archetype> archetypes) {
        SessionContext ctx = SessionContextHolder.get();
        FlatArchetypeRepository flatArchetypeRepository = getFlatArchetypeRepository(ctx);

        TemplateDifferentiator differentiator = new TemplateDifferentiator(flatArchetypeRepository);
        List<Archetype> sourceArchetypes = differentiator.differentiate(referenceModels.getDefaultReferenceModel(), archetypes);
        sourceArchetypes.forEach(a -> {
            if (!a.isIsOverlay() && a.getRmRelease() == null) {
                a.setRmRelease(ReferenceModelDataBuilder.RM_VERSION);
            }
        });
        TemplateRepository templateRepository = repositoryProvider.getTemplateRepository(ctx);
        templateRepository.saveTemplate(sourceArchetypes);
    }

    private FlatArchetypeRepository getFlatArchetypeRepository(SessionContext ctx) {
        return new FlatArchetypeRepository(
                repositoryProvider.getArchetypeRepository(ctx),
                referenceModels.getDefaultReferenceModel());
    }

    @RequestMapping(value = "/template", method = RequestMethod.GET)
    public List<TemplateInfo> listTemplates(HttpSession session) {
        SessionContext ctx = SessionContextHolder.get();


        TemplateRepository templateRepository = repositoryProvider.getTemplateRepository(ctx);

        return templateRepository.listTemplates();
    }

    @RequestMapping(value = "/template/{templateId}", method = RequestMethod.GET)
    public List<Archetype> loadTemplate(@PathVariable String templateId) {
        SessionContext ctx = SessionContextHolder.get();

        TemplateRepository templateRepository = repositoryProvider.getTemplateRepository(ctx);

        List<Archetype> differentials = templateRepository.loadTemplate(templateId);
        FlatArchetypeProvider flatArchetypeProvider = new FlatArchetypeProviderOverlay(
                getFlatArchetypeRepository(ctx), differentials);

        return differentials.stream()
                .map(d -> flatArchetypeProvider.getFlatArchetype(d.getArchetypeId().getValue()))
                .collect(Collectors.toList());
    }

    @RequestMapping(value = "/export/opt/14/{templateId}", method = RequestMethod.GET)
    public ResponseEntity<byte[]> exportSavedOpt14(@PathVariable String templateId) {
        SessionContext conf = SessionContextHolder.get();

        TemplateRepository templateRepository = repositoryProvider.getTemplateRepository(conf);
        List<Archetype> templateArchetypes = templateRepository.loadTemplate(templateId);

        OptBuilder.Opt opt = createOptBuilder(conf).build(templateArchetypes);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "text/xml; charset=utf-8");
        headers.add("Content-Disposition", "attachment; filename=\"" + opt.getTemplateId() + ".opt\"");
        headers.add("Content-Length", Integer.toString(opt.getContent().length));
        return new ResponseEntity<>(opt.getContent(), headers, HttpStatus.OK);
    }

    private OptBuilder createOptBuilder(SessionContext conf) {
        OptBuilder builder = new OptBuilder();
        builder.setArchetypeRepository(repositoryProvider.getArchetypeRepository(conf));
        builder.init();
        return builder;
    }

    @RequestMapping(value = "/export/opt14/display", method = RequestMethod.POST)
    public ResponseEntity<byte[]> displayProvidedOpt14(@RequestBody List<Archetype> flatArchetypeList) {
        OptBuilder.Opt opt = createOpt(flatArchetypeList);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "text/xml; charset=utf-8");
        headers.add("Content-Disposition", "attachment; filename=\"" + opt.getTemplateId() + ".opt\"");
        headers.add("Content-Length", Integer.toString(opt.getContent().length));
        return new ResponseEntity<>(opt.getContent(), headers, HttpStatus.OK);
    }

    @RequestMapping(value = "/export/opt14/handle", method = RequestMethod.POST)
    public DownloadableResourceHandle exportProvidedOpt14(@RequestBody List<Archetype> flatArchetypeList) {
        OptBuilder.Opt opt = createOpt(flatArchetypeList);

        ResourceDownloadManager.DownloadResource res = new ResourceDownloadManager.DownloadResource(
                "text/xml", opt.getTemplateId() + ".opt", opt.getContent());
        String id = resourceDownloadManager.store(res);
        return new DownloadableResourceHandle(id, res);
    }

    private OptBuilder.Opt createOpt(@RequestBody List<Archetype> flatArchetypeList) {
        SessionContext conf = SessionContextHolder.get();

        TemplateDifferentiator differentiator = new TemplateDifferentiator(getFlatArchetypeRepository(conf));
        List<Archetype> templateArchetypes = differentiator.differentiate(
                referenceModels.getDefaultReferenceModel(), flatArchetypeList);

        return createOptBuilder(conf).build(templateArchetypes);
    }

    @RequestMapping(value = "/export/adlt/{templateId}", method = RequestMethod.GET)
    public ResponseEntity<byte[]> exportAdlt(@PathVariable String templateId) {
        SessionContext ctx = SessionContextHolder.get();
        TemplateRepository templateRepository = repositoryProvider.getTemplateRepository(ctx);
        List<Archetype> archetypes = templateRepository.loadTemplate(templateId);
        Archetype archetype = archetypes.get(0);
        ArchetypeWrapper archetypeWrapper = new ArchetypeWrapper(archetype);
        String archetypeName = archetypeWrapper.getTermText(archetype.getDefinition().getNodeId());

        byte[] adltContent = TemplateSerializer.serialize(archetypes).getBytes(Charsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "text/plain; charset=utf-8");
        headers.add("Content-Disposition", "attachment; filename=\"" + archetypeName + ".adlt\"");
        headers.add("Content-Length", Integer.toString(adltContent.length));
        return new ResponseEntity<>(adltContent, headers, HttpStatus.OK);
    }

    @RequestMapping(value = "/display/adl/source", method = RequestMethod.POST, produces = "text/plain; charset=utf-8")
    @ResponseBody
    public String displayArchetypeAdlSource(@RequestBody Archetype archetype, HttpSession session) {
        SessionContext ctx = SessionContextHolder.get();

        Archetype differentialArchetype = ArchetypeDifferentiator.differentiate(
                referenceModels.getDefaultReferenceModel(), getFlatArchetypeRepository(ctx), archetype);
        return ArchetypeSerializer.serialize(differentialArchetype);
    }

    @RequestMapping(value = "/display/adl/flat", method = RequestMethod.POST, produces = "text/plain; charset=utf-8")
    @ResponseBody
    public String displayArchetypeAdlFlat(@RequestBody Archetype archetype) {
        return ArchetypeSerializer.serialize(archetype);
    }

    @RequestMapping(value = "/display/adl/template", method = RequestMethod.POST, produces = "text/plain; charset=utf-8")
    @ResponseBody
    public String displayTemplateAdl(@RequestBody List<Archetype> flatArchetypeList) {
        SessionContext ctx = SessionContextHolder.get();
        TemplateDifferentiator differentiator = new TemplateDifferentiator(getFlatArchetypeRepository(ctx));
        List<Archetype> sourceArchetypes = differentiator.differentiate(
             /**/   referenceModels.getDefaultReferenceModel(), flatArchetypeList);
        return TemplateSerializer.serialize(sourceArchetypes);
    }

    @ResponseStatus(value = HttpStatus.BAD_REQUEST, reason = "No such archetype")
    @ExceptionHandler(ArtifactNotFoundException.class)
    @ResponseBody
    public RestErrorResponseBody handleArchetypeNotFoundException(ArtifactNotFoundException e) {
        LOG.error("Bad Request", e);
        return new RestErrorResponseBody(e.getMessage());
    }

    @ResponseStatus(value = HttpStatus.UNAUTHORIZED)
    @ExceptionHandler(RepositoryAccessException.class)
    @ResponseBody
    public RestErrorResponseBody handleArchetypeNotFoundException(RepositoryAccessException e) {
        LOG.warn("Cannot access repository", e);
        return new RestErrorResponseBody(e.getMessage());
    }


    @RequestMapping(value = "/template-editor", method = RequestMethod.GET, produces = "text/html")
    public void GetTemplateHTML() {
        LOG.error("Something");
    }
}
