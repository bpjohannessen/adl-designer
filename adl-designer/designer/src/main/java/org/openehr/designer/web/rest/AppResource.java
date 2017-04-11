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

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSortedMap;
import org.openehr.designer.Configuration;
import org.openehr.designer.util.WtUtils;
import org.openehr.designer.web.ResourceDownloadManager;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;

/**
 * @author markopi
 */
@RequestMapping("/app")
@RestController
public class AppResource {
    private Map<String, String> appProperties;

    @Resource
    private ResourceDownloadManager resourceDownloadManager;

    @PostConstruct
    public void init() throws IOException {
        Properties properties = new Properties();
        try (InputStream appStream = getClass().getClassLoader().getResourceAsStream("app.properties");
             Reader reader = new InputStreamReader(appStream, StandardCharsets.UTF_8)) {
            properties.load(reader);
            appProperties = ImmutableSortedMap.copyOf(WtUtils.uncheckedCast(properties));

        }
    }

    @RequestMapping(value = "/configuration", method = RequestMethod.GET)
    public Map<String, Object> getAppConfiguration(HttpServletRequest req) {
        Map<String, Object> result = new LinkedHashMap<>();
        // add config keys
        ImmutableList.of("github.api.auth.client_id")
                .forEach((k) -> result.put(k, Configuration.get(k)));

        result.putAll(appProperties);
        return result;
    }


    @RequestMapping(value = "/download/{id}", method = RequestMethod.GET)
    public ResponseEntity<byte[]> download(@PathVariable("id") String id) {
        Optional<ResourceDownloadManager.DownloadResource> result = resourceDownloadManager.load(id);
        if (!result.isPresent()) {
            throw RestException.of(HttpStatus.NOT_FOUND).message("N such resource to download: %s", id).build();
        }
        ResourceDownloadManager.DownloadResource r = result.get();
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_TYPE, r.getMimetype());
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + r.getFilename() + "\"");
        headers.add("Content-Length", Integer.toString(r.getContent().length));
        return new ResponseEntity<>(r.getContent(), headers, HttpStatus.OK);
    }
}
