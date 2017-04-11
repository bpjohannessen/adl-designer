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

AOM = (function (AOM) {
        var my = AOM;

        // todo use for loading templates
        /**
         *
         * @param {object[]} archetypeDataList
         * @param {AOM.ArchetypeRepository} archetypeRepository repository of the archetypes
         * @param {function(AOM.ArchetypeModel[])} callback function with a list of archetype models to call when all archetype models are constructed
         */
        function buildArchetypeModels(archetypeDataList, archetypeRepository, callback) {
            function buildArchetypeModel(index) {
                var archetypeData = archetypeDataList[index];
                archetypeRepository.loadArchetype(archetypeData.parent_archetype_id.value, function (parentArchetypeData) {
                    var parentArchetypeModel = new AOM.ArchetypeModel(parentArchetypeData);
                    result[index] = new AOM.ArchetypeModel(archetypeDataList[index], parentArchetypeModel);
                    latch.countDown();
                });
            }

            var result = [];
            var latch = new CountdownLatch(archetypeDataList.length);
            for (var i in archetypeDataList) {
                var archetypeData = archetypeDataList[i];
                if (archetypeData.parent_archetype_id) {
                    buildArchetypeModel(i);
                } else {
                    result[i] = new AOM.ArchetypeModel(archetypeData);
                    latch.countDown();
                }
            }
            latch.execute(function () {
                callback(result);
            });

        }

        /**
         * @constructor

         * @param {AOM.ArchetypeModel[]} archetypeModels list of archetype models present in the archetype.
         *                                               First item is the root archetype, the rest are template overlays
         * @param {AOM.ArchetypeRepository} archetypeRepository
         * @param {AOM.ReferenceModel} referenceModel
         */
        my.TemplateModel = function (archetypeModels, archetypeRepository, referenceModel) {
            var self = this;

            function getArchetypeModel(archetypeId) {
                return Stream(archetypeModels)
                    .filter(function (model) {
                        return model.data.archetype_id.value === archetypeId
                    })
                    .findFirst().orElse(undefined);
            }

            function enrichAttributeData(cons) {
                for (var i in cons.children || []) {
                    enrichConstraintData(cons.children[i])
                }
            }

            function enrichConstraintData(cons) {
                if (cons["@type"] === "C_ARCHETYPE_ROOT") {
                    var refArchetypeModel = getArchetypeModel(cons.archetype_ref);
                    refArchetypeModel.data.definition[".templateArchetypeRoot"] = cons;
                }
                if (cons["@type"] === "ARCHETYPE_SLOT") {
                    return; // do not add any attributes on slots
                }
                var existingAttributes = {};
                for (var i in cons.attributes || []) {
                    existingAttributes[cons.attributes[i].rm_attribute_name] = true;
                }

                // add attributes that can be filled by archetypes
                if (cons["@type"] === "C_COMPLEX_OBJECT" || cons["@type"] === "C_ARCHETYPE_ROOT") {
                    var rmType = cons.rm_type_name;
                    var referenceType = referenceModel.getType(rmType);
                    if (referenceType) {
                        for (var attrName in referenceType.attributes) {
                            if (!existingAttributes[attrName]) {
                                var attr = referenceType.attributes[attrName];
                                if (rmTypesForArchetypesSet[attr.type]) {
                                    var attrCons = AOM.ArchetypeModel.from(cons).addAttribute(cons, attrName);
                                    existingAttributes[attrName] = true;
                                }
                            }
                        }
                    }
                }

                // enrich attributes of the constraint
                for (var i in cons.attributes || []) {
                    enrichAttributeData(cons.attributes[i])
                }

            }

            function enrichArchetypeModelData(archetypeModel) {
                archetypeModel.data.definition[".templateModel"] = self;
                enrichConstraintData(archetypeModel.data.definition)
            }

            function enrichArchetypeModelsData() {
                for (var i in archetypeModels) {
                    enrichArchetypeModelData(archetypeModels[i]);
                }
            }


            self.getRootArchetypeModel = function () {
                return archetypeModels[0];
            };

            self.getConstraintParent = function (cons) {
                function findArchetypeSlot(archetypeRoot) {
                    if (!archetypeRoot.node_id) return null;

                    var parentAttr = archetypeRoot[".parent"];
                    for (var i in parentAttr.children) {
                        var consChild = parentAttr.children[i];
                        if (consChild["@type"] === "ARCHETYPE_SLOT") {
                            if (my.nodeIdMatches(archetypeRoot.node_id, consChild.node_id, {matchParent: true})) {
                                return consChild;
                            }
                        }
                    }
                    return null;
                }

                if (cons[".templateArchetypeRoot"]) {
                    var archetypeRoot = cons[".templateArchetypeRoot"];
                    var parentSlot = findArchetypeSlot(archetypeRoot);
                    return parentSlot || archetypeRoot[".parent"];
                } else {
                    return cons[".parent"];
                }
            };

            self.getConstraintChildren = function (cons) {
                function constraintChildren(children) {

                    function getParentSlot(slotIdToSlot, archetypeRootCons) {
                        for (var slotId in slotIdToSlot) {
                            if (my.nodeIdMatches(slotId, archetypeRootCons.node_id, {matchParent: true})) {
                                return slotIdToSlot[slotId];
                            }
                        }
                        return null;
                    }

                    var slotIdToSlot = {};
                    children.forEach(function (cons) {
                        if (cons["@type"] === "ARCHETYPE_SLOT") {
                            slotIdToSlot[cons.node_id] = cons;
                        }
                    });


                    var result = [];
                    for (var i in children) {
                        var consChild = children[i];
                        var amType = consChild["@type"];
                        if (amType === "C_ARCHETYPE_ROOT") {
                            if (!getParentSlot(slotIdToSlot, consChild)) {
                                // only show the archetype_root if it is directly under attribute, instead of under slot
                                result.push(getArchetypeModel(consChild.archetype_ref).data.definition);
                            }
                        } else {
                            result.push(consChild);
                        }
                    }
                    return result;
                }

                function slotChildren(cons) {

                    var result = [];
                    var parentAttrCons = cons[".parent"];
                    for (var i in parentAttrCons.children) {
                        var consChild = parentAttrCons.children[i];
                        if (consChild["@type"] === "C_ARCHETYPE_ROOT") {
                            if (my.nodeIdMatches(consChild.node_id, cons.node_id, {matchSpecialized: true})) {
                                result.push(getArchetypeModel(consChild.archetype_ref).data.definition);
                            }
                        }
                    }
                    return result;
                }


                var consMixin = AOM.mixin(cons);
                if (consMixin.isAttribute()) {
                    return constraintChildren(cons.children || []);
                } else if (consMixin.isSlot()) {
                    return slotChildren(cons);
                } else {
                    return cons.attributes || [];
                }
            };

            function createNewOverlayArchetypeId(parentArchetypeModel) {
                function extractNamePart(pid) {
                    var start = pid.indexOf('.');
                    var end = pid.indexOf('.', start + 1);
                    return pid.substring(start + 1, end);
                }


                function pad(num, size) {
                    var s = "000000000" + num;
                    return s.substr(s.length - size);
                }

                var parentId = parentArchetypeModel.getArchetypeId();
                var start = parentId.indexOf('.');
                var end = parentId.indexOf('.', start + 1);

                var parentName = extractNamePart(parentArchetypeModel.getArchetypeId());
                var templateName = extractNamePart(self.getRootArchetypeModel().getArchetypeId());

                var num = 1;
                while (true) {
                    var newArchetypeId = parentId.substring(0, start) + ".ovl-"
                        + templateName + "-" + parentName + "-" + pad(num, 3)
                        + parentId.substring(end);
                    if (!getArchetypeModel(newArchetypeId)) {
                        return newArchetypeId
                    }
                    //if (Stream(archetypeModels).noneMatch(function (d) {
                    //        return d.getArchetypeId() === newArchetypeId
                    //    })) {
                    //    return newArchetypeId;
                    //}
                    num++;
                }
            }

            /**
             *  Adds a new archetype to the target constraint (slot or attribute)
             * @param targetCons
             * @param flatParentArchetypeData
             * @return {object} generated cons object
             */
            self.addArchetype = function (targetCons, flatParentArchetypeData) {

                function createNewOverlayArchetypeModel(flatParentArchetypeData) {
                    var parentArchetypeModel = new AOM.ArchetypeModel(flatParentArchetypeData);

                    var archetypeModel = AOM.createSpecializedArchetype({
                        archetypeId: createNewOverlayArchetypeId(parentArchetypeModel),
                        parent: parentArchetypeModel
                    });
                    archetypeModel.data.is_overlay = true;
                    delete archetypeModel.data.concept;
                    delete archetypeModel.data.description;
                    delete archetypeModel.data.original_language;
                    delete archetypeModel.data.translations;
                    delete archetypeModel.data.adl_version;
                    delete archetypeModel.data.rm_release;
                    delete archetypeModel.data.is_generated;
                    delete archetypeModel.data.other_metadata;
                    return archetypeModel;
                }

                var targetArchetypeModel = AOM.ArchetypeModel.from(targetCons);
                var mixin = AOM.mixin(targetCons);
                var targetAttribute = mixin.isSlot() ? targetCons[".parent"] : targetCons;

                var newArchetypeModel = createNewOverlayArchetypeModel(flatParentArchetypeData);
                enrichArchetypeModelData(newArchetypeModel);

                var newConstraint = AOM.newCArchetypeRoot(
                    newArchetypeModel.data.definition.rm_type_name,
                    mixin.isSlot() ?
                        targetArchetypeModel.generateSpecializedTermId(targetCons.node_id) :
                        targetArchetypeModel.generateSpecializedTermId("id"),
                    newArchetypeModel.getArchetypeId()
                );

                newArchetypeModel.data.definition[".templateArchetypeRoot"] = newConstraint;


                // add constraint to the target attribute and model to the models list
                targetArchetypeModel.addConstraint(targetAttribute, newConstraint);
                archetypeModels.push(newArchetypeModel);
                return newArchetypeModel.data.definition;
            };

            self.getAttributeChildOccurrences = function (attrCons) {
                if (attrCons.cardinality && attrCons.cardinality.interval) {
                    return attrCons.cardinality.interval;
                }
                var rmTypeName = attrCons[".parent"].rm_type_name;
                var rmAttribute = referenceModel.getType(rmTypeName).attributes[attrCons.rm_attribute_name];
                return AmInterval.of(rmAttribute.existence.lower, rmAttribute.existence.upper);
            };

            self.canAddArchetype = function (cons) {
                var targetConsMixin = AOM.mixin(cons);
                var children;

                if (targetConsMixin.isAttribute()) {
                    // is there place for one more child ?
                    var childOccurrences = self.getAttributeChildOccurrences(cons);
                    children = self.getConstraintChildren(cons);
                    return typeof childOccurrences.upper !== "number" || childOccurrences.upper > children.length;
                } else if (targetConsMixin.isSlot()) {
                    children = self.getConstraintChildren(cons);
                    if (cons.occurrences) {
                        return typeof cons.occurrences.upper !== "number" || cons.occurrences.upper > children.length;
                    } else {
                        return true;
                    }
                } else {
                    return false;
                }
            };
            self.removeConstraint = function (cons) {
                function removeOrphanArchetypeModels() {
                    do {
                        var referencedArchetypes = {};
                        for (var i in archetypeModels) {
                            my.visitDefinition(archetypeModels[i].data.definition, function (cons) {
                                if (cons["@type"] === "C_ARCHETYPE_ROOT") {
                                    referencedArchetypes[cons.archetype_ref] = true;
                                }
                            });
                        }

                        var removedCount = 0;
                        var index = 1;
                        while (index < archetypeModels.length) {
                            if (!referencedArchetypes[archetypeModels[index].getArchetypeId()]) {
                                archetypeModels.splice(index, 1);
                                removedCount++;
                            } else {
                                index++;
                            }
                        }
                    } while (removedCount > 0);

                }

                function removeAttributeConstraint(cons) {
                    var archetypeModel = AOM.ArchetypeModel.from(cons)
                    var parent = archetypeModel.getParentConstraint(cons);
                    var attrExistence = referenceModel.getExistence(parent);
                    if (attrExistence.lower) {
                        throw "Attribute is not optional: existence.lower=" + attrExistence.lower;
                    }
                    cons.existence=AmInterval.of(0, 0)
                }

                function removeCObjectConstraint(cons) {
                    var consArchetypeModel = AOM.ArchetypeModel.from(cons);
                    if (cons[".parent"]) {
                        return consArchetypeModel.removeConstraint(cons, cons[".clone"]);
                    } else if (cons[".templateArchetypeRoot"]) {
                        var parentArchetypeRoot = cons[".templateArchetypeRoot"];
                        var parentArchetypeModel = AOM.ArchetypeModel.from(parentArchetypeRoot);
                        //removeArchetypeModel(consArchetypeModel);
                        var result = parentArchetypeModel.removeConstraint(parentArchetypeRoot, true);
                        removeOrphanArchetypeModels();
                        return result;
                    }
                }


                if (AOM.mixin(cons).isAttribute()) {
                    return removeAttributeConstraint(cons)
                } else {
                    return removeCObjectConstraint(cons);
                }
            };

            self.getConstraintLabel = function (cons, language) {
                if (cons["@type"] === "C_ATTRIBUTE") return cons.rm_attribute_name;
                if (cons["@type"] === "C_ARCHETYPE_ROOT") {
                    var refArchetypeModel = getArchetypeModel(cons.archetype_ref);
                    return refArchetypeModel.getTermDefinitionText(refArchetypeModel.data.definition.node_id, language);
                } else {
                    var label = AOM.ArchetypeModel.from(cons).getTermDefinitionText(cons.node_id, language);
                    if (!label) {
                        label = cons.rm_type_name;
                    }
                    return label;
                }
            };

            self.renameConstraint = function (cons, text, language) {
                var archetypeModel = AOM.ArchetypeModel.from(cons);

                if (cons["@type"] === "C_ARCHETYPE_ROOT") {
                    var refArchetypeModel = getArchetypeModel(cons.archetype_ref);
                    refArchetypeModel.setTermDefinition(refArchetypeModel.data.definition.node_id, language, text);
                } else if (cons.node_id !== undefined) {
                    if (!archetypeModel.isSpecialized(cons)) return;
                    archetypeModel.setTermDefinition(cons.node_id, language, text);
                }
            };


            /**
             * Creates a json representation of the template than can be stored via rest call to /rest/repo/template
             * @return {object[]} list of archetype data, in serializable form.
             */
            self.toSerializableForm = function () {
                var result = [];
                for (var i in archetypeModels) {
                    var archetypeModel = archetypeModels[i];
                    result.push(AOM.impoverishedClone(archetypeModel.data));
                }
                return result;
            };

            self.getArchetypeLanguageIntersection = function () {
                var languageSet = AmUtils.listToSet(archetypeModels[0].allLanguages());
                for (var i = 1; i < archetypeModels.length; i++) {
                    languageSet = AmUtils.intersectSet(languageSet, AmUtils.listToSet(archetypeModels[i].allLanguages()));
                }
                return AmUtils.keys(languageSet);
            };

            self.canCloneConstraint = function (cons) {
                var consMixin = AOM.mixin(cons);
                if (!consMixin.isConstraint()) return false;
                if (consMixin.isSlot()) return false;
                if (cons.occurrences && cons.occurrences.upper === 1) return false;
                if (!self.getConstraintParent(cons)) return false;

                var archetypeModel = AOM.ArchetypeModel.from(cons);
                if (!archetypeModel.isSpecialized(cons)) return false;

                return true;
            };


            /**
             *
             * @param {AOM.ArchetypeModel} sourceArchetypeModel
             */
            function createOverlayArchetypeClone(sourceArchetypeModel) {
                var sourceData = AOM.impoverishedClone(sourceArchetypeModel.data);

                var archetypeModel = new AOM.ArchetypeModel(sourceData, sourceArchetypeModel.parentArchetypeModel);
                archetypeModel.data.archetype_id.value = createNewOverlayArchetypeId(sourceArchetypeModel.parentArchetypeModel);
                archetypeModel.data.is_overlay = true;
                enrichArchetypeModelData(archetypeModel);
                return archetypeModel;

            }

            /**
             * Clones a constraint and adds it to the model
             * @param {object} consToClone constraint to be cloned
             * @return {object|false} cloned constraint, or false if constraint cannot be added
             */
            self.cloneConstraint = function (consToClone) {
                if (!self.canCloneConstraint(consToClone)) {
                    toastr.error("Cannot clone this constraint");
                    return false;
                }

                function cloneCons(sourceCons, cons) {
                    if (cons["@type"] === "C_ARCHETYPE_ROOT") {
                        var sourceSlotArchetypeModel = getArchetypeModel(cons.archetype_ref);
                        var newArchetypeModel = createOverlayArchetypeClone(sourceSlotArchetypeModel);
                        newArchetypeModel.data.definition[".templateArchetypeRoot"] = cons;

                        archetypeModels.push(newArchetypeModel);
                        cons.archetype_ref = newArchetypeModel.getArchetypeId();
                        return;
                    }

                    var archetypeModel = AOM.ArchetypeModel.from(sourceCons);
                    if (archetypeModel.isSpecialized(cons)) {
                        var newNodeId = archetypeModel.generateSpecializedTermId(cons.node_id);
                        archetypeModel.copyTermDefinition(cons.node_id, newNodeId);
                        cons.node_id = newNodeId;


                        // copy the value set if needed
                        if (cons["@type"] === "C_TERMINOLOGY_CODE") {
                            if (cons.constraint) {
                                var value_set = archetypeModel.data.terminology.value_sets[cons.constraint];
                                if (value_set) {
                                    var newValueSetId = archetypeModel.generateSpecializedTermId(cons.constraint);
                                    var newValueSet = AmUtils.clone(value_set);
                                    newValueSet.id = newValueSetId;
                                    archetypeModel.data.terminology.value_sets[newValueSetId] = newValueSetId;
                                }
                            }
                        }
                    }


                    if (sourceCons.attributes) {
                        for (var i = 0; i < sourceCons.attributes.length; i++) {
                            var sourceAttr = sourceCons.attributes[i];
                            var attr = cons.attributes[i];
                            if (sourceAttr.children) {
                                for (var j = 0; j < sourceAttr.children.length; j++) {
                                    var sourceChildCons = sourceAttr.children[j];
                                    var childCons = attr.children[j];
                                    cloneCons(sourceChildCons, childCons);
                                }
                            }
                        }
                    }
                }

                var actualConsToClone = consToClone[".templateArchetypeRoot"] || consToClone;

                var archetypeModel = AOM.ArchetypeModel.from(actualConsToClone);
                var newCons = AOM.impoverishedClone(actualConsToClone);
                cloneCons(actualConsToClone, newCons);
                var parent = self.getConstraintParent(actualConsToClone);
                archetypeModel.addConstraint(parent, newCons);

                var sourceIndex = parent.children.indexOf(actualConsToClone);
                if (sourceIndex < 0) throw "topCons is not a member of its parent";
                var anchorCons = sourceIndex < parent.children.length - 2 ? parent.children[sourceIndex + 1] : undefined;
                if (anchorCons) {
                    archetypeModel.moveBefore(newCons, anchorCons);
                }
                if (consToClone[".templateArchetypeRoot"]) {
                    newCons = getArchetypeModel(newCons.archetype_ref).data.definition;
                }
                newCons[".clone"] = true;

                return newCons;
            };

            self.canMoveBefore = function (cons, anchorCons) {
                var archetypeModel = AOM.ArchetypeModel.from(cons);
                if (!AOM.mixin(cons).isConstraint() || !archetypeModel.isSpecialized(cons)) {
                    return false;
                }

                if (anchorCons && self.getConstraintParent(anchorCons) !== self.getConstraintParent(cons)) {
                    return false;
                }
                if (cons[".parent"] != anchorCons[".parent"])
                    return false;

                return true;
            };


            /**
             * Moves a constraint cons before a constraint anchorCons. Moving has some limitations:
             * cons must be specialized, cons must be a constraint, cons and anchorCons
             * must have the same parent.
             *
             * @param {object} cons Constraint to move
             * @param {object?} anchorCons constraint before which to move. If undefined, move to the end of list
             * @return {boolean} True if the move was successful
             */
            self.moveBefore = function (cons, anchorCons) {

                function moveCArchetypeRoot() {
                    var parent = self.getConstraintParent(cons);
                    if (AOM.mixin(parent).isSlot()) {
                        parent = parent[".parent"];
                    }

                    var consArchetypeRoot = cons[".templateArchetypeRoot"];
                    var anchorConsArchetypeRoot = anchorCons && anchorCons[".templateArchetypeRoot"];
                    var consIndexOf = parent.children.indexOf(consArchetypeRoot);
                    if (consIndexOf < 0) throw "archetype root does not have an anchor";
                    parent.children.splice(consIndexOf, 1);
                    if (anchorConsArchetypeRoot) {
                        var anchorIndexOf = parent.children.indexOf(anchorConsArchetypeRoot);
                        if (anchorIndexOf < 0) throw "anchor archetype root is not present in cons parent children";
                        parent.children.splice(anchorIndexOf, 0, consArchetypeRoot);
                    } else {
                        parent.children.push(consArchetypeRoot);
                    }
                }


                if (!self.canMoveBefore(cons, anchorCons)) {
                    return false;
                }
                if (cons[".templateArchetypeRoot"]) {
                    return moveCArchetypeRoot()
                } else {
                    var archetypeModel = AOM.ArchetypeModel.from(cons);
                    return archetypeModel.moveBefore(cons, anchorCons);
                }
            };

            function createRmTypesForArchetypesSet() {
                var archetypeTypes = {};
                for (var i in archetypeRepository.infoList) {
                    archetypeTypes[archetypeRepository.infoList[i].rmType] = true;
                }
                var result = {};
                for (var rmType in referenceModel.model.types) {
                    for (var archetypeRmType in archetypeTypes) {
                        if (referenceModel.isSubclass(rmType, archetypeRmType, true)) {
                            result[rmType] = true;
                            break;
                        }
                    }
                }
                return result;
            }


            // init TemplateModel
            // a set of all rmTypes that can be filled with an existing archetype
            var rmTypesForArchetypesSet = createRmTypesForArchetypesSet();

            enrichArchetypeModelsData();
        };

        /**
         * @param {object} cons Constraint object
         * @return {AOM.TemplateModel} template model for the given constraint, or undefined
         */
        my.TemplateModel.from = function (cons) {
            while (cons[".parent"]) cons = cons[".parent"];
            return cons[".templateModel"];
        };


        /**
         * @param {object} params New template params
         * @param {AOM.ArchetypeRepository} params.archetypeRepository Archetype repository to use
         * @param {AOM.ReferenceModel} params.referenceModel Reference model to use
         * @param {string} params.templateId Template id of the new template
         * @param {string} params.parentArchetypeId Archetype id of the top level COMPOSITION archetype
         * @param {function(AOM.TemplateModel)} params.callback callback called when the TemplateModel is created
         */
        my.TemplateModel.createNew = function (params) {
            params.archetypeRepository.loadArchetype(params.parentArchetypeId, function (parentData) {
                var parentArchetypeModel = new AOM.ArchetypeModel(parentData);

                var archetypeModel = AOM.createSpecializedArchetype({
                    archetypeId: params.templateId,
                    parent: parentArchetypeModel
                });
                archetypeModel.data.is_template = true;

                var templateModel = new AOM.TemplateModel([archetypeModel], params.archetypeRepository, params.referenceModel);
                params.callback(templateModel);
            });
        };

        /**
         * Creates a new template model from the serialized form (a list of archetypes). The serialized form is loaded
         * from template repository or obtained by calling templateModel.toSerializedForm().
         *
         * @param params Load template params
         * @param {AOM.ArchetypeRepository} params.archetypeRepository Archetype repository to use
         * @param {AOM.ReferenceModel} params.referenceModel Reference model to use
         * @param {object} params.data serialized form of the template (as loaded from repository)
         * @param {function(AOM.TemplateModel)} params.callback callback called when the template model is created
         */
        my.TemplateModel.createFromSerialized = function (params) {
            buildArchetypeModels(params.data, params.archetypeRepository, function (archetypeModels) {
                var templateModel = new AOM.TemplateModel(archetypeModels, params.archetypeRepository, params.referenceModel);
                params.callback(templateModel);
            });
        };


        return my;
    }
    (AOM)
)
;