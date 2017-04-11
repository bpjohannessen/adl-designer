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

package org.openehr.designer.util;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;

import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Provides locks for a given key, allowing locking only for that particular key.
 * NOTE: you must keep a reference for the lock while holding it.
 *
 * @param <K> type of the lock key. Must conform to standard equals/hashCode contract.
 */
public class CachedLockProvider<K> implements LockProvider<K> {
    private final LoadingCache<K, Lock> lockCache;

    public CachedLockProvider() {
        lockCache = CacheBuilder.newBuilder().weakValues().build(new CacheLoader<K, Lock>() {
            @Override
            public Lock load(K key) throws Exception {
                return new ReentrantLock();
            }
        });
    }

    public Lock getLock(K key) {
        return lockCache.getUnchecked(key);
    }
}
