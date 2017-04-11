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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import javax.servlet.http.HttpServletRequest;

/**
 * @author markopi
 */
abstract public class AbstractResource {
    public static final Logger LOG = LoggerFactory.getLogger(AbstractResource.class);


    @ExceptionHandler(RestException.class)
    public ResponseEntity<RestErrorResponseBody> handleException(HttpServletRequest req, RestException e) {
        ResponseEntity<RestErrorResponseBody> result = new ResponseEntity<>(
                e.getErrorResponseBody(), e.getStatus());

        if (e.getStatus().is4xxClientError()) {
            LOG.warn("Client error for {}: {}: {}", req.getRequestURI(), e.getStatus(), e.getMessage());
        }
        if (e.getStatus().is5xxServerError()) {
            LOG.error("Server Error executing rest request: " + req.getRequestURI(), e);
        }
        return result;
    }

    @ExceptionHandler(ServletRequestBindingException.class)
    public ResponseEntity<RestErrorResponseBody> handleException(HttpServletRequest req, ServletRequestBindingException e) {

        LOG.warn("Rest binding error for {}: {}", req.getRequestURI(), e.getMessage());
        RestErrorResponseBody m = new RestErrorResponseBody();
        m.setMessage(e.getMessage());
        return new ResponseEntity<>(m, HttpStatus.BAD_REQUEST);
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<RestErrorResponseBody> handleException(HttpServletRequest req, Exception e) {

        LOG.error("Uncaught exception executing rest request: " + req.getRequestURI(), e);
        RestErrorResponseBody m = new RestErrorResponseBody();
        m.setMessage(e.getMessage());
        return new ResponseEntity<>(m, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ResponseStatus(value = HttpStatus.NOT_IMPLEMENTED)
    @ExceptionHandler(UnsupportedOperationException.class)
    @ResponseBody
    public RestErrorResponseBody handleException(UnsupportedOperationException e) {
        LOG.error("Unsupported operation", e);
        return new RestErrorResponseBody(e.getMessage());
    }



}
