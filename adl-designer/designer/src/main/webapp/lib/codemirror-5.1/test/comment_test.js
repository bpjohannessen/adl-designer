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

namespace = "comment_";

(function() {
  function test(name, mode, run, before, after) {
    return testCM(name, function(cm) {
      run(cm);
      eq(cm.getValue(), after);
    }, {value: before, mode: mode});
  }

  var simpleProg = "function foo() {\n  return bar;\n}";
  var inlineBlock = "foo(/* bar */ true);";
  var inlineBlocks = "foo(/* bar */ true, /* baz */ false);";
  var multiLineInlineBlock = ["above();", "foo(/* bar */ true);", "below();"];

  test("block", "javascript", function(cm) {
    cm.blockComment(Pos(0, 3), Pos(3, 0), {blockCommentLead: " *"});
  }, simpleProg + "\n", "/* function foo() {\n *   return bar;\n * }\n */");

  test("blockToggle", "javascript", function(cm) {
    cm.blockComment(Pos(0, 3), Pos(2, 0), {blockCommentLead: " *"});
    cm.uncomment(Pos(0, 3), Pos(2, 0), {blockCommentLead: " *"});
  }, simpleProg, simpleProg);

  test("blockToggle2", "javascript", function(cm) {
    cm.setCursor({line: 0, ch: 7 /* inside the block comment */});
    cm.execCommand("toggleComment");
  }, inlineBlock, "foo(bar true);");

  // This test should work but currently fails.
  // test("blockToggle3", "javascript", function(cm) {
  //   cm.setCursor({line: 0, ch: 7 /* inside the first block comment */});
  //   cm.execCommand("toggleComment");
  // }, inlineBlocks, "foo(bar true, /* baz */ false);");

  test("line", "javascript", function(cm) {
    cm.lineComment(Pos(1, 1), Pos(1, 1));
  }, simpleProg, "function foo() {\n//   return bar;\n}");

  test("lineToggle", "javascript", function(cm) {
    cm.lineComment(Pos(0, 0), Pos(2, 1));
    cm.uncomment(Pos(0, 0), Pos(2, 1));
  }, simpleProg, simpleProg);

  test("fallbackToBlock", "css", function(cm) {
    cm.lineComment(Pos(0, 0), Pos(2, 1));
  }, "html {\n  border: none;\n}", "/* html {\n  border: none;\n} */");

  test("fallbackToLine", "ruby", function(cm) {
    cm.blockComment(Pos(0, 0), Pos(1));
  }, "def blah()\n  return hah\n", "# def blah()\n#   return hah\n");

  test("ignoreExternalBlockComments", "javascript", function(cm) {
    cm.execCommand("toggleComment");
  }, inlineBlocks, "// " + inlineBlocks);

  test("ignoreExternalBlockComments2", "javascript", function(cm) {
    cm.setCursor({line: 0, ch: null /* eol */});
    cm.execCommand("toggleComment");
  }, inlineBlocks, "// " + inlineBlocks);

  test("ignoreExternalBlockCommentsMultiLineAbove", "javascript", function(cm) {
    cm.setSelection({line: 0, ch: 0}, {line: 1, ch: 1});
    cm.execCommand("toggleComment");
  }, multiLineInlineBlock.join("\n"), ["// " + multiLineInlineBlock[0],
                                       "// " + multiLineInlineBlock[1],
                                       multiLineInlineBlock[2]].join("\n"));

  test("ignoreExternalBlockCommentsMultiLineBelow", "javascript", function(cm) {
    cm.setSelection({line: 1, ch: 13 /* after end of block comment */}, {line: 2, ch: 1});
    cm.execCommand("toggleComment");
  }, multiLineInlineBlock.join("\n"), [multiLineInlineBlock[0],
                                       "// " + multiLineInlineBlock[1],
                                       "// " + multiLineInlineBlock[2]].join("\n"));

  test("commentRange", "javascript", function(cm) {
    cm.blockComment(Pos(1, 2), Pos(1, 13), {fullLines: false});
  }, simpleProg, "function foo() {\n  /*return bar;*/\n}");

  test("indented", "javascript", function(cm) {
    cm.lineComment(Pos(1, 0), Pos(2), {indent: true});
  }, simpleProg, "function foo() {\n  // return bar;\n  // }");

  test("singleEmptyLine", "javascript", function(cm) {
    cm.setCursor(1);
    cm.execCommand("toggleComment");
  }, "a;\n\nb;", "a;\n// \nb;");

  test("dontMessWithStrings", "javascript", function(cm) {
    cm.execCommand("toggleComment");
  }, "console.log(\"/*string*/\");", "// console.log(\"/*string*/\");");

  test("dontMessWithStrings2", "javascript", function(cm) {
    cm.execCommand("toggleComment");
  }, "console.log(\"// string\");", "// console.log(\"// string\");");

  test("dontMessWithStrings3", "javascript", function(cm) {
    cm.execCommand("toggleComment");
  }, "// console.log(\"// string\");", "console.log(\"// string\");");
})();
