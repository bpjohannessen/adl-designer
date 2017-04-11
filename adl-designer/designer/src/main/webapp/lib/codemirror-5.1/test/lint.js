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

var blint = require("blint");

["mode", "lib", "addon", "keymap"].forEach(function(dir) {
  blint.checkDir(dir, {
    browser: true,
    allowedGlobals: ["CodeMirror", "define", "test", "requirejs"],
    blob: "// CodeMirror, copyright (c) by Marijn Haverbeke and others\n// Distributed under an MIT license: http:\/\/codemirror.net\/LICENSE\n\n"
  });
});

module.exports = {ok: blint.success()};
