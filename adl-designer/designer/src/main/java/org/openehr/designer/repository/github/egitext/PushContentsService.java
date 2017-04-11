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

package org.openehr.designer.repository.github.egitext;

import org.eclipse.egit.github.core.IRepositoryIdProvider;
import org.eclipse.egit.github.core.client.GitHubClient;
import org.eclipse.egit.github.core.service.ContentsService;

import java.io.IOException;
import java.net.URLEncoder;

import static org.eclipse.egit.github.core.client.IGitHubConstants.SEGMENT_CONTENTS;
import static org.eclipse.egit.github.core.client.IGitHubConstants.SEGMENT_REPOS;

/**
 * @author markopi
 */
public class PushContentsService extends ContentsService {

    public PushContentsService() {
    }

    public PushContentsService(GitHubClient client) {
        super(client);
    }

    public PushContentsResponse pushContents(IRepositoryIdProvider repository, String path, PushContentsData pushData) throws IOException {
        String id = getId(repository);

        StringBuilder uri = new StringBuilder(SEGMENT_REPOS);
        uri.append('/').append(id);
        uri.append(SEGMENT_CONTENTS);
        if (path != null && path.length() > 0) {
            if (path.charAt(0) != '/')
                uri.append('/');
            uri.append(path);
        }
//        if (ref != null && ref.length() > 0) {
//            uri.append("?branch=").append(URLEncoder.encode(ref, "utf-8"));
//        }

        return client.put(uri.toString(), pushData, PushContentsResponse.class);
    }

}
