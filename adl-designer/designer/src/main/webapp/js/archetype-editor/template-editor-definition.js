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
        TemplateEditor.Definition = function () {
            var my = {};


            /**
             * Specializes a given constraint, and updates the
             * @param {object} constraintData
             * @param {object} treeNode
             */
            function specializeConstraint(constraintData, treeNode) {

                var cons = constraintData.cons;
                var archetypeModel = AOM.ArchetypeModel.from(cons);
                var rmTypeHandler = ArchetypeEditor.getRmTypeHandler(cons.rm_type_name);
                if (rmTypeHandler) {
                    // specialize whole tree when using a custom rm type handler
                    archetypeModel.specializeConstraintSubTree(cons);
                } else {
                    archetypeModel.specializeConstraint(cons);
                }
                // did not work, so remove node_id from name
//            definitionTree.jstree.rename_node(definitionTreeNode, definitionTree.extractConstraintName(cons));
                constraintData.info.tree.styleNodes(treeNode.id, 1);
                //var isSelected = constraintData.info.tree.targetElement.jstree('is_selected', treeNode);
                //if (isSelected) {
                //    constraintData.info.propertiesPanel.show(constraintData);
                //}

            }


            function getCandidateArchetypesToAdd(cons) {

                function getCandidateArchetypesMatchingRmType(rmType) {
                    var result = [];
                    for (var i in TemplateEditor.archetypeRepository.infoList) {
                        var info = TemplateEditor.archetypeRepository.infoList[i];

                        if (TemplateEditor.referenceModel.isSubclass(rmType, info.rmType)) {
                            result.push(info);
                        }
                    }
                    return result;
                }

                function filterCandidateArchetypesForSlot(candidateArchetypes, slot) {
                    var predicate = AOM.mixin(slot).buildArchetypeMatcher(slot);
                    var result = [];
                    for (var i in candidateArchetypes) {
                        var candidate = candidateArchetypes[i];
                        if (predicate(candidate.archetypeId)) {
                            result.push(candidate);
                        }
                    }
                    return result;
                }

                var candidateArchetypes;
                if (AOM.mixin(cons).isAttribute()) {
                    var attributeParentRmType = cons[".parent"].rm_type_name;
                    var referenceType = TemplateEditor.referenceModel.getType(attributeParentRmType);
                    var attributeRmType = referenceType.attributes[cons.rm_attribute_name].type;
                    candidateArchetypes = getCandidateArchetypesMatchingRmType(attributeRmType);
                } else if (AOM.mixin(cons).isSlot()) {
                    candidateArchetypes = getCandidateArchetypesMatchingRmType(cons.rm_type_name);
                    candidateArchetypes = filterCandidateArchetypesForSlot(candidateArchetypes, cons);
                } else {
                    // archetypes can only be added on attributes or slots

                    return [];
                }

                return candidateArchetypes;
            }

            function openAddArchetypeDialog(targetCons, callback) {


                var templateModel = AOM.TemplateModel.from(targetCons);


                var candidateArchetypes = getCandidateArchetypesToAdd(targetCons);

                // no matching archetypes found
                if (candidateArchetypes.length === 0) {
                    toastr.info("There are no candidate archetypes for this slot.");
                    return;
                }

                var context = {
                    panel_id: GuiUtils.generateId(),
                    candidateArches: []
                };
                for (var i in candidateArchetypes) {
                    context.candidateArches.push(candidateArchetypes[i]);
                }


                GuiUtils.applyTemplate("template-editor|addArchetypeDialog", context, function (htmlString) {


                    var content = $(htmlString);

                    var archetypeIdSelect = content.find('#' + context.panel_id + '_archetype_id');
                    archetypeIdSelect.selectpicker({size: "10"});


                    GuiUtils.openSimpleDialog(
                        {
                            title: "Add Archetype",
                            buttons: {"create": "Add"},
                            content: content,
                            callback: function (content) {
                                var archetypeId = archetypeIdSelect.val();

                                TemplateEditor.archetypeRepository.loadArchetype(archetypeId, function (data) {
                                    var archetypeModel = new AOM.ArchetypeModel(data);
                                    var templateLanguages = templateModel.getArchetypeLanguageIntersection();
                                    var archetypeLanguages = archetypeModel.allLanguages();
                                    var joinedLanguages = AmUtils.intersectSet(AmUtils.listToSet(templateLanguages), AmUtils.listToSet(archetypeLanguages));
                                    if (AmUtils.keys(joinedLanguages).length == 0) {
                                        alert('Archetype does not have any common languages with current template. Template languages: ' + templateLanguages + ", archetype languages: " + archetypeLanguages);
                                        return;
                                    }

                                    var generatedCons = templateModel.addArchetype(targetCons, data);

                                    callback(generatedCons);
                                });
                            }
                        });
                });
            }

            function populateLanguageSelect(languageSelect, templateModel) {
                var lastVal = languageSelect.val();
                var lastValPresent = false;
                languageSelect.empty();
                var langs = templateModel.getArchetypeLanguageIntersection();
                for (var i in langs) {
                    var lang = langs[i];
                    languageSelect.append($('<option>').attr('value', lang).text(lang));
                    if (lang == lastVal) {
                        lastValPresent = true;
                    }
                }
                if (lastValPresent) {
                    languageSelect.val(lastVal);
                } else {
                    languageSelect.val(langs[0]);
                }

            }


            /**
             * @param targetElement
             * @constructor
             */
            my.DefinitionPropertiesPanel = function (targetElement) {
                targetElement.empty();
                var self = this;

                var stage, templateHandler, context, constraintHandler;

                function addPropertiesPanelToStage(stage, context, handler, targetElement) {
                    stage.propertiesPanel = {
                        redraw: function () {
                            handler.updateContext(stage, context, targetElement);
                            targetElement.empty();
                            handler.show(stage, context, targetElement);
                        }
                    };
                    return stage;
                }

                function createEmptyStage() {
                    var stage = {};
                    stage.archetypeEditor = ArchetypeEditor;
                    return stage;
                }


                function clearConstraints(targetElement) {
                    if (templateHandler && templateHandler.hide) {
                        templateHandler.hide(stage, context, targetElement);
                        templateHandler = undefined;
                        constraintHandler = undefined;
                        stage = undefined;
                        context = undefined;
                    }
                }

                self.clear = function () {
                    clearConstraints(targetElement);
                    targetElement.empty();
                };


                function showConstraintProperties(constraintData, targetElement) {

                    function disableIfSpecialized() {
                        // add global handlers
                        if (specialized) {
                            $('.splabel').text("Specialized");
                        }
                        /*   if (!specialized) {
                         $('.minMaxF').editable('option', 'disabled', true);
                         var dataElements = targetElement.find(".data");

                         var panel = targetElement.find("#ConstraintPanel");
                         dataElements.css('cursor', 'not-allowed');

                         panel.css('cursor', 'not-allowed');
                         panel.css('overflow', 'auto');

                         dataElements.prop("disabled", !specialized);
                         saveButton.prop('disabled', !specialized);
                         }
                         var archetypeOnlyElements = targetElement.find(".archetype-only");
                         archetypeOnlyElements.prop("disabled", true);*/
                    }

                    clearConstraints(targetElement);
                    var cons = constraintData.cons;
                    if (!cons) return;
                    var archetypeModel = AOM.ArchetypeModel.from(cons);

                    var parentCons = archetypeModel.getParentConstraint(cons);
                    var specialized = archetypeModel.isSpecialized(cons);

//                var topDiv = $('<div class="container-fluid">');
//                targetElement.append(topDiv);

                    constraintHandler = ArchetypeEditor.getRmTypeHandler('main', '@common');
                    templateHandler = constraintHandler;

                    var customDiv = $('<div class="container-fluid horizontal-stretch" id="ConstraintPanel">');
                    targetElement.append(customDiv);

                    stage = createEmptyStage();
                    stage.archetypeModel = archetypeModel;
                    stage.readOnly = !specialized;
                    stage.constraintHandler = constraintHandler;
                    stage.templateModel = AOM.TemplateModel.from(cons);


                    context = templateHandler.createContext(stage, cons, parentCons);
                    addPropertiesPanelToStage(stage, context, templateHandler, customDiv);
                    templateHandler.show(stage, context, customDiv);

                    var errorsDiv = $('<div class="errors">');
                    targetElement.append(errorsDiv);


                    var footerDiv = $('<div class="footer">');
                    targetElement.append(footerDiv);

                    var footerContext = {
                        footer_id: GuiUtils.generateId(),
                        specialized: specialized
                    };

                    GuiUtils.applyTemplate("properties/constraint-common|footer", footerContext, footerDiv);

                    /* if (!specialized) {
                     var specializeButton = footerDiv.find('#' + footerContext.footer_id + '_specialize');
                     specializeButton.click(function () {
                     constraintData.specializeCallback();
                     });
                     }*/

                    var saveButton = footerDiv.find('#' + footerContext.footer_id + '_save');

                    //disableIfSpecialized();
                    //setTimeout(disableIfSpecialized, 100);

                    disableIfSpecialized();
                    saveButton.click(function () {

                        console.log("Clicked");
                        /* if (!specialized) {

                         // var specializeButton = footerDiv.find('#' + footerContext.footer_id + '_specialize');
                         // specializeButton.click(function () {
                         constraintData.specializeCallback();

                         //    specializeConstraint(constraintData, self.current.treeNode);
                         // });
                         }*/
                        var errors = new AmUtils.Errors();

                        templateHandler.updateContext(stage, context, targetElement);

                        templateHandler.validate(stage, context, errors);
                        errorsDiv.empty();
                        if (errors.getErrors().length > 0) {
                            var errorsContext = {errors: errors.getErrors()};
                            GuiUtils.applyTemplate("properties/constraint-common|errors", errorsContext, errorsDiv);
                            console.error("There were validation errors:", errors.getErrors());
                            errors.getErrors().forEach(function (e) {
                                toastr.error(e.error, e.location);
                            });
                            return;
                        }
//                    var context2=context;
                        constraintData.specializeCallback();
                        console.debug("save changes from: ", cons);

                        templateHandler.updateConstraint(stage, context, cons, errors);
                        console.debug("save changes to:   ", cons);
                        specialized = archetypeModel.isSpecialized(cons);
                        archetypeModel.enrichReplacementConstraint(cons);
                        constraintData.saveCallback();
                        disableIfSpecialized();
                        //$('#' + constraintData.info.tree.current.treeNode.id).addClass('specialized');
                    });

                } // showConstraintProperties

                function showAnnotations(constraintData, targetElement) {
                    var archetypeModel = AOM.ArchetypeModel.from(constraintData.cons);
                    var context = {
                        panel_id: GuiUtils.generateId(),
                        lang: archetypeModel.defaultLanguage
                    };
                    GuiUtils.applyTemplate("definition|annotations", context, function (html) {

                        function populateLanguageSelect() {
                            languageSelect.empty();
                            var allLanguages = archetypeModel.allLanguages();
                            for (var i in allLanguages) {
                                var option = $("<option>").attr('value', allLanguages[i]).text(allLanguages[i]);
                                languageSelect.append(option);
                            }
                        }

                        function showLanguageAnnotations() {
                            var lang = languageSelect.val();
                            var allAnnotations = archetypeModel.getAnnotationsForNode(constraintData.cons);
                            annotationsDiv.empty();
                            var annotationsMap = new GuiUtils.TableMap(allAnnotations[lang], annotationsDiv);

                            annotationsMap.onBlur(function () {
                                allAnnotations[lang] = annotationsMap.getAsMap();
                                archetypeModel.updateAnnotationsForNode(constraintData.cons, allAnnotations);
                            });
                        }

                        html = $(html);

                        var languageSelect = html.find('#' + context.panel_id + '_language');
                        var annotationsDiv = html.find('#' + context.panel_id + '_annotations');


                        populateLanguageSelect();
                        showLanguageAnnotations();
                        languageSelect.on('change', showLanguageAnnotations);

                        targetElement.append(html);
                    })
                }

                self.show = function (constraintData) {
                    self.clear();

                    if (!constraintData.cons) {
                        return;
                    }

                    var context = {
                        panel_id: GuiUtils.generateId()
                    };
                    GuiUtils.applyTemplate('definition|constraintsPanel', context, function (html) {
                        html = $(html);
                        var constraintsTab = html.find('#' + context.panel_id + '_constraints');
                        var annotationsTab = html.find('#' + context.panel_id + '_annotations');
                        showConstraintProperties(constraintData, constraintsTab);
                        showAnnotations(constraintData, annotationsTab);

                        targetElement.append(html);
                    });
                }

            };

            my.DefinitionTree = function (templateModel, targetElement, info) {
                var self = this;
                var treeIdPrefix = "dt_" + GuiUtils.generateId() + "_";
                var nextTreeIdIndex = 0;
                var currentLanguage;

                var treeData = {};

                function nextTreeId() {
                    return treeIdPrefix + (nextTreeIdIndex++).toString();
                }

                self.extractConstraintName = function (cons, language) {
                    var label = templateModel.getConstraintLabel(cons, language);
                    var deltas = [];

                    if (!AOM.mixin(cons).isConstraint()) {
                        return label;
                    }

                    var archetypeModel = AOM.ArchetypeModel.from(cons);
                    var parentCons = archetypeModel.getParentConstraint(cons);
                    if (!parentCons) {
                        return label;
                    }

                    var rmTypeHandler = ArchetypeEditor.getRmTypeHandler(cons);
                    if (rmTypeHandler) {
                        var stage = {
                            archetypeEditor: ArchetypeEditor,
                            templateEditor: TemplateEditor,
                            archetypeModel: archetypeModel,
                            templateModel: AOM.TemplateModel.from(cons)

                        };
                        var context = rmTypeHandler.createContext(stage, cons, parentCons);

                    }
                    if (!archetypeModel.isSpecialized(cons)) return label;

                    if (cons.occurrences && cons.occurrences.upper === 0) {
                        return label;
                    }


                    var term = archetypeModel.getTermDefinitionText(cons.node_id, language);
                    var parentTerm = archetypeModel.parentArchetypeModel.getTermDefinitionText(parentCons.node_id, language);
                    if (context != undefined) {
                        if (context.values)
                            if (context.values[0].rmType === "DV_CODED_TEXT") {
                                if (context.values[0].rmType != context.parent.values[0].rmType) {
                                    deltas.push(" Coded Text ");
                                }
                                else if (context.values[0].context.defining_code.value_set_code != context.values[0].context.defining_code.parent_value_set_code) {
                                    deltas.push(" Data set values changed ")
                                }
                            }
                    }


                    if (term !== parentTerm) {
                        deltas.push("NAME: from '" + parentTerm + '"');
                    }
                    if (AmInterval.toString(cons.occurrences) !== AmInterval.toString(parentCons.occurrences)) {
                        deltas.push("occ: " + AmInterval.toString(parentCons.occurrences) + " to " + AmInterval.toString(cons.occurrences))
                    }
                    if (deltas.length > 0) {
                        label = label + " <-- " + deltas.join(", ");
                    }

                    return label;
                };


                self.setLanguage = function (language) {

                    function renameSubtree(node) {
                        var nodeData = treeData[node.id];
                        var cons = nodeData.cons || nodeData.attr;
                        var newName = self.extractConstraintName(cons, language);
                        info.tree.targetElement.jstree('rename_node', node, newName);
                        if (node.children) {
                            for (var i in node.children) {
                                var child = info.tree.targetElement.jstree('get_node', node.children[i]);
                                renameSubtree(child)
                            }
                        }
                    }

                    var treeRoot = info.tree.targetElement.jstree('get_node', '#');
                    var node = info.tree.targetElement.jstree('get_node', treeRoot.children[0]);
                    renameSubtree(node);

                    info.tree.targetElement.jstree('redraw', true);

                    currentLanguage = language;
                };


                function buildTreeJson(cons, showStructure) {

                    function createJson(target, cons) {
                        if (cons["@type"] === "C_ATTRIBUTE") {
                            createAttrJson(target, cons);
                        } else {
                            createConsJson(target, cons);
                        }
                    }

                    function createConsJson(target, cons) {
                        var rmType = info.referenceModel.getType(cons.rm_type_name);
                        if (!showStructure && rmType && rmType.display.transparent) {
                            createChildrenJson(target, cons);
                            return;
                        }
                        var consJson = {
                            id: nextTreeId()
                        };
                        treeData[consJson.id] = {
                            cons: cons
                        };
                        if (!consJson.text) {
                            consJson.text = self.extractConstraintName(cons, currentLanguage);
                        }
                        if (cons["@type"] === "ARCHETYPE_SLOT" || !ArchetypeEditor.getRmTypeHandler(cons)) {
                            consJson.children = [];
                            createChildrenJson(consJson.children, cons);
                        }
                        target.push(consJson);
                    }

                    function createAttrJson(target, cons) {
                        var rmType = info.referenceModel.getType(cons[".parent"].rm_type_name);
                        if (!showStructure && rmType) {
                            var rmAttribute = rmType.attributes[cons.rm_attribute_name];
                            if (rmAttribute && rmAttribute.display.transparent) {
                                createChildrenJson(target, cons);
                                return;
                            }
                        }

                        var attrJson = {
                            id: nextTreeId()
                        };
                        treeData[attrJson.id] = {
                            attr: cons
                        };
                        attrJson.text = cons.rm_attribute_name;
                        attrJson.children = [];
                        createChildrenJson(attrJson.children, cons);
                        target.push(attrJson);
                    }

                    function createChildrenJson(target, cons) {
                        var children = templateModel.getConstraintChildren(cons);
                        for (var i in children) {
                            var child = children[i];
                            createJson(target, child);
                        }
                    }


                    var resultTarget = [];
                    createJson(resultTarget, cons);
                    return resultTarget[0];

                }

                function styleNodeJson(treeNodeJson) {

                    var cons = treeData[treeNodeJson.id].cons || treeData[treeNodeJson.id].attr;

                    var isAttr = !treeData[treeNodeJson.id].cons;
                    var archetypeModel = AOM.ArchetypeModel.from(cons);

                    var isSpecialized = archetypeModel.isSpecialized(cons);

                    if (cons && cons.rm_type_name) {
                        var rmType;
                        if (cons.rm_type_name === "ELEMENT") {
                            if (!cons.attributes || cons.attributes.length == 0) {
                                rmType = ""
                            }
                            else {
                                var attr = cons.attributes[0];
                                if (!attr.children || attr.children.length == 0) {
                                    rmType = ""
                                } else if (attr.children.length == 1) {
                                    rmType = attr.children[0].rm_type_name;
                                } else {
                                    rmType = "ELEMENT"; // no specific icon for choice
                                }
                            }
                        }
                        if (!rmType) rmType = cons.rm_type_name;
                        treeNodeJson.icon = "openehr-rm-icon " + rmType.toLowerCase();
                        if (cons["@type"] === "ARCHETYPE_SLOT") {
                            treeNodeJson.icon += " slot";
                        }
                    }
                    else {
                        if (templateModel.canAddArchetype(cons))
                            treeNodeJson.icon = "openehr-rm-icon archetype_slot";
                    }
                    treeNodeJson.a_attr = treeNodeJson.a_attr || {};
                    treeNodeJson.a_attr.class = 'definition-tree-node ' + (isAttr ? 'attribute' : 'constraint');
                    if (isSpecialized) {
                        treeNodeJson.a_attr.class += ' specialized';

                        if (isProhibited(cons)) {
                            treeNodeJson.a_attr.class += ' specialized prohibited';
                        }
                        else {
                            treeNodeJson.a_attr.class -= "prohibited";
                        }
                    }
                    if (cons.node_id) {
                        if (cons.node_id.indexOf('.') != -1)
                            treeNodeJson.a_attr.class += ' specialized'
                    }

                    if (cons) {
                        treeNodeJson.text = self.extractConstraintName(cons, currentLanguage);
                    }
                    if (typeof cons.is_multiple != 'undefined' && typeof treeNodeJson.icon == 'undefined')
                        treeNodeJson.icon = "openehr-rm-icon object_ref";
                }


                /**
                 * Restyles definition nodes to give them proper style.
                 *
                 * @param {string} rootTreeNodeId Id of the node from which to style.
                 * @param {number?} depth Limit styling to a number of levels below the node:
                 *      0=this node only, 1=immediate children...
                 *      If not defined, style the entire subtree
                 */
                self.styleNodes = function (rootTreeNodeId, depth) {

                    function styleNodes(treeNodeId, depth) {
                        var treeNode = self.targetElement.jstree('get_node', treeNodeId);
                        styleNodeJson(treeNode);

                        if (depth === undefined || depth > 0) {
                            var childDepth = depth === undefined ? undefined : depth - 1;
                            for (var i in treeNode.children) {
                                styleNodes(treeNode.children[i], childDepth);
                            }
                        }

                    }

                    styleNodes(rootTreeNodeId, depth);
                    self.targetElement.jstree('redraw', true);
                };

                self.renameConstraint = function () {
                    var targetCons = self.current.data.cons;

                    if (!targetCons || !targetCons.node_id) {
                        return;
                    }
                    var archetypeModel = AOM.ArchetypeModel.from(targetCons);
                    if (!archetypeModel.isSpecialized(targetCons)) {
                        return;
                    }

                    var term = archetypeModel.getTermDefinition(targetCons.node_id, currentLanguage);
                    var context = {
                        panel_id: GuiUtils.generateId(),
                        language: currentLanguage

                    };
                    GuiUtils.applyTemplate("template-editor|renameConstraintDialog", context, function (htmlString) {

                        var content = $(htmlString);

                        var textInput = content.find('#' + context.panel_id + '_text');
                        textInput.val(term.text);
                        var descriptionInput = content.find('#' + context.panel_id + '_description');
                        descriptionInput.val(term.description);
                        var commentInput = content.find('#' + context.panel_id + '_comment');
                        commentInput.val(term.comment);


                        GuiUtils.openSimpleDialog(
                            {
                                title: "Rename constraint",
                                buttons: {"rename": "Rename"},
                                content: content,
                                callback: function (content) {
                                    var text = textInput.val();
                                    var description = descriptionInput.val();
                                    var comment = commentInput.val();
                                    if (comment.length === 0) {
                                        comment = undefined;
                                    }
                                    if (text.length == 0) {
                                        return "text is required"
                                    }
                                    if (description.length == 0) {
                                        return "description is required"
                                    }

                                    archetypeModel.setTermDefinition(targetCons.node_id, currentLanguage, text, description, comment);
                                    info.tree.styleNodes(self.current.treeNode.id, 1);

                                }
                            });
                    });

                };


                self.addArchetype = function () {


                    var targetCons = self.current.data.cons || self.current.data.attr;

                    var templateModel = AOM.TemplateModel.from(targetCons);
                    if (!templateModel.canAddArchetype(targetCons)) {
                        return;
                    }
                    openAddArchetypeDialog(targetCons, function (newCons) {

                        addConstraintTreeNode(self.current.treeNode, newCons);
                        populateLanguageSelect(info.toolbar.languageSelect, templateModel);
                    });
                };

                self.removeConstraint = function () {

                    function getJsTreeNodeSiblingIndex(treeNode) {
                        var parentNode = info.tree.targetElement.jstree('get_node', treeNode.parent);
                        for (var i in parentNode.children) {
                            var nodeId = parentNode.children[i];
                            if (nodeId === treeNode.id) {
                                return i;
                            }
                        }
                        return -1;
                    }


                    if (!self.current) return;
                    var cons = self.current.data.cons || self.current.data.attr;

                    var archetypeModel = AOM.ArchetypeModel.from(cons);
                    if (!archetypeModel.isSpecialized(cons)) return;
                    // do not remove top level node
                    if (!templateModel.getConstraintParent(cons)) return;
                    var newCons = templateModel.removeConstraint(cons);

                    if (newCons) {
                        if (newCons == cons) return; // no change
                        var nodeIndex = getJsTreeNodeSiblingIndex(self.current.treeNode);
                        var parentNode = info.tree.targetElement.jstree('get_node', self.current.treeNode.parent);

                        info.tree.targetElement.jstree('delete_node', self.current.treeNode);
                        var newNodeId = addConstraintTreeNode(parentNode, newCons, nodeIndex);
                        info.tree.targetElement.jstree('select_node', newNodeId);
                    } else {
                        info.tree.targetElement.jstree('delete_node', self.current.treeNode);
                        populateLanguageSelect(info.toolbar.languageSelect, templateModel);
                    }
                };


                function addConstraintTreeNode(parentNode, childCons, pos) {
                    var childJson = buildTreeJson(childCons);
                    var newTreeNodeId = self.targetElement.jstree('create_node', parentNode, childJson, pos);
                    self.styleNodes(parentNode.id);
                    self.targetElement.jstree("deselect_all");
                    self.targetElement.jstree('select_node', newTreeNodeId);
                    $('#' + newTreeNodeId).children('a').focus();
                    return newTreeNodeId;
                }


                function styleJson(list) {
                    for (var i in list) {
                        styleNodeJson(list[i]);
                        if (list[i].children) {
                            styleJson(list[i].children);
                        }
                    }
                }

                self.info = info;

                self.SpecializeAndProhibit = function (constraintData, event) {

                    var data = treeData[self.current.treeNode.id];
//                var archetypeModel = AOM.ArchetypeModel.from(data.cons);
                    if (event == 'prohibit') {
                        data.cons.occurrences = AmInterval.parseContainedString("[0..0]", "MULTIPLICITY_INTERVAL");
                        specializeConstraint(constraintData, self.current.treeNode);
                    }

                    else if (event == 'unprohibit') {
                        var archetypeModel = AOM.ArchetypeModel.from(data.cons);
                        var parentCons = archetypeModel.getParentConstraint(data.cons);
                        data.cons.occurrences = AmUtils.clone(parentCons.occurrences);
                    }


                    info.propertiesPanel.show(constraintData);
                    info.tree.filterProhibited(info.toolbar.showProhibited.prop('checked'));
                    styleNodeJson(self.current.treeNode);
                    constraintData.specializeCallback();
                };
                self.SpecializeNode = function (constraintData) {
                    constraintData.specializeCallback();
                };
                var gstate = false;
                self.createTree = function (showStructure, callback) {
                    treeData = {};

                    var jsonTreeRoot = buildTreeJson(templateModel.getRootArchetypeModel().data.definition, showStructure);
                    var jsonTreeTarget = [jsonTreeRoot];
                    styleJson(jsonTreeTarget);
                    targetElement.empty();
                    targetElement.jstree("destroy");
                    targetElement.jstree(
                        {
                            'core': {
                                'data': jsonTreeTarget,
                                'multiple': false,
                                'check_callback': function (operation, node, node_parent, node_position, more) {

                                    if (operation === 'move_node') {
                                        try {
                                            var cons = treeData[node.id].cons;
                                            var anchorCons = treeData[node_parent.children[node_position]].cons;
                                        }
                                        catch (err) {

                                            return false;
                                        }
                                        if (typeof cons != 'undefined' && typeof anchorCons != 'undefined') {

                                            return templateModel.canMoveBefore(cons, anchorCons);
                                        }
                                        return false;

                                    }
                                    else
                                        return true;

                                }

                            },
                            "plugins": [
                                "contextmenu", "dnd", "search",
                                "state", "types", "wholerow"
                            ],
                            "search": {
                                "case_insensitive": true,
                                "show_only_matches": true
                            },
                            "contextmenu": {
                                "items": customMenu
                            },

                        })
                        .on('loaded.jstree', function () {
                            $(".search-input").keyup(function () {
                                var searchString = $(this).val();
                                $('.treejsc').jstree('search', searchString);
                            });
                            targetElement.jstree('open_all');
                            var superRootNode = targetElement.jstree('get_node', '#');
                            targetElement.jstree('select_node', superRootNode.children[0]);
                            if (callback) {
                                callback();
                            }


                        }).on('select_node.jstree', function (event, treeEvent) {


                        var data = treeData[treeEvent.node.id];
                        self.current = {
                            treeNode: treeEvent.node,
                            data: data,
                            constraintData: {
                                info: info,
                                cons: data.cons
                            }
                        };

                        self.current.constraintData.specializeCallback = function () {
                            specializeConstraint(self.current.constraintData, treeEvent.node);
                        };
                        self.current.constraintData.saveCallback = function () {
                            info.tree.styleNodes(treeEvent.node.id);
                            info.tree.styleNodes(treeEvent.node.id, 1);
                            var isSelected = info.tree.targetElement.jstree('is_selected', treeEvent.node);
                            if (isSelected) {
                                info.propertiesPanel.show(self.current.constraintData);
                            }
                        };

                        if (oldnode != treeEvent.node.id)
                            gstate = false;

                        oldnode = treeEvent.node.id;
                        if (gstate) {
                            createToolbar(treeEvent, true, self.current.constraintData);
                            gstate = false;
                        } else {
                            createToolbar(treeEvent, false, self.current.constraintData);
                            gstate = true;
                        }

                        info.propertiesPanel.show(self.current.constraintData);

                    })
                        .on("deselect_all.jstree", function (e, treeEvent) {

                            $('.openC').remove();
                            $('.movertb').remove();

                        }).on("move_node.jstree", function (node, parent) {


                        var treeNode = self.targetElement.jstree('get_node', parent.old_parent);
                        var cons = treeData[treeNode.children[parent["position"]]].cons;
                        var anchorCons = treeData[treeNode.children[parent["old_position"]]].cons;
                        if (typeof cons != 'undefined' && typeof anchorCons != 'undefined') {

                            templateModel.moveBefore(cons, anchorCons);
                        }

                    })

                    var oldnode;
                    var ctr = 0;

                    function createToolbar(treeEvent, state, constraintData) {

                        function createCallback(targetElement) {
                            return function (html) {
                                html = $(html);
                                targetElement.append(html);
                                html.find("#" + context.panel_id + "_reset").click(info.tree.removeConstraint);
                                html.find("#" + context.panel_id + "_addArchetype").click(info.tree.addArchetype);
                                html.find("#" + context.panel_id + "_rename").click(function () {
                                    specializeConstraint(constraintData, self.current.treeNode);
                                    info.tree.renameConstraint();
                                    createToolbar(treeEvent, true, constraintData);
                                });
                                html.find("#" + context.panel_id + "_clone").click(function () {
                                    templateModel.cloneConstraint(cons);
                                    self.createTree();
                                    createToolbar(treeEvent, true, constraintData);
                                });
                                if (prohibitFlag)
                                    html.find("#" + context.panel_id + "_unprohibit").click(function () {
                                        self.SpecializeAndProhibit(constraintData, 'unprohibit');
                                        styleNodeJson(treeEvent.node);
                                        createToolbar(treeEvent, true, constraintData);
                                    })
                                else
                                    html.find("#" + context.panel_id + "_prohibit").click(function () {
                                        self.SpecializeAndProhibit(constraintData, 'prohibit');
                                        styleNodeJson(treeEvent.node);
                                        createToolbar(treeEvent, true, constraintData);
                                    });
                                if (archetypeName)
                                    html.find("#" + context.panel_id + "_editArchetype").click(function () {
                                        if (cons) {
                                            var archetypeModelRoot = AOM.ArchetypeModel.from(cons);
                                            var archetypeId = archetypeModelRoot.parentArchetypeModel.getArchetypeId();
                                            window.open('archetype-editor.html?archetypeId=' + encodeURIComponent(archetypeId), '_blank');
                                        }
                                    })
                                if (context.createArchetype)
                                    html.find("#" + context.panel_id + "_createArchetype").click(function () {
                                        window.open('archetype-editor.html?action=new');
                                    })
                            }
                        }

                        if (oldnode != treeEvent.node.id)

                            ctr = 0;
                        if ($('#' + treeEvent.node.id + '_anchor')[0].innerHTML.indexOf('movertb') != -1)
                            return;
                        oldnode = treeEvent.node.id;

                        var data = treeData[treeEvent.node.id];
                        var cons = data.cons || data.attr;
                        var templateModel = AOM.TemplateModel.from(cons);
                        var archetypeModel = AOM.ArchetypeModel.from(cons);


                        if ($('#' + treeEvent.node.id + '_anchor')[0].innerHTML.indexOf('openC') === -1) {
                            $('#' + treeEvent.node.id + '_anchor').append(
                                "<span class='openC'><span class='fa fa-chevron-left'></span></span>")
                        }


                        var isArchetype = false;
                        if (data.cons) {
                            var renameFlag = AOM.ArchetypeModel.from(data.cons).getTermDefinition(data.cons.node_id, currentLanguage);
                            if (renameFlag)
                                var archetypeName = renameFlag.text;
                            isArchetype = typeof data.cons['.templateArchetypeRoot'] != 'undefined';
                        }
                        if (cons.occurrences) {
                            if (cons.occurrences.lower === 0 && cons.occurrences.upper === 0)
                                var prohibitFlag = true;
                        }
                        else
                            var prohibitFlag = false;


                        var context = {
                            panel_id: GuiUtils.generateId(),
                            addArchetype: templateModel.canAddArchetype(cons),
                            reset: archetypeModel.isSpecialized(cons),
                            archetypeName: "'" + archetypeName + "'",
                            archetypeHead: !!cons[".templateArchetypeRoot"],
                            rename: typeof renameFlag !== 'undefined',
                            clone: templateModel.canCloneConstraint(cons),
                            prohibit: !prohibitFlag && archetypeName,
                            unprohibit: prohibitFlag && archetypeName,
                            editArchetype: isArchetype,
                            createArchetype: templateModel.canAddArchetype(cons),
                            cssClass: 'btn-xs'
                        };
                        if (cons['@type'] === 'C_ATTRIBUTE') {
                            context.archetypeHead = true;
                            context.archetypeName = '';
                        }
                        /*   if (!cons['is_multiple'] && cons.children) {
                         context.addArchetype = false;
                         context.createArchetype = false;
                         context.archetypeHead = false;
                         }
                         */
                        var chevronShown = false;
                        for (var prop in context) {
                            if (typeof(context[prop]) === 'boolean') {
                                if (context[prop] && prop != 'archetypeHead') {
                                    chevronShown = true;
                                    break;
                                }
                            }
                        }
                        if (state)
                            $('.openC')[0].innerHTML = ' <span class="fa fa-chevron-right"></span>';
                        else
                            $('.openC')[0].innerHTML = ' <span class="fa fa-chevron-left"></span>';

                        if (!chevronShown)
                            $('.openC')[0].innerHTML = '';
                        if (!state) {
                            $('.movertb').remove();
                        }
                        else {

                            GuiUtils.applyTemplate("template-editor|inlineToolbar", context, createCallback($('#' + treeEvent.node.id + '_anchor')));
                        }
                        context.cssClass = '';
                        context.panel_id = GuiUtils.generateId();
                        $('#topToolbar').empty();
                        GuiUtils.applyTemplate("template-editor|topToolbar", context, createCallback($('#topToolbar')));
                    }

                    self.jstree = targetElement.jstree(true);
                    self.targetElement = targetElement;
                    function customMenu(node) {
                        // The default set of all items\

                        var targetCons = self.current.data.cons || self.current.data.attr;
                        if (targetCons['@type'] !== 'C_ATTRIBUTE') {
                            var archetypeModelTerm = AOM.ArchetypeModel.from(targetCons).getTermDefinition(targetCons.node_id);
                            if (archetypeModelTerm)
                                var name = "'" + archetypeModelTerm.text + "'";
                            if (typeof self.current.data.cons['.templateArchetypeRoot'] == 'undefined')
                                name = '';
                        }

                        var items = {
                            addArchetype: { // The "Add archetype" menu item
                                label: "Add archetype",
                                action: function () {
                                    info.tree.addArchetype()
                                },
                                icon: 'glyphicon glyphicon-plus'
                            },
                            deleteItem: { // The "delete" menu item
                                label: "Delete " + name,
                                action: function () {
                                    info.tree.removeConstraint();
                                },
                                icon: 'glyphicon glyphicon-remove redicon'
                            },
                            renameItem: { // The "Rename menu" item
                                label: "Rename " + name,
                                action: function () {
                                    specializeConstraint(self.current.constraintData, self.current.treeNode)
                                    styleNodeJson(node);
                                    info.tree.renameConstraint();
                                },
                                icon: 'glyphicon glyphicon-edit'

                            },
                            prohibitItem: {
                                label: "Zero occurrence",
                                action: function () {
                                    self.SpecializeAndProhibit(self.current.constraintData, 'prohibit');
                                    styleNodeJson(node);

                                },
                                icon: 'glyphicon glyphicon-eye-close'
                            },
                            cloneItem: { // The "Clone" menu item
                                label: "Clone",
                                "separator_before": true,
                                action: function () {
                                    var temp = templateModel.cloneConstraint(treeData[node.id].cons);
                                    if (temp[".clone"])
                                        self.createTree();
                                },
                                icon: 'glyphicon glyphicon-duplicate'

                            }
                        };


                        var templateModel = AOM.TemplateModel.from(targetCons);
                        if (!targetCons['.templateArchetypeRoot'])
                            delete items.deleteItem;
                        if (!templateModel.canAddArchetype(targetCons)) {
                            delete items["addArchetype"];
                        }
                        if (targetCons['@type'] !== 'C_ATTRIBUTE') {
                            if (!templateModel.canCloneConstraint(treeData[node.id].cons))
                                delete items['cloneItem'];
                            if (treeData[node.id].cons.occurrences)
                                if (treeData[node.id].cons.occurrences.lower === 0 && treeData[node.id].cons.occurrences.upper === 0) {
                                    items["prohibitItem"] = { //Changing the "Add archetype" button
                                        label: "Default occurrence",
                                        action: function () {
                                            self.SpecializeAndProhibit(node, 'unprohibit');
                                            styleNodeJson(node);
                                        },
                                        icon: 'glyphicon glyphicon-eye-open'
                                    }

                                }
                        }
                        else {
                            delete items.renameItem;
                            delete items.cloneItem;
                            delete items.prohibitItem;


                            /*  if (typeof targetCons['is_multiple'] != 'undefined') {

                             items.deleteElement = {
                             label: "Delete",
                             action: function () {
                             info.tree.removeConstraint();
                             },
                             icon: 'glyphicon glyphicon-remove'
                             }
                             }*/
                            if (templateModel.canAddArchetype(targetCons))
                                items.CreateArchetype = {
                                    label: "Create new archetype",
                                    action: function () {
                                        window.open('archetype-editor.html?action=new');
                                    },
                                    icon: 'glyphicon glyphicon-file'
                                }


                        }

                        if (!node.id)
                            delete items.renameItem;

                        return items;
                    }

                };


                function isProhibited(cons) {
                    if (!cons) return false;
                    var mixin = AOM.mixin(cons);
                    if (mixin.isAttribute()) {
                        return cons.existence && cons.existence.lower === 0;
                    } else {
                        return cons.occurrences && cons.occurrences.upper === 0
                    }
                }

                self.filterProhibited = function (status) {
                    status = info.toolbar.showProhibited.prop('checked');
                    var ProhibitedIDs = [];
                    var instance = $('.treejsc').jstree(true);


                    for (var node in treeData) {
                        if (treeData[node] && isProhibited(treeData[node].cons || treeData[node].attr)) {
                            ProhibitedIDs.push(node);
                        }
                    }
                    for (var i = 0; i < ProhibitedIDs.length; i++) {
                        if (status)
                            instance.show_node(ProhibitedIDs[i]);
                        else
                            instance.hide_node(ProhibitedIDs[i]);
                    }
                }


                self.changeShowStructure = function (showStructure) {

                    function findTreeNode(cons) {
                        function findInSubtree(treeNodeId) {
                            var actualCons = treeData[treeNodeId].cons || treeData[treeNodeId].attr;
                            if (actualCons === cons) return treeNodeId;
                            var treeNode = self.targetElement.jstree('get_node', treeNodeId);
                            for (var i in treeNode.children) {
                                var d = findInSubtree(treeNode.children[i]);
                                if (d) return d;
                            }
                            return null;
                        }

                        var treeRoot = info.tree.targetElement.jstree('get_node', '#');
//                    var node = info.tree.targetElement.jstree('get_node', treeRoot.children[0]);
                        return findInSubtree(treeRoot.children[0]);
                    }

                    var oldCurrentCons = self.current && (self.current.data.cons || self.current.data.attr);
                    self.createTree(showStructure, function () {
                        while (oldCurrentCons) {
                            var newTreeNodeId = findTreeNode(oldCurrentCons);
                            if (newTreeNodeId) {
                                info.tree.targetElement.jstree('select_node', newTreeNodeId);
                                break;
                            }
                            oldCurrentCons = oldCurrentCons[".parent"];
                        }
                    });
                };

                currentLanguage = templateModel.getRootArchetypeModel().defaultLanguage;

                self.createTree();

            };

            my.show = function (templateModel, referenceModel, targetElement) {
                targetElement.empty();
                var context = {
                    panel_id: GuiUtils.generateId()
                };


                GuiUtils.applyTemplate("template-editor|definition", context, function (html) {
                    html = $(html);

                    var info = {
                        referenceModel: referenceModel,
                        toolbar: {
                            languageSelect: html.find('#' + context.panel_id + '_language'),
                            editArchetype: html.find('#' + context.panel_id + '_editArchetype'),
                            renameConstraint: html.find('#' + context.panel_id + '_renameConstraint'),
                            addArchetype: html.find('#' + context.panel_id + '_addArchetype'),
                            removeConstraint: html.find('#' + context.panel_id + '_removeConstraint'),
                            showStructure: html.find('#' + context.panel_id + '_structure'),
                            showProhibited: html.find('#' + context.panel_id + '_filterProhibited'),
                            exportToOpt14: html.find('#' + context.panel_id + '_exportToOpt14')
                        }
                    };
                    var definitionPropertiesElement = html.find('#' + context.panel_id + '_constraints_panel');
                    info.propertiesPanel = new my.DefinitionPropertiesPanel(definitionPropertiesElement);

                    var definitionTreeElement = html.find('#' + context.panel_id + '_tree');
                    info.tree = new my.DefinitionTree(templateModel, definitionTreeElement, info);


                    info.toolbar.languageSelect.change(function () {
                        info.tree.setLanguage(info.toolbar.languageSelect.val())
                    });
                    populateLanguageSelect(info.toolbar.languageSelect, templateModel);

                    info.toolbar.editArchetype.on('click', function () {
                        if (info.tree.current) {
                            var cons = info.tree.current.data.cons || info.tree.current.data.attr;
                            if (cons) {
                                var archetypeModelRoot = AOM.ArchetypeModel.from(cons);
                                var archetypeId = archetypeModelRoot.parentArchetypeModel.getArchetypeId();
                                window.open('archetype-editor.html?archetypeId=' + encodeURIComponent(archetypeId), '_blank');
                            }

                        }
                    });
                    info.toolbar.renameConstraint.click(info.tree.renameConstraint);
                    info.toolbar.addArchetype.click(info.tree.addArchetype);
                    info.toolbar.removeConstraint.click(info.tree.removeConstraint);
                    info.toolbar.exportToOpt14.click(function () {
                        TemplateEditor.exportToOpt14(templateModel);
                    });

                    info.toolbar.showStructure.on('change', function () {
                        info.tree.changeShowStructure(info.toolbar.showStructure.prop('checked'));
                    });
                    info.toolbar.showProhibited.on('change', function () {
                        info.tree.filterProhibited(info.toolbar.showProhibited.prop('checked'));
                    });


                    targetElement.append(html);
                });
            };

            return my;
        }();

    }
    (TemplateEditor)
)
;