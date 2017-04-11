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

var ArchetypeEditor = (function () {
    var my = {};

    var rmModules = {};

    my.openLoadArchetypeDialog = function () {
        var loadArchetypeContext = {
            panel_id: GuiUtils.generateId(),
            archetypes: my.archetypeRepository.infoList
        };
        GuiUtils.applyTemplate("dialog-archetype|load", loadArchetypeContext, function (htmlString) {
            var content = $(htmlString);
            var archetypeSelect = content.find('#' + loadArchetypeContext.panel_id + "_archetype");
            archetypeSelect.selectpicker({size: "10"});

            GuiUtils.openSimpleDialog(
                {
                    title: "Load archetype",
                    backdrop: "static",
                    buttons: {"load": "Load"},
                    content: content,
                    callback: function (content) {
                        var archetypeId = content.find('#' + loadArchetypeContext.panel_id + '_archetype').val();
                        $('.nav-tabs a[href="#' + 'archetype-editor-main-tabs-definition' + '"]').tab('show');
                        my.loadArchetype(archetypeId, my.useArchetype);
                    }
                });
        });
    };

    my.openSpecializeArchetypeDialog = function () {
        var loadArchetypeContext = {
            panel_id: GuiUtils.generateId(),
            archetypes: my.archetypeRepository.infoList
        };
        GuiUtils.applyTemplate("dialog-archetype|specialize", loadArchetypeContext, function (htmlString) {
            var content = $(htmlString);

            var parentSelect = content.find('#' + loadArchetypeContext.panel_id + '_parent');
            var specializedInput = content.find('#' + loadArchetypeContext.panel_id + '_specialized');

            specializedInput.val(parentSelect.val());
            parentSelect.change(function () {
                specializedInput.val(parentSelect.val());
            });


            GuiUtils.openSimpleDialog(
                {
                    title: "Specialize archetype",
                    buttons: {"specialize": "Specialize"},
                    content: content,
                    callback: function (content) {
                        var parentArchetypeId = parentSelect.val();
                        var specializedArchetypeId = specializedInput.val().trim();
                        if (specializedArchetypeId.length === 0) {
                            return "Missing specialized archetype id"
                        }

                        var existing = Stream(my.archetypeRepository.infoList)
                            .anyMatch({archetypeId: specializedArchetypeId});
                        if (existing) {
                            return "Specialized archetype id already exists";
                        }
                        $('.nav-tabs a[href="#' + 'archetype-editor-main-tabs-definition' + '"]').tab('show');
                        my.createSpecializedArchetypeModel(parentArchetypeId, specializedArchetypeId, my.useArchetype);
                    }
                });
        });
    };

    my.createNewArchetypeDialog = function () {
        var context = {
            panel_id: GuiUtils.generateId()
        };
        GuiUtils.applyTemplate("dialog-archetype|create", context, function (htmlString) {
            function populateRmTypeSelect() {
                rmTypeSelect.empty();
                var types = [];
                for (var type in my.referenceModel.model.types) {
                    var rmType = my.referenceModel.model.types[type];
                    if (rmType.rootType) {
                        types.push(type);
                    }
                }
                types.sort();
                for (var i in types) {
                    rmTypeSelect.append($("<option>").attr("value", types[i]).text(types[i]));
                }
            }

            function createArchetypeId() {
                return "openEHR-EHR-" + rmTypeSelect.val() + "."
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
                archetypeIdText.text(createArchetypeId());
            }

            var content = $(htmlString);

            var rmTypeSelect = content.find('#' + context.panel_id + '_rm_type');
            var conceptInput = content.find('#' + context.panel_id + '_concept');
            var versionInput = content.find('#' + context.panel_id + '_version');
            var languageInput = content.find('#' + context.panel_id + '_language');
            var archetypeIdText = content.find('#' + context.panel_id + '_archetype_id');

            rmTypeSelect.on('change', changeValue);
            conceptInput.on('change', changeValue);
            versionInput.on('change', changeValue);

            populateRmTypeSelect();
            changeValue();

            GuiUtils.openSimpleDialog(
                {
                    title: "Create new archetype",
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
                        var language = languageInput.val().trim();
                        if (language.length === 0) {
                            return "Language is required";
                        }

                        var archetypeId = createArchetypeId();
                        var existing = Stream(my.archetypeRepository.infoList)
                            .anyMatch({archetypeId: archetypeId});
                        if (existing) {
                            return "New archetype id already exists";
                        }

                        var newArchetypeModel = AOM.createNewArchetype({
                            rm_type: rmTypeSelect.val(),
                            concept: sanitizedConcept,
                            version: version,
                            language: language,
                            definition_text: rawConcept,
                            definition_description: rawConcept
                        });
                        $('.nav-tabs a[href="#' + 'archetype-editor-main-tabs-definition' + '"]').tab('show');
                        my.useArchetype(newArchetypeModel);
                    }
                });
        });
    };

    my.createSpecializedArchetypeModel = function (parentArchetypeId, newArchetypeId, callback) {
        $.getJSON("rest/repo/archetype/" + encodeURIComponent(parentArchetypeId) + "/flat")
            .done(function (data) {
                //var parentData = AmUtils.clone(data);
                var archetypeModel = AOM.createSpecializedArchetype({
                        archetypeId: newArchetypeId,
                        parent: new AOM.ArchetypeModel(data)
                    }
                );
                callback(archetypeModel);
            });
    };


    my.loadArchetype = function (archetypeId, callback) {
        $.getJSON("rest/repo/archetype/" + encodeURIComponent(archetypeId) + "/flat").success(
            function (data) {
                if (data.parent_archetype_id) {
                    $.getJSON("rest/repo/archetype/" + encodeURIComponent(data.parent_archetype_id.value) + "/flat").success(
                        function (parentData) {
                            var parentArchetypeModel = new AOM.ArchetypeModel(parentData);
                            var archetypeModel = new AOM.ArchetypeModel(data, parentArchetypeModel);
                            if (callback) {
                                callback(archetypeModel);
                            }
                        }
                    );
                } else {
                    var archetypeModel = new AOM.ArchetypeModel(data);
                    if (callback) {
                        callback(archetypeModel);
                    }
                }
            });

    };

    my.saveCurrentArchetypeWithNotification = function () {
        my.saveCurrentArchetype(function () {
            GuiUtils.alert({type: 'success', title: 'Archetype Saved'});
        }, function (status) {
            GuiUtils.alert({type: 'error', title: 'Error saving archetype', text: status.message})
        })
    };

    my.saveCurrentArchetype = function (successCallback, errorCallback) {
        if (!my.archetypeModel) return;
        var archetypeId = my.archetypeModel.data.archetype_id.value;
        var archetypeJson = AOM.impoverishedClone(my.archetypeModel.data);

        $.ajax({
            type: "PUT",
            url: "rest/repo/archetype/" + encodeURIComponent(archetypeId) + "/flat",
            data: JSON.stringify(archetypeJson),
            contentType: "application/json; charset=utf-8",
            dataType: "text"
        }).done(function (data) {
            // reload list of archetypes
            my.archetypeRepository.load().done(function () {
                /*if (successCallback) {
                    successCallback();
                }*/
                toastr.success("Save successful!")
            }).fail(GuiUtils.processAjaxError);
        }).error(function (jxhr) {
            GuiUtils.processAjaxError(jxhr, errorCallback)
        });
    };

    my.getRmTypeHandler = function (rm_type, referenceModel) {
        if (typeof rm_type === "object") {
            if (rm_type["@type"] === "ARCHETYPE_SLOT") {
                return rmModules["@common"].handlers["ARCHETYPE_SLOT"];
            } else if (rm_type["@type"] === "ARCHETYPE_INTERNAL_REF") {
                return rmModules["@common"].handlers["ARCHETYPE_INTERNAL_REF"];
            } else {
                rm_type = rm_type.rm_type_name;
            }
        }

        if (!rm_type) return undefined;

        referenceModel = referenceModel || my.referenceModel.name();
        var rmModule = rmModules[referenceModel];
        if (rmModule && rmModule.handlers[rm_type]) {
            return rmModule.handlers[rm_type];
        }
        var result = rmModules["@common"].handlers[rm_type] || rmModules[""].handlers[rm_type];
        if (result) return result;
        var ltPos = rm_type.indexOf('<');
        if (ltPos >= 0) {
            //var gtPos = rm_type.indexOf('>', ltPos);
            var mainRmType = rm_type.substring(0, ltPos);
            return my.getRmTypeHandler(mainRmType, referenceModel);
        }
        return result;

    };

    my.applySubModules = function (stage, generatedDom, context) {

        for (var key in context) {
            var prop = context[key];
            if (typeof prop === "object") {
                if (prop.type && prop.panel_id) {
                    var handler = my.getRmTypeHandler(prop.type);
                    if (handler) {
                        var targetElement = generatedDom.find("#" + prop.panel_id);
                        if (targetElement.length > 0) {
                            handler.show(stage, prop, targetElement);
                            continue;
                        }
                    }
                }
                my.applySubModules(stage, generatedDom, prop);
            }
        }
    };

    my.applySubModulesHide = function (stage, generatedDom, context) {
        for (var key in context) {
            var prop = context[key];
            if (typeof prop === "object") {
                if (prop.type && prop.panel_id) {
                    var handler = my.getRmTypeHandler(prop.type);
                    if (handler) {
                        var targetElement = generatedDom.find("#" + prop.panel_id);
                        if (targetElement.length > 0) {
                            if (handler.hide) {
                                handler.hide(stage, prop, targetElement);
                                continue;
                            }
                        }
                    }
                }
                my.applySubModulesHide(stage, generatedDom, prop)
            }
        }
    };

    my.applySubModulesUpdateContext = function (stage, generatedDom, context) {
        for (var key in context) {
            var prop = context[key];
            if (typeof prop === "object" && !prop["@type"]) {
                if (prop.type && prop.panel_id) {
                    var handler = my.getRmTypeHandler(prop.type);
                    if (handler) {
                        var targetElement = generatedDom.find("#" + prop.panel_id);
                        if (targetElement.length > 0) {
                            handler.updateContext(stage, prop, targetElement);
                            continue;
                        }
                    }
                }
                my.applySubModulesUpdateContext(stage, generatedDom, prop);
            }
        }
    };


    my.useArchetype = function (archetypeModel) {

        function loadTerminology() {
            var targetElement = $('#archetype-editor-main-tabs-terminology');
            ArchetypeEditorTerminology.showTerminology(archetypeModel, targetElement);
//            targetElement.find(".bootstrap-table").each(function(idx, el) {
//							$(el).find("table").bootstrapTable('resetView', {
//		            height: getBoostrapTableHeight($(el))
//		        	});
//						});
        }

        function loadDescription() {
            var targetElement = $('#archetype-editor-main-tabs-description');
            my.Description.show(archetypeModel, targetElement);
        }

        function loadDisplay() {
            var targetElement = $('#archetype-editor-main-tabs-display');
            my.Display.show(archetypeModel, targetElement);
        }

        function displayArchetypeId() {
            var aid = new AOM.ArchetypeId(archetypeModel.getArchetypeId());

            var targetElement = $('#archetype-editor-id-panel');
            targetElement.empty();

            var context = {
                namespace: aid.data.namespace,
                context: aid.getContextString(),
                concept: aid.data.concept,
                version: aid.getVersionString()
            };
            GuiUtils.applyTemplate("util|colorizeArchetypeId", context, targetElement)
        }


        my.archetypeModel = archetypeModel;

        var targetElement = $('#archetype-editor-main-tabs-definition');
        my.Definition.show(archetypeModel, my.referenceModel, targetElement);

        loadTerminology();
        $('a[href="#archetype-editor-main-tabs-terminology"]').on('show.bs.tab', loadTerminology);
        loadDescription();
        $('a[href="#archetype-editor-main-tabs-description"]').on('show.bs.tab', loadDescription);
        loadDisplay();
        $('a[href="#archetype-editor-main-tabs-display"]').on('show.bs.tab', loadDisplay);

        var archetypeName = my.archetypeModel.getTermDefinitionText(my.archetypeModel.data.definition.node_id);
        document.title = archetypeName + ' - Archetype Editor';

        displayArchetypeId();

    };

//    var getBoostrapTableHeight = function (targetElement) {
//    	var height = targetElement.height();
//    	console.log("Table height: ", height + "px");
//      return height > 0 ? height : null;
//  	}

    my.addRmModule = function (module) {
        rmModules[module.name] = module;
    };

    my.getRmModule = function (moduleName) {
        return rmModules[moduleName];
    };

    /**
     * Opens a dialog that enables creation of new terms
     * @param {ArchetypeModel} archetypeModel
     * @param {function?} callback calback to call once the term is created. First callback parameter is the generated term_id
     */
    my.openAddNewTermDefinitionDialog = function (archetypeModel, callback) {
        var addNewTermContext = {
            id: GuiUtils.generateId()
        };

        GuiUtils.applyTemplate("dialog-terms|addNew", addNewTermContext, function (htmlString) {
            var content = $(htmlString);

            GuiUtils.openSimpleDialog(
                {
                    title: "Load archetype",
                    buttons: {"add": "Add term"},
                    content: content,
                    callback: function (content) {
                        var text = content.find('#' + addNewTermContext.id + "_text").val().trim();
                        var description = content.find('#' + addNewTermContext.id + "_description").val().trim();

                        if (text.length == 0) {
                            return; // do nothing
                        }
                        $('.nav-tabs a[href="#' + 'archetype-editor-main-tabs-definition' + '"]').tab('show');
                        var newTerminologyCode = archetypeModel.addNewTermDefinition("at", text, description);
                        if (callback) {
                            callback(newTerminologyCode);
                        }
                    }
                });
        });

    };

    my.openAddExistingTermsDialog = function (archetypeModel, context, callback) {
        GuiUtils.applyTemplate(
            "dialog-terms|addExistingTermsDialog",
            context, function (content) {
                content = $(content);
                GuiUtils.openSimpleDialog(
                    {
                        title: "Add existing terms from archetype",
                        buttons: {"add": "Add"},
                        content: content,
                        callback: function () {
                            var select = content.find('#selectExistingTerms');
                            var options = select.find(':selected');
                            if (options.length === 0) return;
                            var terms = [];
                            for (var i = 0; i < options.length; i++) {
                                var nodeId = $(options[i]).val();
                                terms.push(nodeId);
                            }
                            if (callback && terms.length) {
                                callback(terms);
                            }
                        }
                    });
            });
    };

    my.commitRepository = function () {
        GuiUtils.openSingleTextInputDialog({
            title: "Commit changes to repository",
            inputLabel: "Commit message",
            inputValue: "",
            callback: function (content) {
                var commitMessage = content.find("input").val().trim();
                if (commitMessage.length === 0) {
                    return "Commit message is required";
                }

                var commitJson = {
                    message: commitMessage
                };
                $.ajax({
                    type: "POST",
                    url: "rest/repo/commit",
                    data: JSON.stringify(commitJson),
                    contentType: "application/json; charset=utf-8",
                    dataType: "text"
                }).done(function (data) {
                    // reload list of archetypes
                    alert("Commit successful");
                }).fail(function (errMsg) {
                    alert("Error committing repository: " + errMsg.status + " " + errMsg.statusText);
                });
            }
        })
    };

    my.initialize = function () {


        my.referenceModel = new AOM.ReferenceModel();
        my.archetypeRepository = new AOM.ArchetypeRepository();

        var defRefModel = my.referenceModel.load();
        var defRepo = my.archetypeRepository.load();

        var defTemplates = GuiUtils.preloadTemplates([
                "util",
                "properties/constraint-common",
                "terminology/terms"
            ]);

        var defUnits = $.get("rest/support/units").done(function (data) {
            my.unitsModel = new AOM.UnitsModel(data);
        });

        return $.when(defRefModel, defRepo, defTemplates, defUnits).fail(function(jqXHR) {
            toastr.error(JSON.parse(jqXHR.responseText).message);
        });
    };

    return my;
}() );