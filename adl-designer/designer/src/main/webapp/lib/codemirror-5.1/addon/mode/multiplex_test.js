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

(function() {
  CodeMirror.defineMode("markdown_with_stex", function(){
    var inner = CodeMirror.getMode({}, "stex");
    var outer = CodeMirror.getMode({}, "markdown");

    var innerOptions = {
      open: '$',
      close: '$',
      mode: inner,
      delimStyle: 'delim',
      innerStyle: 'inner'
    };

    return CodeMirror.multiplexingMode(outer, innerOptions);
  });

  var mode = CodeMirror.getMode({}, "markdown_with_stex");

  function MT(name) {
    test.mode(
      name,
      mode,
      Array.prototype.slice.call(arguments, 1),
      'multiplexing');
  }

  MT(
    "stexInsideMarkdown",
    "[strong **Equation:**] [delim $][inner&tag \\pi][delim $]");
})();
