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

import org.openehr.designer.repository.RepositoryNotFoundException;
import org.openehr.designer.repository.github.GithubArchetypeRepository;
import org.openehr.designer.repository.github.GithubRepositoryId;
import org.openehr.designer.user.UserConfigurationService;
import org.openehr.designer.user.UserRepositoriesConfiguration;
import org.openehr.designer.user.UserRepositoryConfiguration;
import org.openehr.designer.util.LockProvider;
import org.openehr.designer.web.RepositoryProvider;
import org.openehr.designer.web.SessionContext;
import org.openehr.designer.web.SessionContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * @author markopi
 */
@RequestMapping("/user")
@RestController
public class UserResource extends AbstractResource {
    @Resource
    RepositoryProvider repositoryProvider;

    @Resource
    UserConfigurationService userConfigurationService;
    @Resource(name = "usernameLockProvider")
    LockProvider<String> usernameLockProvider;


    @RequestMapping(value = "/profile", method = RequestMethod.GET)
    public UserProfile getUserProfile() {
        SessionContext ctx = SessionContextHolder.get();
        UserProfile info = new UserProfile();
        info.setUsername(ctx.getUsername());
        info.setRepository(ctx.getGithubRepository());

        return info;
    }

    @RequestMapping(value = "/repository/info", method = RequestMethod.GET)
    public UserRepositoriesConfiguration getRepositoriesConfiguration() {
        SessionContext ctx = SessionContextHolder.get();
        return userConfigurationService.getRepositoriesConfiguration(ctx.getUsername());
    }

    @RequestMapping(value = "/repository/delete", method = RequestMethod.POST)
    public void deleteRepository(@RequestParam String name) {
        SessionContext ctx = SessionContextHolder.get();
        userConfigurationService.deleteRepositoryByName(ctx.getUsername(), name);
    }

    @RequestMapping(method = RequestMethod.POST, value = "/repository/add")
    public UserRepositoryConfiguration addRepository(@RequestParam String name)  {

        SessionContext ctx = SessionContextHolder.get();
        return usernameLockProvider.with(ctx.getUsername(), () -> {
            String repoName=name;
            if (repoName.indexOf('/')==-1) {
                repoName = ctx.getUsername()+"/"+repoName;
            }
            UserRepositoriesConfiguration repositories = userConfigurationService.getRepositoriesConfiguration(ctx.getUsername());
            UserRepositoryConfiguration existing = repositories.findByName(repoName).orElse(null);
            if (existing != null) {
                return existing;
            }
            // create repository and maybe metadata
            GithubArchetypeRepository archetypeRepository = null;
            try {
                archetypeRepository = (GithubArchetypeRepository)
                        repositoryProvider.getArchetypeRepository(ctx, repoName);
                repositoryProvider.getTemplateRepository(ctx, repoName);
            } catch (RepositoryNotFoundException e) {
                throw RestException.badRequest().causedBy(e).build();
            }

            UserRepositoryConfiguration repo = new UserRepositoryConfiguration();
            repo.setName(repoName);
            repo.setForkOf(archetypeRepository.getParent());
            repo.setWritable(archetypeRepository.isWritable());
            userConfigurationService.saveRepository(ctx.getUsername(), repo);
            return repo;
        });
    }

    @RequestMapping(method = RequestMethod.POST, value = "/repository/choose")
    public UserRepositoryConfiguration chooseRepository(@RequestParam String name) throws Exception {
        SessionContext ctx = SessionContextHolder.get();
        return usernameLockProvider.with(ctx.getUsername(), ()->{
            UserRepositoriesConfiguration repositories = userConfigurationService.getRepositoriesConfiguration(ctx.getUsername());

            UserRepositoryConfiguration repo = repositories.findByName(name)
                    .orElseThrow(() -> RestException.badRequest()
                            .message("No such repository: %s", name).build());

            repositoryProvider.getArchetypeRepository(ctx, name);
            repositoryProvider.getTemplateRepository(ctx, name);

            repositories.setLastRepository(name);
            userConfigurationService.setRepositoriesConfiguration(ctx.getUsername(), repositories);

            ctx.setGithubRepository(name);
            return repo;
        });
    }

    @RequestMapping(method = RequestMethod.POST, value = "/repository/fork")
    public UserRepositoryConfiguration forkRepository(@RequestParam String parent) throws Exception {
        SessionContext ctx = SessionContextHolder.get();
        return usernameLockProvider.with(ctx.getUsername(), ()->{
            UserRepositoriesConfiguration repositories = userConfigurationService.getRepositoriesConfiguration(ctx.getUsername());
            String newRepository = repositoryProvider.forkRepository(ctx, parent);


            UserRepositoryConfiguration repo = repositories.findByName(newRepository).orElse(null);
            if (repo==null) {
                repo = new UserRepositoryConfiguration();
                repo.setName(newRepository);
                repo.setForkOf(parent);
                repo.setWritable(true);

                userConfigurationService.saveRepository(ctx.getUsername(), repo);
            }

            return repo;
        });
    }


}
