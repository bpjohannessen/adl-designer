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

var AOM = (function () {
            var my = {};

            my.NodeId = function (node_id_str) {
                var self = this;

                function decode(str) {
                    var result = {};
                    var firstIdPos = str.search(/\d/);
                    result.prefix = str.substring(0, firstIdPos);
                    result.ids = [];
                    var tokens = str.substring(firstIdPos).split(".");
                    for (var i in tokens) {
                        result.ids.push(Number(tokens[i]));
                    }
                    return result;
                }

                var decoded = decode(node_id_str);
                self.prefix = decoded.prefix;
                self.ids = decoded.ids;


                self.getParent = function () {
                    if (self.ids.length > 1) {
                        var newIds = self.ids.slice(0, self.ids.length - 1);
                        return new my.NodeId(self.prefix + newIds.join(".")).toString();
                    } else {
                        return undefined;
                    }
                };

                self.toString = function () {
                    return self.prefix + self.ids.join(".");
                };
                self.getSpecializationDepth = function () {
                    return self.ids.length;
                }
            };

            /**
             * @param {AOM.NodeId|string} node_id
             * @returns {AOM.NodeId}
             */
            my.NodeId.of = function (node_id) {
                if (node_id instanceof my.NodeId) {
                    return node_id;
                }
                return new my.NodeId(node_id)
            };

            my.RmPath = function (path) {
                var self = this;

                function parsePathSegments(path) {
                    if (Array.isArray(path)) {
                        return path;
                    }

                    if (path.length > 0 && path.charAt(0) === "/") {
                        path = path.substring(1);
                    }
                    if (path.length === 0) return [];

                    var result = [];
                    var strSegments = path.split("/");
                    for (var pathPartIndex in strSegments) {
                        var pathPart = strSegments[pathPartIndex];
                        var spos = pathPart.indexOf("[");
                        if (spos >= 0) {
                            var epos = pathPart.lastIndexOf("]");
                            var segment = {};
                            segment.attribute = pathPart.substring(0, spos);
                            segment.node_id = pathPart.substring(spos + 1, epos).trim();
                            result.push(segment);
                        } else {
                            result.push({attribute: pathPart});
                        }
                    }
                    return result;
                }


                self.getParentPath = function () {
                    if (self.segments.length < 1) return undefined;

                    var newSegments = AmUtils.clone(self.segments);
                    newSegments.splice(newSegments.length - 1, 1);

                    return new my.RmPath(newSegments);
                };

                self.getChildPath = function () {
                    if (self.segments.length < 1) return undefined;
                    var newSegments = AmUtils.clone(self.segments);
                    newSegments.splice(0, 1);

                    return new my.RmPath(newSegments);
                };

                self.lastSegment = function () {
                    return self.segments[self.segments.length - 1];
                };

                self.toString = function () {
                    function segmentToString(segment) {
                        var result = "/" + segment.attribute;
                        if (segment.node_id) {
                            result += "[" + segment.node_id + "]";
                        }
                        return result;
                    }

                    var result = "";
                    for (var i in self.segments) {
                        result += segmentToString(self.segments[i]);
                    }
                    return result;
                };

                self.segments = parsePathSegments(path);
            };

            /**
             *
             * @param {AOM.RmPath|string}from
             * @returns {AOM.RmPath}
             */
            my.RmPath.of = function (from) {
                if (from instanceof my.RmPath) return from;
                return new my.RmPath(from);
            };


            //  depending on context:
            //  candidate       match       options.matchParent     options.matchSpecialized    result
            //  id1             undefined   any                     any                         true
            //  id1             id1         any                     any                         true
            //  id1.1           id1         any                     any                         options.matchSpecialized
            //  id1             id1.1       any                     any                         options.matchParent
            //  id2             id1         any                     any                         false
            /**
             * @param {string} candidate candidate node to check
             * @param {string} match node_id to check the candidate against
             * @param {object?} options match options
             * @param {boolean|undefined} options.matchSpecialized can candidate be a specialization of match
             * @param {boolean|undefined} options.matchParent can candidate be a parent of match
             * @return {boolean} true if candidate matches match with given options
             */
            my.nodeIdMatches = function (candidate, match, options) {
                options = options || {};
                if (match === undefined) return true;
                if (candidate === undefined) return false;
                if (candidate === match) return true;
                if (options.matchSpecialized) {
                    if (candidate.length > match.length && candidate.substring(0, match.length + 1) === match + ".") return true;
                }
                if (options.matchParent) {
                    if (candidate.length < match.length && match.substring(0, candidate.length + 1) === candidate + ".") return true;
                }
                return false;

            };
            my.AmQuery = function () {
                var self = this;

                function attributeMatches(attribute, segment) {
                    return attribute.rm_attribute_name === segment.attribute;
                }

                function constraintMatches(cons, segment, context) {
                    return my.nodeIdMatches(cons.node_id, segment.node_id, context);
                }

                function findChildConstrains(cons, segment, context) {
                    var result = [];

                    for (var i in cons.attributes || []) {
                        var attribute = cons.attributes[i];
                        if (attributeMatches(attribute, segment)) {
                            for (var j in attribute.children || []) {
                                var childCons = attribute.children[j];
                                if (constraintMatches(childCons, segment, context)) {
                                    result.push(childCons);
                                }
                            }
                        }
                    }

                    for (var i in cons.attribute_tuples || []) {
                        var attribute_tuple = cons.attribute_tuples[i];
                        for (var j in attribute_tuple.members) {
                            var attribute = attribute_tuple.members[j];
                            if (attributeMatches(attribute, segment)) {
                                for (var k in attribute_tuple.children) {
                                    var object_tuple = attribute_tuple.children[k];
                                    var childCons = object_tuple.members[j];
                                    if (constraintMatches(childCons, segment)) {
                                        result.push(childCons);
                                    }
                                }
                            }
                        }
                    }
                    return result;
                }

                /**
                 * Returns true if the candidate path matches match match, with a given context
                 * @param {string|AOM.RmPath} candidate candidate path
                 * @param {string|AOM.RmPath} match match path
                 * @param {{matchParent: false, matchSpecialized: false}?} context Details about what to match
                 * @returns {boolean} true if candidate path matches match path
                 */
                self.pathMatches = function (candidate, match, context) {
                    context = context || {};

                    var candidatePath = my.RmPath.of(candidate);
                    var matchPath = my.RmPath.of(match);

                    if (candidatePath.segments.length !== matchPath.segments.length) return false;

                    for (var segment_index in candidatePath.segments) {
                        var candidateSegment = candidatePath.segments[segment_index];
                        var matchSegment = matchPath.segments[segment_index];

                        if (candidateSegment.attribute !== matchSegment.attribute) return false;
                        if (!my.nodeIdMatches(candidateSegment.node_id, matchSegment.node_id, context)) return false;
                    }
                    return true;
                };
                /**
                 *
                 * @param cons constraints archetype node that is the root for search
                 * @param {RmPath|string} rmPath  path relative to the constraint
                 * @param {{matchParent: false, matchSpecialized: false}?} context Details about what to match
                 * @returns {{}[]} [] list of all nodes that match the path, empty list if none
                 */
                self.findAll = function (cons, rmPath, context) {
                    if (!cons) return [];
                    context = context || {};
                    rmPath = my.RmPath.of(rmPath);
                    var matches = [cons];
                    for (var segment_index in rmPath.segments) {
                        var segment = rmPath.segments[segment_index];
                        var roots = matches;
                        matches = [];
                        for (var i in roots) {
                            matches.push.apply(matches, findChildConstrains(roots[i], segment, context));
                        }
                    }
                    return matches;
                };

                /**
                 *
                 * @param rootCons constraints archetype node that is the root for search
                 * @param {RmPath|string} rmPath  path relative to the constraint
                 * @param {{matchParent: false, matchSpecialized: false}?} context Details about what to match
                 * @returns {{}} first node that matched, undefined if none
                 */
                self.get = function (rootCons, rmPath, context) {
                    var matches = self.findAll(rootCons, rmPath, context);
                    if (matches.length === 0) return undefined;
                    return matches[0];
                };


                return self;
            }();

            my.ArchetypeModel = function (data, parentArchetypeModel) {

                var defaultLanguage;
                if (data.original_language) {
                    defaultLanguage = data.original_language.code_string;
                } else {
                    // overlays have no original_language, so just take the first language from the terminology
                    // since defaultLanguage is not used on everlays, just choose the first language in terminology
                    // as default
                    defaultLanguage = AmUtils.keys(data.terminology.term_definitions)[0];
                }
                var self = this;

                function getTermDefinition(node_id, language) {

                    function getTermDefinitionFrom(definitions) {
                        var def = definitions;
                        if (def) def = def[language];
                        if (def) def = def[node_id];
                        return def;
                    }

                    language = language || defaultLanguage;

                    if (!node_id) return undefined;
                    var term = getTermDefinitionFrom(data.terminology.term_definitions);
                    if (term) return term;
                    term = getTermDefinitionFrom(data.terminology.constraint_definitions);
                    if (term) return term;

                    return undefined;
                }

                function extractTranslations() {
                    var result = [];
                    for (var i in data.translations || []) {
                        var tr = data.translations[i];
                        result.push(tr.language.code_string);
                    }
                    return result;
                }

                self.getTermDefinition = function (node_id, language) {
                    return getTermDefinition(node_id, language || defaultLanguage);
                };


                self.getTermDefinitionText = function (node_id, language) {
                    var td = getTermDefinition(node_id, language || defaultLanguage);
                    return td && td.text;
                };

                self.getTermBinding = function (terminology, node_id) {
                    return (data.terminology
                    && data.terminology.term_bindings
                    && data.terminology.term_bindings[terminology]
                    && data.terminology.term_bindings[terminology][node_id]);
                };


                /**
                 * Exports all term definitions for a single node_id. Target term nodes are in format
                 * result[language] = {text:..., description=...}. Changes to the result do not result in changes to the
                 * archetype. For this, ArchetypeModel.importTermDefinitions(node_id, result) must be called
                 *
                 * @param node_id
                 * @returns {{}} term definitions for node_id, for each language
                 */
                self.exportTermDefinitions = function (node_id) {
                    var result = {};
                    var allLanguages = self.allLanguages();
                    var term_definitions = self.data.terminology && self.data.terminology.term_definitions || {};
                    for (var i in allLanguages) {
                        var lang = allLanguages[i];
                        var langTerms = term_definitions[lang];
                        if (langTerms) {
                            var term = langTerms && langTerms[node_id];
                            if (term) {
                                result[lang] = {
                                    text: term.text,
                                    description: term.description
                                };
                            }
                        }
                    }
                    return result;
                };


                self.explodeValueSets = function (code, language) {
                    var result = {};

                    function explode(code) {
                        if (data.terminology.value_sets) {
                            var valueSet = data.terminology.value_sets[code];
                            if (valueSet) {
                                for (var i in valueSet.members || []) {
                                    explode(valueSet.members[i])
                                }
                            } else {
                                var term = self.getTermDefinition(code, language);
                                if (term) {
                                    result[code] = term;
                                }
                            }
                        }
                    }

                    if (typeof code === "string") {
                        explode(code);
                    } else if (Array.isArray(code)) {
                        for (var ci in code) {
                            explode(code[ci]);
                        }
                    }

                    return result;
                };


                self.getAnnotation = function (path, language) {
                    if (!language) language = self.defaultLanguage;
                    if (!self.data.annotations) return undefined;
                    if (!self.data.annotations.items) return undefined;
                    var langAnnotations = self.data.annotations.items[language];
                    if (!langAnnotations) return undefined;

                    path = AmUtils.getPathSegments(path);
                    for (var aPath in langAnnotations) {
                        if (AmUtils.pathMatches(aPath, path)) return langAnnotations[aPath];
                    }
                    return undefined;
                };


                /**
                 * Gets all annotations for a particular node
                 * @param {object} cons Constraint object for which to retrieve annotations
                 * @returns {{}} A {language: {key: value}} structure,
                 *          containing all annotations for all languages
                 */
                self.getAnnotationsForNode = function (cons) {

                    function addToLangResult(langResult, nodeItems) {
                        for (var key in nodeItems) {
                            langResult[key] = nodeItems[key];
                        }
                        return nodeItems;
                    }


                    if (!cons || !self.data.annotations || !self.data.annotations.items) {
                        return {};
                    }
                    var consPath = self.getRmPath(cons);

                    var result = {};


                    for (var lang in self.data.annotations.items) {
                        var langItems = self.data.annotations.items[lang];
                        var langResult = {};
                        for (var path in langItems) {
                            if (AOM.AmQuery.pathMatches(path, consPath, {matchParent: true})) {
                                addToLangResult(langResult, langItems[path]);
                            }
                        }
                        // ensure exact match overrides any previous annotations
                        for (var path in langItems) {
                            if (AOM.AmQuery.pathMatches(path, consPath)) {
                                addToLangResult(langResult, langItems[path]);
                            }
                        }

                        result[lang] = langResult;
                    }
                    return result;
                };
                /**
                 * Gets all external terminologies that are currently present in the archetype
                 * @returns {string[]}
                 */
                self.getAvailableTerminologies = function () {
                    return AmUtils.keys(self.data.terminology.term_bindings);
                };

                /**
                 * Gets all terminology definitions with codes that have a given prefix. Returns definitions in archetype0s
                 * original language.
                 *
                 * @param {string} prefix Prefix of the codes, for example "at"
                 * @returns {{}} map of "termId: term".
                 */
                self.getAllTerminologyDefinitionsWithPrefix = function (prefix) {
                    var result = {};
                    var defaultTermDefinitions = self.data.terminology.term_definitions[self.defaultLanguage];
                    for (var code in defaultTermDefinitions) {
                        if (AOM.NodeId.of(code).prefix === prefix) {
                            result[code] = defaultTermDefinitions[code]
                        }
                    }
                    return result;
                };

                /**
                 *  Returns existing external terminology codes
                 *
                 * @returns {string[]} list of external terminology codes
                 */
                self.getExternalTerminologyCodes = function () {
                    var result = [];
                    var termCandidates = self.getAllTerminologyDefinitionsWithPrefix("ac");
                    for (var nodeId in termCandidates) {
                        if (!self.data.terminology.value_sets[nodeId]) {
                            result.push(nodeId)
                        }
                    }
                    return result;
                };


                /**
                 * @returns {Array} all languages present in the archetype.
                 */
                self.allLanguages = function () {
                    return AmUtils.keys(self.data.terminology.term_definitions);
                };

                /**
                 * Gets an attribute of a given name on a constraint.
                 *
                 * @param {object} cons
                 * @param {string} attributeName
                 * @param {boolean?} autoCreate Should the attribute be autocreated if not found
                 * @return {object|undefined} Found attribute, or undefined if not found and autoCreate=false
                 */
                self.getAttribute = function (cons, attributeName, autoCreate) {
                    var attr = Stream(cons.attributes || []).filter({rm_attribute_name: attributeName}).findFirst().orElse(undefined);
                    if (attr) return attr;
                    if (autoCreate) {
                        return self.addAttribute(cons, attributeName);
                    } else {
                        return undefined;
                    }

                };

                /**
                 *
                 * @param {object} cons constraint object
                 * @param {string[]} attributeNames list of attribute names
                 * @returns {Array} array of name->constraint objects for each tuple
                 */
                self.getAttributesTuple = function (cons, attributeNames) {
                    var commonAttributes = {}, hasCommonAttributes = false;
                    var result = [];

                    for (var i in attributeNames) {
                        var attributeName = attributeNames[i];
                        var attribute = AOM.AmQuery.get(cons, attributeName);
                        if (attribute) {
                            commonAttributes[attributeName] = attribute;
                            hasCommonAttributes = true;
                        }
                    }

                    for (var i in cons.attribute_tuples || []) {
                        var attribute_tuple = cons.attribute_tuples[i];
                        var tupleMembers = Stream(attribute_tuple.members).flatMap("rm_attribute_name").toArray();
                        var containedCount = 0;
                        for (var j in tupleMembers) {
                            if (attributeNames.indexOf(tupleMembers[j]) > 0) {
                                containedCount++;
                            }
                        }
                        if (containedCount > 0) {
                            var indices = {};
                            for (var j in attributeNames) {
                                indices[attributeNames[j]] = tupleMembers.indexOf(attributeNames[j]);
                            }

                            for (var j in attribute_tuple.children || []) {
                                var resultItem = {};
                                var object_tuple = attribute_tuple.children[j];
                                for (var k in attributeNames) {
                                    var index = indices[attributeNames[k]];
                                    var attributeName = attributeNames[k];
                                    resultItem[attributeName] = index >= 0 ? object_tuple.members[index] : commonAttributes[attributeName];
                                }
                                result.push(resultItem);
                            }
                            break; // only allow one tuple
                        }
                    }
                    if (result.length == 0 && hasCommonAttributes) {
                        result.push(commonAttributes); // just use common attributes, if no tuples are defined
                    }
                    return result;
                };


                /**
                 * Gets a rm path to a constraint, optionally from a given origin
                 * @param {{}} cons - constraint for which to get rm path. Must be part of the archetype model
                 * @param {{}?} originCons - from what constraint should path be build. If undefined, assumes root. If defined, must be a parent of cons
                 * @return {AOM.RmPath} rmPath
                 */
                self.getRmPath = function (cons, originCons) {

                    function fillSegments(segments, cons) {
                        if (cons === undefined || cons === originCons) return;

                        var parentAttr = cons[".parent"];
                        if (parentAttr) {
                            var parentCons = parentAttr[".parent"];
                            if (parentCons["@type"] === "C_ATTRIBUTE_TUPLE") { // if tuple, take actual constraint instead
                                parentCons = parentCons[".parent"];
                            }

                            fillSegments(segments, parentCons);

                            var segment = {
                                attribute: parentAttr.rm_attribute_name
                            };
                            if (cons.node_id) {
                                segment.node_id = cons.node_id;
                            }
                            segments.push(segment);
                        }
                    }

                    var segments = [];
                    if (cons["@type"] === "C_ATTRIBUTE") {
                        fillSegments(segments, cons);
                        segments.push({attribute: cons.rm_attribute_name});
                    } else {
                        fillSegments(segments, cons);
                    }
                    return my.RmPath.of(segments);
                };

                /**
                 * Finds the constraint of the parent archetype that corresponds to this node.
                 * If no parent archetype, or no constraint was found, returns undefined
                 * @param {{}} cons specialized constraint for which the parent should be returned. must be a member of this archetypeModel
                 * @returns {{}} matching constraint of the parent archetype (member of the parentArchetypeModel), or undefined.
                 */
                self.getParentConstraint = function (cons) {
                    if (!cons || !self.parentArchetypeModel) return undefined;
                    if (AOM.mixin(cons).isAttribute()) {
                        var parent = cons[".parent"];
                        var parentParent = self.getParentConstraint(parent);
                        if (parentParent) {
                            return self.parentArchetypeModel.getAttribute(parentParent, cons.rm_attribute_name);
                        }
                    }
                    var rmPath = self.getRmPath(cons);
                    return my.AmQuery.get(self.parentArchetypeModel.data.definition, rmPath, {matchParent: true});
                };


                var maxTermIdsByPrefix = {};
                var existingTerms = {};

                /**
                 * Used in preprocessor for each existing nodeId, to know what node ids already exist in the archetype. Used
                 * for generating new ids
                 * @param {string} termId termId string to acknowledge, i.e. id2.1
                 */
                function acknowledgeTermId(termId) {
                    if (!termId) return;
                    existingTerms[termId] = true;
                    termId = my.NodeId.of(termId);
                    if (termId.getSpecializationDepth() === self.specializationDepth) {
                        var lastTermIdSegment = termId.ids[termId.ids.length - 1];
                        var maxTermId = maxTermIdsByPrefix[termId.prefix];
                        if (maxTermId === undefined || maxTermId < lastTermIdSegment) {
                            maxTermIdsByPrefix[termId.prefix] = lastTermIdSegment;
                        }
                    }
                }

                function removeTermId(termId) {
                    if (!termId) return;
                    delete existingTerms[termId];
                }


                function enrichAttributeData(data, parent) {
                    if (!data) return;
                    data[".parent"] = parent;
                    for (var i in data.children || []) {
                        enrichConstraintData(data.children[i], data);
                    }
                }

                function removeTermDefinition(node_id) {
                    for (var lang in self.data.terminology.term_definitions) {
                        var langTerms = self.data.terminology.term_definitions[lang];
                        delete langTerms[node_id];
                    }
                    removeTermId(node_id);

                }

                function enrichConstraintData(data, parent) {
                    if (!data) return;
                    data[".parent"] = parent;

                    acknowledgeTermId(data.node_id);
                    for (var i in data.attributes || []) {
                        enrichAttributeData(data.attributes[i], data);
                    }
                    for (var i in data.attribute_tuples || []) {
                        var attribute_tuple = data.attribute_tuples[i];
                        //attribute_tuple[".parent"]=data;
                        for (var j in attribute_tuple.members || []) {
                            enrichAttributeData(attribute_tuple.members[j], data);
                        }
                        for (var j in attribute_tuple.children || []) {
                            var object_tuple = attribute_tuple.children[j];
                            for (var k in object_tuple.members || []) {
                                enrichConstraintData(object_tuple.members[k], attribute_tuple.members[k]);
                            }
                        }
                    }
                }

                function processOntology(ontology) {
                    if (!ontology) return;
                    for (var lang in ontology.term_definitions || {}) {
                        var langDefinitions = ontology.term_definitions[lang];
                        for (var termId in langDefinitions || {}) {
                            acknowledgeTermId(termId);
                        }
                    }
                    for (var codeSystem in ontology.term_bindings || {}) {
                        var codeSystemBindings = ontology.term_bindings[codeSystem];
                        for (var termId in codeSystemBindings || {}) {
                            acknowledgeTermId(termId);
                        }
                    }

                    for (var valueSetId in ontology.value_sets || {}) {
                        acknowledgeTermId(valueSetId);
                        var valueSet = ontology.value_sets[valueSetId];
                        for (var i in valueSet.members || []) {
                            acknowledgeTermId(valueSet.members[i]);
                        }
                    }
                }


                //function isTuplePart(cons) {
                //    var parentAttr = cons[".parent"];
                //    if (!parentAttr) return false;
                //    var parentAttrParent = parentAttr[".parent"];
                //    return parentAttrParent["@type"] === "C_ATTRIBUTE_TUPLE";
                //}


                /**
                 * Generates a new term id for a given prefix or parent term id with the same specialization level as the archetype
                 * @param {string} parentTermOrPrefix prefix or parent term. Examples: 'id', 'id2', 'at2.2', 'ac'
                 * @returns {string} a new, unique term id
                 */
                self.generateSpecializedTermId = function (parentTermOrPrefix) {

                    var term;
                    if (parentTermOrPrefix.match(/^[a-zA-Z]+$/)) {
                        var prefix = parentTermOrPrefix;
                        var maxTermId = maxTermIdsByPrefix[prefix] || 0;
                        if (self.specializationDepth === 1) {
                            term = my.NodeId.of(prefix + String(++maxTermId));
                        } else {
                            term = my.NodeId.of(prefix + "0");
                            while (term.ids.length < self.specializationDepth - 1) {
                                term.ids.push(0);
                            }
                            term.ids.push(++maxTermId);
                        }
                        maxTermIdsByPrefix[prefix] = maxTermId;
                        existingTerms[term.toString()] = true;
                        return term.toString();
                    } else {
                        term = my.NodeId.of(parentTermOrPrefix);
                        while (term.ids.length < self.specializationDepth - 1) {
                            term.ids.push(0);
                        }
                        if (term.ids.length < self.specializationDepth) {
                            term.ids.push(1);
                        }
                        while (existingTerms[term.toString()]) { // find first unique id
                            term.ids[term.ids.length - 1]++;
                        }
                        existingTerms[term.toString()] = true;
                        return term.toString();
                    }
                };


                /**
                 * Checks if node is defined directly in this archetype
                 *
                 * @param {object|string} cons constraint data node, or node_id
                 * @returns {boolean} true if the node is defined in current archetype, false if defined only in parent
                 */
                self.isSpecialized = function (cons) {

                    function isArchetypeSlotSpecialized(cons) {
                        var parent = self.getParentConstraint(cons);
                        if (!parent) return false;

                        // currently always treat archetype slot as specialized
                        // if (AOM.mixin(cons).equals(cons, parent)) return false;
                        return true;
                    }

                    if (typeof cons === "object") {
                        if (AOM.mixin(cons).isSlot()) {
                            return isArchetypeSlotSpecialized(cons)
                        }
                        while (cons && !cons.node_id) { // find nearest parent with node_id
                            cons = cons[".parent"];
                        }
                        if (!cons) return false;
                        return self.isSpecialized(cons.node_id);
                    } else {
                        var specializationDepth = my.NodeId.of(cons).getSpecializationDepth();
                        return specializationDepth === self.specializationDepth;
                    }
                };


                self.specializeTermDefinition = function (termId) {
                    var newTermId = self.generateSpecializedTermId(termId);
                    self.copyTermDefinition(termId, newTermId);
                    return newTermId;
                };

                /**
                 * Copies a term definition from one termId to another. targetTermId must already exist
                 * (either preexisting or generated by generateSpecializedTermId), but target term definition
                 * may or may not.
                 *
                 * @param {string} sourceTermId Term definition must exist
                 * @param {string?} targetTermId Target termId. Does not have to exist;
                 */
                self.copyTermDefinition = function (sourceTermId, targetTermId) {
                    Stream(self.allLanguages()).forEach(function (lang) {
                        var term = self.getTermDefinition(sourceTermId, lang);
                        if (term) {
                            self.setTermDefinition(targetTermId, lang, term.text, term.description, term.comment);
                        }
                    });
                };

                self.specializeValueSet = function (valueSetId) {
                    var value_set = self.data.terminology.value_sets[valueSetId];
                    if (!value_set) return undefined;

                    var newValueSetId = self.specializeTermDefinition(valueSetId);

                    value_set = AmUtils.clone(value_set);
                    value_set.id = newValueSetId;
                    self.data.terminology.value_sets[newValueSetId] = value_set;
                    return newValueSetId;
                };

                self.removeValueSet = function (node_id) {
                    if (!self.data.terminology.value_sets[node_id]) return false;

                    delete self.data.terminology.value_sets[node_id];
                    removeTermDefinition(node_id);

                    return true;
                };

                self.getValueSet = function (valueSetId) {
                    var value_set = self.data.terminology.value_sets[valueSetId];
                    if (!value_set) return undefined;
                    return value_set;
                };

                /**
                 * Gets a constraint from rm path
                 * @param {string} path
                 * @return {object|undefined} found constraint
                 */
                self.getConstraint = function (path) {
                    return my.AmQuery.get(self.data.definition, path);
                };


                /**
                 * Remove attribute from constraint
                 * @param {object} cons constraint object
                 * @param {string|string[]} attributeName name of the attribute to remove, or list of attribute names to remove
                 */
                self.removeAttribute = function (cons, attributeName) {
                    if (Array.isArray(attributeName)) {
                        for (var i in attributeName) {
                            self.removeAttribute(cons, attributeName[i]);
                        }

                    }
                    for (var i in cons.attributes || []) {
                        var attribute = cons.attributes[i];
                        if (attribute.rm_attribute_name === attributeName) {
                            cons.attributes.splice(i, 1);
                            break;
                        }
                    }

                    for (var i in cons.attribute_tuples || []) {
                        var attribute_tuple = cons.attribute_tuples[i];
                        for (var j in attribute_tuple.members) {
                            if (attribute_tuple.members[j].rm_attribute_name === attributeName) {
                                attribute_tuple.members.splice(j, 1);
                                for (var k in attribute_tuple.children) {
                                    attribute_tuple.children[k].members.splice(j, 1);
                                }
                                break;
                            }
                        }
                        if (attribute_tuple.members.length == 0) {
                            cons.attribute_tuples.splice(i, 1);
                        }
                    }
                };


                /**
                 * Copies properties that are defined on cons but not on targetCons to targetCons. Not recursive
                 * @param {object} cons source constraint. Must be part of archetype and be of @type C_COMPLEX_OBJECT
                 * @param {object} targetCons target constraint. Must NOT be part of archetype and be of @type C_COMPLEX_OBJECT
                 */
                self.addUnconstrainedAttributes = function (cons, targetCons) {

                    function getTupleAttributeNames(attribute_tuple) {
                        var result = [];
                        for (var j in attribute_tuple.members) {
                            result.push(attribute_tuple.members[j].rm_attribute_name);
                        }
                        return result;
                    }

                    function addAttributeTuple(attribute_tuple) {
                        var attributeNames = getTupleAttributeNames(attribute_tuple);

                        for (var j in targetCons.attribute_tuples || []) {
                            var targetAttributeNames = getTupleAttributeNames(targetCons.attribute_tuples[j]);
                            var matches = 0;
                            for (var k in attributeNames) {
                                if (targetAttributeNames.indexOf(attributeNames[k]) >= 0) {
                                    matches++;
                                }
                            }
                            if (matches === 0) {
                                continue; // tuples completely different, check next target tuple
                            } else if (matches < attributeNames) {
                                console.warn("Partial tuple match, attributes will not be added:\ttuple:", attributeNames,
                                    "\ttargetTuple:", targetAttributeNames);
                                return; // partial match, merging is not possible. (should throw an error?)
                            } else {
                                return; // full match, skip this source tuple
                            }
                        }
                        // no match in target tuples, proceed to check target attributes
                        for (var j in attributeNames) {
                            var targetChildCons = my.AmQuery.get(targetCons, "/" + attributeNames[j]);
                            if (targetChildCons) {
                                console.warn("Cannot merge tuple with existing attribute constraint:\ntuple:", attributeNames,
                                    "\ntargetAttribute:", attributeNames[j]);
                                return; // attribute part of tuple in source, but standalone in target (should throw an error?)
                            }
                        }
                        // all checks passed add tuple to targetCons
                        targetCons.attribute_tuples = targetCons.attribute_tuples || [];
                        targetCons.attribute_tuples.push(my.impoverishedClone(attribute_tuple));
                    }

                    // add regular attributes
                    for (var i in cons.attributes || []) {
                        var attribute = cons.attributes[i];
                        var targetAttribute = my.AmQuery.get(targetCons, "/" + attribute.rm_attribute_name);
                        if (!targetAttribute) {
                            targetAttribute = my.impoverishedClone(attribute);

                            targetCons.attributes = targetCons.attributes || [];
                            targetCons.attributes.push(targetAttribute);
                        }
                    }

                    // add tuples, if possible
                    for (var i in cons.attribute_tuples || []) {
                        addAttributeTuple(cons.attribute_tuples[i])
                    }
                };

                /**
                 * Adds a translation to the archetype. The language must not already exist. Also adds quick translations
                 * of details and term definitions
                 *
                 * @param {string} langCode Code of the language to add
                 */
                self.addTranslation = function (langCode) {
                    function quickTranslate(value) {
                        if (!value) return undefined;
                        value = "*" + value + " (" + self.data.original_language.code_string + ")";
                        return value;
                    }

                    function addDescriptionDetails() {
                        var orig = self.data.description.details[0];

                        self.data.description.details.push({
                            "@type": "RESOURCE_DESCRIPTION_ITEM",
                            "language": {
                                "@type": "CODE_PHRASE",
                                "terminology_id": {
                                    "@type": "TERMINOLOGY_ID",
                                    "value": "ISO_639-1"
                                },
                                "code_string": langCode
                            },
                            "purpose": quickTranslate(orig.purpose),
                            "keywords": AmUtils.clone(orig.keywords),
                            "use": quickTranslate(orig.use),
                            "misuse": quickTranslate(orig.misuse),
                            "copyright": orig.copyright,
                            "original_resource_uri": {},
                            "other_details": {}
                        });

                    }

                    function addTermDefinitions() {
                        var orig = self.data.terminology.term_definitions[self.data.original_language.code_string];
                        var tds = {};
                        self.data.terminology.term_definitions[langCode] = tds;
                        for (var nodeId in orig) {
                            var term = orig[nodeId];
                            tds[nodeId] = {
                                text: quickTranslate(term.text),
                                description: quickTranslate(term.description)
                            }
                        }
                    }

                    var translation = {
                        "@type": "TRANSLATION_DETAILS",
                        "language": {
                            "@type": "CODE_PHRASE",
                            "terminology_id": {
                                "@type": "TERMINOLOGY_ID",
                                "value": "ISO_639-1"
                            },
                            "code_string": langCode
                        },
                        "author": {},
                        "accreditation": "",
                        "other_details": {}
                    };


                    self.data.translations.push(translation);
                    addDescriptionDetails();
                    addTermDefinitions();
                    self.translations.push(langCode);
                };

                /**
                 * Saves external term bindings on the archetype
                 * @param {string} termId constraint node id
                 * @param {{terminology:url}} bindings of terminology to query url
                 */
                self.setExternalTerminologyBinding = function (termId, bindings) {
                    var tds = self.data.terminology.term_bindings;

                    for (var bt in bindings) {
                        if (!tds[bt]) {
                            tds[bt] = {};
                        }
                    }

                    for (var terminology in tds) {
                        if (bindings[terminology]) {
                            tds[terminology][termId] = bindings[terminology];
                        } else {
                            delete tds[terminology][termId];
                        }
                    }
                };

                /**
                 * Sets a term definition to ontology term_definitions. Will override existing definition or add a new one
                 * <p>When adding you must always make sure that you add terms to all languages
                 *
                 * @param {string} code node_id of the term definition
                 * @param {string|undefined} language language of the definition. If undefined, sets terms for all definitions
                 * @param {string} text term definition text
                 * @param {string?} description term definition description. If undefined, equals to text
                 * @param {string?} comment term definition comment. If undefined, not present
                 */
                self.setTermDefinition = function (code, language, text, description, comment) {
                    function quickTranslate(value, sourceLanguage, targetLanguage) {
                        if (!value) return undefined;
                        value = value + " (" + sourceLanguage + ")";
                        return value;
                    }


                    if (!language) {
                        self.setTermDefinition(code, self.defaultLanguage, text, description, comment);
                        for (var i in self.translations) {
                            var lang = self.translations[i];
                            self.setTermDefinition(code, lang,
                                quickTranslate(text, self.defaultLanguage, lang),
                                quickTranslate(description, self.defaultLanguage, lang));
                        }
                        return;
                    }

                    var term_definitions = self.data.terminology.term_definitions;

                    if (!term_definitions[language]) {
                        term_definitions[language] = {};
                    }
                    var old = term_definitions[language][code];
                    if (!description && old) {
                        description = old.description;
                    }
                    description = description || text;
                    term_definitions[language][code] = {
                        text: text,
                        description: description,
                        comment: comment
                    };
                    AmUtils.cleanObjectProperties(term_definitions[language][code]);
                };

                self.specializeTermDefinition = function (term_id) {
                    var newTermId = self.generateSpecializedTermId(term_id);

                    for (var lang in self.data.terminology.term_definitions) {
                        var langTerms = self.data.terminology.term_definitions[lang];
                        langTerms[newTermId] = AmUtils.clone(langTerms[term_id]);
                    }
                    return newTermId;
                };

                /**
                 * Adds a new term definition to ontology. Text and description are given to the original language, while other languages
                 * have suffix " (original_language)"
                 * @param {string}prefixOrCode prefix (or code) under which to generate new termId. If it refers to
                 * a parent code, a specialized code will be generated
                 * @param {string} text text of the terminology definition
                 * @param {string?}description description of the terminology definition
                 * @returns {string} code of the generated terminology definition
                 */
                self.addNewTermDefinition = function (prefixOrCode, text, description) {


                    var newCode = self.generateSpecializedTermId(prefixOrCode);

                    self.setTermDefinition(newCode, undefined, text, description);

                    return newCode;
                };

                /**
                 * Imports term definitions for a single node_id, for all languages
                 *
                 * @param node_id
                 * @param {{}} termsPerLanguage terms per language, in format {language: {text:..., description:...}}
                 */
                self.importTermDefinitions = function (node_id, termsPerLanguage) {
                    var ontology = self.data.terminology;
                    var term_definitions = (ontology.term_definitions = ontology.term_definitions || {});
                    for (var language in termsPerLanguage) {
                        var term = termsPerLanguage[language];
                        var langTerms = (term_definitions[language] = term_definitions[language] || {});
                        langTerms[node_id] = {
                            text: term.text,
                            description: term.description
                        };
                    }
                };


                self.specializeConstraint = function (cons) {
                    if (self.isSpecialized(cons)) return;
                    var mixin = my.mixin(cons);
                    if (mixin.isPrimitive()) return; // do not specialize primitive nodes
                    if (mixin.isSlot()) return; // do not specilize slots

                    var originalNodeId = cons.node_id;
                    var specializedNodeId = self.generateSpecializedTermId(cons.node_id || "id");
                    cons.node_id = specializedNodeId;

                    // add specialized term to term definitions if present in parent
                    var allLanguages = self.allLanguages();
                    for (var langIndex in allLanguages) {
                        var lang = allLanguages[langIndex];
                        var term = self.getTermDefinition(originalNodeId, lang);
                        if (term) {
                            self.setTermDefinition(specializedNodeId, lang, term.text, term.description);
                        }
                    }
                };

                self.specializeConstraintSubTree = function (cons) {
                    self.specializeConstraint(cons);
                    Stream(cons.attributes || []).flatMap("children").forEach(function (c) {
                        self.specializeConstraintSubTree(c);
                    });
                };


                /**
                 * Enriches constraint with additional attributes form the ArchetypeModel. Intended to allow adding attributes on a
                 * C_COMPLEX_OBJECT
                 *
                 * @param {object} cons Constraint to enrich. If parent===undefined, must already have [".parent"] attribute
                 * @param {object?} parent parent of this constraint
                 Ł           */
                self.enrichReplacementConstraint = function (cons, parent) {
                    enrichConstraintData(cons, parent || cons[".parent"]);
                };

                function ensureAnnotations() {
                    if (!self.data.annotations) {
                        self.data.annotations = {
                            "@type": "RESOURCE_ANNOTATIONS",
                            items: {}
                        }
                    }
                    if (!self.data.annotations.items) {
                        self.data.annotations.items = {};
                    }
                }


                self.addAttribute = function (parentCons, name) {
                    var cAttribute = AOM.newCAttribute(name);
                    parentCons.attributes = parentCons.attributes || [];
                    parentCons.attributes.push(cAttribute);
                    self.enrichReplacementConstraint(cAttribute, parentCons);
                    return cAttribute;
                };

                self.addConstraint = function (parentAttrCons, ccons) {
                    parentAttrCons.children = parentAttrCons.children || [];
                    parentAttrCons.children.push(ccons);
                    self.enrichReplacementConstraint(ccons, parentAttrCons);
                    return ccons;
                };


                /**
                 *
                 * @param cons Constraint or attribute to remove
                 * @param {boolean?} forceRemove Forcefully removes the node even if it is present in parent. Useful in custom handlers. Default is false
                 * @return {*}
                 */
                self.removeConstraint = function (cons, forceRemove) {
                    function removeFromTermDefinitions(node_id) {
                        for (var lang in self.data.terminology.term_definitions) {
                            var langDefs = self.data.terminology.term_definitions[lang];
                            delete langDefs[node_id];
                        }
                    }

                    function removeFromTermBindings(node_id) {
                        for (var terminology in self.data.terminology.term_bindings) {
                            var terminologyDefs = self.data.terminology.term_bindings[terminology];
                            delete terminologyDefs[node_id];
                        }
                    }

                    function removeConstraintTerms(cons) {
                        if (cons.node_id && self.isSpecialized(cons.node_id)) {
                            removeFromTermDefinitions(cons.node_id);
                            removeFromTermBindings(cons.node_id);
                            removeTermId(cons.node_id);
                        }
                        if (cons.attributes) {
                            for (var i in cons.attributes) {
                                var attr = cons.attributes[i];
                                for (var j in attr.children || []) {
                                    removeConstraintTerms(attr.children[j]);
                                }
                            }
                        }
                        if (cons["@type"] === "C_TERMINOLOGY_CODE") {
                            if (cons.code_list && cons.code_list.length === 1) {
                                // currently does not support sharing of value sets and terminology
                                var valueSet = self.data.terminology.value_sets[cons.code_list[0]];
                                if (valueSet && self.isSpecialized(cons.code_list[0])) {
                                    // does not support common value sets
                                    self.removeValueSet(cons.code_list[0]);
                                }
                            }
                        }
                    }

                    function removeAttribute(attr) {
                        var parentCons = attr[".parent"];
                        var parentParentCons = self.getParentConstraint(parentCons);
                        var parentAttr = parentParentCons ? self.getAttribute(parentParentCons, attr.rm_attribute_name) : undefined;
                        if (parentAttr) {
                            // do nothing if parent attribute is present
                            return attr;
                        } else {
                            for (var i in parentCons.attributes) {
                                var attrChild = parentCons.attributes[i];
                                if (attrChild === attr) {
                                    parentCons.attributes.splice(i, 1);
                                    return undefined;
                                }
                            }
                        }
                    }

                    function removeConstraint(cons) {
                        var parentAttr = cons[".parent"];
                        var parentArchetypeCons = self.getParentConstraint(cons);
                        for (var i in parentAttr.children) {
                            var consChild = parentAttr.children[i];
                            if (consChild === cons) {
                                removeConstraintTerms(cons);
                                if (parentArchetypeCons && !forceRemove) {
                                    var newCons = AOM.impoverishedClone(parentArchetypeCons);
                                    self.enrichReplacementConstraint(newCons, cons[".parent"]);
                                    parentAttr.children[i] = newCons;
                                    return newCons;
                                } else {
                                    parentAttr.children.splice(i, 1);
                                    return undefined;
                                }
                            }
                        }
                    }


                    // never remove parent root from archetype
                    if (!cons[".parent"]) return cons;

                    if (cons["@type"] === "C_ATTRIBUTE") {
                        return removeAttribute(cons);
                    } else {
                        return removeConstraint(cons);
                    }
                };


                /**
                 * Updates annotations for a node.
                 *
                 * @param cons Constraint for which to update annotations
                 * @param annotations A {language: {key: value}} structure, containing all annotations for all languages
                 * @returns {{}}
                 */
                self.updateAnnotationsForNode = function (cons, annotations) {

                    var consRmPath = self.getRmPath(cons);
                    var consPath = consRmPath.toString();

                    ensureAnnotations();

                    // remove specialized annotations
                    Stream(self.allLanguages()).each(function (lang) {
                        var langAnnotations = self.data.annotations.items[lang];
                        if (langAnnotations) {
                            if (consRmPath.segments.node_id) {
                                // delete all annotations that match path and have specialized node_id
                                for (var path in langAnnotations) {
                                    if (my.AmQuery.pathMatches(path, consRmPath, {matchParent: true})) {
                                        var attrPath = my.RmPath.of(path);
                                        if (attrPath.lastSegment().node_id === consRmPath.lastSegment().node_id) {
                                            delete langAnnotations[path];
                                        }
                                    }
                                }
                            } else {
                                delete langAnnotations[consPath];
                            }

                        }
                    });
                    var parentAnnotations = self.getAnnotationsForNode(cons);

                    for (var lang in annotations) {
                        var langAnnotations = annotations[lang];
                        var parentLangAnnotations = parentAnnotations[lang] || {};
                        for (var key in langAnnotations) {
                            if (parentLangAnnotations[key] && parentLangAnnotations[key] === langAnnotations[key]) {
                                delete langAnnotations[key];
                            }
                        }
                        if (!$.isEmptyObject(langAnnotations)) {
                            var aitems = self.data.annotations.items;
                            if (!aitems[lang]) {
                                aitems[lang] = {};
                            }
                            aitems[lang][consPath] = AmUtils.clone(langAnnotations);
                        }
                    }
                };


                /**
                 * Moves a constraint cons before a constraint anchorCons. Moving has some limitations:
                 * Both cons and its parent must be specialized, cons must be a constraint, cons and anchorCons
                 * must have the same parent.
                 *
                 * @param {object} cons Constraint to move
                 * @param {object?} anchorCons constraint before which to move. If undefined, move to the end of list
                 * @return {boolean} True if the move was successful
                 */
                self.moveBefore = function (cons, anchorCons) {
                    if (!AOM.mixin(cons).isConstraint() || !self.isSpecialized(cons)) {
                        console.error("Only specialized constraints can be moved");
                        return false;
                    }


                    if (anchorCons && anchorCons[".parent"] !== cons[".parent"]) {
                        console.error("Can only move before a constraint on the same level");
                        return false;
                    }

                    if (!self.isSpecialized(cons[".parent"])) {
                        console.error("Can only move constraints on a specialized parent");
                        return false;
                    }

                    var parentAttr = cons[".parent"];
                    var found = false;
                    for (var i in parentAttr.children) {
                        var consChild = parentAttr.children[i];
                        if (consChild === cons) {
                            parentAttr.children.splice(i, 1);
                            found = true;
                        }
                    }
                    if (!found) throw "cons is not a child of its own parent";

                    if (anchorCons) {
                        var found = false;
                        for (var i in parentAttr.children) {
                            var consChild = parentAttr.children[i];
                            if (consChild === anchorCons) {
                                parentAttr.children.splice(i, 0, cons);
                                found = true;
                                break;
                            }
                        }
                        if (!found) throw "targetCons is not a child of its own parent";

                    } else {
                        parentAttr.children.push(cons);
                    }
                    toastr.success("Reorder successful!");
                    return true;

                };
                self.moveBeforeChecker = function (cons, anchorCons) {
                    if (!AOM.mixin(cons).isConstraint() || !self.isSpecialized(cons)) {
                        console.error("Only specialized constraints can be moved");
                        toastr.error("Only specialized constraints can be moved");
                        return false;
                    }

                    if (anchorCons && anchorCons[".parent"] !== cons[".parent"]) {
                        console.error("Can only move before a constraint on the same level");
                        toastr.error("You can only move constraints on the same level");
                        return false;
                    }

                    /*  if (!self.isSpecialized(cons[".parent"])) {
                     console.error("Can only move constraints on a specialized parent");
                     toastr.error("You can only move constraints which are on a specialized parent");
                     return false;
                     }*/
                    return true;

                };

                self.getArchetypeId = function () {
                    return data.archetype_id.value;
                };

                self.getArchetypeLabel = function (language) {
                    return self.getTermDefinitionText(self.data.definition.node_id, language);
                };


                self.parentArchetypeModel = parentArchetypeModel;
                self.data = data;
                self.defaultLanguage = defaultLanguage;
                self.translations = extractTranslations();
                self.specializationDepth = new my.NodeId(data.definition.node_id).getSpecializationDepth();
                data["@type"] = data["@type"] || "ARCHETYPE";


                enrichConstraintData(data.definition, undefined);
                data.definition[".archetypeModel"] = self;
                processOntology(data.terminology);

            }; // ArchetypeModel


            my.ArchetypeId = function (archetypeId) {
                var self = this;

                function parseContext(contextStr) {
                    var regex = /^([^-]+)\-([^-]+)\-([^.]+)/;
                    var match = regex.exec(contextStr);
                    if (!match) {
                        console.error("Invalid archetypeId context part", contextStr);
                        return null;
                    }
                    return {
                        "publisher": match[1],
                        "rm_package": match[2],
                        "rm_class": match[3]
                    }
                }

                function parseVersion(versionStr) {
                    var regex = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\-([^.]+))?(?:\.(\d+))?$/;
                    var match = regex.exec(versionStr);
                    if (!match) {
                        console.error("Invalid archetype id version part", versionStr);
                        return null;
                    }
                    return {
                        major: parseInt(match[1], 10),
                        minor: match[2] ? parseInt(match[2], 10) : null,
                        patch: match[3] ? parseInt(match[3], 10) : null,
                        status: match[4],
                        build_count: match[5] ? parseInt(match[5], 10) : null
                    }
                }

                function parseArchetypeId(archetypeId) {
                    var regex = /^(?:([^:]+)::)?([^.]+)\.([^.]+).v(.+)$/;
                    var match = regex.exec(archetypeId);
                    if (!match) {
                        console.error("Invalid archetypeId", archetypeId);
                        return null;
                    }
                    var result = {};
                    result.namespace = match[1];
                    result.context = parseContext(match[2]);
                    if (!result.context) {
                        console.error("Invalid archetypeId", archetypeId);
                        return null;
                    }
                    result.concept = match[3];
                    result.version = parseVersion(match[4]);
                    if (!result.version) {
                        console.error("Invalid archetypeId", archetypeId);
                        return null;
                    }
                    return result;
                }

                self.getContextString = function () {
                    var ctx = self.data.context;
                    return ctx.publisher + "-" + ctx.rm_package + "-" + ctx.rm_class;
                };
                self.setContextString = function (contextStr) {
                    var context = parseContext(contextStr);
                    if (context) {
                        self.data.context = context;
                    }
                };

                self.getVersionString = function () {
                    var v = self.data.version;
                    var result = v.major;
                    if (typeof v.minor === "number") {
                        result += "." + v.minor;
                    }
                    if (typeof v.patch === "number") {
                        result += "." + v.patch;
                    }
                    if (v.status) {
                        result += "-" + v.status;
                    }
                    if (v.build_count) {
                        result += "." + v.build_count;
                    }
                    return result;
                };

                self.setVersionString = function (versionStr) {
                    var version = parseVersion(versionStr);
                    if (version) {
                        self.data.version = version;
                    }
                };

                self.toString = function () {
                    var result = "";
                    if (self.data.namespace) {
                        result += self.data.namespace + "::";
                    }
                    result += self.getContextString() + ".";
                    result += self.data.concept + ".v";
                    result += self.getVersionString();
                    return result;
                };

                self.data = parseArchetypeId(archetypeId);
            };

            /**
             * Returns the archetype model representing the archetype containing this constraint. Constraint must be part of
             * archetypeModel.data.definition structure.
             *
             * @param {object} cons Constraint object contained in the archetype.
             * @return {AOM.ArchetypeModel} archetype model containing the constraint
             */
            my.ArchetypeModel.from = function (cons) {
                if(cons){
                    while (cons[".parent"]) cons = cons[".parent"];
                    if(cons['.archetypeModel']){
                        return cons[".archetypeModel"];
                    }
                }
            };


            /**
             * Creates an archetype model for a given archetype. Uses the provided archetype repository to load archetypes.
             *
             * @param {string|object} archetype Archetype to generate. Can be either an archetype id or a loaded flatArchetypeData object
             *
             * @param {AOM.ArchetypeRepository} archetypeRepository
             * @param {function(AOM.ArchetypeModel)} callback Function to call when the archetype model is created
             */
            my.ArchetypeModel.create = function (archetype, archetypeRepository, callback) {
                function createFromData(data) {
                    if (data.parent_archetype_id) {
                        archetypeRepository.loadArchetype(data.parent_archetype_id, function (parentData) {
                            var parentArchetypeModel = new my.ArchetypeModel(parentData);
                            var archetypeModel = new my.ArchetypeModel(data, parentArchetypeModel);
                            callback(archetypeModel);
                        });
                    } else {
                        var archetypeModel = new my.ArchetypeModel(data);
                        callback(archetypeModel);
                    }
                }

                if (typeof archetype === "string") {
                    archetypeRepository.loadArchetype(archetype, createFromData);
                } else {
                    createFromData(archetype);
                }
            };


// fabio wants me to do this before I even know the reference model. >:(
            function fillNewArchetypeDefinition(archetypeModel) {
                function fillObservation() {
                    var aObservationData = archetypeModel.addAttribute(archetypeModel.data.definition, "data");
                    var cDataHistory = AOM.newCComplexObject("HISTORY", archetypeModel.generateSpecializedTermId("id"));
                    archetypeModel.addConstraint(aObservationData, cDataHistory);
                    var aHistoryEvents = archetypeModel.addAttribute(cDataHistory, "events");
                    var cEventsAny = AOM.newCComplexObject("EVENT", archetypeModel.addNewTermDefinition("id", "Any event"));
                    archetypeModel.addConstraint(aHistoryEvents, cEventsAny);

                    var aEventData = archetypeModel.addAttribute(cEventsAny, "data");
                    var cEventData = AOM.newCComplexObject("ITEM_TREE", archetypeModel.generateSpecializedTermId("id"));
                    archetypeModel.addConstraint(aEventData, cEventData);

                    var aEventState = archetypeModel.addAttribute(cEventsAny, "state");
                    var cEventState = AOM.newCComplexObject("ITEM_TREE", archetypeModel.generateSpecializedTermId("id"));
                    archetypeModel.addConstraint(aEventState, cEventState);
                }

                function fillComposition() {
                    var aCompositionCategory = archetypeModel.addAttribute(archetypeModel.data.definition, "category");
                    var cCategoryConstraint = AOM.newCComplexObject("DV_CODED_TEXT", archetypeModel.generateSpecializedTermId("id"));
                    archetypeModel.addConstraint(aCompositionCategory, cCategoryConstraint);
                    var aDefiningCode = archetypeModel.addAttribute(cCategoryConstraint, "defining_code");
                    var cCode = AOM.newCTerminologyCode();
                    cCode.terminology_id = "openehr";
                    cCode.code_list = ["433"];
                    archetypeModel.addConstraint(aDefiningCode, cCode);
                }

                switch (archetypeModel.data.definition.rm_type_name) {
                    case "COMPOSITION":
                        fillComposition();
                        break;
                    case "OBSERVATION":
                        fillObservation();
                        break;
                }
            }

            /**
             * Creates a new archetype with no parent.
             *
             * @param {object} options archetype options
             * @param {string} options.rm_type rm type of the archetype, e.g. OBSERVATION
             * @param {string} options.concept concept name e.g. blood_pressure. By default converted from definition_text
             * @param {string?} options.version Archetype version, default is 1.0.0
             * @param {string} options.language Original language for the archetype, e.g. en
             * @param {object} options.definition_text Text of the main definition, e.g. Blood Pressure
             * @param {string} options.definition_description Description of the main definition, e.g.
             *              "Blood Pressure Measurement".
             * @return {AOM.ArchetypeModel} editable model of the new archetype
             */
            my.createNewArchetype = function (options) {
                var defaultOptions = {version: "1.0.0"};
                options = $.extend({}, defaultOptions, options);

                var newArchetypeJson = {
                    "@type": "ARCHETYPE",
                    "description": {
                        "@type": "RESOURCE_DESCRIPTION",
                        "original_author": {},
                        "lifecycle_state": "unmanaged",
                        "other_details": {},
                        "copyright": "",
                        "details": [{
                            "@type": "RESOURCE_DESCRIPTION_ITEM",
                            "language": {
                                "@type": "CODE_PHRASE",
                                "terminology_id": {
                                    "@type": "TERMINOLOGY_ID",
                                    "value": "ISO_639-1"
                                },
                                "code_string": options.language
                            },
                            "purpose": "",
                            "keywords": [],
                            "original_resource_uri": {},
                            "other_details": {}
                        }]
                    },
                    "translations": [],
                    "definition": {
                        "@type": "C_COMPLEX_OBJECT",
                        "attributes": [],
                        "attribute_tuples": [],
                        "occurrences": {
                            "@type": "MULTIPLICITY_INTERVAL",
                            "lower_included": true,
                            "upper_included": true,
                            "lower_unbounded": false,
                            "upper_unbounded": false,
                            "lower": 1,
                            "upper": 1
                        },
                        "rm_type_name": options.rm_type,
                        "node_id": "id1"
                    },
                    "invariants": [],
                    "terminology": {
                        "@type": "ARCHETYPE_TERMINOLOGY",
                        "term_definitions": {},
                        "constraint_definitions": {},
                        "term_bindings": {},
                        "constraint_bindings": {},
                        "terminology_extracts": {},
                        "value_sets": {}
                    },
                    "original_language": {
                        "@type": "CODE_PHRASE",
                        "terminology_id": {
                            "@type": "TERMINOLOGY_ID",
                            "value": "ISO_639-1"
                        },
                        "code_string": options.language
                    },
                    "is_controlled": false,
                    "annotations": {
                        "@type": "RESOURCE_ANNOTATIONS",
                        "items": {}
                    },
                    "archetype_id": {
                        "@type": "ARCHETYPE_ID",
                        "value": ""
                    },
                    "adl_version": "2.0.4",
                    "rm_release": "1.0.2",
                    "is_template": false,
                    "is_overlay": false
                };

                newArchetypeJson.archetype_id.value = "openEHR-EHR-" + options.rm_type + "." + options.concept + ".v" + options.version;

                newArchetypeJson.terminology.term_definitions[options.language] = {
                    "id1": {
                        "text": options.definition_text,
                        "description": options.definition_description
                    }
                };

                var archetypeModel = new my.ArchetypeModel(newArchetypeJson);
                fillNewArchetypeDefinition(archetypeModel);
                return archetypeModel;
            };

            /**
             * Creates a model of an archetype that specializes an existing archetype.
             *
             * @param {object} options specialization options
             * @param {string} options.archetypeId archetypeId of the new archetype
             * @param {AOM.ArchetypeModel} options.parent Archetype model of the parent archetype
             * @return (AOM.ArchetypeModel) archetype model of the new specialized archetype
             */
            my.createSpecializedArchetype = function (options) {
                var data = my.impoverishedClone(options.parent.data);

                data.archetype_id.value = options.archetypeId;
                data.parent_archetype_id = {
                    "@type": "ARCHETYPE_ID",
                    value: options.parent.getArchetypeId()
                };

                var originalNodeId = data.definition.node_id;
                var specializedNodeId = data.definition.node_id + ".1";
                data.definition.node_id = specializedNodeId;
                var td = data.terminology.term_definitions;
                for (var lang in td) {
                    td[lang][specializedNodeId] = AmUtils.clone(td[lang][originalNodeId]);
                }
                return new AOM.ArchetypeModel(data, options.parent);


            };

            my.ArchetypeRepository = function () {
                var self = this;

                self.load = function () {
                    return $.getJSON("rest/repo/list").done(function (data) {
                        self.infoList = data;
                        self.infoList.sort(function (a, b) {
                            return a.archetypeId < b.archetypeId ? -1 :
                                a.archetypeId > b.archetypeId ? 1 : 0;
                        })
                    });
                };

                /**
                 * @param {String} archetypeId Archetype id of the archetype to load
                 * @param {function} callback Callback function to call with archetype data on successful load
                 */
                self.loadArchetype = function (archetypeId, callback) {
                    $.getJSON("rest/repo/archetype/" + encodeURIComponent(archetypeId) + "/flat").success(
                        function (data) {
                            callback(data);
                        }
                    );
                };
            };

            /**
             * Creates a new reference model
             *
             * @param {function|object} model callback when loading is completed or preloaded reference model (for testing)
             * @constructor
             */
            my.ReferenceModel = function (model) {
                var self = this;

                self.load = function () {
                    return $.getJSON("rest/rm/openEHR/1.0.2").success(function (data) {
                        self.model = data;
                    });
                };


                self.name = function () {
                    return self.model.name;
                };

                self.getType = function (name) {
                    return self.model.types[name];
                };


                self.getExistence = function (attr) {
                    if (attr.existence) return attr.existence;
                    var parentCons = attr[".parent"];
                    var rmType = self.getType(parentCons.rm_type_name);
                    if (!rmType) return undefined;
                    var rmAttr = rmType.attributes[attr.rm_attribute_name];
                    return AmInterval.of(rmAttr.existence.lower, rmAttr.existence.upper || 1);
                };


                /**
                 * Returns true if childRmType is a subclass of parentRmType according to rm schema.
                 *
                 * @param {string} parentRmType
                 * @param {string} childRmType
                 * @param {boolean?} includeSelf Should a rmType be considered a subclass of itself. Default true.
                 * @return {boolean} True if childRmType is a subclass of parentRmType
                 */
                self.isSubclass = function (parentRmType, childRmType, includeSelf) {
                    if (includeSelf === undefined) includeSelf = true;
                    var rmType = self.model.types[childRmType];
                    if (rmType && !includeSelf) {
                        rmType = self.model.types[rmType.parent];
                    }

                    while (rmType) {
                        if (rmType.name === parentRmType) return true;
                        rmType = self.model.types[rmType.parent];
                    }
                    return false;
                };
                /**
                 * Returns a list of types that are children of parentType
                 *
                 * @param {string} parentType
                 * @param {boolean?} includeParent true if the parent should be included. By default false
                 * @returns {string[]} list of subtypes of parentType
                 */
                self.getSubclassTypes = function (parentType, includeParent) {
                    var result = [];
                    if (includeParent) {
                        result.push(parentType);
                    }
                    for (var type in self.model.types) {
                        if (parentType !== type && self.isSubclass(parentType, type, false)) {
                            result.push(type);
                        }
                    }
                    return result;
                };


                if (typeof "callback" === "object") {
                    self.state = "ok";
                    self.model = model;
                }

            };

            my.UnitsModel = function (unitProperties) {
                var self = this;

                self.getPropertyFromOpenEhrId = function (openEhrId) {
                    return Stream(self.data).filter(function (d) {
                        return d.openEhrId === openEhrId;
                    }).findFirst().orElse(undefined);
                };

                self.data = unitProperties;
            };


            my.makeEmptyConstrainsClone = function (cons) {
                if (typeof cons === "string") {
                    cons = {
                        "@type": cons,
                        rm_type_name: cons,
                        occurrences: AmInterval.of(1, 1, "MULTIPLICITY_INTERVAL")
                    }
                }

                var result = {
                    "@type": cons["@type"],
                    node_id: cons.node_id,
                    rm_type_name: cons.rm_type_name
                };
                if (cons.occurrences) {
                    result.occurrences = AmInterval.of(cons.occurrences.lower, cons.occurrences.upper, "MULTIPLICITY_INTERVAL");
                }
                result["@type"] = cons["@type"];
                AmUtils.cleanObjectProperties(result);
                return result;
            };

            /**
             * Makes a clone of constrains, but removes all enriched properties (those that start with .);
             * @param cons constraint
             * @returns {*} clone of cons, but without enriched properties
             */
            my.impoverishedClone = function (cons) {
                var result;
                if (cons === null || cons === undefined) return cons;
                if (typeof cons === "object") {
                    if (Array.isArray(cons)) {
                        result = [];
                        for (var i in cons) {
                            result.push(my.impoverishedClone(cons[i]));
                        }
                        return result;
                    } else {
                        result = {};
                        for (var key in cons) {
                            if (cons.hasOwnProperty(key)) {
                                if (key.substring(0, 1) !== ".") {
                                    result[key] = my.impoverishedClone(cons[key]);
                                }
                            }
                        }
                        return result;
                    }
                } else {
                    return cons;
                }
            };

            my.visitDefinition = function (rootCons, callback) {
                function walkChildren(children) {
                    if (!children) return;
                    for (var i = 0; i < children.length; i++) {
                        my.visitDefinition(children[i], callback);
                    }
                }

                if (!rootCons) return;
                callback(rootCons);
                walkChildren(rootCons.children || rootCons.attributes);
            };

            return my;
        }
        ()
    )
    ;
