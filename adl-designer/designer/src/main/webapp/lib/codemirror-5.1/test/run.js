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

#!/usr/bin/env node

var ok = require("./lint").ok;

var files = new (require('node-static').Server)();

var server = require('http').createServer(function (req, res) {
  req.addListener('end', function () {
    files.serve(req, res, function (err/*, result */) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
    });
  }).resume();
}).addListener('error', function (err) {
  throw err;
}).listen(3000, function () {
  var childProcess = require('child_process');
  var phantomjs = require("phantomjs");
  var childArgs = [
    require("path").join(__dirname, 'phantom_driver.js')
  ];
  childProcess.execFile(phantomjs.path, childArgs, function (err, stdout, stderr) {
    server.close();
    console.log(stdout);
    if (err) console.error(err);
    if (stderr) console.error(stderr);
    process.exit(err || stderr || !ok ? 1 : 0);
  });
});
