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
    ArchetypeEditor.Definition = function () {
        var my = {};


        /**
         * Specializes a given constraint, and updates the
         * @param {AOM.ArchetypeModel} archetypeModel
         * @param {object} constraintData
         * @param {object} definitionTreeNode treeNode of the definition tree
         */
        function specializeConstraint(archetypeModel, constraintData, definitionTreeNode) {
            var cons = constraintData.cons;
            var rmTypeHandler = ArchetypeEditor.getRmTypeHandler(cons.rm_type_name);
            if (rmTypeHandler) {
                // specialize whole tree when using a custom rm type handler
                archetypeModel.specializeConstraintSubTree(cons);
            } else {
                archetypeModel.specializeConstraint(cons);
            }
            constraintData.info.tree.styleNodes(definitionTreeNode.id, 1);
            var isSelected = constraintData.info.tree.targetElement.jstree('is_selected', definitionTreeNode);
            if (isSelected) {
                constraintData.info.propertiesPanel.show(constraintData);
            }
        }

        function openAddAttributeDialog(attributes, callback) {
            var context = {
                panel_id: GuiUtils.generateId(),
                attributes: attributes
            };

            GuiUtils.applyTemplate("definition|addAttributeDialog", context, function (content) {
                content = $(content);
                GuiUtils.openSimpleDialog({
                    title: "Add attribute",
                    buttons: {'add': 'Add'},
                    content: content,
                    callback: function (content) {
                        var attribute = content.find('#' + context.panel_id + '_attributes').val();
                        callback(attribute);
                    }
                })
            })
        }

        /**
         * @param {AOM.ArchetypeModel} archetypeModel Archetype model
         * @param {string[]} childTypes list of valid rm types
         * @param {string[]} slotChildTypes list of valid rm types for ARCHETYPE_SLOT. Must be a subset of childTypes
         * @param {object} options Dialog options
         * @param {boolean} options.named Whether a node is named. If undefined, a checkbox is displayed for that.
         * @param {function} callback with data about the constraint to add
         */
        function openAddConstraintDialog(archetypeModel, childTypes, slotChildTypes, options, callback) {
            var defaultOptions = {named: undefined};

            options = $.extend({}, defaultOptions, options);

            var context = {
                panel_id: GuiUtils.generateId(),
                namedCheckShow: options.named === undefined,
                nameShow: options.named !== false,
                types: childTypes,
                amTypes: {}
            };
            context.amTypes["C_DEFINED_OBJECT"] = "Constraint";
            if (slotChildTypes && slotChildTypes.length > 0) {
                context.amTypes["ARCHETYPE_SLOT"] = "Archetype Slot";
            }
            context.amTypes["ARCHETYPE_INTERNAL_REF"] = "Internal Reference";

            GuiUtils.applyTemplate("definition|addConstraintDialog", context, function (content) {

                function populateRmTypeSelect() {
                    var isSlot = amTypeSelect.val() === "ARCHETYPE_SLOT";
                    var types = isSlot ? slotChildTypes : childTypes;
                    var oldVal = typeSelect.val();
                    var hasOldVal = false;
                    var first = undefined;
                    typeSelect.empty();
                    for (var i in types) {
                        var type = types[i];
                        typeSelect.append($('<option>').attr('value', type).text(type));
                        first = first || type;
                        if (type === oldVal) hasOldVal = true;
                    }
                    typeSelect.val(hasOldVal ? oldVal : first);
                }

                function amTypeSelectChange() {
                    var amType = amTypeSelect.val();
                    GuiUtils.setVisible(rmTypePanel, amType !== "ARCHETYPE_INTERNAL_REF");
                    GuiUtils.setVisible(targetPathPanel, amType === "ARCHETYPE_INTERNAL_REF");
                    populateRmTypeSelect();
                }

                content = $(content);

                if (context.namedCheckShow) {
                    var namedCheck = content.find('#' + context.panel_id + '_named');
                    namedCheck.on('change', function () {
                        GuiUtils.setVisible(
                            content.find('#' + context.panel_id + '_name_panel'),
                            namedCheck.prop('checked'));
                    });
                }
                var amTypeSelect = content.find('#' + context.panel_id + '_amType');
                var typeSelect = content.find('#' + context.panel_id + '_types');
                var rmTypePanel = content.find('#' + context.panel_id + '_rmTypePanel');
                var targetPathPanel = content.find('#' + context.panel_id + '_targetPathPanel');
                var targetPath = content.find('#' + context.panel_id + '_targetPath');

                amTypeSelectChange();
                amTypeSelect.on('change', amTypeSelectChange);

                GuiUtils.openSimpleDialog({
                    title: "Add Child Constraint",
                    buttons: {'add': 'Add'},
                    content: content,
                    callback: function (content) {
                        var named, targetPathVal;
                        var result = {};

                        // add name
                        if (options.named === true) {
                            named = true;
                        } else if (options.named === false) {
                            named = false;
                        } else {
                            named = content.find('#' + context.panel_id + '_named').prop('checked');
                        }
                        result.named = named;
                        if (named) {
                            result.text = content.find('#' + context.panel_id + '_text').val().trim();
                            result.description = content.find('#' + context.panel_id + '_description').val().trim();

                            if (result.text.length === 0) {
                                return "text is required";
                            }
                            if (result.description.length == 0) {
                                result.description = result.text;
                            }
                        }

                        var amType = amTypeSelect.val();
                        result.amType = amType;
                        if (amType === "ARCHETYPE_INTERNAL_REF") {
                            targetPathVal = targetPath.val();
                            var targetCons = AOM.AmQuery.get(archetypeModel.data.definition, targetPathVal);
                            if (!targetCons) {
                                return "No constraint node at path " + targetPathVal;
                            }
                            result.targetPath = targetPathVal;
                            result.rmType = targetCons.rm_type_name;
                        } else if (amType === "ARCHETYPE_SLOT") {
                            result.rmType = typeSelect.val();
                        } else {
                            result.rmType = typeSelect.val();
                        }

                        callback(result);
                    }
                })
            })
        }

        function populateLanguageSelect(languageSelect, archetypeModel) {
            var lastVal = languageSelect.val();
            var lastValPresent = false;
            languageSelect.empty();
            var langs = archetypeModel.allLanguages();

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
        
        function loadMindmapView(panelId, archetypeModel, referenceModel, info) {
        	$("#" + panelId + "_tree").hide();
        	$("#" + panelId + "_tree").closest(".panel").children(".panel-footer").hide();
          initializeMindMap(panelId, archetypeModel, referenceModel, info.toolbar.languageSelect.val(), info);
        }
        
        function loadTreeView(panelId, archetypeModel, info) {
        	$("#" + panelId + "_mindmap_container").empty().hide();
        	$("#" + panelId + "_tree").show();
        	$("#" + panelId + "_tree").closest(".panel").children(".panel-footer").show();

            var definitionTreeElement = $('#' + panelId + '_tree');
            info.tree = new my.DefinitionTree(archetypeModel, definitionTreeElement, info);

            info.toolbar.addChild.click(info.tree.addChild);
            info.toolbar.removeConstraint.click(info.tree.removeConstraint);
        }

        /**
         * @param {AOM.ArchetypeModel} archetypeModel
         * @param targetElement
         * @constructor
         */
        my.DefinitionPropertiesPanel = function (archetypeModel, targetElement) {
            targetElement.empty();
            var self = this;

            var stage, handler, context;

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
                stage.archetypeModel = archetypeModel;
                stage.archetypeEditor = ArchetypeEditor;
                return stage;
            }

            function clearConstraints(targetElement) {
                if (handler && handler.hide) {
                    handler.hide(stage, context, targetElement);
                    handler = undefined;
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
                    if (!specialized) {
                        var dataElements = targetElement.find(".data");
                        targetElement.prop("disabled", true);
                        dataElements.prop("disabled", true);
                        saveButton.prop('disabled', true);
                    }
                }

                clearConstraints(targetElement);
                var cons = constraintData.cons;
                if (!cons) return;
                var parentCons = archetypeModel.getParentConstraint(cons);
                var specialized = archetypeModel.isSpecialized(cons);

//                var topDiv = $('<div class="container-fluid">');
//                targetElement.append(topDiv);

                handler = ArchetypeEditor.getRmTypeHandler('main', '@common');
                var customDiv = $('<div class="container-fluid">');
                targetElement.append(customDiv);

                stage = createEmptyStage();
                stage.readOnly = !specialized;
                context = handler.createContext(stage, cons, parentCons);
                addPropertiesPanelToStage(stage, context, handler, customDiv);
                handler.show(stage, context, customDiv);

                var errorsDiv = $('<div class="errors">');
                targetElement.append(errorsDiv);


                var footerDiv = $('<div class="footer">');
                targetElement.append(footerDiv);

                var footerContext = {
                    footer_id: GuiUtils.generateId(),
                    specialized: specialized
                };

                GuiUtils.applyTemplate("properties/constraint-common|footer", footerContext, footerDiv);

                if (!specialized) {
                    var specializeButton = footerDiv.find('#' + footerContext.footer_id + '_specialize');
                    specializeButton.click(function () {
                        constraintData.specializeCallback();
                        //specializeConstraint(archetypeModel, cons, constraintData.info, constraintData.treeNode);
                    });
                }

                var saveButton = footerDiv.find('#' + footerContext.footer_id + '_save');

                disableIfSpecialized();
                setTimeout(disableIfSpecialized, 100);


                saveButton.click(function () {
                    var errors = new AmUtils.Errors();

                    handler.updateContext(stage, context, targetElement);
                    handler.validate(stage, context, errors);
                    errorsDiv.empty();
                    if (errors.getErrors().length > 0) {
                        var errorsContext = {errors: errors.getErrors()};
                        GuiUtils.applyTemplate("properties/constraint-common|errors", errorsContext, errorsDiv);
                        console.error("There were validation errors:", errors.getErrors());
                        return;
                    }

                    handler.updateConstraint(stage, context, cons, errors);

                    archetypeModel.enrichReplacementConstraint(cons);
                    constraintData.saveCallback();

                });
            } // showConstraintProperties

            function showAnnotations(constraintData, targetElement) {
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

            function showAttributeProperties(constraintData, targetElement) {

                function disableIfSpecialized() {
                    // add global handlers
                    if (!specialized) {
                        var dataElements = targetElement.find(".data");
                        dataElements.prop("disabled", true);
                        saveButton.prop('disabled', true);
                    }
                }

                clearConstraints(targetElement);
                var cons = constraintData.cons;
                if (!cons) return;
                var parentCons = archetypeModel.getParentConstraint(cons);
                var specialized = archetypeModel.isSpecialized(cons);


                handler = ArchetypeEditor.getRmTypeHandler('C_ATTRIBUTE', '');
                var customDiv = $('<div class="container-fluid">');
                targetElement.append(customDiv);

                stage = createEmptyStage();
                stage.readOnly = !specialized;
                context = handler.createContext(stage, cons, parentCons);
                addPropertiesPanelToStage(stage, context, handler, customDiv);
                handler.show(stage, context, customDiv);

                var errorsDiv = $('<div class="errors">');
                targetElement.append(errorsDiv);


                var footerDiv = $('<div class="footer">');
                targetElement.append(footerDiv);

                var footerContext = {
                    footer_id: GuiUtils.generateId(),
                    specialized: specialized
                };

                GuiUtils.applyTemplate("properties/constraint-common|footer", footerContext, footerDiv);

                var saveButton = footerDiv.find('#' + footerContext.footer_id + '_save');

                disableIfSpecialized();
                setTimeout(disableIfSpecialized, 100);


                saveButton.click(function () {
                    var errors = new AmUtils.Errors();

                    handler.updateContext(stage, context, targetElement);
                    handler.validate(stage, context, errors);
                    errorsDiv.empty();
                    if (errors.getErrors().length > 0) {
                        var errorsContext = {errors: errors.getErrors()};
                        GuiUtils.applyTemplate("properties/constraint-common|errors", errorsContext, errorsDiv);
                        console.error("There were validation errors:", errors.getErrors());
                        return;
                    }

                    handler.updateConstraint(stage, context, cons, errors);

                    archetypeModel.enrichReplacementConstraint(cons);
                    constraintData.saveCallback();

                });
            }

            self.show = function (constraintData) {
                self.clear();

                var context = {
                    panel_id: GuiUtils.generateId()
                };
                if (constraintData.cons["@type"] === "C_ATTRIBUTE") {
                    GuiUtils.applyTemplate('definition|attributePanel', context, function (html) {
                        html = $(html);
                        var attributeTab = html.find('#' + context.panel_id + '_attribute');
                        //var annotationsTab = html.find('#' + context.panel_id + '_annotations');
                        showAttributeProperties(constraintData, attributeTab);
                        //showAnnotations(constraintData, annotationsTab);

                        targetElement.append(html);
                    });

                } else {
                    GuiUtils.applyTemplate('definition|constraintsPanel', context, function (html) {
                        html = $(html);
                        var constraintsTab = html.find('#' + context.panel_id + '_constraints');
                        var annotationsTab = html.find('#' + context.panel_id + '_annotations');
                        showConstraintProperties(constraintData, constraintsTab);
                        showAnnotations(constraintData, annotationsTab);

                        targetElement.append(html);
                    });
                }
            }

        };

        my.DefinitionTree = function (archetypeModel, targetElement, info) {
            var self = this;
            var treeIdPrefix = "dt_" + GuiUtils.generateId() + "_";
            var nextTreeIdIndex = 0;
            var currentLanguage;

            var treeData = {};

            function nextTreeId() {
                return treeIdPrefix + (nextTreeIdIndex++).toString();
            }

            self.extractConstraintName = function (cons, language) {
                var result = archetypeModel.getTermDefinitionText(cons.node_id, language);
                if (!result) {
                    result = cons.rm_type_name;
                }
                return result;
            };

            self.setLanguage = function (language) {

                function renameSubtree(node) {
                    var nodeData = treeData[node.id];
                    var cons = nodeData.cons || nodeData.attr;
                    if (AOM.mixin(cons).isConstraint()) {
                        var newName = self.extractConstraintName(cons, language);
                        info.tree.targetElement.jstree('rename_node', node, newName);
                    }

                    if (node.children) {
                        for (var i in node.children) {
                            var child = info.tree.targetElement.jstree('get_node', node.children[i]);
                            renameSubtree(child)
                        }
                    }
                }
                currentLanguage = language;

                var treeRoot = info.tree.targetElement.jstree('get_node', '#');
                var node = info.tree.targetElement.jstree('get_node', treeRoot.children[0]);
                renameSubtree(node);

                info.tree.targetElement.jstree('redraw', true);
                info.toolbar.languageSelect.val(language);

            };


            function createAttrJson(attribute) {
                var attrJson = {
                    id: nextTreeId()
                };
                treeData[attrJson.id] = {
                    attr: attribute
                };
                attrJson.text = attribute.rm_attribute_name;
                if (attribute.children && attribute.children.length > 0) {
                    attrJson.children = [];

                    for (var j in attribute.children) {
                        buildTreeJson(attrJson.children, attribute.children[j]);
                    }
                }
                return attrJson;
            }

            function buildTreeJson(target, cons) {

                function addTransparentAttributeConstraints() {
                    for (var i in cons.attributes || []) {
                        var attribute = cons.attributes[i];
                        for (var j in attribute.children || []) {
                            buildTreeJson(target, attribute.children[j]);
                        }
                    }
                }

                function addFullAttributesAndConstrains() {
                    for (var i in cons.attributes) {
                        var attribute = cons.attributes[i];
                        var attrJson = createAttrJson(attribute);
                        consJson.children.push(attrJson);
                    }
                }

                function addDataAttribute(consJson, attrName) {
                    for (var i in cons.attributes) {
                        var attribute = cons.attributes[i];
                        if (attribute.rm_attribute_name !== attrName) continue;

                        for (var j in cons.children) {
                            consJson.children = consJson.children || [];
                            buildTreeJson(consJson.children, attribute.children[j]);
                        }
                        return true;
                    }
                    return false;
                }

                // leave tree compactness for later
                var rmType = undefined;
                //var rmType = my.referenceModel.getType(cons.rm_type_name);

                if (rmType && rmType.display === 'none') return;

                if (rmType && rmType.display === 'transparent') {
                    addTransparentAttributeConstraints();
                } else {
                    var consJson = {
                        id: nextTreeId()
                    };
                    treeData[consJson.id] = {
                        cons: cons
                    };

                    consJson.text = self.extractConstraintName(cons, currentLanguage);

                    // only add attributes if no custom handler for this type
                    if (!ArchetypeEditor.getRmTypeHandler(cons)) {

                        if (cons.attributes && cons.attributes.length > 0) {
                            consJson.children = [];
                        }
                        if (cons.attributes && cons.attributes.length > 0) {
                            if (rmType && rmType.dataAttribute) {
                                if (!addDataAttribute(consJson, rmType.dataAttribute)) {
                                    addFullAttributesAndConstrains();
                                }
                            } else {
                                addFullAttributesAndConstrains();
                            }
                        }
                    }

                }
                target.push(consJson);
            }

            function styleNodeJson(treeNodeJson) {
                var cons = treeData[treeNodeJson.id].cons || treeData[treeNodeJson.id].attr;
                var isAttr = !treeData[treeNodeJson.id].cons;
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
                        treeNodeJson.icon += " " + "slot";
                    }
                }


                treeNodeJson.a_attr = treeNodeJson.a_attr || {};
                treeNodeJson.a_attr.class = 'definition-tree-node ' + (isAttr ? 'attribute' : 'constraint');
                if (isSpecialized) {
                    treeNodeJson.a_attr.class += ' specialized';
                }
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

            function addAttributeTreeNode(parentNode, childCons, pos) {
                var attrJson = createAttrJson(childCons);
                self.targetElement.jstree('create_node', parentNode, attrJson, pos);
                self.styleNodes(parentNode.id);
            }

            function addConstraintTreeNode(parentNode, childCons, pos) {
                var target = [];
                buildTreeJson(target, childCons);
                var childJson = target[0];
                var newTreeNodeId = self.targetElement.jstree('create_node', parentNode, childJson, pos);
                self.styleNodes(parentNode.id);
                self.targetElement.jstree("deselect_all");
                self.targetElement.jstree('select_node', newTreeNodeId);
                $('#'+newTreeNodeId).children('a').focus();
                return newTreeNodeId;
            }

            self.addChild = function () {

                function addAttribute(cons) {
                    var rmType = info.referenceModel.getType(cons.rm_type_name);

                    var presentAttributes = AmUtils.listToSet(Stream(cons.attributes || []).map("rm_attribute_name").toArray());

                    var attributesToAdd = [];
                    for (var attrName in rmType.attributes) {
                        if (!presentAttributes[attrName]) {
                            attributesToAdd.push(attrName);
                        }
                    }

                    // no suitable attributes
                    if (attributesToAdd.length === 0) return;

                    openAddAttributeDialog(attributesToAdd, function (attribute) {
                        var cAttribute = archetypeModel.addAttribute(cons, attribute);
                        addAttributeTreeNode(self.current.treeNode, cAttribute);
                    });
                }

                function addConstraint(attr) {

                    var parentCons = attr[".parent"];
                    if (!parentCons) return;
                    attr.children = attr.children || [];


                    var rmAttr = self.info.referenceModel.getType(parentCons.rm_type_name)
                        .attributes[attr.rm_attribute_name];

                    if (rmAttr.existence.upper !== undefined
                        && attr.children.length >= rmAttr.existence.upper) {
                        return;
                    }

                    var subtypes = self.info.referenceModel.getSubclassTypes(rmAttr.type, true);
                    if (subtypes.length === 0) return;
                    var slotSubtypes = Stream(subtypes).filter(function (type) {
                        return self.info.referenceModel.getType(type).rootType;
                    }).toArray();

                    openAddConstraintDialog(archetypeModel, subtypes, slotSubtypes, {}, function (data) {
                        var cConstraint;
                        var newNodeId = archetypeModel.generateSpecializedTermId("id");
                        if (data.amType === "ARCHETYPE_SLOT") {
                            cConstraint = AOM.newArchetypeSlot(data.rmType, newNodeId);
                        } else if (data.amType === "ARCHETYPE_INTERNAL_REF") {
                            cConstraint = AOM.newArchetypeInternalReference(data.rmType, newNodeId);
                            cConstraint.target_path = data.targetPath;
                        } else {
                            cConstraint = AOM.newConstraint(data.rmType, newNodeId);
                            cConstraint.target_path = data.targetPath;
                        }
                        archetypeModel.addConstraint(attr, cConstraint);

                        if (data.named) {
                            archetypeModel.setTermDefinition(cConstraint.node_id, undefined, data.text, data.description);
                        }

//                        archetypeModel.enrichReplacementConstraint(cConstraint, attr);
                        addConstraintTreeNode(self.current.treeNode, cConstraint);
                    });

                }

                if (!self.current) return;
                if (self.current.data.cons) {
                    if (!archetypeModel.isSpecialized(self.current.data.cons)) return;
                    // do not add attributes if there is a custom handler
                    if (ArchetypeEditor.getRmTypeHandler(self.current.data.cons)) return;
                    addAttribute(self.current.data.cons);
                }
                else if (self.current.data.attr) {
                    //if (!archetypeModel.isSpecialized(self.current.data.attr)) {
                    //    return;
                    //}
                    addConstraint(self.current.data.attr)

                }
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
                if (!cons[".parent"]) return;

                var archetypeModel = AOM.ArchetypeModel.from(cons);
                if (!archetypeModel.isSpecialized(cons)) return;
                var newCons = archetypeModel.removeConstraint(cons);
                //delete treeData[self.current.treeNode.id];

                if (newCons) {
                    if (newCons == cons) return; // no change
                    var nodeIndex = getJsTreeNodeSiblingIndex(self.current.treeNode);
                    var parentNode = info.tree.targetElement.jstree('get_node', self.current.treeNode.parent);

                    info.tree.targetElement.jstree('delete_node', self.current.treeNode);
                    var newNodeId = addConstraintTreeNode(parentNode, newCons, nodeIndex);
                    info.tree.targetElement.jstree('select_node', newNodeId);
                } else {
                    info.tree.targetElement.jstree('delete_node', self.current.treeNode);
                }

            };

            function styleJson(list) {
                for (var i in list) {
                    styleNodeJson(list[i]);
                    if (list[i].children) {
                        styleJson(list[i].children);
                    }
                }
            }

            self.info = info;
            currentLanguage = info.toolbar.languageSelect.val();


            var jsonTreeTarget = [];
            buildTreeJson(jsonTreeTarget, archetypeModel.data.definition);
            styleJson(jsonTreeTarget);

            targetElement.empty();
            targetElement.jstree("destroy");
            targetElement.jstree(
                {
                    'core': {
                        'data': jsonTreeTarget,
                        'multiple': false,
                        'check_callback': true

                    },
                    "plugins" : [
                         "search"
                    ],

                }).on('loaded.jstree', function () {
                    targetElement.jstree('open_all');
                    var superRootNode = targetElement.jstree('get_node', '#');
                    targetElement.jstree('select_node', superRootNode.children[0]);
                });

            self.jstree = targetElement.jstree(true);
            self.targetElement = targetElement;


            targetElement.on('select_node.jstree', function (event, treeEvent) {
                var data = treeData[treeEvent.node.id];
                self.current = {
                    treeNode: treeEvent.node,
                    data: data
                };

                var constraintData = {
                    info: info,
                    cons: data.cons || data.attr
                };
                constraintData.specializeCallback = function () {
                    specializeConstraint(archetypeModel, constraintData, treeEvent.node);
                };
                constraintData.saveCallback = function() {
                    info.tree.styleNodes(treeEvent.node.id);
                    constraintData.info.tree.styleNodes(treeEvent.node.id, 1);
                    var isSelected = constraintData.info.tree.targetElement.jstree('is_selected', definitionTreeNode);
                    if (isSelected) {
                        constraintData.info.propertiesPanel.show(constraintData);
                    }

                };
                info.propertiesPanel.show(constraintData);
            });


        };

        my.show = function (archetypeModel, referenceModel, targetElement) {
            targetElement.empty();
            var context = {
                panel_id: GuiUtils.generateId()
            };


            GuiUtils.applyTemplate("definition|main", context, function (html) {
                html = $(html);
                targetElement.append(html);

                var info = {
                    referenceModel: referenceModel,
                    toolbar: {
                        languageSelect: html.find('#' + context.panel_id + '_language'),
												viewTree: html.find('#' + context.panel_id + '_viewTree'),
												viewMindmap: html.find('#' + context.panel_id + '_viewMindmap'),
                        addChild: html.find('#' + context.panel_id + '_addChild'),
                        removeConstraint: html.find('#' + context.panel_id + '_removeConstraint')
                    }
                };
                var definitionPropertiesElement = html.find('#' + context.panel_id + '_constraints_panel');
                info.propertiesPanel = new my.DefinitionPropertiesPanel(archetypeModel, definitionPropertiesElement);



                populateLanguageSelect(info.toolbar.languageSelect, archetypeModel);
                info.toolbar.languageSelect.val(archetypeModel.defaultLanguage);
                info.toolbar.languageSelect.change(function () {
                    if (info.tree) {
                        info.tree.setLanguage(info.toolbar.languageSelect.val());
                    }
                    var mindmapContainer = $("#" + context.panel_id + "_mindmap_container");
                    if(mindmapContainer.is(":visible")) {
                    	mindmapContainer.empty();
                    	initializeMindMap(context.panel_id, archetypeModel, referenceModel, info.toolbar.languageSelect.val(), info);
                    }
                });

                loadTreeView(context.panel_id, archetypeModel, info);

                info.toolbar.viewMindmap.change(function() {
                    delete info.tree;
                	loadMindmapView(context.panel_id, archetypeModel, referenceModel, info);
                });
                
                info.toolbar.viewTree.change(function() {
                	loadTreeView(context.panel_id, archetypeModel, info);
                });


            });
        };

        return my;
    }();

}(ArchetypeEditor)
)
;