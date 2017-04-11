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

package org.openehr.designer.repository;

import com.google.common.base.Charsets;
import com.google.common.io.CharStreams;
import org.openehr.adl.am.ArchetypeIdInfo;
import org.openehr.adl.parser.AdlDeserializer;
import org.openehr.adl.parser.BomSupportingReader;
import org.openehr.adl.serializer.ArchetypeSerializer;
import org.openehr.designer.util.WtUtils;
import org.openehr.jaxb.am.Archetype;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nullable;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;

/**
 * @author markopi
 */
abstract public class AbstractFileBasedArchetypeRepository extends AbstractArchetypeRepository {
    public static final Logger LOG = LoggerFactory.getLogger(AbstractFileBasedArchetypeRepository.class);

    protected final AdlDeserializer deserializer = new AdlDeserializer();

    private List<LocalArchetypeInfo> localArchetypeInfoList;

    private Function<Archetype, Path> newArchetypeFileLocationGenerator = (archetype) -> {
        ArchetypeIdInfo aidi = ArchetypeIdInfo.parse(archetype.getArchetypeId().getValue());
        return Paths.get(aidi.toInterfaceString() + ".adls");
    };

    protected LocalArchetypeInfo createLocalArchetypeInfo(Path path, Archetype archetype) {
        LocalArchetypeInfo result = new LocalArchetypeInfo();

        result.setInfo(createArchetypeInfo(archetype));
        String interfaceArchetypeId = ArchetypeIdInfo.parse(result.getInfo().getArchetypeId()).toInterfaceString();
        result.setInterfaceArchetypeId(interfaceArchetypeId);
        result.setPath(path);

        return result;
    }

    @Nullable
    protected LocalArchetypeInfo getLocalArchetypeInfo(String archetypeId) {
        for (LocalArchetypeInfo localArchetypeInfo : localArchetypeInfoList) {
            if (localArchetypeInfo.getInfo().getArchetypeId().equals(archetypeId)
                    || localArchetypeInfo.getInterfaceArchetypeId().equals(archetypeId)) {
                return localArchetypeInfo;
            }
        }
        return null;
    }

    protected abstract Path getRepositoryLocation();

    public Function<Archetype, Path> getNewArchetypeFileLocator() {
        return newArchetypeFileLocationGenerator;
    }

    public void setNewArchetypeFileLocationGenerator(Function<Archetype, Path> newArchetypeFileLocationGenerator) {
        this.newArchetypeFileLocationGenerator = newArchetypeFileLocationGenerator;
    }

    protected void parseRepository() throws IOException {
        localArchetypeInfoList = parseRepositoryArchetypes();
    }

    private List<LocalArchetypeInfo> parseRepositoryArchetypes() throws IOException {
        List<LocalArchetypeInfo> result = new ArrayList<>();
        List<Path> adlFiles = new ArrayList<>();
        Path repositoryPath = getRepositoryLocation();
        addAdlFilesRecursively(adlFiles, repositoryPath);
        for (Path adlFile : adlFiles) {
            Path relativeArchetypePath = repositoryPath.relativize(adlFile);
            try {
                LOG.info("Parsing archetype file " + relativeArchetypePath);
                String adlContent = readArchetype(adlFile);
                Archetype archetype = deserializer.parse(adlContent);

                LocalArchetypeInfo info = createLocalArchetypeInfo(relativeArchetypePath, archetype);

                result.add(info);
//                sourceArchetypes.put(info.getArchetypeId(), archetype);
//                sourceArchetypes.put(interfaceArchetypeId, archetype);
            } catch (Exception e) {
                LOG.error("Error parsing archetype from file " + relativeArchetypePath + ". Archetype will be ignored", e);
            }
        }
        return result;
    }

    private String readArchetype(Path adlFile) {
        try {
            return CharStreams.toString(new BomSupportingReader(
                    Files.newInputStream(adlFile),
                    Charsets.UTF_8));
        } catch (IOException e) {
            throw new RepositoryException("Could not read archetype from file " + adlFile, e);
        }
    }


    protected void addAdlFilesRecursively(List<Path> target, Path directory) throws IOException {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(directory)) {
            for (Path path : stream) {
                if (Files.isDirectory(path)) {
                    if (acceptDirectory(path)) {
                        addAdlFilesRecursively(target, path);
                    }
                } else if (path.getFileName().toString().endsWith(".adls")) {
                    target.add(path);
                }
            }
        }
    }

    protected boolean acceptDirectory(Path dir) {
        return !dir.getFileName().toString().startsWith(".");
    }

    protected Path getArchetypeFileLocation(@Nullable LocalArchetypeInfo info, Archetype archetype) {
        if (info == null) {
            // new archetype
            return newArchetypeFileLocationGenerator.apply(archetype);
        } else {
            return info.getPath();
        }
    }

    protected LocalArchetypeInfo addArchetype(Archetype archetype, String adl) throws IOException {
        final Path archetypePath = getArchetypeFileLocation(null, archetype);
        LOG.info("Saving new archetype in file {}", archetypePath);

        LocalArchetypeInfo localArchetypeInfo = createLocalArchetypeInfo(archetypePath, archetype);
        localArchetypeInfoList.add(localArchetypeInfo);

        Path absolutePath = getRepositoryLocation().resolve(archetypePath);
        Files.createDirectories(absolutePath.getParent());

        Files.write(absolutePath, adl.getBytes(Charsets.UTF_8));
        return localArchetypeInfo;
    }

    protected LocalArchetypeInfo updateArchetype(Archetype archetype, String adl) throws IOException {
        LocalArchetypeInfo existingArchetypeInfo = getLocalArchetypeInfo(archetype.getArchetypeId().getValue());
        checkNotNull(existingArchetypeInfo, "Archetype does not exist");
        LOG.info("Updating archetype in file {}", existingArchetypeInfo.getPath());

        LocalArchetypeInfo newLocalArchetypeInfo = createLocalArchetypeInfo(existingArchetypeInfo.getPath(), archetype);
        int archetypeInfoIndex = WtUtils.indexOf(localArchetypeInfoList, (t) -> t == existingArchetypeInfo);
        localArchetypeInfoList.set(archetypeInfoIndex, newLocalArchetypeInfo);

        final Path archetypePath = getRepositoryLocation().resolve(newLocalArchetypeInfo.getPath());
        Files.write(getRepositoryLocation().resolve(archetypePath), adl.getBytes(Charsets.UTF_8));
        return newLocalArchetypeInfo;
    }


    protected LocalArchetypeInfo saveArchetypeToFile(Archetype archetype) {
        checkArgument(archetype.isIsDifferential(), "Must be a differential archetype");
        String adl = ArchetypeSerializer.serialize(archetype);

        archetype = deserializer.parse(adl); // checks if the serialization is readable
        LocalArchetypeInfo localArchetypeInfo = getLocalArchetypeInfo(archetype.getArchetypeId().getValue());
        try {
            //ArchetypeInfo info = createArchetypeInfo(archetype);
            if (localArchetypeInfo == null) {
                return addArchetype(archetype, adl);
            } else {
                return updateArchetype(archetype, adl);
            }
        } catch (RepositoryException e) {
            throw e;
        } catch (Exception e) {
            throw new RepositoryException("Could not archetype to file", e);
        }
    }

    protected Archetype loadDifferentialArchetype(String archetypeId) {
        LocalArchetypeInfo localArchetypeInfo = getLocalArchetypeInfo(archetypeId);

        if (localArchetypeInfo == null) {
            throw new ArtifactNotFoundException(archetypeId);
        }
        String adl = readArchetype(getRepositoryLocation().resolve(localArchetypeInfo.getPath()));
        return deserializer.parse(adl);
    }


    @Override
    public List<ArchetypeInfo> getArchetypeInfos() {
        return localArchetypeInfoList.stream().map(LocalArchetypeInfo::getInfo)
                .collect(Collectors.toList());
    }

    protected static class LocalArchetypeInfo {
        private Path path;
        private String interfaceArchetypeId;
        private ArchetypeInfo info;

        public String getInterfaceArchetypeId() {
            return interfaceArchetypeId;
        }

        public void setInterfaceArchetypeId(String interfaceArchetypeId) {
            this.interfaceArchetypeId = interfaceArchetypeId;
        }

        public Path getPath() {
            return path;
        }

        public void setPath(Path path) {
            this.path = path;
        }

        public ArchetypeInfo getInfo() {
            return info;
        }

        public void setInfo(ArchetypeInfo info) {
            this.info = info;
        }
    }
}
