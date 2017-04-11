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

package org.openehr.designer.user;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.openehr.designer.util.CachedLockProvider;
import org.openehr.designer.util.LockProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Required;

import javax.annotation.Resource;
import java.util.concurrent.locks.Lock;

/**
 * @author markopi
 */
@Aspect
public class UserServiceLockingAspect {

    private LockProvider<String> usernameLockProvider = new CachedLockProvider<>();

    @Resource(name = "usernameLockProvider")
    public void setUsernameLockProvider(LockProvider<String> usernameLockProvider) {
        this.usernameLockProvider = usernameLockProvider;
    }

    @Around("target(org.openehr.designer.user.UserConfigurationService) && args(username,..)")
    public Object lockAround(ProceedingJoinPoint joinPoint, String username) throws Throwable {
        Lock lock = usernameLockProvider.getLock(username);
        lock.lock();
        try {
            return joinPoint.proceed();
        } finally {
            lock.unlock();
        }
    }
}
