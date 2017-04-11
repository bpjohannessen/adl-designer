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
  var mode = CodeMirror.getMode({indentUnit: 2}, "xml"), mname = "xml";
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1), mname); }

  MT("matching",
     "[tag&bracket <][tag top][tag&bracket >]",
     "  text",
     "  [tag&bracket <][tag inner][tag&bracket />]",
     "[tag&bracket </][tag top][tag&bracket >]");

  MT("nonmatching",
     "[tag&bracket <][tag top][tag&bracket >]",
     "  [tag&bracket <][tag inner][tag&bracket />]",
     "  [tag&bracket </][tag&error tip][tag&bracket&error >]");

  MT("doctype",
     "[meta <!doctype foobar>]",
     "[tag&bracket <][tag top][tag&bracket />]");

  MT("cdata",
     "[tag&bracket <][tag top][tag&bracket >]",
     "  [atom <![CDATA[foo]",
     "[atom barbazguh]]]]>]",
     "[tag&bracket </][tag top][tag&bracket >]");

  // HTML tests
  mode = CodeMirror.getMode({indentUnit: 2}, "text/html");

  MT("selfclose",
     "[tag&bracket <][tag html][tag&bracket >]",
     "  [tag&bracket <][tag link] [attribute rel]=[string stylesheet] [attribute href]=[string \"/foobar\"][tag&bracket >]",
     "[tag&bracket </][tag html][tag&bracket >]");

  MT("list",
     "[tag&bracket <][tag ol][tag&bracket >]",
     "  [tag&bracket <][tag li][tag&bracket >]one",
     "  [tag&bracket <][tag li][tag&bracket >]two",
     "[tag&bracket </][tag ol][tag&bracket >]");

  MT("valueless",
     "[tag&bracket <][tag input] [attribute type]=[string checkbox] [attribute checked][tag&bracket />]");

  MT("pThenArticle",
     "[tag&bracket <][tag p][tag&bracket >]",
     "  foo",
     "[tag&bracket <][tag article][tag&bracket >]bar");

})();
