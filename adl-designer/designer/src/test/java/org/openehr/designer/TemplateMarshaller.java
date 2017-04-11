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

import org.openehr.jaxb.am.Archetype;
import org.openehr.jaxb.am.ObjectFactory;
import org.openehr.jaxb.am.Template;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.xml.bind.*;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Reader;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * @author markopi
 * @since 2.2.12
 */
public class TemplateMarshaller {
    private static final Logger LOG = LoggerFactory.getLogger(TemplateMarshaller.class);

    private final JAXBContext context;
    private final ObjectFactory objectFactory;

    public TemplateMarshaller() {
        try {
            this.objectFactory = new ObjectFactory();
            context = JAXBContext.newInstance(Template.class.getPackage().getName());
        } catch (JAXBException e) {
            throw new RuntimeException(e);
        }
    }


    public Template readTemplate(Path in) throws IOException, JAXBException {
        return readTemplate(Files.newInputStream(in));
    }

    public Template readTemplate(InputStream in) throws JAXBException {
        try {
            Unmarshaller unmarshaller = context.createUnmarshaller();
            //noinspection unchecked
            JAXBElement<Template> element = (JAXBElement<Template>) unmarshaller.unmarshal(in);
            return element.getValue();
        } finally {
            try {
                in.close();
            } catch (IOException e) {
                LOG.warn("Error closing input stream", e);
            }
        }
    }

    public Template readTemplate(Reader reader) throws JAXBException {
        try {
            Unmarshaller unmarshaller = context.createUnmarshaller();
            //noinspection unchecked
            JAXBElement<Template> element = (JAXBElement<Template>) unmarshaller.unmarshal(reader);
            return element.getValue();
        } finally {
            try {
                reader.close();
            } catch (IOException e) {
                LOG.warn("Error closing input stream", e);
            }
        }
    }

    public void write(Archetype flatArchetype, Path out) throws JAXBException, IOException {
        writeAmObject(objectFactory.createArchetype(flatArchetype), out);
    }

    private void writeAmObject(JAXBElement<?> template, OutputStream out) throws JAXBException, IOException {
        Marshaller marshaller = context.createMarshaller();
        marshaller.setSchema(null);
        marshaller.setProperty(Marshaller.JAXB_FRAGMENT, true);

        marshaller.marshal(template, out);
        out.flush();
    }

    private void writeAmObject(JAXBElement<?> template, Path out) throws JAXBException, IOException {
        try (OutputStream outputStream = Files.newOutputStream(out)) {
            writeAmObject(template, outputStream);
            outputStream.close();
        } catch (IOException e) {
            try {
                Files.deleteIfExists(out);
            } catch (IOException e1) {
                LOG.warn("Error deleting file " + out.toAbsolutePath() + " after error. You should delete it manually.",
                        e1);
            }
            throw e;
        }
    }


}