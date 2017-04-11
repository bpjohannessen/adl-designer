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

import org.openehr.designer.ReferenceModelData;
import org.openehr.designer.ReferenceModelDataBuilder;
import org.openehr.designer.rm.ReferenceModelInfo;
import org.openehr.designer.rm.ReferenceModels;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.List;

/**
 * @author markopi
 */
@RestController
@RequestMapping(value = "/rm")
public class ReferenceModelResource extends AbstractResource {
    public static final Logger LOG = LoggerFactory.getLogger(ReferenceModelResource.class);

    @Resource
    private ReferenceModels referenceModels;

    @RequestMapping(value = "", method = RequestMethod.GET)
    public List<ReferenceModelInfo> list() {
        return referenceModels.listModels();
    }

    @RequestMapping(value = "/{name}/{version}", method = RequestMethod.GET)
    public ReferenceModelData getRmModel(@PathVariable String name, @PathVariable String version) throws IOException {
        ReferenceModelDataBuilder builder = new ReferenceModelDataBuilder();
        try {
            return builder.build(referenceModels.getReferenceModel(name, version));
        } catch (IllegalArgumentException e) {
            throw RestException.of(HttpStatus.BAD_REQUEST).message(e.getMessage()).build();
        }
    }



}
