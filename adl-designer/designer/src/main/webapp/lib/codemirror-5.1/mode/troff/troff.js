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
  if (typeof exports == "object" && typeof module == "object")
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd)
    define(["../../lib/codemirror"], mod);
  else
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('troff', function() {

  var words = {};

  function tokenBase(stream) {
    if (stream.eatSpace()) return null;

    var sol = stream.sol();
    var ch = stream.next();

    if (ch === '\\') {
      if (stream.match('fB') || stream.match('fR') || stream.match('fI') ||
          stream.match('u')  || stream.match('d')  ||
          stream.match('%')  || stream.match('&')) {
        return 'string';
      }
      if (stream.match('m[')) {
        stream.skipTo(']');
        stream.next();
        return 'string';
      }
      if (stream.match('s+') || stream.match('s-')) {
        stream.eatWhile(/[\d-]/);
        return 'string';
      }
      if (stream.match('\(') || stream.match('*\(')) {
        stream.eatWhile(/[\w-]/);
        return 'string';
      }
      return 'string';
    }
    if (sol && (ch === '.' || ch === '\'')) {
      if (stream.eat('\\') && stream.eat('\"')) {
        stream.skipToEnd();
        return 'comment';
      }
    }
    if (sol && ch === '.') {
      if (stream.match('B ') || stream.match('I ') || stream.match('R ')) {
        return 'attribute';
      }
      if (stream.match('TH ') || stream.match('SH ') || stream.match('SS ') || stream.match('HP ')) {
        stream.skipToEnd();
        return 'quote';
      }
      if ((stream.match(/[A-Z]/) && stream.match(/[A-Z]/)) || (stream.match(/[a-z]/) && stream.match(/[a-z]/))) {
        return 'attribute';
      }
    }
    stream.eatWhile(/[\w-]/);
    var cur = stream.current();
    return words.hasOwnProperty(cur) ? words[cur] : null;
  }

  function tokenize(stream, state) {
    return (state.tokens[0] || tokenBase) (stream, state);
  };

  return {
    startState: function() {return {tokens:[]};},
    token: function(stream, state) {
      return tokenize(stream, state);
    }
  };
});

CodeMirror.defineMIME('troff', 'troff');

});
