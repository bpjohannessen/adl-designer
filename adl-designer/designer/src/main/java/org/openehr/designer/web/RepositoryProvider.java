package org.openehr.designer.web;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import org.eclipse.egit.github.core.Repository;
import org.eclipse.egit.github.core.RepositoryId;
import org.eclipse.egit.github.core.client.GitHubClient;
import org.openehr.designer.repository.ArchetypeRepository;
import org.openehr.designer.repository.RepositoryException;
import org.openehr.designer.repository.TemplateRepository;
import org.openehr.designer.repository.github.GithubArchetypeRepository;
import org.openehr.designer.repository.github.GithubRepositoryId;
import org.openehr.designer.repository.github.GithubTemplateRepository;
import org.openehr.designer.repository.github.egitext.ExtRepositoryService;

import java.io.IOException;
import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

/**
 * Created by Denko on 10/28/2015.
 */
public class RepositoryProvider {
    public static Cache<RepoKey, GithubTemplateRepository> userToTemplateRepositoryMap =
            CacheBuilder.<RepoKey, GithubTemplateRepository>newBuilder()
                    .expireAfterAccess(1, TimeUnit.DAYS)
                    .build();
    public static Cache<RepoKey, GithubArchetypeRepository> userToArchetypeRepositoryMap =
            CacheBuilder.<RepoKey, GithubArchetypeRepository>newBuilder()
                    .expireAfterAccess(1, TimeUnit.DAYS)
                    .build();
    public static final String BRANCH="master";

    public TemplateRepository getTemplateRepository(SessionContext conf) {
        return getTemplateRepository(conf, conf.getGithubRepository());
    }

    public ArchetypeRepository getArchetypeRepository(SessionContext conf) {
        return getArchetypeRepository(conf, conf.getGithubRepository());
    }

    private <K, V> V computeIfAbsent(Cache<K, V> cache, K key, Callable<V> supplier) {
        try {
            return cache.get(key, supplier);
        } catch (ExecutionException e) {
            if (e.getCause() instanceof RuntimeException) {
                throw (RuntimeException) e.getCause();
            }
            throw new RuntimeException(e);
        }

    }

    public TemplateRepository getTemplateRepository(SessionContext conf, String repositoryName) {
        return computeIfAbsent(userToTemplateRepositoryMap, new RepoKey(BRANCH, repositoryName), () -> {
            GithubTemplateRepository r = new GithubTemplateRepository();
            r.init(conf.getUsername(), conf.getGithubToken(), repositoryName, BRANCH);
            return r;
        });
    }

    public ArchetypeRepository getArchetypeRepository(SessionContext conf, String repositoryName) {

        return computeIfAbsent(userToArchetypeRepositoryMap, new RepoKey(BRANCH, repositoryName), () -> {
            GithubArchetypeRepository r = new GithubArchetypeRepository();
            r.init(conf.getUsername(), conf.getGithubToken(), repositoryName, BRANCH);
            return r;
        });
    }

    public String forkRepository(SessionContext conf, String parentRepository) {
        GitHubClient github = new GitHubClient();
        github.setCredentials(conf.getUsername(), conf.getGithubToken());
        ExtRepositoryService repositoryService = new ExtRepositoryService(github);
        GithubRepositoryId repoId = GithubRepositoryId.parse(parentRepository);
        try {
            Repository repository = repositoryService.forkRepository(
                    new RepositoryId(repoId.getOwner(), repoId.getName()));
            return new GithubRepositoryId(repository.getOwner().getLogin(), repository.getName()).toString();
        } catch (IOException e) {
            throw new RepositoryException(e);
        }
    }

    private static final class RepoKey {
        final String branch;
        final String repositoryName;

        RepoKey(String branch, String repositoryName) {
            this.branch = branch;
            this.repositoryName = repositoryName;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            RepoKey key = (RepoKey) o;
            return Objects.equals(branch, key.branch) &&
                    Objects.equals(repositoryName, key.repositoryName);
        }

        @Override
        public int hashCode() {
            return Objects.hash(branch, repositoryName);
        }
    }
}
