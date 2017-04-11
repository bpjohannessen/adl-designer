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

(function (ArchetypeEditor) {
    ArchetypeEditor.Display = function () {
        var my = {};

        function showAdlSource(archetypeModel, targetElement) {
            targetElement.empty();

            var json = AOM.impoverishedClone(archetypeModel.data);

            $.ajax({
                type: "POST",
                url: "rest/repo/display/adl/source",
                data: JSON.stringify(json),
                contentType: "application/json; charset=utf-8",
                dataType: "text"
            }).done(function (data) {
                var adlContainer = $("<pre>")
                        .attr("style", "width:100%; height:100%")
                        .attr("class", "display cm-s-adl")
                    ;
                //CodeMirror.runMode(data, "adl",  adlContainer[0]);
                adlContainer.text(data);
                targetElement.append(adlContainer);
            }).fail(function (errMsg) {
                var errDiv = $("<div>").attr("class", "error");
                errDiv.text("" + errMsg.status + " " + errMsg.statusText);
                targetElement.append(errDiv)
            });
        }

        function showAdlFlat(archetypeModel, targetElement) {
            targetElement.empty();

            var json = AOM.impoverishedClone(archetypeModel.data);
            $.ajax({
                type: "POST",
                url: "rest/repo/display/adl/flat",
                data: JSON.stringify(json),
                contentType: "application/json; charset=utf-8",
                dataType: "text"
            }).done(function (data) {
                var adlContainer = $("<pre>")
                        .attr("style", "width:100%; height:100%")
                        .attr("class", "display cm-s-adl")
                    ;
                //CodeMirror.runMode(data, "adl",  adlContainer[0]);
                adlContainer.text(data);
                targetElement.append(adlContainer);
            }).fail(function (errMsg) {
                var errDiv = $("<div>").attr("class", "error");
                errDiv.text("" + errMsg.status + " " + errMsg.statusText);
                targetElement.append(errDiv)
            });
        }


        my.show = function (archetypeModel, targetElement) {
            targetElement.empty();
            var context = {
                panel_id: GuiUtils.generateId()
            };

            GuiUtils.applyTemplate('display|main', context, function (html) {
                html = $(html);

                showAdlSource(archetypeModel, html.find('#' + context.panel_id + '_adl_source'));
                showAdlFlat(archetypeModel, html.find('#' + context.panel_id + '_adl_flat'));

                //html.find('a[href="#' + context.panel_id + '_adl_source"]').on('show.bs.tab', function (e) {
                //    showAdlSource(archetypeModel, html.find('#' + context.panel_id + '_adl_source'));
                //});
                //html.find('a[href="#' + context.panel_id + '_adl_flat"]').on('show.bs.tab', function (e) {
                //    showAdlFlat(archetypeModel, html.find('#' + context.panel_id + '_adl_flat'));
                //});

                targetElement.append(html);
            });
        };
        return my;
    }();

}(ArchetypeEditor));