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

    ArchetypeEditor.Modules = {};

    /**
     * Base object for rm handlers.
     * @abstract
     * @constructor
     */
    ArchetypeEditor.Modules.RmHandler = function () {
        var handler = this;

        handler.createCommonContext = function (stage, cons, parentCons) {
            cons = cons || {};
            var context = {
                "panel_id": GuiUtils.generateId(),
                "type": cons.rm_type_name
            };
            if (parentCons) {
                var h = stage.archetypeEditor.getRmTypeHandler(parentCons);
                if (h) {
                    context.parent = h.createContext(stage, parentCons);
                }
            }
            if (AOM.TemplateModel && AOM.TemplateModel.from(cons)) {
                context.isTemplate = true;
            }
            context.isParentConstrained = context.isTemplate && !!context.parent;
            return context;
        };

        /**
         * Creates context (a gui model from existing or new constrains)
         * @param {object} stage contains caller persistent information, such as archetypeModel and archetypeEditor
         * @param {object} cons Object for which to create the context. undefined if it does not exist yet
         * @param {object?} parentCons Matching constraint in the parent archetype, if available
         * @returns {object} context
         */
        handler.createContext = function (stage, cons, parentCons) {
        };

        /**
         * Displays the gui and populates it with the values of the context
         * @param {object} stage contains caller persistent information, such as archetypeModel and archetypeEditor
         * @param {object} context contains values to populate the gui
         * @param targetElement jquery element where the gui will be displayed
         */
        handler.show = function (stage, context, targetElement) {
        };

        /**
         * Optional function that can perform cleanup just before the panel is destroyed.
         * @param {object} stage contains caller persistent information, such as archetypeModel and archetypeEditor
         * @param {object} context contains values to populate the gui
         * @param targetElement jquery element where the gui is displayed
         */
        handler.hide = function (stage, context, targetElement) {
        };

        /** Updates context values from the current gui values
         * @param {object} stage contains caller persistent information, such as archetypeModel and archetypeEditor
         * @param context
         * @param targetElement
         */
        handler.updateContext = function (stage, context, targetElement) {
        };

        /**
         * Validates a context
         * @param {object} stage contains caller persistent information, such as archetypeModel and archetypeEditor
         * @param {context} context context to validate.
         * @param {AmUtils.Errors} errors Target for any validation errors
         */
        handler.validate = function (stage, context, errors) {
        };

        /**
         * Updates constraint values from the context values.
         *
         * @param {object} stage contains caller persistent information, such as archetypeModel and archetypeEditor
         * @param context contains values that are to be copied on the context
         * @param cons target constrains where the context values will be written
         */
        handler.updateConstraint = function (stage, context, cons) {
        };

    };


    ArchetypeEditor.CommonModule = {
        createCommonContext: function (stage, cons) {
            cons = cons || {};
            var context = {
                "panel_id": GuiUtils.generateId(),
                "type": cons.rm_type_name
            };
            return context;
        }
    };

    var CommonModule = function () {
        var self = this;
        self.name = "@common"; // stands for common module

        var CommonRmHandler = function () {
            var handler = this;
            ArchetypeEditor.Modules.RmHandler.call(handler);

        };
        AmUtils.extend(CommonRmHandler, ArchetypeEditor.Modules.RmHandler);


        var TopCommonHandler = function () {
            var handler = this;
            CommonRmHandler.call(handler);

            handler.createContext = function (stage, cons, parentCons) {
                cons = cons || {};
                var context = handler.createCommonContext(stage, cons);
                context.node_id = cons.node_id;
                context.type = "top";
                context.occurrences = (cons.occurrences) ? AmInterval.toContainedString(cons.occurrences) : "(*..*)";
                context.rmPath = stage.archetypeModel.getRmPath(cons).toString();

                if (parentCons) {
                    context.parent = handler.createContext(stage, parentCons);
                }

                return context;
            };

            handler.show = function (stage, context, targetElement) {

                /**
                 *
                 * @param {object} select jquery select element
                 * @param {object} mapOfOptions map of name/value options
                 */
                function fillSelectOptions(select, mapOfOptions) {
                    select.empty();
                    for (var key in mapOfOptions) {
                        select.append($("<option>").attr('name', key).text(mapOfOptions[key]));

                    }
                }

                function createExistenceMap(occ) {
                    var result = {};
                    if (!occ || !occ.lower) {
                        result['prohibited'] = 'prohibited';
                        if (!occ || occ.upper !== 0) {
                            result['optional'] = 'optional';
                        }
                    }
                    if (!occ || occ.upper !== 0) {
                        result['mandatory'] = 'mandatory';
                    }
                    return result;
                }

                function createMultiplicityMap(occ) {
                    var result = {};
                    result['not_repeating'] = 'not repeating';
                    if (!occ || occ.upper === undefined || occ.upper > 1) {
                        result['bounded'] = 'bounded';
                    }
                    if (!occ || occ.upper === undefined) {
                        result['unbounded'] = 'unbounded';
                    }
                    return result;
                }

                GuiUtils.applyTemplate("properties/constraint-common|top", context, function (html) {

                    function prefillInputValues() {
                        if (occ.lower) {
                            existenceSelect.val('mandatory');
                        } else if (occ.upper === 0) {
                            existenceSelect.val('prohibited');
                        } else {
                            existenceSelect.val('optional');
                        }
                        if (occ.upper === undefined) {
                            multiplicitySelect.val('unbounded');
                        } else if (occ.upper === 1) {
                            multiplicitySelect.val('mandatory');
                        } else {
                            multiplicitySelect.val('bounded');
                        }
                        multiplicityBoundInput.val(String(occ.upper || 1));
                    }

                    html = $(html);
                    var parentOcc = stage.templateModel && AmInterval.parseContainedString(context.parent.occurrences);
                    var occ = AmInterval.parseContainedString(context.occurrences);

                    var existenceMap = createExistenceMap(parentOcc);
                    var multiplicityMap = createMultiplicityMap(parentOcc);

                    var existenceSelect = html.find('#' + context.panel_id + "_existence");
                    var multiplicitySelect = html.find('#' + context.panel_id + "_multiplicity");
                    var multiplicityBoundInput = html.find('#' + context.panel_id + "_multiplicity_bound");

                    var minV = (parentOcc && parentOcc.lower) ? parentOcc.lower : 0;
                    var maxV = parentOcc && parentOcc.upper ? parentOcc.upper : 1;

                    if (typeof occ.lower != 'undefined' && typeof occ.upper != 'undefined') {
                        minV = occ.lower;
                        maxV = occ.upper;
                    }

                    html.find('#' + context.panel_id + "_minOccur").val(minV);
                    var oldValue = minV + '..' + maxV;
                    html.find('#' + context.panel_id + "_minMaxF").editable({
                        value: minV + '..' + maxV,

                        tpl: "<input type='text' style='width: 100px'>",
                        success: function (response, newValue) {
                            var formatted = '';
                            if (newValue == '') {
                                toastr.error("You cannot leave occurrences empty! Changes are reverted");
                                return {newValue: oldValue};
                            }
                            newValue = newValue.replace(/\s+/g, '');
                            switch (newValue) {
                                case '1':
                                    formatted = 0 + '..' + 1;
                                    oldValue = 0 + '..' + 1;
                                    return {newValue: formatted};
                                    break;
                                case '0':
                                    formatted = 0 + '..' + 0;
                                    oldValue = 0 + '..' + 0;
                                    return {newValue: formatted};
                                    break;
                                case '*':
                                    formatted = 0 + '..' + '*';
                                    oldValue = 0 + '..*';
                                    return {newValue: formatted};
                                    break;
                                default:
                                    if (!isNaN(newValue) && newValue % 1 == 0) {
                                        formatted = '0..' + newValue + '';
                                        oldValue = 0 + '..' + newValue;
                                        return {newValue: formatted};
                                        break;
                                    }
                                    else {
                                        if (newValue.indexOf('[') != -1) {
                                            newValue = newValue.substr(newValue.indexOf('[') + 1);
                                        }
                                        if (newValue.indexOf(']') != -1) {
                                            newValue = newValue.substr(0, newValue.indexOf(']'));
                                        }
                                        var parse = newValue.indexOf('..');

                                        if (parse == -1) {
                                            toastr.error("Please insert a valid format: ex. x..y");
                                            return {newValue: oldValue};
                                            break;
                                        }
                                        var minR = newValue.substring(0, parse);
                                        var maxR = newValue.substring(parse + 2);
                                        if (isNaN(Number(minR)) || isNaN(Number(maxR))) {
                                            toastr.error("Please insert a valid format: ex. [x..y]");
                                            return {newValue: oldValue};
                                        }

                                        formatted = minR + '..' + maxR;

                                        if (minR > maxR) {
                                            toastr.error("Min value cannot be bigger than max value");
                                            return {newValue: oldValue};
                                        }
                                        oldValue = minR + '..' + maxR;
                                        return {newValue: formatted};
                                        break;
                                    }

                            }

                            toastr.error("Please insert a valid format: ex. [x..y]");
                            return {newValue: oldValue};


                        }
                    })
                    /*.on('shown', function(e, editable) {
                     editable.input.$input.val(editable["value"].substr(1,editable["value"].length-2));
                     });*/

                    //html.find('#' + context.panel_id + "_minMaxF").text('[ '+minV+'..'+maxV+' ]');

                    /* $("#minOccurq").attr('href', "qqw");
                     html.find('#' + context.panel_id + "_maxOccur").val(maxV);
                     $('#minOccurq').editable({
                     success: function(response, newValue) {
                     switch(newValue)
                     {
                     case '1':
                     toastr.success('[' + 0 + '..' + 1 + ']');
                     break;
                     case '0':
                     toastr.success('[' + 0 + '..' + 0 + ']');
                     break;
                     case '*':
                     toastr.success('[' + 0 + '..' + '*' + ']');
                     break;
                     default:
                     var parse = newValue.indexOf('..');
                     var minR = newValue.substring(0, parse-1);
                     var maxR = newValue.substring(parse+2, newValue.length-1);
                     toastr.success('[' + minR + '..' + maxR + ']');
                     break;
                     }
                     }
                     });*/


                    fillSelectOptions(existenceSelect, existenceMap);
                    fillSelectOptions(multiplicitySelect, multiplicityMap);

                    prefillInputValues();
                    function updateVisibility() {
                        var multVisible = existenceSelect.val() !== 'prohibited';
                        GuiUtils.setVisible(multiplicitySelect, multVisible);
                        GuiUtils.setVisible(multiplicityBoundInput, multVisible && multiplicitySelect.val() === 'bounded');
                    }

                    updateVisibility();

                    existenceSelect.on('change', updateVisibility);
                    multiplicitySelect.on('change', updateVisibility);


                    targetElement.append(html);
                });
            };

            handler.updateContext = function (stage, context, targetElement) {
                /* var existenceSelect = targetElement.find('#' + context.panel_id + "_existence");
                 var multiplicitySelect = targetElement.find('#' + context.panel_id + "_multiplicity");
                 var multiplicityBoundInput = targetElement.find('#' + context.panel_id + "_multiplicity_bound");
                 var minRange = targetElement.find('#' + context.panel_id + "_minOccur").val();
                 var maxRange = targetElement.find('#' + context.panel_id + "_maxOccur").val();*/

                var minmaxRange = $('.minMaxF').text();
                context.occurrences = '[' + minmaxRange + ']';

                /*var minR, maxR;
                 switch(minmaxRange)
                 {
                 case '1':
                 context.occurrences = '[' + 0 + '..' + 1 + ']';
                 break;
                 case '0':
                 context.occurrences = '[' + 0 + '..' + 0 + ']';
                 break;
                 case '*':
                 context.occurrences = '[' + 0 + '..' + '*' + ']';
                 break;
                 default:
                 var parse = minmaxRange.indexOf('..');
                 minR = minmaxRange.substring(0, parse-1);
                 maxR = minmaxRange.substring(parse+2, minmaxRange.length-1);
                 context.occurrences = '[' + minR + '..' + maxR + ']';
                 break;
                 }
                 toastr.success(context.occurrences);
                 if(minmaxRange === '1')
                 {
                 context.occurrences = '[' + minRange + '..' + maxRange + ']';
                 }
                 if(min)

                 if(!minRange || isNaN(minRange)) {
                 toastr.error("Please set a valid min range");
                 minRange = 0;
                 }
                 if(!maxRange) {
                 if(!isNaN(maxRange) && maxRange != '*')
                 maxRange = '*';
                 }
                 if(!isNaN(minRange) && !isNaN(maxRange))
                 {
                 if(maxRange < minRange)
                 //alert("The minimum occurrence range cannot be bigger than the maximum");
                 toastr.error("The minimum occurrence range cannot be bigger than the maximum");
                 }

                 context.occurrences = '[' + minRange + '..' + maxRange + ']';*/

                /* var existence = existenceSelect.val();
                 if (existence === 'prohibited') {
                 context.occurrences = '[0..0]';
                 } else {
                 var low = existence === 'optional' ? '0' : '1';
                 var high = '*';
                 var multiplicity = multiplicitySelect.val();
                 if (multiplicity === 'not repeating') {
                 high = '1';
                 } else if (multiplicity === 'bounded') {
                 high = multiplicityBoundInput.val();
                 if (isNaN(Number(high))) {
                 high = '0';
                 }
                 } else {
                 high = '*';
                 }
                 context.occurrences = '[' + low + '..' + high + ']';
                 }*/
            };

            handler.validate = function (stage, context, errors) {
                var occ = AmInterval.parseContainedString(context.occurrences, "MULTIPLICITY_INTERVAL");

                if (!errors.validate(occ, "Invalid occurrences format", "occurrences")) {
                    toastr.error("Invalid occurrances format!");
                    return;
                }
                if (stage.templateModel) {
                    var parentOcc = AmInterval.parseContainedString(context.parent.occurrences);
                    if (!AmInterval.contains(parentOcc, occ)) {
                        errors.add('Occurrences ' + AmInterval.toContainedString(occ) + ' do not conform to parent occurrences ' + AmInterval.toContainedString(parentOcc), 'occurrences');
                        toastr.error('Occurrences ' + AmInterval.toContainedString(occ) + ' do not conform to parent occurrences ' + AmInterval.toContainedString(parentOcc), 'occurrences');
                    }
                }
            };

            handler.updateConstraint = function (stage, context, cons) {
                cons.occurrences =
                    AmInterval.parseContainedString(context.occurrences, "MULTIPLICITY_INTERVAL");
            };
        };
        AmUtils.extend(TopCommonHandler, CommonRmHandler);

        var MainCommonHandler = function () {
            var handler = this;
            CommonRmHandler.call(handler);

            handler.createContext = function (stage, cons, parentCons) {
                cons = cons || {};
                var context = handler.createCommonContext(stage, cons);
                var topHandler = stage.archetypeEditor.getRmTypeHandler("top", "@common");
                context.type = "main";
                context.top = topHandler.createContext(stage, cons, parentCons);
                context.cons = AOM.impoverishedClone(cons);
                var constraintHandler = stage.archetypeEditor.getRmTypeHandler(cons);
                if (constraintHandler) {
                    context.constraint = constraintHandler.createContext(stage, cons, parentCons);
                }

                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate("properties/constraint-common|main", context, function (html) {
                    html = $(html);
                    targetElement.append(html);

                    var topHandler = stage.archetypeEditor.getRmTypeHandler("top", "@common");
                    topHandler.show(stage, context.top, targetElement.find('#' + context.top.panel_id));

                    var constraintHandler = stage.archetypeEditor.getRmTypeHandler(context.cons);
                    if (constraintHandler) {
                        constraintHandler.show(stage, context.constraint, targetElement.find('#' + context.constraint.panel_id));
                    }

//                    stage.archetypeEditor.applySubModules(stage, html, context);

                });
            };

            handler.updateContext = function (stage, context, targetElement) {
                var topHandler = stage.archetypeEditor.getRmTypeHandler("top", "@common");
                topHandler.updateContext(stage, context.top, targetElement);
//                stage.archetypeEditor.applySubModulesUpdateContext(stage, targetElement, context);
                if (context.constraint) {
                    var constraintHandler = stage.archetypeEditor.getRmTypeHandler(context.cons);
                    constraintHandler.updateContext(stage, context.constraint, targetElement);
                }
            };

            handler.validate = function (stage, context, errors) {
                var topHandler = stage.archetypeEditor.getRmTypeHandler("top", "@common");
                topHandler.validate(stage, context.top, errors);
                if (context.constraint) {
                    var constraintHandler = stage.archetypeEditor.getRmTypeHandler(context.cons);
                    constraintHandler.validate(stage, context.constraint, errors);
                }
            };

            handler.updateConstraint = function (stage, context, cons) {
                var topHandler = stage.archetypeEditor.getRmTypeHandler("top", "@common");
                topHandler.updateConstraint(stage, context.top, cons);
                if (context.constraint) {
                    var constraintHandler = stage.archetypeEditor.getRmTypeHandler(context.cons);
                    constraintHandler.updateConstraint(stage, context.constraint, cons);
                }
            };
        };
        AmUtils.extend(MainCommonHandler, CommonRmHandler);

        var ArchetypeSlotHandler = function () {
            var handler = this;
            CommonRmHandler.call(handler);


            function toContextAssertions(assertions) {
                var result = [];
                for (var i in assertions) {
                    var assertion = assertions[i];
                    var startIndex = assertion.string_expression.indexOf("{/") + 2;
                    var endIndex = assertion.string_expression.lastIndexOf("/}");
                    var pattern = assertion.string_expression.substring(startIndex, endIndex);
                    result.push(pattern);
                }
                return result;
            }

            function toConstraintsAssertions(assertions) {
                var result = [];
                for (var i in assertions) {
                    var pattern = assertions[i];
                    var consObj = {
                        "@type": "ASSERTION",
                        "string_expression": "",
                        "expression": {
                            "@type": "EXPR_BINARY_OPERATOR",
                            "type": "CONSTRAINT"
                        }
                    };
                    consObj.string_expression = "archetype_id/value matches {/" + pattern + "/}";
                    result.push(consObj);
                }
                return result;
            }

            var AssertionList = function (targetElement, candidates, assertions) {
                targetElement.empty();

                var context = {
                    panel_id: GuiUtils.generateId()
                };

                GuiUtils.applyTemplate("properties/constraint-common|ARCHETYPE_SLOT/assertionList", context, function (html) {
                    html = $(html);
                    targetElement.append(html);

                    function populateAssertionsSelect() {
                        assertionsSelect.empty();
                        for (var i in assertions) {
                            var assertion = assertions[i];
                            var option = $("<option>").attr('value', assertion).text(assertion);
                            assertionsSelect.append(option);
                        }
                    }

                    function updateAssertionsFromSelect() {
                        assertions.length = 0;
                        assertionsSelect.find("option").each(function () {
                            assertions.push($(this).val())
                        });
                    }

                    function removeSelectedOptions() {
                        assertionsSelect.find(":selected").remove();
                        updateAssertionsFromSelect();
                    }

                    function quoteRegexp(str) {
                        return (str + '').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
                    }

                    function makePattern(archetypeId, useSpecializations) {
                        if (useSpecializations) {
                            var versionIndex = archetypeId.lastIndexOf('.v');
                            return quoteRegexp(archetypeId.substring(0, versionIndex))
                                + "(-[a-zA-Z0-9_]+)*"
                                + quoteRegexp(archetypeId.substring(versionIndex));

                        } else {
                            return quoteRegexp(archetypeId);
                        }

                    }

                    function addArchetypeAssertion() {

                        var dialogContext = {
                            panel_id: GuiUtils.generateId(),
                            candidates: []
                        };

                        var existingPatterns = AmUtils.listToSet(assertions);
                        for (var i in candidates) {
                            var candidate = candidates[i];
                            if (!existingPatterns[makePattern(candidate.archetypeId, true)]
                                || !existingPatterns[makePattern(candidate.archetypeId, false)]) {
                                dialogContext.candidates.push(candidate);
                            }
                        }

                        if (dialogContext.candidates.length === 0) return; // nothing to add

                        GuiUtils.applyTemplate("properties/constraint-common|ARCHETYPE_SLOT/addAssertionDialog", dialogContext, function (html) {
                            html = $(html);

                            var candidatesSelect = html.find('#' + dialogContext.panel_id + '_candidates');
                            var useSpecializationsCheck = html.find('#' + dialogContext.panel_id + '_specializations');

                            GuiUtils.openSimpleDialog(
                                {
                                    title: "Add assertions",
                                    buttons: {"add": "Add"},
                                    content: html,
                                    callback: function () {
                                        var checkedOptions = candidatesSelect.find(':selected');
                                        var useSpecializations = useSpecializationsCheck.prop('checked');
                                        for (var i = 0; i < checkedOptions.length; i++) {
                                            var checkedOption = $(checkedOptions[i]);
                                            var pattern = makePattern(checkedOption.val(), useSpecializations);
                                            if (!existingPatterns[pattern]) {
                                                assertions.push(pattern);
                                                existingPatterns[pattern] = true;
                                            }
                                        }
                                        populateAssertionsSelect();
                                    }
                                });
                        });

                    }

                    var assertionsSelect = html.find('#' + context.panel_id + "_list");
                    var addButton = html.find('#' + context.panel_id + "_add");
                    var removeButton = html.find('#' + context.panel_id + "_remove");

                    addButton.on('click', addArchetypeAssertion);
                    removeButton.on('click', removeSelectedOptions);

                    populateAssertionsSelect();
                });
            };

            handler.createContext = function (stage, cons, parentCons) {
                cons = cons || {};
                var context = handler.createCommonContext(stage, cons);
                context.includes = toContextAssertions(cons.includes);
                context.excludes = toContextAssertions(cons.excludes);
                context.candidateArchetypes = [];
                context.isClosed = cons.is_closed;
                context.hasSlotParent = !!parentCons;

                var archetypeInfos = stage.archetypeEditor.archetypeRepository.infoList;
                var referenceModel = stage.archetypeEditor.referenceModel;
                for (var i in archetypeInfos) {
                    var info = archetypeInfos[i];
                    if (!cons.rm_type_name || referenceModel.isSubclass(cons.rm_type_name, info.rmType)) {
                        context.candidateArchetypes.push(info)
                    }
                }

                return context;
            };

            handler.show = function (stage, context, targetElement) {

                GuiUtils.applyTemplate("properties/constraint-common|ARCHETYPE_SLOT", context, function (html) {
                    html = $(html);
                    targetElement.append(html);

                    var includesContainer = html.find('#' + context.panel_id + '_includes');
                    var excludesContainer = html.find('#' + context.panel_id + '_excludes');
                    var closedCheck = html.find('#' + context.panel_id + '_closed');
                    closedCheck.prop('checked', context.isClosed);

                    var includesComponent = new AssertionList(includesContainer, context.candidateArchetypes, context.includes);
                    var excludesComponent = new AssertionList(excludesContainer, context.candidateArchetypes, context.excludes);

                });
            };

            handler.updateContext = function (stage, context, targetElement) {
                var closedCheck = targetElement.find('#' + context.panel_id + '_closed');
                context.isClosed = closedCheck.prop('checked');
            };

            handler.validate = function (stage, context, errors) {
            };

            handler.updateConstraint = function (stage, context, cons) {
                cons.includes = toConstraintsAssertions(context.includes);
                cons.excludes = toConstraintsAssertions(context.excludes);
                cons.is_closed = context.isClosed ? true : null
            };
        };
        AmUtils.extend(ArchetypeSlotHandler, CommonRmHandler);


        var ArchetypeInternalRefHandler = function () {
            var handler = this;
            CommonRmHandler.call(handler);


            handler.createContext = function (stage, cons, parentCons) {
                cons = cons || {};
                var context = handler.createCommonContext(stage, cons);
                context.target_path = cons.target_path;
                return context;
            };

            handler.show = function (stage, context, targetElement) {
                GuiUtils.applyTemplate("properties/constraint-common|ARCHETYPE_INTERNAL_REF", context, function (html) {
                    html = $(html);
                    targetElement.append(html);
                });
            };

            handler.updateContext = function (stage, context, targetElement) {
            };

            handler.validate = function (stage, context, errors) {
            };

            handler.updateConstraint = function (stage, context, cons) {
                // read only, so no update allowed
            };
        };
        AmUtils.extend(ArchetypeInternalRefHandler, CommonRmHandler);


        self.handlers = {};
        self.handlers["top"] = new TopCommonHandler();
        self.handlers["main"] = new MainCommonHandler();
        self.handlers["ARCHETYPE_SLOT"] = new ArchetypeSlotHandler();
        self.handlers["ARCHETYPE_INTERNAL_REF"] = new ArchetypeInternalRefHandler();

    };

    ArchetypeEditor.addRmModule(new CommonModule());
}(ArchetypeEditor || {}) );