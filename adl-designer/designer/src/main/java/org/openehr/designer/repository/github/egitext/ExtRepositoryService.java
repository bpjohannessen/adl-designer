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
import org.eclipse.egit.github.core.Repository;
import org.eclipse.egit.github.core.client.GitHubClient;
import org.eclipse.egit.github.core.client.GitHubRequest;
import org.eclipse.egit.github.core.service.RepositoryService;

import java.io.IOException;

import static org.eclipse.egit.github.core.client.IGitHubConstants.SEGMENT_REPOS;

/**
 * @author markopi
 */
public class ExtRepositoryService extends RepositoryService {
    public ExtRepositoryService() {
    }

    public ExtRepositoryService(GitHubClient client) {
        super(client);
    }

    public void createBranch(IRepositoryIdProvider repository, String branchName, String shaToBranchFrom)
            throws IOException {
        String id = getId(repository);
        StringBuilder uri = new StringBuilder(SEGMENT_REPOS);
        uri.append('/').append(id);
        uri.append("/git/refs");

        CreateBranchRequest postData = new CreateBranchRequest();
        postData.setRef("refs/heads/"+branchName);
        postData.setSha(shaToBranchFrom);

        client.post(uri.toString(), postData, Object.class);
    }

    @Override
    public ExtRepository getRepository(final IRepositoryIdProvider provider)
            throws IOException {
        final String id = getId(provider);
        GitHubRequest request = createRequest();
        request.setUri(SEGMENT_REPOS + '/' + id);
        request.setType(ExtRepository.class);
        return (ExtRepository) client.get(request).getBody();
    }


    public static class CreateBranchRequest {
        private String ref;
        private String sha;

        public String getRef() {
            return ref;
        }

        public void setRef(String ref) {
            this.ref = ref;
        }

        public String getSha() {
            return sha;
        }

        public void setSha(String sha) {
            this.sha = sha;
        }
    }

}
