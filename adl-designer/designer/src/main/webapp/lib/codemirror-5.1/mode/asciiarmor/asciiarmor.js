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

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function errorIfNotEmpty(stream) {
    var nonWS = stream.match(/^\s*\S/);
    stream.skipToEnd();
    return nonWS ? "error" : null;
  }

  CodeMirror.defineMode("asciiarmor", function() {
    return {
      token: function(stream, state) {
        var m;
        if (state.state == "top") {
          if (stream.sol() && (m = stream.match(/^-----BEGIN (.*)?-----\s*$/))) {
            state.state = "headers";
            state.type = m[1];
            return "tag";
          }
          return errorIfNotEmpty(stream);
        } else if (state.state == "headers") {
          if (stream.sol() && stream.match(/^\w+:/)) {
            state.state = "header";
            return "atom";
          } else {
            var result = errorIfNotEmpty(stream);
            if (result) state.state = "body";
            return result;
          }
        } else if (state.state == "header") {
          stream.skipToEnd();
          state.state = "headers";
          return "string";
        } else if (state.state == "body") {
          if (stream.sol() && (m = stream.match(/^-----END (.*)?-----\s*$/))) {
            if (m[1] != state.type) return "error";
            state.state = "end";
            return "tag";
          } else {
            if (stream.eatWhile(/[A-Za-z0-9+\/=]/)) {
              return null;
            } else {
              stream.next();
              return "error";
            }
          }
        } else if (state.state == "end") {
          return errorIfNotEmpty(stream);
        }
      },
      blankLine: function(state) {
        if (state.state == "headers") state.state = "body";
      },
      startState: function() {
        return {state: "top", type: null};
      }
    };
  });

  CodeMirror.defineMIME("application/pgp", "asciiarmor");
  CodeMirror.defineMIME("application/pgp-keys", "asciiarmor");
  CodeMirror.defineMIME("application/pgp-signature", "asciiarmor");
});
