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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;

/**
 * @author markopi
 */
public class AuthorizationFilter implements Filter {
    public static final Logger LOG = LoggerFactory.getLogger(AuthorizationFilter.class);

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        HttpSession session = req.getSession();
        SessionContext ctx = (SessionContext) session.getAttribute(WebAttributes.SESSION_CONTEXT);
        boolean authorized = ctx!=null;
        //LOG.debug("Authorized: {} for servlet {}", authorized, req.getRequestURI() );
        if (!authorized && !req.getServletPath().equals("/rest")) {
            resp.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            resp.setHeader("Pragma", "no-cache");
            resp.setHeader("Expires", "0");
            req.getRequestDispatcher("/WEB-INF/html/login.html").include(request, response);
        } else {
            SessionContextHolder.SESSION_CONTEXT.set(ctx);
            try {
                chain.doFilter(request, response);
            } finally {
                SessionContextHolder.SESSION_CONTEXT.remove();
            }
        }
    }


    @Override
    public void destroy() {
    }
}
