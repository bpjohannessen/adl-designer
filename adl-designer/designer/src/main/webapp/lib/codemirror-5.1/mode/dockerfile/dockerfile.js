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
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  // Collect all Dockerfile directives
  var instructions = ["from", "maintainer", "run", "cmd", "expose", "env",
                      "add", "copy", "entrypoint", "volume", "user",
                      "workdir", "onbuild"],
      instructionRegex = "(" + instructions.join('|') + ")",
      instructionOnlyLine = new RegExp(instructionRegex + "\\s*$", "i"),
      instructionWithArguments = new RegExp(instructionRegex + "(\\s+)", "i");

  CodeMirror.defineSimpleMode("dockerfile", {
    start: [
      // Block comment: This is a line starting with a comment
      {
        regex: /#.*$/,
        token: "comment"
      },
      // Highlight an instruction without any arguments (for convenience)
      {
        regex: instructionOnlyLine,
        token: "variable-2"
      },
      // Highlight an instruction followed by arguments
      {
        regex: instructionWithArguments,
        token: ["variable-2", null],
        next: "arguments"
      },
      {
        regex: /./,
        token: null
      }
    ],
    arguments: [
      {
        // Line comment without instruction arguments is an error
        regex: /#.*$/,
        token: "error",
        next: "start"
      },
      {
        regex: /[^#]+\\$/,
        token: null
      },
      {
        // Match everything except for the inline comment
        regex: /[^#]+/,
        token: null,
        next: "start"
      },
      {
        regex: /$/,
        token: null,
        next: "start"
      },
      // Fail safe return to start
      {
        token: null,
        next: "start"
      }
    ]
  });

  CodeMirror.defineMIME("text/x-dockerfile", "dockerfile");
});
