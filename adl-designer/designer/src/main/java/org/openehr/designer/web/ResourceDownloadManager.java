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

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * @author markopi
 */
@Component
public class ResourceDownloadManager {
    private Cache<String, DownloadResource> dowloadCache = CacheBuilder.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();

    public String store(DownloadResource resource) {
        String id = UUID.randomUUID().toString();
        dowloadCache.put(id, resource);
        return id;
    }

    public Optional<DownloadResource> load(String id) {
        DownloadResource res = dowloadCache.getIfPresent(id);
        if (res != null) {
            dowloadCache.invalidate(id);
        }
        return Optional.ofNullable(res);
    }


    public static class DownloadResource {
        private String mimetype;
        private String filename;
        private byte[] content;

        public DownloadResource(String mimetype, String filename, byte[] content) {
            this.mimetype = mimetype;
            this.filename = filename;
            this.content = content;
        }

        public DownloadResource() {
        }

        public void setMimetype(String mimetype) {
            this.mimetype = mimetype;
        }

        public void setContent(byte[] content) {
            this.content = content;
        }

        public String getMimetype() {
            return mimetype;
        }

        public byte[] getContent() {
            return content;
        }

        public String getFilename() {
            return filename;
        }

        public void setFilename(String filename) {
            this.filename = filename;
        }
    }
}
