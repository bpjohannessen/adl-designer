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


import org.springframework.http.HttpStatus;

/**
 * @author markopi
 */
public class RestException extends RuntimeException {
    private final RestErrorResponseBody errorResponseBody;
    private final HttpStatus status;

    private RestException(HttpStatus status, RestErrorResponseBody m, Throwable cause) {
        super(m != null ? m.getMessage() : status.toString(), cause);
        this.errorResponseBody = m;
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public RestErrorResponseBody getErrorResponseBody() {
        return errorResponseBody;
    }

    public static Builder of(HttpStatus status) {
        return new Builder(status);
    }

    public static Builder badRequest() {
        return of(HttpStatus.BAD_REQUEST);
    }


    public static class Builder {
        RestErrorResponseBody m = new RestErrorResponseBody();
        private final HttpStatus status;
        private Throwable cause;

        public Builder(HttpStatus status) {
            this.status = status;
        }

        public Builder causedBy(Throwable cause) {
            this.cause = cause;
            m.setMessage(cause.getMessage());
            return this;
        }

        public Builder message(String message, Object... params) {
            m.setMessage(String.format(message, params));
            return this;
        }

        public Builder message(String message) {
            m.setMessage(message);
            return this;
        }

        public RestException build() {
            if (m.getMessage()==null) {
                m.setMessage(status.toString() + ": " + status.getReasonPhrase());
            }

            return new RestException(status, m, cause);
        }
    }

}
