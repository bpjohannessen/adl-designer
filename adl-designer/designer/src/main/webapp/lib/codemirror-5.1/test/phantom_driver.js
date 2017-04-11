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

var page = require('webpage').create();

page.open("http://localhost:3000/test/index.html", function (status) {
  if (status != "success") {
    console.log("page couldn't be loaded successfully");
    phantom.exit(1);
  }
  waitFor(function () {
    return page.evaluate(function () {
      var output = document.getElementById('status');
      if (!output) { return false; }
      return (/^(\d+ failures?|all passed)/i).test(output.innerText);
    });
  }, function () {
    var failed = page.evaluate(function () { return window.failed; });
    var output = page.evaluate(function () {
      return document.getElementById('output').innerText + "\n" +
        document.getElementById('status').innerText;
    });
    console.log(output);
    phantom.exit(failed > 0 ? 1 : 0);
  });
});

function waitFor (test, cb) {
  if (test()) {
    cb();
  } else {
    setTimeout(function () { waitFor(test, cb); }, 250);
  }
}
