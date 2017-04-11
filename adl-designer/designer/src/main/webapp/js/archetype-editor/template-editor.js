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

var TemplateEditor = (function () {
    var my = {};

    my.openLoadTemplateDialog = function () {
        $.getJSON("rest/repo/template").success(function (templateInfoList) {

            var context = {
                panel_id: GuiUtils.generateId()
            };
            GuiUtils.applyTemplate("template-editor|loadTemplateDialog", context, function (htmlString) {

                function populateTemplateIdSelect() {
                    templateIdSelect.empty();
                    for (var i in templateInfoList) {
                        var templateInfo = templateInfoList[i];
                        var option = $("<option>").attr("value", templateInfo.templateId).text(templateInfo.templateId + " (" + templateInfo.name + ")");
                        templateIdSelect.append(option);

                    }
                }

                var content = $(htmlString);

                var templateIdSelect = content.find('#' + context.panel_id + "_template_id");

                populateTemplateIdSelect();


                GuiUtils.openSimpleDialog(
                    {
                        title: "Load existing template",
                        buttons: {"load": "Load"},
                        content: content,
                        callback: function (content) {
                            var templateId = templateIdSelect.val();
                            $.getJSON("rest/repo/template/" + encodeURIComponent(templateId)).success(function (templateData) {
                                toastr.info("Loaded template " + templateId, "", {positionClass: "toast-bottom-full-width"});
                                $('.nav-tabs a[href="#' + 'archetype-editor-main-tabs-definition' + '"]').tab('show');
                                AOM.TemplateModel.createFromSerialized({
                                    archetypeRepository: my.archetypeRepository,
                                    referenceModel: my.referenceModel,
                                    data: templateData,
                                    callback: my.useTemplate
                                });
                            });
                        }
                    });
            });

        });
    };

    my.openCreateNewTemplateDialog = function () {
        var context = {
            panel_id: GuiUtils.generateId()
        };
        GuiUtils.applyTemplate("template-editor|createNewTemplateDialog", context, function (htmlString) {
            function populateParentArchetypeIdSelect() {
                parentArchetypeIdSelect.empty();
                var ids = [];
                for (var i in my.archetypeRepository.infoList) {
                    var info = my.archetypeRepository.infoList[i];
                    if (info.rmType === "COMPOSITION") {
                        ids.push(info.archetypeId);

                    }
                }
                ids.sort();
                for (var j in ids) {
                    parentArchetypeIdSelect.append($("<option>").attr("value", ids[j]).text(ids[j]));
                }
            }

            function createTemplateId() {
                return "openEHR-EHR-" + "COMPOSITION" + "."
                    + sanitizeConcept(conceptInput.val().trim()) + ".v"
                    + versionInput.val().trim();
            }

            function isValidConcept(str) {
                // invalid ascii characters
                if (/[\u0000-\u002f\u003a-\u0040\u005b-\u005e\u0060\u007b-\u007f]/.test(str)) return false;
                return true;
            }

            function sanitizeConcept(str) {
                str = str.toLowerCase();
                str = str.replace(/[\s\.]/g, "_");
                return str;
            }

            function changeValue() {
                templateIdText.text(createTemplateId());
            }

            var content = $(htmlString);

            var parentArchetypeIdSelect = content.find('#' + context.panel_id + '_archetype_id');
            var conceptInput = content.find('#' + context.panel_id + '_concept');
            var versionInput = content.find('#' + context.panel_id + '_version');
            var templateIdText = content.find('#' + context.panel_id + '_template_id');

            parentArchetypeIdSelect.on('change', changeValue);
            conceptInput.on('change', changeValue);
            versionInput.on('change', changeValue);

            populateParentArchetypeIdSelect();
            changeValue();

            GuiUtils.openSimpleDialog(
                {
                    title: "Create new template",
                    buttons: {"create": "Create"},
                    content: content,
                    callback: function (content) {
                        var rawConcept = conceptInput.val().trim();
                        var sanitizedConcept = sanitizeConcept(rawConcept);
                        if (rawConcept.length === 0) {
                            return "Concept is required";
                        }
                        if (!isValidConcept(sanitizedConcept)) {
                            return "Invalid concept";
                        }
                        var version = versionInput.val().trim();
                        if (version.length === 0) {
                            return "Version is invalid";
                        }

                        var templateId = createTemplateId();

                        AOM.TemplateModel.createNew({
                            archetypeRepository: my.archetypeRepository,
                            referenceModel: my.referenceModel,
                            templateId: templateId,
                            parentArchetypeId: parentArchetypeIdSelect.val(),
                            callback: function (templateModel) {
                                $('.nav-tabs a[href="#' + 'archetype-editor-main-tabs-definition' + '"]').tab('show');
                                my.useTemplate(templateModel);
                            }
                        });
                    }
                });
        });

    };

    my.saveCurrentTemplateWithNotification = function () {
        my.saveCurrentTemplate().done(function () {
            toastr.success("Template saved", "", {positionClass: "toast-bottom-full-width"})
        });
    };

    my.saveCurrentTemplate = function () {
        if (!my.templateModel) return;

        return jQuery.ajax({
            'type': 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            'url': "rest/repo/template",
            'contentType': 'application/json',
            'data': JSON.stringify(my.templateModel.toSerializableForm())/*,
             'dataType': 'text'*/
        }).fail(GuiUtils.processAjaxError);

    };

    my.exportToOpt14 = function () {
        function download(id) {
            document.location = "rest/app/download/" + encodeURIComponent(id);
        }

        return jQuery.ajax({
            'type': 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            'url': "rest/repo/export/opt14/handle",
            'contentType': 'application/json',
            'data': JSON.stringify(my.templateModel.toSerializableForm())/*,
             'dataType': 'text'*/
        }).done(function (data) {
            download(data.id);
        }).fail(GuiUtils.processAjaxError);
    };


    my.useTemplate = function (templateModel) {

        function loadDescription() {
            var targetElement = $('#archetype-editor-main-tabs-description');
            ArchetypeEditor.Description.show(templateModel.getRootArchetypeModel(), targetElement);
        }

        function loadDisplay() {
            var targetElement = $('#archetype-editor-main-tabs-display');
            my.Display.show(templateModel, targetElement);
        }


        my.templateModel = templateModel;

        var targetElement = $('#archetype-editor-main-tabs-definition');
        my.Definition.show(templateModel, my.referenceModel, targetElement);

        loadDescription();
        $('a[href="#archetype-editor-main-tabs-description"]').on('show.bs.tab', loadDescription);
        loadDisplay();
        $('a[href="#archetype-editor-main-tabs-display"]').on('show.bs.tab', loadDisplay);

        var am = templateModel.getRootArchetypeModel();
        var templateName = am.getTermDefinitionText(am.data.definition.node_id);
        document.title = templateName + ' - Template Editor';

    };

    /**
     * @return $.Deferred
     */
    my.initialize = function () {
        var defTemplate = GuiUtils.applyTemplate("template-editor|main", {}, function (html) {
            var $templateEditorContainer = $('#archetype-editor-archetype-tabs');
            $templateEditorContainer.empty();
            $templateEditorContainer.html(html);
        });

        // var latch = new CountdownLatch(4);
        var getUrlParameter = function getUrlParameter(sParam) {
            var sPageURL = decodeURIComponent(window.location.search.substring(1)),
                sURLVariables = sPageURL.split('&'),
                sParameterName,
                i;

            for (i = 0; i < sURLVariables.length; i++) {
                sParameterName = sURLVariables[i].split('=');

                if (sParameterName[0] === sParam) {
                    return sParameterName[1] === undefined ? true : sParameterName[1];
                }
            }
        };
        // these templates are loaded at initialization, to avoid asynchronous callback and multiple retrieves
        var defArchetype = ArchetypeEditor.initialize().done(function () {
            my.referenceModel = ArchetypeEditor.referenceModel;
            my.archetypeRepository = ArchetypeEditor.archetypeRepository;
            if (getUrlParameter('action') === 'new') {
                ArchetypeEditor.createNewArchetypeDialog();
            }
        });

        return $.when(defTemplate, defArchetype);
    };


    return my;


}() );