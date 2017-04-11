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

CodeMirror.defineMode("eiffel", function() {
  function wordObj(words) {
    var o = {};
    for (var i = 0, e = words.length; i < e; ++i) o[words[i]] = true;
    return o;
  }
  var keywords = wordObj([
    'note',
    'across',
    'when',
    'variant',
    'until',
    'unique',
    'undefine',
    'then',
    'strip',
    'select',
    'retry',
    'rescue',
    'require',
    'rename',
    'reference',
    'redefine',
    'prefix',
    'once',
    'old',
    'obsolete',
    'loop',
    'local',
    'like',
    'is',
    'inspect',
    'infix',
    'include',
    'if',
    'frozen',
    'from',
    'external',
    'export',
    'ensure',
    'end',
    'elseif',
    'else',
    'do',
    'creation',
    'create',
    'check',
    'alias',
    'agent',
    'separate',
    'invariant',
    'inherit',
    'indexing',
    'feature',
    'expanded',
    'deferred',
    'class',
    'Void',
    'True',
    'Result',
    'Precursor',
    'False',
    'Current',
    'create',
    'attached',
    'detachable',
    'as',
    'and',
    'implies',
    'not',
    'or'
  ]);
  var operators = wordObj([":=", "and then","and", "or","<<",">>"]);
  var curPunc;

  function chain(newtok, stream, state) {
    state.tokenize.push(newtok);
    return newtok(stream, state);
  }

  function tokenBase(stream, state) {
    curPunc = null;
    if (stream.eatSpace()) return null;
    var ch = stream.next();
    if (ch == '"'||ch == "'") {
      return chain(readQuoted(ch, "string"), stream, state);
    } else if (ch == "-"&&stream.eat("-")) {
      stream.skipToEnd();
      return "comment";
    } else if (ch == ":"&&stream.eat("=")) {
      return "operator";
    } else if (/[0-9]/.test(ch)) {
      stream.eatWhile(/[xXbBCc0-9\.]/);
      stream.eat(/[\?\!]/);
      return "ident";
    } else if (/[a-zA-Z_0-9]/.test(ch)) {
      stream.eatWhile(/[a-zA-Z_0-9]/);
      stream.eat(/[\?\!]/);
      return "ident";
    } else if (/[=+\-\/*^%<>~]/.test(ch)) {
      stream.eatWhile(/[=+\-\/*^%<>~]/);
      return "operator";
    } else {
      return null;
    }
  }

  function readQuoted(quote, style,  unescaped) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && (unescaped || !escaped)) {
          state.tokenize.pop();
          break;
        }
        escaped = !escaped && ch == "%";
      }
      return style;
    };
  }

  return {
    startState: function() {
      return {tokenize: [tokenBase]};
    },

    token: function(stream, state) {
      var style = state.tokenize[state.tokenize.length-1](stream, state);
      if (style == "ident") {
        var word = stream.current();
        style = keywords.propertyIsEnumerable(stream.current()) ? "keyword"
          : operators.propertyIsEnumerable(stream.current()) ? "operator"
          : /^[A-Z][A-Z_0-9]*$/g.test(word) ? "tag"
          : /^0[bB][0-1]+$/g.test(word) ? "number"
          : /^0[cC][0-7]+$/g.test(word) ? "number"
          : /^0[xX][a-fA-F0-9]+$/g.test(word) ? "number"
          : /^([0-9]+\.[0-9]*)|([0-9]*\.[0-9]+)$/g.test(word) ? "number"
          : /^[0-9]+$/g.test(word) ? "number"
          : "variable";
      }
      return style;
    },
    lineComment: "--"
  };
});

CodeMirror.defineMIME("text/x-eiffel", "eiffel");

});
