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

CodeMirror.defineMode("properties", function() {
  return {
    token: function(stream, state) {
      var sol = stream.sol() || state.afterSection;
      var eol = stream.eol();

      state.afterSection = false;

      if (sol) {
        if (state.nextMultiline) {
          state.inMultiline = true;
          state.nextMultiline = false;
        } else {
          state.position = "def";
        }
      }

      if (eol && ! state.nextMultiline) {
        state.inMultiline = false;
        state.position = "def";
      }

      if (sol) {
        while(stream.eatSpace());
      }

      var ch = stream.next();

      if (sol && (ch === "#" || ch === "!" || ch === ";")) {
        state.position = "comment";
        stream.skipToEnd();
        return "comment";
      } else if (sol && ch === "[") {
        state.afterSection = true;
        stream.skipTo("]"); stream.eat("]");
        return "header";
      } else if (ch === "=" || ch === ":") {
        state.position = "quote";
        return null;
      } else if (ch === "\\" && state.position === "quote") {
        if (stream.eol()) {  // end of line?
          // Multiline value
          state.nextMultiline = true;
        }
      }

      return state.position;
    },

    startState: function() {
      return {
        position : "def",       // Current position, "def", "quote" or "comment"
        nextMultiline : false,  // Is the next line multiline value
        inMultiline : false,    // Is the current line a multiline value
        afterSection : false    // Did we just open a section
      };
    }

  };
});

CodeMirror.defineMIME("text/x-properties", "properties");
CodeMirror.defineMIME("text/x-ini", "properties");

});
