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

import org.openehr.designer.web.ResourceDownloadManager;

/**
 * @author markopi
 */
public class DownloadableResourceHandle {
    private String id;
    private Integer size;
    private String mimetype;
    private String filename;

    public DownloadableResourceHandle() {
    }

    public DownloadableResourceHandle(String id) {
        this.id = id;
    }

    public DownloadableResourceHandle(String id, ResourceDownloadManager.DownloadResource resource) {
        this.id = id;
        this.mimetype = resource.getMimetype();
        this.size = resource.getContent() != null ? resource.getContent().length : size;
        this.filename=resource.getFilename();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }

    public String getMimetype() {
        return mimetype;
    }

    public void setMimetype(String mimetype) {
        this.mimetype = mimetype;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }
}
