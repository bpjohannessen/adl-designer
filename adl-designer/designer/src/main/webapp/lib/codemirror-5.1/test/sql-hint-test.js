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
  var Pos = CodeMirror.Pos;

  var simpleTables = {
    "users": ["name", "score", "birthDate"],
    "xcountries": ["name", "population", "size"]
  };

  var schemaTables = {
    "schema.users": ["name", "score", "birthDate"],
    "schema.countries": ["name", "population", "size"]
  };

  var displayTextTables = [{
    text: "mytable",
    displayText: "mytable | The main table",
    columns: [{text: "id", displayText: "id | Unique ID"},
              {text: "name", displayText: "name | The name"}]
  }];

  namespace = "sql-hint_";

  function test(name, spec) {
    testCM(name, function(cm) {
      cm.setValue(spec.value);
      cm.setCursor(spec.cursor);
      var completion = CodeMirror.hint.sql(cm, {tables: spec.tables});
      if (!deepCompare(completion.list, spec.list))
        throw new Failure("Wrong completion results " + JSON.stringify(completion.list) + " vs " + JSON.stringify(spec.list));
      eqPos(completion.from, spec.from);
      eqPos(completion.to, spec.to);
    }, {
      value: spec.value,
      mode: "text/x-mysql"
    });
  }

  test("keywords", {
    value: "SEL",
    cursor: Pos(0, 3),
    list: ["SELECT"],
    from: Pos(0, 0),
    to: Pos(0, 3)
  });

  test("from", {
    value: "SELECT * fr",
    cursor: Pos(0, 11),
    list: ["FROM"],
    from: Pos(0, 9),
    to: Pos(0, 11)
  });

  test("table", {
    value: "SELECT xc",
    cursor: Pos(0, 9),
    tables: simpleTables,
    list: ["xcountries"],
    from: Pos(0, 7),
    to: Pos(0, 9)
  });

  test("columns", {
    value: "SELECT users.",
    cursor: Pos(0, 13),
    tables: simpleTables,
    list: ["users.name", "users.score", "users.birthDate"],
    from: Pos(0, 7),
    to: Pos(0, 13)
  });

  test("singlecolumn", {
    value: "SELECT users.na",
    cursor: Pos(0, 15),
    tables: simpleTables,
    list: ["users.name"],
    from: Pos(0, 7),
    to: Pos(0, 15)
  });

  test("quoted", {
    value: "SELECT `users`.`na",
    cursor: Pos(0, 18),
    tables: simpleTables,
    list: ["`users`.`name`"],
    from: Pos(0, 7),
    to: Pos(0, 18)
  });

  test("quotedcolumn", {
    value: "SELECT users.`na",
    cursor: Pos(0, 16),
    tables: simpleTables,
    list: ["`users`.`name`"],
    from: Pos(0, 7),
    to: Pos(0, 16)
  });

  test("schema", {
    value: "SELECT schem",
    cursor: Pos(0, 12),
    tables: schemaTables,
    list: ["schema.users", "schema.countries",
           "SCHEMA", "SCHEMA_NAME", "SCHEMAS"],
    from: Pos(0, 7),
    to: Pos(0, 12)
  });

  test("schemaquoted", {
    value: "SELECT `sch",
    cursor: Pos(0, 11),
    tables: schemaTables,
    list: ["`schema`.`users`", "`schema`.`countries`"],
    from: Pos(0, 7),
    to: Pos(0, 11)
  });

  test("schemacolumn", {
    value: "SELECT schema.users.",
    cursor: Pos(0, 20),
    tables: schemaTables,
    list: ["schema.users.name",
           "schema.users.score",
           "schema.users.birthDate"],
    from: Pos(0, 7),
    to: Pos(0, 20)
  });

  test("schemacolumnquoted", {
    value: "SELECT `schema`.`users`.",
    cursor: Pos(0, 24),
    tables: schemaTables,
    list: ["`schema`.`users`.`name`",
           "`schema`.`users`.`score`",
           "`schema`.`users`.`birthDate`"],
    from: Pos(0, 7),
    to: Pos(0, 24)
  });

  test("displayText_table", {
    value: "SELECT myt",
    cursor: Pos(0, 10),
    tables: displayTextTables,
    list: displayTextTables,
    from: Pos(0, 7),
    to: Pos(0, 10)
  });

  test("displayText_column", {
    value: "SELECT mytable.",
    cursor: Pos(0, 15),
    tables: displayTextTables,
    list: [{text: "mytable.id", displayText: "id | Unique ID"},
           {text: "mytable.name", displayText: "name | The name"}],
    from: Pos(0, 7),
    to: Pos(0, 15)
  });

  function deepCompare(a, b) {
    if (!a || typeof a != "object")
      return a === b;
    if (!b || typeof b != "object")
      return false;
    for (var prop in a) if (!deepCompare(a[prop], b[prop])) return false;
    return true;
  }
})();
