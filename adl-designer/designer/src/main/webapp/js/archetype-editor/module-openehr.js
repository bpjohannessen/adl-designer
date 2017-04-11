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
    var OpenEhrModule = function () {
        var self = this;

        self.name = "openEHR";


        /**
         * @param {AOM.ArchetypeModel} archetypeModel
         * @param {object} options
         * @param {AOM.ArchetypeModel} options.archetypeModel archetype model to use
         * @param {AOM.ReferenceModel} options.referenceModel reference model to use
         * @param {string?} options.language language to use, undefined for default
         */
        self.MindmapModel = function (options) {
            var mindmap = this;

            var itemStructSet = AmUtils.listToSet(['ITEM_TREE', 'ITEM_SINGLE', 'ITEM_LIST', 'ITEM_TABLE']);
            var validSlotTypes = ["ADMIN_ENTRY", "CLUSTER", "EVALUATION", "OBSERVATION", "SECTION", "COMPOSITION",
                "INSTRUCTION", "ACTION", "ELEMENT"];
            validSlotTypes.sort();

            var validDvTypes = [
                "DV_TEXT",
                "DV_CODED_TEXT",
                "DV_BOOLEAN",
                "DV_ORDINAL",
                "DV_COUNT",
                "DV_QUANTITY",
                "DV_DATE_TIME",
                "DV_DATE",
                "DV_TIME",
                "DV_DURATION",
                "DV_MULTIMEDIA",
                "DV_URI",
                "DV_PROPORTION",
                "DV_IDENTIFIER",
                "DV_PARSABLE",

                "DV_INTERVAL<DV_COUNT>",
                "DV_INTERVAL<DV_QUANTITY>",
                "DV_INTERVAL<DV_DATE_TIME>",
                "DV_INTERVAL<DV_DATE>",
                "DV_INTERVAL<DV_TIME>"

            ];


            function convertSingleConstraintToMindmap(cons) {
                var rmType = cons.rm_type_name;
                if (rmType === 'ELEMENT') {
                    var dvCons = AOM.AmQuery.get(cons, 'value');
                    rmType = dvCons ? dvCons.rm_type_name : 'DATA_VALUE';
                }
                var result = {
                    type: 'constraint',
                    rmType: rmType,
                    rmPath: options.archetypeModel.getRmPath(cons).toString(),
                    label: options.archetypeModel.getTermDefinitionText(cons.node_id, options.language) || cons.rm_type_name
                };
                if (cons["@type"] === "C_COMPLEX_OBJECT" && (result.rmType === "CLUSTER" || result.rmType === "HISTORY")) {
                    result.canAddChildren = true;
                }
                if (cons["@type"] === "ARCHETYPE_SLOT") {
                    result.isSlot = true;
                }
                result.canDelete = true;
                return result;
            }

            mindmap.convertToMindmap = function () {

                function createProperty(obj) {
                    return {
                        type: 'property',
                        property: obj.property,
                        label: obj.label || obj.property,
                        value: obj.value
                    };
                }


                function createConstraints(rootConsAttr) {
                    var result = [];
                    if (!rootConsAttr) return result;

                    for (var i in rootConsAttr.children) {
                        var cons = rootConsAttr.children[i];
                        if (itemStructSet[cons.rm_type_name]) {
                            var structItemsAttr = options.archetypeModel.getAttribute(cons, 'items');
                            var structs = createConstraints(structItemsAttr);
                            for (var j in structs) {
                                result.push(structs[j]);
                            }

                        } else {
                            var modelConstraint = convertSingleConstraintToMindmap(cons);
                            if (cons.rm_type_name == 'CLUSTER') {
                                var clusterItemsAttr = options.archetypeModel.getAttribute(cons, 'items');
                                modelConstraint.children = createConstraints(clusterItemsAttr);
                            }
                            result.push(modelConstraint);
                        }
                    }
                    return result;
                }

                function createSection(section, label) {
                    return {
                        type: 'section',
                        section: section,
                        label: label,
                        children: []
                    }
                }

                function createConstraintsSection(section, label, consAttr, cons) {
                    var result = createSection(section, label);
                    if (consAttr) {
                        result.children = createConstraints(consAttr);
                        if (!cons && consAttr.children && consAttr.children.length === 1) {
                            cons = consAttr.children[0];
                        }
                        if (cons) {
                            result.rmPath = options.archetypeModel.getRmPath(cons).toString();
                            result.rmType = cons.rm_type_name;
                        }
                    }
                    result.canAddChildren = true;
                    return result;
                }

                function createDescriptionSection() {

                    var section = createSection('description', 'Description');

                    var rdi = Stream(options.archetypeModel.data.description.details).filter(function (d) {
                        return d.language.code_string == options.language
                    }).findFirst().get();

                    section.children.push(createProperty({property: 'purpose', value: rdi.purpose}));
                    section.children.push(createProperty({property: 'use', value: rdi.use}));
                    section.children.push(createProperty({property: 'misuse', value: rdi.misuse}));
                    section.children.push(createProperty({
                        property: 'keywords',
                        value: AmUtils.clone(rdi.keywords || [])
                    }));


                    return section;
                }

                function createAttributionSection() {

                    function createTranslatorsValue(translations) {
                        var result = {};
                        Stream(translations).forEach(function (t) {
                            result[t.language.code_string] = AmUtils.clone(t.author);
                        });
                        return result;
                    }

                    var section = createSection('attribution', 'Attribution');

                    var description = options.archetypeModel.data.description;
                    section.children.push(createProperty({
                        property: 'original_author',
                        value: AmUtils.clone(description.original_author),
                        label: 'Original Author'
                    }));
                    section.children.push(createProperty({
                        property: 'other_contributors',
                        value: AmUtils.clone(description.other_contributors),
                        label: 'Other Contributors'
                    }));

                    section.children.push(createProperty({
                        property: 'translators',
                        value: createTranslatorsValue(options.archetypeModel.data.translations),
                        label: 'Translators'
                    }));


                    return section;

                }


                function addObservationSections(target) {
                    function createProtocolSection() {
                        var protocolAttr = options.archetypeModel.getAttribute(options.archetypeModel.data.definition, 'protocol');
                        return createConstraintsSection('protocol', 'Protocol', protocolAttr);
                    }

                    function createDataSection() {

                        var dataConses = AOM.AmQuery.findAll(options.archetypeModel.data.definition, "/data/events/data");
                        var dataCons = Stream(dataConses).filter(function (d) {
                            return d["@type"] !== "ARCHETYPE_INTERNAL_REF";
                        }).findFirst().orElse();
                        if (!dataCons) return;
                        return createConstraintsSection('data', 'Data', dataCons[".parent"]);
                    }

                    function createStateSection() {
                        var stateConses = AOM.AmQuery.findAll(options.archetypeModel.data.definition, "/data/events/state");
                        if (stateConses.length == null) return undefined;

                        var stateCons = Stream(stateConses).filter(function (d) {
                            return d["@type"] !== "ARCHETYPE_INTERNAL_REF";
                        }).findFirst().orElse();
                        if (!stateCons) return undefined;
                        return createConstraintsSection('state', 'State', stateCons[".parent"]);
                    }

                    function createEventsSection() {
                        var dataCons = AOM.AmQuery.get(options.archetypeModel.data.definition, 'data');
                        var eventAttr = options.archetypeModel.getAttribute(dataCons, 'events');
                        var result = createConstraintsSection('events', 'Events', eventAttr, dataCons);
                        result.children[0].canDelete = false; // disallow top
                        return result;
                    }

                    target.push(createEventsSection());
                    target.push(createProtocolSection());
                    target.push(createDataSection());
                    target.push(createStateSection());

                    AmUtils.removeUndefinedItems(target);
                }

                function addEvaluationSections(target) {

                    function createDataSection() {
                        var dataAttr = options.archetypeModel.getAttribute(options.archetypeModel.data.definition, 'data');
                        return createConstraintsSection('data', 'Data', dataAttr);
                    }

                    function createProtocolSection() {
                        var protocolAttr = options.archetypeModel.getAttribute(options.archetypeModel.data.definition, 'protocol');
                        return createConstraintsSection('protocol', 'Protocol', protocolAttr);
                    }

                    target.push(createDataSection());
                    target.push(createProtocolSection());
                }

                function addActionSections(target) {
                    function createProtocolSection() {
                        var protocolAttr = options.archetypeModel.getAttribute(options.archetypeModel.data.definition, 'protocol');
                        return createConstraintsSection('protocol', 'Protocol', protocolAttr);
                    }

                    function createPathwaySection() {
                        var pathwayAttr = options.archetypeModel.getAttribute(options.archetypeModel.data.definition, 'ism_transition');
                        return createConstraintsSection('pathway', 'Pathway', pathwayAttr);
                    }

                    target.push(createProtocolSection());
                    target.push(createPathwaySection());
                }

                function addAdminSections(target) {
                    function createDataSection() {
                        var dataAttr = options.archetypeModel.getAttribute(options.archetypeModel.data.definition, 'data');
                        return createConstraintsSection('data', 'Data', dataAttr);
                    }

                    target.push(createDataSection());
                }

                function addInstructionSections(target) {
                    function createProtocolSection() {
                        var protocolAttr = options.archetypeModel.getAttribute(options.archetypeModel.data.definition, 'protocol');
                        return createConstraintsSection('protocol', 'Protocol', protocolAttr);
                    }

                    function createActivitiesSection() {
                        var activities = options.archetypeModel.getAttribute(options.archetypeModel.data.definition, 'activities');
                        return createConstraintsSection('activities', 'Activities', activities);
                    }

                    target.push(createProtocolSection());
                    target.push(createActivitiesSection());
                }

                function addClusterSections(target) {
                    function createItemsSection() {
                        var itemsAttr = options.archetypeModel.getAttribute(options.archetypeModel.data.definition, 'items');
                        return createConstraintsSection('items', 'Items', itemsAttr);
                    }

                    target.push(createItemsSection());
                }

                function addCompositionSections(target) {
                    function createContentSection() {
                        var contentAttr = options.archetypeModel.getAttribute(options.archetypeModel.data.definition, 'content');
                        return createConstraintsSection('content', 'Content', contentAttr);
                    }

                    function createContextSection() {
                        var context = AOM.AmQuery.get(options.archetypeModel.data.definition, 'context');
                        if (context) {
                            var otherContextAttr = options.archetypeModel.getAttribute(context, 'other_context');
                            if (otherContextAttr) {
                                return createConstraintsSection('context', 'Context', otherContextAttr);
                            }
                        }
                        return undefined;
                    }

                    target.push(createContentSection());
                    target.push(createContextSection());
                }

                options.language = options.language || options.archetypeModel.defaultLanguage;
                var result = {};
                result.archetypeId = options.archetypeModel.getArchetypeId();
                result.label = options.archetypeModel.getArchetypeLabel(options.language);
                result.rmType = options.archetypeModel.data.definition.rm_type_name;
                result.children = [];
                result.children.push(createDescriptionSection());
                result.children.push(createAttributionSection());
                switch (result.rmType) {
                    case "ACTION":
                        addActionSections(result.children);
                        break;
                    case "ADMIN":
                        addAdminSections(result.children);
                        break;
                    case "CLUSTER":
                        addClusterSections(result.children);
                        break;
                    case "COMPOSITION":
                        addCompositionSections(result.children);
                        break;
                    case "EVALUATION":
                        addEvaluationSections(result.children);
                        break;
                    case "OBSERVATION":
                        addObservationSections(result.children);
                        break;
                    case "INSTRUCTION":
                        addInstructionSections(result.children);
                        break;
                    default:
                        console.error("Unknown rmType: " + result.rmType);
                }
                result.children = Stream(result.children).filter(function (d) {
                    return d !== undefined;
                }).toArray();
                return result;
            };


            mindmap.getValidRmTypesForConstraint = function (rmPath) {
                var cons = AOM.AmQuery.get(options.archetypeModel.data.definition, rmPath);
                if (cons["@type"] === "ARCHETYPE_SLOT") {
                    var parentAttr = cons[".parent"];
                    var parentCons = parentAttr[".parent"];
                    var rmType = options.referenceModel.getType(parentCons.rm_type_name);
                    var rmAttr = rmType ? rmType.attributes[parentAttr.rm_attribute_name] : undefined;
                    if (rmAttr) {
                        var validParentTypes = options.referenceModel.getSubclassTypes(rmAttr.type, true);
                        var intersectSlotTypes = AmUtils.keys(AmUtils.intersectSet(
                            AmUtils.listToSet(validSlotTypes), AmUtils.listToSet(validParentTypes)));
                        if (intersectSlotTypes.length === 0) return [cons.rm_type_name];
                        intersectSlotTypes.sort();
                        return intersectSlotTypes;
                    } else {
                        return [cons.rm_type_name];
                    }
                    return validSlotTypes;
                }

                if (cons.rm_type_name === "ELEMENT" || cons.rm_type_name === "CLUSTER") {
                    var result = AmUtils.clone(validDvTypes);
                    result.push("CLUSTER");
                    return result;
                }
                if (itemStructSet[cons.rm_type_name]) {
                    return [cons.rm_type_name];
                }
                if (cons[".parent"]) {
                    var parentAttr = cons[".parent"];
                    var parentCons = parentAttr[".parent"];
                    var rmType = options.referenceModel.getType(parentCons.rm_type_name);
                    if (rmType) {
                        var rmAttr = rmType.attributes[parentAttr.rm_attribute_name];
                        if (rmAttr) {
                            return options.referenceModel.getSubclassTypes(rmAttr.type, true);
                        }
                    }


                }
                return [cons.rm_type_name];

            };

            mindmap.getValidRmTypesForConstraintChild = function (rmPath) {
                var cons = AOM.AmQuery.get(options.archetypeModel.data.definition, rmPath);
                if (cons.rm_type_name === "CLUSTER" || cons.rm_type_name === "ITEM_TREE") {
                    var result = AmUtils.clone(validDvTypes);
                    result.push("CLUSTER");
                    return result;
                }
                else if (cons.rm_type_name === "HISTORY") {
                    return ["EVENT", "POINT_EVENT", "INTERVAL_EVENT"];
                } else {
                    return [];
                }
            };

            mindmap.createConstraintChild = function (parentRmPath) {
                function addEventConstraint(parentCons) {
                    function isNotArchetypeInternalRef(d) {
                        return d["@type"] !== "ARCHETYPE_INTERNAL_REF";
                    }

                    var dataCons = Stream(AOM.AmQuery.findAll(parentCons, "events/data")).filter(isNotArchetypeInternalRef)
                        .findFirst().orElse();
                    var stateCons = Stream(AOM.AmQuery.findAll(parentCons, "events/state")).filter(isNotArchetypeInternalRef)
                        .findFirst().get();

                    var newCons = AOM.newConstraint("EVENT", options.archetypeModel.addNewTermDefinition("id", "EVENT"));
                    newCons.attributes = [];
                    if (dataCons) {
                        newCons.attributes.push({
                            "@type": "C_ATTRIBUTE",
                            "rm_attribute_name": "data",
                            "existence": AmInterval.of(1, 1),
                            "is_multiple": false,
                            "match_negated": false,
                            "children": [{
                                "@type": "ARCHETYPE_INTERNAL_REF",
                                "target_path": options.archetypeModel.getRmPath(dataCons),
                                "occurrences": AmInterval.of(1, 1),
                                "rm_type_name": "ITEM_TREE",
                                "node_id": options.archetypeModel.generateSpecializedTermId("id")
                            }]
                        });
                    }
                    if (stateCons) {
                        newCons.attributes.push({
                            "@type": "C_ATTRIBUTE",
                            "rm_attribute_name": "state",
                            "existence": AmInterval.of(1, 1),
                            "is_multiple": false,
                            "match_negated": false,
                            "children": [{
                                "@type": "ARCHETYPE_INTERNAL_REF",
                                "target_path": options.archetypeModel.getRmPath(stateCons),
                                "occurrences": AmInterval.of(1, 1),
                                "rm_type_name": "ITEM_TREE",
                                "node_id": options.archetypeModel.generateSpecializedTermId("id")
                            }]
                        });
                    }
                    options.archetypeModel.addConstraint(options.archetypeModel.getAttribute(parentCons, "events"), newCons);
                    return newCons;
                }

                function addDvTypeConstraint(childRmType) {
                    var cons = AOM.newCComplexObject("ELEMENT", options.archetypeModel.generateSpecializedTermId("id"));
                    cons.node_id = options.archetypeModel.addNewTermDefinition("id", childRmType);
                    var attr = options.archetypeModel.getAttribute(parentCons, "items", true);
                    options.archetypeModel.addConstraint(attr, cons);
                    var vAttr = options.archetypeModel.addAttribute(cons, "value");
                    var dvCons = AOM.newCComplexObject(childRmType, options.archetypeModel.generateSpecializedTermId("id"));
                    options.archetypeModel.addConstraint(vAttr, dvCons);

                    return cons;
                }

                var parentCons = AOM.AmQuery.get(options.archetypeModel.data.definition, parentRmPath);
                if (!parentCons) return false;

                var validChildTypes = mindmap.getValidRmTypesForConstraintChild(parentRmPath);
                var childRmType = validChildTypes[0];

                var cons;


                if (validDvTypes.indexOf(childRmType) >= 0) {
                    cons = addDvTypeConstraint(childRmType);
                } else if (parentCons.rm_type_name === "HISTORY") {
                    cons = addEventConstraint(parentCons);
                } else {
                    cons = AOM.newCComplexObject(validChildTypes[0], options.archetypeModel.generateSpecializedTermId("id"));
                    options.archetypeModel.setTermDefinition(cons.node_id, undefined, cons.rm_type_name);
                    var attr = options.archetypeModel.getAttribute(parentCons, "items", true);
                    options.archetypeModel.addConstraint(attr, cons);
                }

                return convertSingleConstraintToMindmap(cons);

            };

            mindmap.renameConstraint = function (rmPath, text) {
                var cons = AOM.AmQuery.get(options.archetypeModel.data.definition, rmPath);
                options.archetypeModel.setTermDefinition(cons.node_id, options.language, text);

            };

            mindmap.removeConstraint = function (rmPath) {
                var cons = AOM.AmQuery.get(options.archetypeModel.data.definition, rmPath);
                if (!cons) return false;
                options.archetypeModel.removeConstraint(cons);
                return true;

            };

            mindmap.changeConstraintType = function (rmPath, rmType) {
                function removeAllAttributes(cons) {
                    var attrs = cons.attributes || [];
                    attrs.forEach(function (attr) {
                        options.archetypeModel.removeAttribute(cons, attr.rm_attribute_name);
                    });

                }

                var cons = AOM.AmQuery.get(options.archetypeModel.data.definition, rmPath);

                // do nothing when no change
                if (cons.rm_type_name === rmType) {
                    return false;
                }
                var validTypes = mindmap.getValidRmTypesForConstraint(rmPath);
                if (validTypes.indexOf(rmType) < 0) {
                    console.error("Invalid type:", rmType, "Valid types:", validTypes);
                    return false;
                }

                // If already ELEMENT, and new type needs ELEMENT wrapper, only change the existing DV node
                if (cons.rm_type_name === "ELEMENT" && validDvTypes.indexOf(rmType) >= 0) {
                    var vCons = AOM.AmQuery.get(cons, "value");
                    if (vCons) {
                        removeAllAttributes(vCons);
                        vCons.rm_type_name = rmType;
                        return convertSingleConstraintToMindmap(cons);
                    }
                }

                removeAllAttributes(cons);

                if (validDvTypes.indexOf(rmType) < 0) {
                    cons.rm_type_name = rmType;
                } else {
                    cons.rm_type_name = "ELEMENT";
                    var attr = options.archetypeModel.addAttribute(cons, "value");
                    var dvCons = AOM.newCComplexObject(rmType, options.archetypeModel.generateSpecializedTermId("id"));
                    options.archetypeModel.addConstraint(attr, dvCons);
                }
                return convertSingleConstraintToMindmap(cons);
            };

            mindmap.getConstraintObject = function (rmPath) {
                return AOM.AmQuery.get(options.archetypeModel.data.definition, rmPath);
            };

            mindmap.getMindmapConstraint = function (rmPath) {
                var cons = AOM.AmQuery.get(options.archetypeModel.data.definition, rmPath);
                return convertSingleConstraintToMindmap(cons);
            }


        };


        /**
         * Adds an attribute with a single constraint to a constraint
         * @param cons target constrain
         * @param attributeName attribute name
         * @param childConstraint single constraint under the attribute
         * @return childConstraint
         */
        function addAttributeConstraint(cons, attributeName, childConstraint) {
            var attr = AOM.newCAttribute(attributeName);
            attr.children = [childConstraint];

            cons.attributes = cons.attributes || [];
            cons.attributes.push(attr);
            return childConstraint;
        }


        var CComplexObjectHandler = function () {
            var handler = this;
            ArchetypeEditor.Modules.RmHandler.call(handler);

            handler.hide = function (stage, context, targetElement) {
                stage.archetypeEditor.applySubModulesHide(stage, targetElement, context);
            };
        };
        AmUtils.extend(CComplexObjectHandler, ArchetypeEditor.Modules.RmHandler);


        self.handlers = {};
        var DvQuantityHandler = function () {
            var handler = this;
            CComplexObjectHandler.call(handler);

            var propertyNotSetEhrId = "118";

            handler.createContext = function (stage, cons, parentCons) {


                function createPanel(tupleConstraint, parentTupleConstraint) {
                    var magnitudeHandler = stage.archetypeEditor.getRmTypeHandler("C_REAL");
                    var units = tupleConstraint.units.constraint[0];

                    var precisionEnabled = !!(tupleConstraint.precision && tupleConstraint.precision.constraint &&
                    tupleConstraint.precision.constraint.length > 0);


                    var panel = {
                        panel_id: GuiUtils.generateId(),
                        magnitude: magnitudeHandler.createContext(stage, tupleConstraint.magnitude,
                            parentTupleConstraint && parentTupleConstraint.magnitude),
                        units: units,
                        precision: precisionEnabled ? tupleConstraint.precision.constraint[0] : ""
                    };
                    return panel;

                }

                function extractPropertyOpenEhrId() {
                    var propertyCons = AOM.AmQuery.get(cons, "property");
                    if (!propertyCons) return undefined;
                    if (!propertyCons || propertyCons.constraint) return undefined;

                    var atCode = propertyCons.constraint;
                    var tb = stage.archetypeModel.getTermBinding("openehr", atCode);
                    if (!tb) return undefined;
                    var openEhrId = tb.substring(tb.lastIndexOf('/') + 1);
                    return openEhrId;
                }

                var tupleConstraints = stage.archetypeModel.getAttributesTuple(cons, ["units", "magnitude", "precision"]);
                var parentTupleConstraints = parentCons
                    ? stage.archetypeModel.parentArchetypeModel.getAttributesTuple(parentCons, ["units", "magnitude", "precision"])
                    : undefined;

                var context = handler.createCommonContext(stage, cons, parentCons);
                context.type = 'DV_QUANTITY';
                context.units_id = GuiUtils.generateId();
                context.unit_panels = [];

                context.property = extractPropertyOpenEhrId() || propertyNotSetEhrId;

                if (context.isTemplate) {
                    for (var i in parentTupleConstraints) {
                        var parentTupleConstraint = parentTupleConstraints[i];

                        var units = (parentTupleConstraint.units && parentTupleConstraint.units.constraint) ? parentTupleConstraint.units.constraint[0] : undefined;
                        if (units === undefined) continue;

                        var tupleConstraint = Stream(tupleConstraints).filter(function (d) {
                            return d.units.constraint && d.units.constraint.length === 1 && d.units.constraint[0] === units;
                        }).findFirst().orElse();

                        var panel = createPanel(tupleConstraint || parentTupleConstraint, parentTupleConstraint);
                        panel.active = !!tupleConstraint;

                        context.unit_panels.push(panel);
                    }
                } else {
                    for (var i in tupleConstraints) {
                        var tupleConstraint = tupleConstraints[i];
                        var units = (tupleConstraint.units && tupleConstraint.units.constraint) ? tupleConstraint.units.constraint[0] : undefined;
                        if (units === undefined) continue;

                        var parentTupleConstraint = undefined;
                        if (parentTupleConstraints) {
                            parentTupleConstraint = Stream(parentTupleConstraints).filter({units: units}).findFirst().orElse();
                        }
                        var panel = createPanel(tupleConstraint, parentTupleConstraint);
                        panel.active = true;

                        context.unit_panels.push(panel);
                    }
                }
                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate(
                    "properties/constraint-openehr|DV_QUANTITY", context, function (generatedDom) {

                        function populatePropertySelect() {
                            var unitsModel = stage.archetypeEditor.unitsModel;
                            propertySelect.empty();
                            Stream(unitsModel.data).forEach(function (d) {
                                propertySelect.append($("<option>").attr("value", d.openEhrId).text(d.label))
                            });
                            if (context.property) {
                                propertySelect.val(context.property);
                            }
                        }

                        function showUnitPanel(panel_id) {
                            Stream(context.unit_panels).forEach(
                                function (panel) {
                                    var panelElement = targetElement.find("#" + panel.panel_id);
                                    if (panel.panel_id === panel_id) {
                                        panelElement.show();
                                    } else {
                                        panelElement.hide();
                                    }
                                });
                        }

                        function removeUnitPanel(panel_id) {
                            for (var i in context.unit_panels) {
                                var panel = context.unit_panels[i];
                                if (panel.panel_id === panel_id) {
                                    context.unit_panels.splice(i, 1);
                                    break;
                                }
                            }
                        }

                        function fillActiveUnitsSelect(unitsSelect) {
                            var oldValue = unitsSelect.val(), hasOldValue;
                            var first;
                            unitsSelect.empty();

                            for (var i in context.unit_panels) {
                                var panel = context.unit_panels[i];
                                if (panel.active) {
                                    var option = $("<option>").attr("value", panel.panel_id).text(panel.units);
                                    unitsSelect.append(option);
                                    if (panel.panel_id === oldValue) hasOldValue = true;
                                    if (!first) first = panel.panel_id;
                                }
                            }
                            unitsSelect.val(hasOldValue ? oldValue : first);
                            showUnitPanel(unitsSelect.val());
                        }

                        generatedDom = $(generatedDom);
                        generatedDom.find("#" + context.units_id + "_remove").click(
                            function () {
                                if (context.unit_panels.length === 0) return;
                                var panel_id = targetElement.find("#" + context.units_id).val();
                                removeUnitPanel(panel_id);
                                stage.propertiesPanel.redraw();
                            });

                        generatedDom.find("#" + context.units_id + "_add").click(function () {
                            if (context.property === propertyNotSetEhrId) return;
                            var property = stage.archetypeEditor.unitsModel.getPropertyFromOpenEhrId(context.property);
                            if (!property) return;
                            var existingUnits = AmUtils.listToSet(Stream(context.unit_panels).map("units").toArray());
                            var selectOptions = [];
                            property.units.forEach(function (u) {
                                if (!existingUnits[u.code]) {
                                    var opt = {key: u.code, label: u.code};
                                    if (u.code !== u.label) {
                                        opt.label += "    (" + u.label + ")";
                                    }
                                    selectOptions.push(opt);
                                }
                            });
                            if (selectOptions.length === 0) return;
                            GuiUtils.openSingleSelectInputDialog(
                                {
                                    title: "Add unit",
                                    selectOptions: selectOptions,
                                    callback: function (unit) {
                                        if (unit.length === 0) return;
                                        var existingUnitPanel = Stream(context.unit_panels)
                                            .filter({units: unit})
                                            .findFirst().orElse();
                                        if (existingUnitPanel) {
                                            return "Unit " + unit + " already exists";
                                        }
                                        var panel = {
                                            active: true,
                                            panel_id: GuiUtils.generateId(),
                                            magnitude: stage.archetypeEditor.getRmTypeHandler("C_REAL").createContext(stage),
                                            units: unit,
                                            precision: ""
                                        };
                                        context.unit_panels.push(panel);
                                        stage.propertiesPanel.redraw();

                                    }
                                });
                        });


                        stage.archetypeEditor.applySubModules(stage, generatedDom, context);
                        targetElement.append(generatedDom);


                        var unitsSelect = generatedDom.find("#" + context.units_id);
                        unitsSelect.change(
                            function () {
                                showUnitPanel(unitsSelect.find("option:selected").val());
                            });

                        var propertySelect = generatedDom.find('#' + context.panel_id + "_property");
                        populatePropertySelect();
                        propertySelect.prop('disabled', context.unit_panels.length > 0);
                        propertySelect.on('change', function () {
                            context.property = propertySelect.val();
                        });

                        if (context.isTemplate) {
                            var activeUnitsOptions = {
                                title: "Active units",
                                items: [],
                                targetElement: generatedDom.find("#" + context.panel_id + "_active_units_container")
                            };
                            for (var i in context.unit_panels) {
                                var panel = context.unit_panels[i];
                                activeUnitsOptions.items.push({
                                    label: panel.units,
                                    checked: panel.active,
                                    code: panel.units
                                });
                            }
                            var activeUnitsCheckboxList = new GuiUtils.DropDownCheckboxList(activeUnitsOptions);

                            activeUnitsCheckboxList.onChange(function () {
                                var items = activeUnitsCheckboxList.getItemSelectionList();
                                for (var i in items) {
                                    context.unit_panels[i].active = items[i];
                                }
                                fillActiveUnitsSelect(unitsSelect);
                            });
                        }


                        fillActiveUnitsSelect(unitsSelect);
                    });
            };


            handler.updateContext = function (stage, context, targetElement) {
                Stream(context.unit_panels).forEach(
                    function (up) {
                        var targetPanel = targetElement.find('#' + up.panel_id);
                        if (targetPanel.length > 0) {
                            stage.archetypeEditor.getRmTypeHandler("C_REAL").updateContext(stage, up.magnitude, targetPanel);
                            up.precision = targetPanel.find('#' + up.panel_id + '_precision').val();
                        }
                    });
            };

            handler.validate = function (stage, context, errors) {
                var activeCount = 0;
                for (var panelIndex in context.unit_panels) {
                    var panel = context.unit_panels[panelIndex];
                    var unitErrors = errors.sub("[" + panel.units + "]");

                    var magnitudeHandler = ArchetypeEditor.getRmTypeHandler("C_REAL");
                    magnitudeHandler.validate(stage, panel.magnitude, unitErrors.sub("magnitude"));

                    if (panel.precision && panel.precision.length > 0) {
                        var val = parseInt(panel.precision);
                        unitErrors.validate(AmUtils.isInt(val), "Not a valid integer", "precision");
                    }
                    if (panel.active) activeCount++;
                }
                if (context.isTemplate && context.parent && context.parent.unit_panels.length > 0) {
                    errors.validate(activeCount, "At least one unit must be selected");
                }
            };
            handler.updateConstraint = function (stage, context, cons) {

                function getOrCreateBindingAndCode(propertyOpenEhrId) {
                    var tbs = stage.archetypeModel.data.terminology.term_bindings;
                    if (!tbs["openehr"]) {
                        tbs["openehr"] = {};
                    }

                    var openEhrTb = tbs["openehr"];
                    for (var atCode in openEhrTb) {
                        var url = openEhrTb[atCode];
                        var openEhrId = url.substring(url.lastIndexOf('/') + 1);
                        if (openEhrId === propertyOpenEhrId) {
                            return atCode;
                        }
                    }
                    atCode = stage.archetypeModel.generateSpecializedTermId('at');
                    openEhrTb[atCode] = "http://openehr.org/id/" + propertyOpenEhrId;
                    var property = stage.archetypeEditor.unitsModel.getPropertyFromOpenEhrId(propertyOpenEhrId);
                    stage.archetypeModel.setTermDefinition(atCode, undefined, property.label);
                    return atCode;

                }

                function updateProperty() {
                    stage.archetypeModel.removeAttribute(cons, 'property');
                    if (context.property && context.property !== propertyNotSetEhrId) {
                        var aProperty = stage.archetypeModel.addAttribute(cons, 'property');
                        var cProperty = AOM.newCTerminologyCode();
                        cProperty.constraint = getOrCreateBindingAndCode(context.property);
                        stage.archetypeModel.addConstraint(aProperty, cProperty);
                    }
                }

                updateProperty();

                stage.archetypeModel.removeAttribute(cons, ["units", "magnitude", "precision"]);

                cons.attribute_tuples = cons.attribute_tuples || [];
                var panels = Stream(context.unit_panels).filter({active: true}).toArray();
                if (panels.length > 0) {
                    var attributeTuple = AOM.newCAttributeTuple(["units", "magnitude", "precision"]);

                    for (var panelIndex in panels) {
                        var panel = panels[panelIndex];

                        var unitCons = AOM.newCString();
                        unitCons.constraint = [panel.units];
                        unitCons.default_value = panel.units;

                        var magnitudeCons = AOM.newCReal();
                        var magnitudeHandler = ArchetypeEditor.getRmTypeHandler("C_REAL");
                        magnitudeHandler.updateConstraint(stage, panel.magnitude, magnitudeCons);

                        var precisionCons = AOM.newCInteger();
                        if (panel.precision === "" || !panel.precision) {
                            precisionCons.constraint = [AmInterval.of(0, undefined, "INTERVAL_OF_INTEGER")];
                        } else {
                            precisionCons.constraint = [parseInt(panel.precision)];
                        }
                        attributeTuple.children.push(AOM.newCObjectTuple([unitCons, magnitudeCons, precisionCons]));
                    }
                    cons.attribute_tuples.push(attributeTuple);
                }
            };


        };
        AmUtils.extend(DvQuantityHandler, CComplexObjectHandler);


        var DvTextHandler = function () {
            var handler = this;
            CComplexObjectHandler.call(handler);


            function isParentConstrained(context) {
                return !!(context.parent && context.parent.type === 'DV_CODED_TEXT');
            }

            handler.createContext = function (stage, cons, parentCons) {
                cons = cons || {};
                var definingCodeCons = AOM.AmQuery.get(cons, "defining_code");
                var parentDefiningCodeCons = AOM.AmQuery.get(parentCons, "defining_code");

                var context = handler.createCommonContext(stage, cons, parentCons);
                context.type = cons && cons.rm_type_name ? cons.rm_type_name : "DV_TEXT";
                context.defining_code = stage.archetypeEditor.getRmTypeHandler("C_TERMINOLOGY_CODE")
                    .createContext(stage, definingCodeCons, parentDefiningCodeCons);

                context.isCoded = context.type === "DV_CODED_TEXT";

             /*   if(context.isCoded && context.defining_code.value_set_code != undefined)
                {
                    var selectedID = $('.treejsc').jstree('get_selected')[0];
                    if(selectedID){
                        var selected = $('.treejsc').jstree('get_node', selectedID);
                        if(context.isCoded && selected.text.indexOf(" <-- Coded text") == -1) $('.treejsc').jstree(true).rename_node(selected, selected.text + " <-- Coded text");
                        else if(!context.isCoded){
                            var nr = selected.text.indexOf(" <-- Coded text");
                            $('.treejsc').jstree(true).rename_node(selected, selected.text.slice(0,nr)+selected.text.slice(nr+15, selected.text.length));
                        }
                    }

                }*/
                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate(
                    "properties/constraint-openehr|DV_CODED_TEXT", context, function (generatedDom) {

                        generatedDom = $(generatedDom);
                        var codedTextCheckbox = generatedDom.find("#" + context.panel_id + "_coded_text");
                        var definingCodeDiv = generatedDom.find("#" + context.defining_code.panel_id);

                        codedTextCheckbox.prop('disabled', isParentConstrained(context));
                        codedTextCheckbox.prop('checked', context.isCoded);
                        GuiUtils.setVisible(definingCodeDiv, codedTextCheckbox.prop('checked'));
                        codedTextCheckbox.click(
                            function () {
                                context.isCoded = codedTextCheckbox.prop('checked');
                               /* var selectedID = $('.treejsc').jstree('get_selected')[0];
                                var selected = $('.treejsc').jstree('get_node', selectedID);
                                if(context.isCoded && selected.text.indexOf(" <-- Coded text") == -1) $('.treejsc').jstree(true).rename_node(selected, selected.text + " <-- Coded text");
                                else if(!context.isCoded){
                                    var nr = selected.text.indexOf(" <-- Coded text");
                                    $('.treejsc').jstree(true).rename_node(selected, selected.text.slice(0,nr)+selected.text.slice(nr+15, selected.text.length));
                                }*/
                                GuiUtils.setVisible(definingCodeDiv, context.isCoded);
                            });

                        stage.archetypeEditor.applySubModules(stage, generatedDom, context);
                        targetElement.append(generatedDom);
                    });
            };


            handler.updateContext = function (stage, context, targetElement) {
                stage.archetypeEditor.getRmTypeHandler("C_TERMINOLOGY_CODE")
                    .updateContext(stage, context.defining_code, targetElement.find('#' + context.defining_code.panel_id));

            };

            handler.validate = function (stage, context, errors) {
                if (context.isCoded) { // context is DV_CODED_TEXT
                    stage.archetypeEditor.getRmTypeHandler("C_TERMINOLOGY_CODE").validate(
                        stage, context.defining_code, errors.sub("defining_code"));
                }
            };

            handler.updateConstraint = function (stage, context, cons) {
                cons.rm_type_name = context.isCoded ? "DV_CODED_TEXT" : "DV_TEXT";

                if (context.isCoded) { // context is DV_CODED_TEXT
                    var cDefiningCode = AOM.AmQuery.get(cons, "defining_code");
                    if (!cDefiningCode) {
                        var aDefiningCode = AOM.newCAttribute("defining_code");
                        cDefiningCode = AOM.newCTerminologyCode();
                        aDefiningCode.children = [cDefiningCode];
                        cons.attributes = cons.attributes || [];
                        cons.attributes.push(aDefiningCode);
                    }
                    stage.archetypeEditor.getRmTypeHandler("C_TERMINOLOGY_CODE").updateConstraint(
                        stage, context.defining_code, cDefiningCode);

                } else { // context is DV_TEXT
                    stage.archetypeModel.removeAttribute(cons, ["defining_code"]);
                }
            };
        };
        AmUtils.extend(DvTextHandler, CComplexObjectHandler);

        var DvBooleanHandler = function () {
            var handler = this;
            CComplexObjectHandler.call(handler);

            handler.createContext = function (stage, cons, parentCons) {
                var valueCons = AOM.AmQuery.get(cons, "value");
                var parentValueCons = AOM.AmQuery.get(parentCons, "value");

                var context = handler.createCommonContext(stage, cons, parentCons);
                context.type = 'DV_BOOLEAN';
                context.value = stage.archetypeEditor.getRmTypeHandler("C_BOOLEAN").createContext(
                    stage, valueCons, parentValueCons);


                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate(
                    "properties/constraint-openehr|DV_BOOLEAN", context, function (generatedDom) {

                        generatedDom = $(generatedDom);
                        stage.archetypeEditor.applySubModules(stage, generatedDom, context);
                        targetElement.append(generatedDom);
                    });
            };

            handler.updateContext = function (stage, context, targetElement) {

                stage.archetypeEditor.getRmTypeHandler("C_BOOLEAN")
                    .updateContext(stage, context.value, targetElement.find('#' + context.value.panel_id));

            };

            handler.validate = function (stage, context, errors) {
                stage.archetypeEditor.getRmTypeHandler("C_BOOLEAN").validate(
                    stage, context.value, errors.sub("value"));
            };

            handler.updateConstraint = function (stage, context, cons) {
                stage.archetypeModel.removeAttribute(cons, "value");
                var aValue = AOM.newCAttribute("value");
                var cValue = AOM.newCBoolean();
                aValue.children = [cValue];
                cons.attributes = cons.attributes || [];
                cons.attributes.push(aValue);

                stage.archetypeEditor.getRmTypeHandler("C_BOOLEAN").updateConstraint(
                    stage, context.value, cValue);
            };
        };
        AmUtils.extend(DvBooleanHandler, CComplexObjectHandler);

        var DvCountHandler = function () {
            var handler = this;
            CComplexObjectHandler.call(handler);
            handler.createContext = function (stage, cons, parentCons) {
                var magnitudeCons = AOM.AmQuery.get(cons, "magnitude");
                var parentMagnitudeCons = AOM.AmQuery.get(parentCons, "magnitude");

                var context = handler.createCommonContext(stage, cons, parentCons);
                context.type = 'DV_COUNT';
                context.magnitude = stage.archetypeEditor.getRmTypeHandler("C_INTEGER").createContext(stage, magnitudeCons, parentMagnitudeCons);

                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate(
                    "properties/constraint-openehr|DV_COUNT", context, function (generatedDom) {

                        generatedDom = $(generatedDom);
                        stage.archetypeEditor.applySubModules(stage, generatedDom, context);
                        targetElement.append(generatedDom);
                    });
            };

            handler.updateContext = function (stage, context, targetElement) {
                stage.archetypeEditor.getRmTypeHandler("C_INTEGER")
                    .updateContext(stage, context.magnitude, targetElement.find('#' + context.magnitude.panel_id));

            };

            handler.validate = function (stage, context, errors) {
                stage.archetypeEditor.getRmTypeHandler("C_INTEGER").validate(
                    stage, context.magnitude, errors.sub("magnitude"));
            };

            handler.updateConstraint = function (stage, context, cons) {
                stage.archetypeModel.removeAttribute(cons, "magnitude");
                var aValue = AOM.newCAttribute("magnitude");
                var cValue = AOM.newCInteger();
                aValue.children = [cValue];
                cons.attributes = cons.attributes || [];
                cons.attributes.push(aValue);

                stage.archetypeEditor.getRmTypeHandler("C_INTEGER").updateConstraint(
                    stage, context.magnitude, cValue);
            };

        };
        AmUtils.extend(DvCountHandler, CComplexObjectHandler);

        var DvOrdinalHandler = function () {
            var handler = this;
            CComplexObjectHandler.call(handler);
            handler.createContext = function (stage, cons, parentCons) {

                var context = handler.createCommonContext(stage, cons, parentCons);
                context.type = 'DV_ORDINAL';
                context.values = [];
                context.assumed_value = cons.assumed_value;

                var tuples = stage.archetypeModel.getAttributesTuple(cons, ["value", "symbol"]);
                var parentTuples = parentCons ? stage.archetypeModel.parentArchetypeModel.getAttributesTuple(parentCons, ["value", "symbol"]) : undefined;
                if (context.isParentConstrained) {
                    for (var i in parentTuples) {
                        var parentTuple = parentTuples[i];
                        var specializedTuple = Stream(tuples).filter(function (d) {
                            return d["value"].constraint[0] === parentTuple["value"].constraint[0];
                        }).findFirst().orElse();
                        var tuple = specializedTuple || parentTuple;
                        //var parentTuple = parentTuples && parentTuples[i];
                        var term = stage.archetypeModel.getTermDefinition(tuple["symbol"].constraint);
                        var value = {
                            active: !!specializedTuple,
                            value: tuple ["value"].constraint[0],
                            term_id: tuple["symbol"].constraint[0],
                            term: term
                        };
                        context.values.push(value);
                    }
                } else {
                    for (var i in tuples) {
                        var tuple = tuples[i];
                        //var parentTuple = parentTuples && parentTuples[i];
                        var term = stage.archetypeModel.getTermDefinition(tuple["symbol"].constraint);
                        var value = {
                            active: true,
                            value: tuple["value"].constraint[0],
                            term_id: tuple["symbol"].constraint,
                            term: term
                        };
                        context.values.push(value);
                    }
                }

                return context;
            };

            handler.show = function (stage, context, targetElement) {
                function getAvailableInternalTerms() {
                    var allTerminologyCodes = stage.archetypeModel.getAllTerminologyDefinitionsWithPrefix("at");
                    var result = {};
                    var presentCodes = AmUtils.listToSet(Stream(context.values).map("term_id").toArray());

                    for (var code in allTerminologyCodes) {
                        if (!presentCodes[code]) {
                            result[code] = allTerminologyCodes[code];
                        }
                    }
                    return result;
                }


                function populateValuesSelect(valuesSelect, hasEmptyOption) {
                    context.values = Stream(context.values).sorted("value").toArray();

                    var oldval = valuesSelect.val();
                    valuesSelect.empty();
                    if (hasEmptyOption) {
                        valuesSelect.append($("<option>").attr("value", ""));
                    }
                    for (var i in context.values) {
                        var value = context.values[i];
                        var option = $("<option>")
                            .attr("value", value.term_id)
                            .attr("title", value.term_id + ": " + value.term.description)
                            .text(value.value + ": " + value.term.text);
                        valuesSelect.append(option);
                    }
                    valuesSelect.val(oldval);
                }


                GuiUtils.applyTemplate(
                    "properties/constraint-openehr|DV_ORDINAL", context, function (html) {
                        html = $(html);
                        targetElement.append(html);


                        if (context.isParentConstrained) {
                            var activeValuesOptions = {
                                title: "Active Values",
                                items: [],
                                targetElement: html.find("#" + context.panel_id + "_ordinal_checkbox_container")
                            };
                            for (var i in context.values) {
                                var contextValue = context.values[i];
                                activeValuesOptions.items.push({
                                    label: contextValue.term.text + ": " + stage.archetypeModel.getTermDefinitionText(contextValue.term_id, stage.language),
                                    checked: contextValue.active,
                                    code: contextValue.term_id
                                });
                            }
                            var activeValuesCheckboxList = new GuiUtils.DropDownCheckboxList(activeValuesOptions);
                            activeValuesCheckboxList.onChange(function () {
                                var checks = activeValuesCheckboxList.getItemSelectionList();
                                for (var i in context.values) {
                                    context.values[i].active = checks[i];
                                }
                            });
                        }
                        var valuesSelect = targetElement.find("#" + context.panel_id + "_values");
                        populateValuesSelect(valuesSelect);

                        targetElement.find('#' + context.panel_id + "_add_new_value").click(function () {
                            stage.archetypeEditor.openAddNewTermDefinitionDialog(
                                stage.archetypeModel, function (nodeId) {
                                    var term = stage.archetypeModel.getTermDefinition(nodeId);
                                    var nextValue = Stream(context.values).map("value").max().orElse(0) + 1;
                                    context.values.push(
                                        {
                                            value: nextValue,
                                            term_id: nodeId,
                                            term: term
                                        });
                                    populateValuesSelect(valuesSelect);
                                })

                        });

                        targetElement.find('#' + context.panel_id + "_remove_value").click(function () {
                            var option = valuesSelect.find(":selected");
                            if (option.length > 0) {
                                var nodeId = option.val();
                                option.remove();
                                context.values = Stream(context.values).filter(function (value) {
                                    return value.term_id !== nodeId
                                }).toArray(); // remove value with deleted nodeId
                                populateValuesSelect(valuesSelect);
                            }
                        });
                        targetElement.find('#' + context.panel_id + "_add_existing_value").click(function () {
                            var dialogContext = {
                                terms: getAvailableInternalTerms()
                            };
                            if ($.isEmptyObject(dialogContext.terms)) return;

                            stage.archetypeEditor.openAddExistingTermsDialog(stage.archetypeModel, dialogContext, function (selectedTerms) {
                                var nextValue = Stream(context.values).map("value").max().orElse(0) + 1;

                                for (var i in selectedTerms) {
                                    var nodeId = selectedTerms[i];
                                    var term = stage.archetypeModel.getTermDefinition(nodeId);
                                    context.values.push(
                                        {
                                            value: nextValue++,
                                            term_id: nodeId,
                                            term: term
                                        }
                                    );
                                }
                                populateValuesSelect(valuesSelect);
                            });
                        });

                        targetElement.find('#' + context.panel_id + "_edit_value").click(function () {
                            var option = valuesSelect.find(":selected");
                            if (option.length === 0) return;

                            var dialogContext = {
                                id: GuiUtils.generateId()
                            };
                            dialogContext.value = Stream(context.values).filter(function (value) {
                                return value.term_id === valuesSelect.val();
                            }).findFirst().orElse(undefined);

                            GuiUtils.applyTemplate(
                                "properties/constraint-openehr|DV_ORDINAL/editValue",
                                dialogContext, function (content) {
                                    content = $(content);
                                    GuiUtils.openSimpleDialog(
                                        {
                                            title: "Edit ordinal value",
                                            buttons: {"update": "Update"},
                                            content: content,
                                            callback: function () {
                                                var valueInput = content.find('#' + dialogContext.id + "_value");
                                                var newValue = parseInt(valueInput.val());
                                                if (isNaN(newValue) || valueInput.val().indexOf(".") >= 0) {
                                                    return "ordinal value must be an integer";
                                                }
                                                var existingValue = Stream(context.values).filter(function (value) {
                                                    return value.value === newValue;
                                                }).findFirst().orElse(undefined);

                                                if (existingValue && dialogContext.value.term_id !== existingValue.term_id) {
                                                    return "value is already used by another term '" + existingValue.term.text + "'";
                                                }

                                                dialogContext.value.value = newValue;
                                                populateValuesSelect(valuesSelect);
                                            }
                                        });
                                });

                        });
                    });
            };

            handler.updateContext = function (stage, context, targetElement) {
                // context is updated on the fly in show
            };

            handler.updateConstraint = function (stage, context, cons) {
                stage.archetypeModel.removeAttribute(cons, ["value", "symbol"]);

                cons.attribute_tuples = cons.attribute_tuples || [];
                if (context.values.length > 0) {
                    var attributeTuple = AOM.newCAttributeTuple(["value", "symbol"]);

                    for (var i in context.values) {
                        var contextValue = context.values[i];
                        if (!contextValue.active) continue;

                        var valueCons = AOM.newCInteger([contextValue.value]);

                        var symbolCons = AOM.newCTerminologyCode();
                        symbolCons.constraint = contextValue.term_id;

                        attributeTuple.children.push(AOM.newCObjectTuple([valueCons, symbolCons]));
                    }
                    cons.attribute_tuples.push(attributeTuple);
                }

            };

        };
        AmUtils.extend(DvOrdinalHandler, CComplexObjectHandler);

        var DvDurationHandler = function () {
            var handler = this;
            CComplexObjectHandler.call(handler);

            handler.createContext = function (stage, cons, parentCons) {
                var valueCons = AOM.AmQuery.get(cons, "value");
                var parentValueCons = AOM.AmQuery.get(parentCons, "value");

                var context = handler.createCommonContext(stage, cons, parentCons);
                context.type = 'DV_DURATION';
                context.value = stage.archetypeEditor.getRmTypeHandler("C_DURATION").createContext(stage, valueCons, parentValueCons);

                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate(
                    "properties/constraint-openehr|DV_DURATION", context, function (generatedDom) {

                        generatedDom = $(generatedDom);
                        stage.archetypeEditor.applySubModules(stage, generatedDom, context);
                        targetElement.append(generatedDom);
                    });
            };

            handler.updateContext = function (stage, context, targetElement) {
                stage.archetypeEditor.getRmTypeHandler("C_DURATION")
                    .updateContext(stage, context.value, targetElement.find('#' + context.value.panel_id));

            };

            handler.validate = function (stage, context, errors) {
                stage.archetypeEditor.getRmTypeHandler("C_DURATION").validate(
                    stage, context.value, errors.sub("value"));
            };

            handler.updateConstraint = function (stage, context, cons) {
                stage.archetypeModel.removeAttribute(cons, "value");

                var cValue = AOM.newCDuration();
                var aValue = AOM.newCAttribute("value");
                aValue.children = [cValue];
                cons.attributes = cons.attributes || [];
                cons.attributes.push(aValue);

                stage.archetypeEditor.getRmTypeHandler("C_DURATION").updateConstraint(
                    stage, context.value, cValue);
            };

        };
        AmUtils.extend(DvDurationHandler, CComplexObjectHandler);

        var DvIdentifierHandler = function () {
            var handler = this;
            CComplexObjectHandler.call(handler);

            handler.createContext = function (stage, cons, parentCons) {
                var context = handler.createCommonContext(stage, cons, parentCons);
                context.type = 'DV_IDENTIFIER';

                var issuerCons = AOM.AmQuery.get(cons, "issuer");
                var typeCons = AOM.AmQuery.get(cons, "type");
                var assignerCons = AOM.AmQuery.get(cons, "assigner");
                if (issuerCons) {
                    context.issuerPattern = issuerCons.pattern;
                }
                if (typeCons) {
                    context.typePattern = typeCons.pattern;
                }
                if (assignerCons) {
                    context.assignerPattern = assignerCons.pattern;
                }

                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate(
                    "properties/constraint-openehr|DV_IDENTIFIER", context, function (generatedDom) {
                        generatedDom = $(generatedDom);
                        stage.archetypeEditor.applySubModules(stage, generatedDom, context);
                        targetElement.append(generatedDom);
                    });
            };

            handler.updateContext = function (stage, context, targetElement) {
                context.issuerPattern = targetElement.find('#' + context.panel_id + '_issuer').val();
                context.typePattern = targetElement.find('#' + context.panel_id + '_type').val();
                context.assignerPattern = targetElement.find('#' + context.panel_id + '_assigner').val();
            };

            handler.updateConstraint = function (stage, context, cons) {
                function addAttribute(pattern, attributeName) {
                    if (pattern && pattern.length > 0) {
                        var attr = AOM.newCAttribute(attributeName);
                        var cstr = AOM.newCString(undefined, pattern);
                        attr.children = [cstr];
                        cons.attributes = cons.attributes || [];
                        cons.attributes.push(attr);
                    }
                }

                stage.archetypeModel.removeAttribute(["issuer", "type", "assigner"]);

                addAttribute(context.issuerPattern, "issuer");
                addAttribute(context.typePattern, "type");
                addAttribute(context.assignerPattern, "assigner");
            };

        };
        AmUtils.extend(DvIdentifierHandler, CComplexObjectHandler);


        var DvDateTimeHandler = function () {
            var handler = this;
            CComplexObjectHandler.call(handler);

            handler.createContext = function (stage, cons, parentCons) {
                var valueCons = AOM.AmQuery.get(cons, "value");
                var parentValueCons = AOM.AmQuery.get(parentCons, "value");

                var type = cons ? cons.rm_type_name : 'DV_DATE_TIME';

                var context = handler.createCommonContext(stage, cons, parentCons);
                context.type = type;
                context.value = stage.archetypeEditor.getRmTypeHandler('C_DATE_TIME').createContext(stage, valueCons, parentValueCons);

                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate(
                    "properties/constraint-openehr|DV_DATE_TIME", context, function (generatedDom) {
                        generatedDom = $(generatedDom);

                        stage.archetypeEditor.applySubModules(stage, generatedDom, context);
                        targetElement.append(generatedDom);
                    });
            };

            handler.hide = function (stage, context, targetElement) {
                var dateTimeHandler = stage.archetypeEditor.getRmTypeHandler('C_DATE_TIME');
                if (dateTimeHandler.hide) {
                    dateTimeHandler.hide(stage, context.value, targetElement.find('#' + context.value.panel_id));
                }
            };

            handler.updateContext = function (stage, context, targetElement) {
                stage.archetypeEditor.getRmTypeHandler("C_DATE_TIME")
                    .updateContext(stage, context.value, targetElement.find('#' + context.value.panel_id));

            };

            handler.validate = function (stage, context, errors) {
                stage.archetypeEditor.getRmTypeHandler("C_DATE_TIME").validate(
                    stage, context.value, errors.sub("value"));
            };

            handler.updateConstraint = function (stage, context, cons) {
                var primitiveToDvMap = {
                    "C_DATE": "DV_DATE",
                    "C_DATE_TIME": "DV_DATE_TIME",
                    "C_TIME": "DV_TIME"
                };

                var cValue = AOM.AmQuery.get(cons, "value");
                if (!cValue) {
                    cValue = AOM.newCDateTime();
                    var aValue = AOM.newCAttribute("value");
                    aValue.children = [cValue];
                    cons.attributes = cons.attributes || [];
                    cons.attributes.push(aValue);
                }

                stage.archetypeEditor.getRmTypeHandler("C_DATE_TIME").updateConstraint(
                    stage, context.value, cValue);
                cons.rm_type_name = primitiveToDvMap[cValue.rm_type_name];
            };
        };
        AmUtils.extend(DvDateTimeHandler, CComplexObjectHandler);

        var DvProportionHandler = function () {
            var handler = this;
            CComplexObjectHandler.call(handler);

            var Kind = {
                ratio: {value: 0, denominator: true},
                unitary: {value: 1, denominator: false},
                percent: {value: 2, denominator: false},
                fraction: {value: 3, denominator: true},
                integer_fraction: {value: 4, denominator: true}
            };

            function hasDenominator(context) {
                for (var k in Kind) {
                    if (context.kinds[k]) {
                        var kind = Kind[k];
                        if (kind.denominator) {
                            return true;
                        }
                    }
                }
                return false;
            }

            function getKindsType(context) {
                var any = false;
                var all = true;
                for (var k in Kind) {
                    if (context.kinds[k]) {
                        any = true;
                    } else {
                        all = false;
                    }
                }
                if (!any) return 'none';
                if (!all) return 'some';
                return 'all';
            }

            function getKindsList(context) {
                var result = [];
                for (var k in Kind) {
                    if (context.kinds[k]) {
                        result.push(Kind[k].value);
                    }
                }
                return result;
            }


            handler.createContext = function (stage, cons, parentCons) {
                var numeratorCons = AOM.AmQuery.get(cons, "numerator");
                var parentNumeratorCons = AOM.AmQuery.get(parentCons, "numerator");
                var denominatorCons = AOM.AmQuery.get(cons, "denominator");
                var parentDenominatorCons = AOM.AmQuery.get(parentCons, "denominator");

                var type = cons ? cons.rm_type_name : 'DV_PROPORTION';

                var context = handler.createCommonContext(stage, cons, parentCons);
                context.type = type;
                context.numerator = stage.archetypeEditor.getRmTypeHandler('C_REAL').createContext(stage, numeratorCons, parentNumeratorCons);
                context.denominator = stage.archetypeEditor.getRmTypeHandler('C_REAL').createContext(stage, denominatorCons, parentDenominatorCons);

                var cIsIntegral = AOM.AmQuery.get(cons, "is_integral");
                context.is_integral = cIsIntegral ? (cIsIntegral.true_valid ? 'true' : 'false') : '';
                var cType = AOM.AmQuery.get(cons, 'type');

                if (cType && cType.list && cType.list.length > 0) {
                    context.kinds = {};
                    for (var k in Kind) {
                        context.kinds[k] = cType.list.indexOf(Kind[k].value) >= 0;
                    }
                } else {
                    context.kinds = {};
                    for (var k in Kind) {
                        context.kinds[k] = true;
                    }
                }

                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate(
                    "properties/constraint-openehr|DV_PROPORTION", context, function (generatedDom) {
                        function applyContextKindsToCheckboxes(checkboxes) {
                            var prefix = context.panel_id + "_kind_";
                            for (var i = 0; i < checkboxes.length; i++) {
                                var checkbox = $(checkboxes[i]);
                                var kind = checkbox.attr('id').substring(prefix.length);
                                checkbox.prop('checked', context.kinds[kind]);
                            }
                        }

                        function updateVisibilityFromContext() {
                            var tabsElement = generatedDom.filter('#' + context.panel_id + "_tabs");
                            var numeratorElement = tabsElement.find('a[href="#' + context.numerator.panel_id + '"]');
                            var denominatorElement = tabsElement.find('a[href="#' + context.denominator.panel_id + '"]');
                            if (hasDenominator(context)) {
                                GuiUtils.setVisible(denominatorElement, true);
                            } else {
                                numeratorElement.tab('show');
                                GuiUtils.setVisible(denominatorElement, false);
                            }
                        }

                        function applyKindsCheckboxesToContext(checkboxes) {
                            var prefix = context.panel_id + "_kind_";
                            for (var i = 0; i < checkboxes.length; i++) {
                                var checkbox = $(checkboxes[i]);
                                var kind = checkbox.attr('id').substring(prefix.length);
                                context.kinds[kind] = checkbox.prop('checked');
                            }
                        }

                        generatedDom = $(generatedDom);

                        stage.archetypeEditor.applySubModules(stage, generatedDom, context);
                        targetElement.append(generatedDom);

                        generatedDom.find('#' + context.panel_id + '_integral').val(context.is_integral);

                        var checkboxes = generatedDom.find('#' + context.panel_id + "_kinds_panel").find('input');
                        applyContextKindsToCheckboxes(checkboxes);
                        updateVisibilityFromContext();

                        checkboxes.change(function () {
                            applyKindsCheckboxesToContext(checkboxes);
                            updateVisibilityFromContext();
                        });

                    });
            };

            handler.updateContext = function (stage, context, targetElement) {
                context.is_integral = targetElement.find('#' + context.panel_id + "_integral").val();

                stage.archetypeEditor.applySubModulesUpdateContext(stage, targetElement, context);
            };

            handler.validate = function (stage, context, errors) {
                var kindsType = getKindsType(context);
                if (kindsType === 'none') {
                    errors.add('At least one proportion kind is required', 'kinds');
                }
                stage.archetypeEditor.getRmTypeHandler("C_REAL").validate(
                    stage, context.numerator, errors.sub("numerator"));

                if (hasDenominator(context)) {
                    stage.archetypeEditor.getRmTypeHandler("C_REAL").validate(
                        stage, context.denominator, errors.sub("denominator"));
                }

            };

            handler.updateConstraint = function (stage, context, cons) {

                stage.archetypeModel.removeAttribute(cons, ['type', 'is_integral', 'numerator', 'denominator']);

                var kindsType = getKindsType(context);
                if (kindsType === 'some') {
                    addAttributeConstraint(cons, 'type', AOM.newCInteger(getKindsList(context)));
                }

                var cNumerator = addAttributeConstraint(cons, 'numerator', AOM.newCReal());

                stage.archetypeEditor.getRmTypeHandler("C_REAL").updateConstraint(
                    stage, context.numerator, cNumerator);
                if (hasDenominator(context)) {
                    var cDenominator = addAttributeConstraint(cons, 'denominator', AOM.newCReal());

                    stage.archetypeEditor.getRmTypeHandler("C_REAL").updateConstraint(
                        stage, context.denominator, cDenominator);
                }

                if (context.is_integral && context.is_integral.length > 0) {
                    var cIntegral = AOM.newCBoolean();
                    var isIntegral = context.is_integral === 'true';
                    cIntegral.true_valid = isIntegral;
                    cIntegral.false_valid = !isIntegral;
                    addAttributeConstraint(cons, 'is_integral', cIntegral);
                }
            };
        };
        AmUtils.extend(DvProportionHandler, CComplexObjectHandler);

        var DvIntervalHandler = function () {
            var handler = this;
            CComplexObjectHandler.call(handler);

            function parseGenericRmTypeName(rm_type) {
                var ltPos = rm_type.indexOf('<');
                var gtPos = rm_type.lastIndexOf('>');
                var result = {};
                result.main = rm_type.substring(0, ltPos);
                result.param = rm_type.substring(ltPos + 1, gtPos);
                return result;
            }


            handler.createContext = function (stage, cons, parentCons) {

                var context = handler.createCommonContext(stage, cons, parentCons);
                var genericRmType = parseGenericRmTypeName(cons.rm_type_name);

                var lowerCons = AOM.AmQuery.get(cons, "lower");
                var parentLowerCons = AOM.AmQuery.get(parentCons, "lower");
                var upperCons = AOM.AmQuery.get(cons, "upper");
                var parentUpperCons = AOM.AmQuery.get(parentCons, "upper");

                if (!lowerCons) lowerCons = AOM.newCComplexObject(genericRmType.param);
                if (!upperCons) upperCons = AOM.newCComplexObject(genericRmType.param);

                context.lower = stage.archetypeEditor.getRmTypeHandler(lowerCons.rm_type_name)
                    .createContext(stage, lowerCons, parentLowerCons);
                context.upper = stage.archetypeEditor.getRmTypeHandler(upperCons.rm_type_name)
                    .createContext(stage, upperCons, parentUpperCons);

                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate(
                    "properties/constraint-openehr|DV_INTERVAL", context, function (generatedDom) {
                        generatedDom = $(generatedDom);
                        targetElement.append(generatedDom);
                        stage.archetypeEditor.applySubModules(stage, targetElement, context);
                    });
            };

            handler.updateContext = function (stage, context, targetElement) {
                stage.archetypeEditor.applySubModulesUpdateContext(stage, targetElement, context);
            };

            handler.validate = function (stage, context, errors) {
                stage.archetypeEditor.getRmTypeHandler(context.lower.type).validate(stage, context.lower, errors.sub('lower'));
                stage.archetypeEditor.getRmTypeHandler(context.upper.type).validate(stage, context.upper, errors.sub('upper'));
            };

            handler.updateConstraint = function (stage, context, cons) {
                var boundHandler = stage.archetypeEditor.getRmTypeHandler(context.lower.type);

                stage.archetypeModel.removeAttribute(cons, ['lower', 'upper']);
                cons.attributes = cons.attributes || [];
                var lowerAttr = AOM.newCAttribute('lower');
                lowerAttr.children = [AOM.newCComplexObject(context.lower.type)];
                var upperAttr = AOM.newCAttribute('upper');
                upperAttr.children = [AOM.newCComplexObject(context.upper.type)];

                cons.attributes.push(lowerAttr);
                cons.attributes.push(upperAttr);

                boundHandler.updateConstraint(stage, context.lower, lowerAttr.children[0]);
                boundHandler.updateConstraint(stage, context.upper, upperAttr.children[0]);
            };
        };
        AmUtils.extend(DvIntervalHandler, CComplexObjectHandler);


        var ElementHandler = function () {
            var handler = this;
            CComplexObjectHandler.call(handler);


            var dataValues = {
                data: {
                    "DV_TEXT": "Text",
                    "DV_BOOLEAN": "Boolean",
                    "DV_ORDINAL": "Ordinal",
                    "DV_COUNT": "Count",
                    "DV_QUANTITY": "Quantity",
                    "DV_DATE_TIME": "DateTime",
                    "DV_DURATION": "Duration",
                    "DV_MULTIMEDIA": "Multimedia",
                    "DV_URI": "Uri",
                    "DV_PROPORTION": "Proportion",
                    "DV_IDENTIFIER": "Identifier",
                    "DV_PARSABLE": "Parsable",

                    "DV_INTERVAL<DV_COUNT>": "Interval: Count",
                    "DV_INTERVAL<DV_QUANTITY>": "Interval: Quantity",
                    "DV_INTERVAL<DV_DATE_TIME>": "Interval: DateTime"
                },

                aliases: {
                    "DV_CODED_TEXT": "DV_TEXT",
                    "DV_DATE": "DV_DATE_TIME",
                    "DV_TIME": "DV_DATE_TIME",
                    "DV_INTERVAL<DV_DATE>": "DV_INTERVAL<DV_DATE_TIME>",
                    "DV_INTERVAL<DV_TIME>": "DV_INTERVAL<DV_DATE_TIME>"
                },

                getText: function (rmType) {
                    var text = this.data[rmType];
                    if (text) return text;
                    var dataType = this.aliases[rmType];
                    if (!dataType) return rmType;
                    text = this.data[dataType];
                    if (text) return text;
                    return rmType;
                }
            };


            handler.createContext = function (stage, cons, parentCons) {
                var valueConses = AOM.AmQuery.findAll(cons, "value");

                var context = handler.createCommonContext(stage, cons, parentCons);
                context.type = 'ELEMENT';
                context.values = [];
                context.isTemplateChoice = context.isParentConstrained && context.parent.values.length !== 1;
                if (context.isTemplateChoice) {
                    var parentValueConses = AOM.AmQuery.findAll(parentCons, "value");
                    if (parentValueConses.length > 0) {
                        for (var i in parentValueConses) {
                            var parentValueCons = parentValueConses[i];
                            var specializedValueCons = AOM.AmQuery.get(cons, "value[" + parentValueCons.node_id + "]", {matchSpecialized: true});
                            var valueCons = specializedValueCons || AOM.impoverishedClone(parentValueCons);

                            var valueHandler = stage.archetypeEditor.getRmTypeHandler(valueCons.rm_type_name);
                            context.values.push({
                                active: !!specializedValueCons,
                                rmType: valueCons.rm_type_name,
                                cons: specializedValueCons,
                                parentCons: parentValueCons,
                                context: valueHandler ? valueHandler.createContext(stage, valueCons, specializedValueCons ? parentValueCons : undefined) : undefined
                            });
                        }
                    } else {
                        var types = AmUtils.keys(dataValues.data).concat(AmUtils.keys(dataValues.aliases)).sort();
                        var noConstraints = AOM.AmQuery.findAll(cons, "value").length === 0;
                        for (var i in types) {
                            var rmType = types[i];

                            var specializedValueCons = Stream(valueConses).filter(function (d) {
                                return d.rm_type_name === rmType;
                            }).findFirst().orElse();

                            context.values.push({
                                active: noConstraints || !!specializedValueCons,
                                rmType: rmType,
                                cons: specializedValueCons
                            });
                        }
                    }
                }
                else {
                    for (var i in valueConses) {
                        var valueCons = valueConses[i];
                        var valueHandler = stage.archetypeEditor.getRmTypeHandler(valueCons.rm_type_name);
                        var parentValueCons = AOM.AmQuery.get(parentCons, "value[" + valueCons.node_id + "]", {matchParent: true});
                        context.values.push({
                            active: true,
                            rmType: valueCons.rm_type_name,
                            cons: valueCons,
                            parentCons: parentValueCons,
                            context: valueHandler ? valueHandler.createContext(stage, valueCons, parentValueCons) : undefined
                        });
                    }
                }

                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate(
                    "properties/constraint-openehr|ELEMENT", context, function (generatedDom) {
                        generatedDom = $(generatedDom);

                        function createValueDiv(val) {
                            var valueHandler = stage.archetypeEditor.getRmTypeHandler(val.rmType);
                            var div = $("<div class='horizontal-stretch'>");
                            if (valueHandler) {
                                valueHandler.show(stage, val.context, div);
                            }
                            return div;
                        }

                        function showSelectedDiv() {
                            var selectedIndex = Number(typeSelect.val());
                            for (var i in context.values) {
//                                var val = context.values[i];
                                GuiUtils.setVisible(valueDivs[i], Number(i) === selectedIndex);
                            }
                        }

                        function populateTypeSelect() {
                            var oldVal = typeSelect.val();
                            var hasOldVal = false, first = undefined;
                            typeSelect.empty();
                            for (var i in context.values) {
                                var val = context.values[i];
                                typeSelect.append($("<option>").attr("value", i).text(dataValues.getText(val.rmType)));
                                if (oldVal === i) hasOldVal = true;
                                if (first === undefined) first = val.rmType;
                            }
                            typeSelect.val(hasOldVal ? oldVal : first);
                        }

                        function addDataValue(rmType) {
                            var valueHandler = stage.archetypeEditor.getRmTypeHandler(rmType);

                            var val = {};
                            val.rmType = rmType;
                            val.cons = {rm_type_name: rmType};
                            val.context = valueHandler.createContext(stage, val.cons, undefined);
                            context.values.push(val);
                            var valueDiv = createValueDiv(val);
                            valueDivs.push(valueDiv);
                            valueContainer.append(valueDiv);

                            populateTypeSelect();
                            typeSelect.val(context.values.length - 1);
                            showSelectedDiv();
                        }

                        function openAddDataValueDialog() {
                            var dialogContext = {
                                panel_id: GuiUtils.generateId()
                            };
                            GuiUtils.applyTemplate("properties/constraint-openehr|ELEMENT/addDataValue", dialogContext, function (dialogContent) {

                                function populateDataValuesSelect() {
                                    dataValuesSelect.empty();
                                    var first;
                                    for (var rmType in dataValues.data) {
                                        if (!first) first = rmType;
                                        dataValuesSelect.append($("<option>").attr("value", rmType).text(dataValues.getText(rmType)));
                                    }
                                    dataValuesSelect.val(first);
                                }

                                dialogContent = $(dialogContent);
                                var dataValuesSelect = dialogContent.find('#' + dialogContext.panel_id + '_dataValues');
                                populateDataValuesSelect();

                                GuiUtils.openSimpleDialog(
                                    {
                                        title: "Add Data Value",
                                        buttons: {"add": "Add"},
                                        content: dialogContent,
                                        callback: function () {
                                            var rmType = dataValuesSelect.val();
                                            addDataValue(rmType);
                                        }
                                    });

                            });
                        }

                        function removeSelectedDataType() {
                            var selected = typeSelect.val();
                            if (selected === null) return;
                            selected = Number(selected);
                            context.values.splice(selected, 1);
                            var valueDiv = valueDivs[selected];
                            valueDiv.remove();
                            valueDivs.splice(selected, 1);

                            populateTypeSelect();
                            showSelectedDiv();
                        }

                        if (context.isTemplateChoice) {
                            var activeDvsOptions = {
                                title: "Active DVs",
                                items: [],
                                targetElement: generatedDom.find("#" + context.panel_id + "_active_dv_container")
                            };
                            for (var i in context.values) {
                                var contextValue = context.values[i];
                                activeDvsOptions.items.push({
                                    label: contextValue.rmType,
                                    checked: contextValue.active,
                                    code: contextValue.cons ? contextValue.cons.node_id : undefined
                                });
                            }
                            var activeDvsCheckboxList = new GuiUtils.DropDownCheckboxList(activeDvsOptions);
                            activeDvsCheckboxList.onChange(function () {
                                var checks = activeDvsCheckboxList.getItemSelectionList();
                                for (var i in context.values) {
                                    context.values[i].active = checks[i];
                                }
                            });
                            targetElement.append(generatedDom);
                            return;
                        }


                        var typeSelect = generatedDom.find('#' + context.panel_id + '_type');
                        var addTypeButton = generatedDom.find('#' + context.panel_id + '_addType');
                        var removeTypeButton = generatedDom.find('#' + context.panel_id + '_removeType');

                        var valueContainer = generatedDom.find('#' + context.panel_id + '_valueContainer');
                        var valueDivs = [];


                        for (var i in context.values) {
                            var val = context.values[i];
                            var valueDiv = createValueDiv(val);
                            valueDivs.push(valueDiv);
                            valueContainer.append(valueDiv);
                        }
                        populateTypeSelect();
                        showSelectedDiv();
                        typeSelect.on('change', showSelectedDiv);

                        addTypeButton.on('click', openAddDataValueDialog);
                        removeTypeButton.on('click', removeSelectedDataType);

                        targetElement.append(generatedDom);
                    });
            };

            handler.updateContext = function (stage, context, targetElement) {
                if (context.isTemplateChoice) return;

                var valueContainer = targetElement.find('#' + context.panel_id + '_valueContainer');

                for (var i in context.values) {
                    var val = context.values[i];
                    var typeHandler = stage.archetypeEditor.getRmTypeHandler(val.rmType);
                    if (typeHandler) {
                        typeHandler.updateContext(stage, val.context, valueContainer);
                    }
                }

            };

            handler.validate = function (stage, context, errors) {
                if (context.isTemplateChoice) return;

                for (var i in context.values) {
                    var val = context.values[i];
                    var typeHandler = stage.archetypeEditor.getRmTypeHandler(val.rmType);
                    if (typeHandler) {
                        typeHandler.validate(stage, val.context, errors.sub(val.rmType + "[" + i + "]"));
                    }
                }
            };

            handler.updateConstraint = function (stage, context, cons) {
                if (context.isTemplateChoice) {
                    var allMatch = Stream(context.values).allMatch({active: true});

                    var valueAttr = stage.archetypeModel.getAttribute(cons, "value")
                        || stage.archetypeModel.addAttribute(cons, "value");

                    for (var i in context.values) {
                        var value = context.values[i];
                        if (!allMatch && value.active) {
                            if (!value.cons) {
                                if (value.parentCons) {
                                    value.cons = AOM.impoverishedClone(value.parentCons);
                                    value.cons.node_id = stage.archetypeModel.generateSpecializedTermId(value.parentCons.node_id);
                                    stage.archetypeModel.addConstraint(valueAttr, value.cons);
                                } else {
                                    value.cons = AOM.newConstraint(value.rmType, stage.archetypeModel.generateSpecializedTermId("id"));
                                    stage.archetypeModel.addConstraint(valueAttr, value.cons);
                                }
                            }
                        } else {
                            if (value.cons) {
                                stage.archetypeModel.removeConstraint(value.cons, true);
                                value.cons = undefined;
                            }
                        }
                    }
                    return;
                }
                // remove value constraints that have been removed from value
                var retainedNodeIds = AmUtils.listToSet(Stream(context.values)
                    .filter(function (v) {
                        return v.cons && v.cons.node_id
                    })
                    .map("cons.node_id").toArray());

                var valueAttr = stage.archetypeModel.getAttribute(cons, "value");
                if (valueAttr) {
                    var toRemove = Stream(valueAttr.children).filter(function (c) {
                        return !retainedNodeIds[c.node_id]
                    }).toArray();
                    for (var i in toRemove) {
                        stage.archetypeModel.removeConstraint(toRemove[i], true);
                    }
                }


                // add/update constraints
                for (var i in context.values) {
                    var val = context.values[i];
                    var typeHandler = stage.archetypeEditor.getRmTypeHandler(val.rmType);
                    if (typeHandler) {
                        if (!val.cons.node_id) {
                            // create new constraint if added on context
                            val.cons = AOM.newCComplexObject(val.rmType, stage.archetypeModel.generateSpecializedTermId("id"));
                            var valueAttr = stage.archetypeModel.getAttribute(cons, "value");
                            if (!valueAttr) {
                                valueAttr = stage.archetypeModel.addAttribute(cons, "value");
                            }
                            stage.archetypeModel.addConstraint(valueAttr, val.cons);
                        }
                        typeHandler.updateConstraint(stage, val.context, val.cons);
                    }
                }

            };
        };


        self.handlers["DV_QUANTITY"] = new DvQuantityHandler();
        self.handlers["DV_CODED_TEXT"] = new DvTextHandler();
        self.handlers["DV_TEXT"] = self.handlers["DV_CODED_TEXT"];
        self.handlers["DV_BOOLEAN"] = new DvBooleanHandler();
        self.handlers["DV_COUNT"] = new DvCountHandler();
        self.handlers["DV_ORDINAL"] = new DvOrdinalHandler();
        self.handlers["DV_DURATION"] = new DvDurationHandler();
        self.handlers["DV_IDENTIFIER"] = new DvIdentifierHandler();
        self.handlers["DV_DATE_TIME"] = new DvDateTimeHandler();
        self.handlers["DV_DATE"] = self.handlers["DV_DATE_TIME"];
        self.handlers["DV_TIME"] = self.handlers["DV_DATE_TIME"];
        self.handlers["DV_PROPORTION"] = new DvProportionHandler();
        self.handlers["DV_INTERVAL"] = new DvIntervalHandler();
        self.handlers["ELEMENT"] = new ElementHandler();
    };


    ArchetypeEditor.addRmModule(new OpenEhrModule());
}(ArchetypeEditor || {}) );