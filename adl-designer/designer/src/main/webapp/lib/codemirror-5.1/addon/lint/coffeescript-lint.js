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

// Depends on coffeelint.js from http://www.coffeelint.org/js/coffeelint.js

// declare global: coffeelint

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.registerHelper("lint", "coffeescript", function(text) {
  var found = [];
  var parseError = function(err) {
    var loc = err.lineNumber;
    found.push({from: CodeMirror.Pos(loc-1, 0),
                to: CodeMirror.Pos(loc, 0),
                severity: err.level,
                message: err.message});
  };
  try {
    var res = coffeelint.lint(text);
    for(var i = 0; i < res.length; i++) {
      parseError(res[i]);
    }
  } catch(e) {
    found.push({from: CodeMirror.Pos(e.location.first_line, 0),
                to: CodeMirror.Pos(e.location.last_line, e.location.last_column),
                severity: 'error',
                message: e.message});
  }
  return found;
});

});
