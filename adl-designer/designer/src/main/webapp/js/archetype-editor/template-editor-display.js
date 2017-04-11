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

(function (TemplateEditor) {
    TemplateEditor.Display = function () {
        var my = {};

        function showAdl(templateModel, targetElement) {
            targetElement.empty();

            //var json = AOM.impoverishedClone(archetypeModel.data);
            var serializableForm = templateModel.toSerializableForm();

            $.ajax({
                type: "POST",
                url: "rest/repo/display/adl/template",
                data: JSON.stringify(serializableForm),
                contentType: "application/json; charset=utf-8",
                dataType: "text"
            }).done(function (data) {
                var adlContainer = $("<pre>")
                        .attr("style", "width:100%; height:100%")
                        .attr("class", "display cm-s-adl")
                    ;
                CodeMirror.runMode(data, "adl",  adlContainer[0]);
                targetElement.append(adlContainer);
            }).fail(function (errMsg) {
                var errDiv = $("<div>").attr("class", "error");
                errDiv.text("" + errMsg.status + " " + errMsg.statusText);
                targetElement.append(errDiv)
            });
        }

        my.show = function (templateModel, targetElement) {
            targetElement.empty();
            var context = {
                panel_id: GuiUtils.generateId()
            };

            GuiUtils.applyTemplate('template-editor|display', context, function (html) {
                html = $(html);

                showAdl(templateModel, html.find('#' + context.panel_id + '_adl'));

                targetElement.append(html);
            });
        };
        return my;
    }();

}(TemplateEditor));