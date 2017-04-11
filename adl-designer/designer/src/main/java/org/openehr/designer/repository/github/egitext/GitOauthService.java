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

import org.springframework.http.HttpRequest;
import org.springframework.http.client.support.HttpRequestWrapper;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * @author markopi
 */
public class GitOauthService {
    private final RestTemplate restTemplate;

    public GitOauthService() {
        restTemplate = new RestTemplate();
        restTemplate.getInterceptors().add((request, body, execution) -> {
            HttpRequest wrapper = new HttpRequestWrapper(request);
            wrapper.getHeaders().set("Accept", "application/json");
            return execution.execute(wrapper, body);
        });
    }

    @SuppressWarnings("unchecked")
    public GetAccessTokenResponse getAccessToken(GetAccessTokenRequest request) {
        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("client_id", request.getClientId());
        map.add("client_secret", request.getClientSecret());
        map.add("code", request.getCode());
        Map<String, String> tokenResult = restTemplate.postForObject("https://github.com/login/oauth/access_token/", map, Map.class);
        GetAccessTokenResponse response = new GetAccessTokenResponse();
        response.setAccessToken(tokenResult.get("access_token"));
        response.setScope(tokenResult.get("scope"));
        response.setTokenType(tokenResult.get("token_type"));
        return response;
    }
}
