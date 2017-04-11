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


        var PrimitiveModule = function () {
            var self = this;
            self.name = ""; // empty string stands for primitives

            var PrimitiveRmHandler = function () {
                var handler = this;
                ArchetypeEditor.Modules.RmHandler.call(handler);

            };
            AmUtils.extend(PrimitiveRmHandler, ArchetypeEditor.Modules.RmHandler);

            var CRealHandler = function () {
                var handler = this;
                PrimitiveRmHandler.call(handler);

                handler.createContext = function (stage, cons, parentCons) {
                    cons = cons || {};
                    var context = handler.createCommonContext(stage, cons, parentCons);
                    context.type = 'C_REAL';

                    context.range_id = GuiUtils.generateId();
                    context.range = (cons.constraint && cons.constraint.length > 0) ? AmInterval.toContainedString(cons.constraint[0]) : "(*..*)";
                    context.assumed_value_id = GuiUtils.generateId();
                    context.assumed_value = cons.assumed_value != undefined ? String(cons.assumed_value) : "";

                    return context;
                };

                handler.show = function (stage, context, targetElement) {
                    GuiUtils.applyTemplate("properties/constraint-primitive|C_REAL", context, targetElement);
                };

                handler.updateContext = function (stage, context, targetElement) {
                    context.range = targetElement.find('#' + context.range_id).val();
                    context.assumed_value = targetElement.find('#' + context.assumed_value_id).val().trim();
                };


                handler.validate = function (stage, context, errors) {
                    var range = context.range && AmInterval.parseContainedString(context.range, "INTERVAL_OF_REAL");

                    if (typeof context.assumed_value === "string" && context.assumed_value.length > 0) {
                        var assumed_value = parseFloat(context.assumed_value);
                        errors.validate(!isNaN(assumed_value), "Invalid number", "assumed_value");
                        if (range) {
                            errors.validate(AmInterval.contains(range, assumed_value), "Out of range", "assumed_value");
                        }
                    }
                    if (context.range && context.range.length > 0) {
                        errors.validate(range, "Invalid interval", "range");
                    }

                    if (context.isParentConstrained) {
                        var parentRange = AmInterval.parseContainedString(context.parent.range, "INTERVAL_OF_REAL");
                        if (parentRange) {
                            if (!AmInterval.contains(parentRange, range)) {
                                errors.add("Range " + context.range + " is not a subset of parent range " + context.parent.range, "range");
                            }
                        }

                        if (context.parent.assumed_value !== undefined && context.assumed_value !== context.assumed_value) {
                            errors.add("Assumed value does not match parent assumed value", "assumed_value");
                        }
                    }
                };

                handler.updateConstraint = function (stage, context, cons) {
                    cons.assumed_value = parseFloat(context.assumed_value);

                    if (context.range === "" || context.range === "(*..*)") {
                        cons.constraint = [];
                    } else {
                        var rns = AmInterval.parseContainedString(context.range, "INTERVAL_OF_REAL");
                        if (rns && rns.upper === undefined && rns.lower === undefined) rns = undefined;
                        cons.constraint = rns ? [rns] : [];
                    }
                    return cons;
                };
            };
            AmUtils.extend(CRealHandler, PrimitiveRmHandler);

            var CIntegerHandler = function () {
                var handler = this;
                PrimitiveRmHandler.call(handler);
                handler.createContext = function (stage, cons, parentCons) {
                    cons = cons || {};
                    var context = handler.createCommonContext(stage, cons, parentCons);
                    context.type = 'C_INTEGER';
                    context.range_id = GuiUtils.generateId();
                    context.range = (cons.constraint && cons.constraint.length > 0) ? AmInterval.toContainedString(cons.constraint[0]) : "(*..*)";
                    context.assumed_value_id = GuiUtils.generateId();
                    context.assumed_value = cons.assumed_value != undefined ? String(cons.assumed_value) : "";

                    return context;
                };

                handler.show = function (stage, context, targetElement) {
                    GuiUtils.applyTemplate("properties/constraint-primitive|C_INTEGER", context, targetElement);
                };

                handler.updateContext = function (stage, context, targetElement) {
                    context.range = targetElement.find('#' + context.range_id).val();
                    context.assumed_value = targetElement.find('#' + context.assumed_value_id).val().trim();
                };

                handler.validate = function (stage, context, errors) {
                    var range = AmInterval.parseContainedString(context.range, "INTERVAL_OF_INTEGER");

                    if (context.assumed_value && context.assumed_value.length > 0) {
                        var num = parseInt(context.assumed_value);
                        errors.validate(AmUtils.isInt(num), "Invalid integer", "assumed_value");
                        if (range) {
                            errors.validate(AmInterval.contains(range, num), "Out of range", "assumed_value");
                        }

                    }
                    if ((context.range) && context.range.length > 0 && context.range !== "(*..*)") {
                        errors.validate(range, "Invalid interval", "range");
                    }

                    if (context.isParentConstrained) {
                        var parentRange = AmInterval.parseContainedString(context.parent.range, "INTERVAL_OF_INTEGER");
                        if (parentRange) {
                            if (!AmInterval.contains(parentRange, range)) {
                                errors.add("Range " + context.range + " is not a subset of parent range " + context.parent.range, "range");
                            }
                        }

                        if (context.parent.assumed_value !== undefined && context.assumed_value !== context.assumed_value) {
                            errors.add("Assumed value does not match parent assumed value", "assumed_value");
                        }
                    }


                };

                handler.updateConstraint = function (stage, context, cons) {
                    if (typeof context.assumed_value === "string" && context.assumed_value.length > 0) {
                        cons.assumed_value = parseInt(context.assumed_value);
                    }

                    if (context.range === "" || context.range === "(*..*)") {
                        cons.constraint = [];
                    } else {
                        var rns = AmInterval.parseContainedString(context.range, "INTERVAL_OF_INTEGER");
                        if (rns && rns.upper === undefined && rns.lower === undefined) rns = undefined;
                        cons.constraint = rns ? [rns] : [];
                    }
                    return cons;
                };
            };
            AmUtils.extend(CIntegerHandler, PrimitiveRmHandler);

            var CTerminologyCodeHandler = function () {
                var handler = this;
                PrimitiveRmHandler.call(handler);

                function getTerminologyData(archetypeModel, cons) {
                    function getValueSet(node_id) {
                        return archetypeModel.data.terminology.value_sets &&
                            archetypeModel.data.terminology.value_sets[node_id]
                    }

                    function getExternalBinding(node_id) {
                        if (!archetypeModel.data.terminology.term_bindings) return undefined;
                        var bindings = {};
                        for (var terminology in archetypeModel.data.terminology.term_bindings) {
                            var binding = archetypeModel.data.terminology.term_bindings[terminology][node_id];
                            if (binding) {
                                bindings[terminology] = binding;
                            }
                        }
                        return {
                            term: archetypeModel.getTermDefinition(node_id),
                            bindings: bindings
                        }
                    }


                    if (cons.constraint) {
                        var code = cons.constraint;
                        var valueSet = getValueSet(code);
                        var externalBinding = getExternalBinding(code);

                        if (valueSet || AOM.NodeId.of(code).prefix === 'at') {
                            return {
                                type: 'internal',
                                code: code,
                                external_term: undefined,
                                external_bindings: {}
                            }
                        }

                        return {
                            type: 'external',
                            code: code,
                            external_term: externalBinding ? AmUtils.clone(externalBinding.term) : {},
                            external_bindings: externalBinding ? externalBinding.bindings : {}
                        }
                    }

                    return {
                        type: 'internal',
                        code: undefined,
                        external_term: undefined,
                        external_bindings: {}
                    }

                }

                handler.createContext = function (stage, cons, parentCons) {
                    cons = cons || {};
                    var context = handler.createCommonContext(stage, cons, parentCons);
                    context.type = 'C_TERMINOLOGY_CODE';
                    context.assumed_value = cons.assumed_value;

                    var terminologyData = getTerminologyData(stage.archetypeModel, cons);
                    context.type_internal = terminologyData.type === 'internal';
                    context.any = terminologyData.any;
                    if (context.type_internal) {
                        context.value_set_code = terminologyData.code;
                    } else {
                        context.external_term_code = terminologyData.code;
                    }
                    context.isParentConstrained = !!(context.isTemplate && (context.parent && !context.parent.any));
                    if (context.isParentConstrained && context.value_set_code) {
                        if (stage.archetypeModel.isSpecialized(context.value_set_code)) {
                            context.parent_value_set_code = new AOM.NodeId(context.value_set_code).getParent().toString();
                        } else {
                            context.parent_value_set_code = context.value_set_code; // code is taken from parent
                        }
                        var parentValueSet = stage.archetypeModel.data.terminology.value_sets[context.parent_value_set_code];
                        var valueSet = stage.archetypeModel.data.terminology.value_sets[context.value_set_code];
                        context.valueSetItems = [];
                        for (var pvi in parentValueSet.members) {
                            var code = parentValueSet.members[pvi];
                            context.valueSetItems.push({
                                code: code,
                                label: stage.archetypeModel.getTermDefinitionText(code, stage.language),
                                checked: Stream(valueSet.members).anyMatch(function (d) {
                                    return d === code;
                                })
                            })
                        }


                    }
                    return context;
                };

                handler.show = function (stage, context, targetElement) {
                    function updatePanelVisibility(radios, panels) {
                        for (var i in radios) {
                            GuiUtils.setVisible(panels[i], radios[i].prop('checked'));
                        }
                    }


                    function updateInternalValueSet(valueSetSelect) {
                        valueSetSelect.empty();
                        var valueSets = stage.archetypeModel.data.terminology.value_sets;

                        var option = $("<option>").attr("value", '').text('');
                        if (!context.value_set_code || context.value_set_code.length === 0) {
                            option.prop("selected", true);
                        }

                        valueSetSelect.append(option);
                        for (var valueSetId in valueSets) {
                            var term = stage.archetypeModel.getTermDefinition(valueSetId);
                            option = $("<option>").attr("value", valueSetId).text(term.text);
                            if (valueSetId === context.value_set_code) {
                                option.prop("selected", true);
                            }
                            valueSetSelect.append(option);
                        }
                    }

                    function updateInternalAssumedValue(assumedValueSelect) {
                        assumedValueSelect.empty();
                        var noAssumedValueOption = $("<option>").attr("value", "");
                        assumedValueSelect.append(noAssumedValueOption);
                        var found = false;
                        var valueSet = stage.archetypeModel.data.terminology.value_sets[context.value_set_code];
                        if (valueSet) {
                            for (var i in valueSet.members) {
                                var memberId = valueSet.members[i];
                                var term = stage.archetypeModel.getTermDefinition(memberId);
                                var option = $("<option>").attr("value", memberId).text(term.text);
                                if (memberId === context.assumed_value) {
                                    option.prop("selected", true);
                                    found = true;
                                }
                                assumedValueSelect.append(option);
                            }
                        }
                        if (!found) {
                            noAssumedValueOption.prop('selected', true);
                            context.assumed_value = undefined;
                        }
                    }

                    function updateInternalAssumedValueFromCheckboxList(assumedValueSelect, valueSetItemsCheckboxList) {
                        assumedValueSelect.empty();
                        var noAssumedValueOption = $("<option>").attr("value", "");
                        assumedValueSelect.append(noAssumedValueOption);
                        var found = false;
                        var valueSet = stage.archetypeModel.data.terminology.value_sets[context.parent_value_set_code];
                        if (valueSet) {
                            var items = valueSetItemsCheckboxList.getItemSelectionList();
                            for (var i in valueSet.members) {
                                var memberId = valueSet.members[i];
                                var term = stage.archetypeModel.getTermDefinition(memberId);
                                if (items[i]) {
                                    var option = $("<option>").attr("value", memberId).text(term.text);
                                    if (memberId === context.assumed_value) {
                                        option.prop("selected", true);
                                        found = true;
                                    }
                                    assumedValueSelect.append(option);
                                }
                            }
                        }
                        if (!found) {
                            noAssumedValueOption.prop('selected', true);
                            context.assumed_value = undefined;
                        }

                    }


                    function updateExternalSelect(externalSelect) {
                        externalSelect.empty();
                        var nodeIds = stage.archetypeModel.getExternalTerminologyCodes();
                        for (var i in nodeIds) {
                            var nodeId = nodeIds[i];
                            var term = stage.archetypeModel.getTermDefinition(nodeId);
                            var option = $("<option>").attr("value", nodeId).text(term.text);
                            if (nodeId === context.external_term_code) {
                                option.prop("selected", true);
                            }
                            externalSelect.append(option);
                        }

                    }

                    GuiUtils.applyTemplate("properties/constraint-primitive|C_TERMINOLOGY_CODE", context, function (html) {
                        html = $(html);
                        targetElement.append(html);


                        var panelInternal = targetElement.find("#" + context.panel_id + "_internal_panel");
                        var panelExternal = targetElement.find("#" + context.panel_id + "_external_panel");

                        var radioInternal = targetElement.find("#" + context.panel_id + "_internal");
                        var radioExternal = targetElement.find("#" + context.panel_id + "_external");
                        var valueSetSelect = targetElement.find('#' + context.panel_id + "_value_set");
                        var assumedValueSelect = targetElement.find('#' + context.panel_id + "_assumed_value");
                        var valueSetItemsCheckboxList;

                        if (context.isParentConstrained) {
                            radioInternal.prop('disabled', true);
                            radioExternal.prop('disabled', true);
                            var parentValueSet = stage.archetypeModel.data.terminology.value_sets[context.parent_value_set_code];
                            var valueSet = stage.archetypeModel.data.terminology.value_sets[context.value_set_code];

                            if (context.value_set_code) {
                                var valueSetItemsOptions = {
                                    title: stage.archetypeModel.getTermDefinitionText(context.value_set_code, stage.language),
                                    items: [],
                                    targetElement: targetElement.find('#' + context.panel_id + "_value_set_items_container")
                                };

                                for (var pvi in parentValueSet.members) {
                                    var code = parentValueSet.members[pvi];
                                    valueSetItemsOptions.items.push({
                                        code: code,
                                        label: stage.archetypeModel.getTermDefinitionText(code, stage.language),
                                        checked: Stream(valueSet.members).anyMatch(function (d) {
                                            return d === code;
                                        })
                                    })
                                }
                                valueSetItemsCheckboxList = new GuiUtils.DropDownCheckboxList(valueSetItemsOptions);

                                valueSetItemsCheckboxList.onChange(function () {
                                    updateInternalAssumedValueFromCheckboxList(assumedValueSelect, valueSetItemsCheckboxList);
                                    var items = valueSetItemsCheckboxList.getItemSelectionList();
                                    for (var i in items) {
                                        context.valueSetItems[i].checked = items[i];
                                    }

                                })
                            }

                        }

                        var externalSelect = targetElement.find('#' + context.panel_id + '_external_select');

                        radioInternal.change(function () {
                            updatePanelVisibility([radioInternal, radioExternal], [panelInternal, panelExternal]);
                            context.type_internal = radioInternal.prop('checked');
                        });
                        radioExternal.change(function () {
                            updatePanelVisibility([radioInternal, radioExternal], [panelInternal, panelExternal]);
                            context.type_internal = !radioExternal.prop('checked');
                        });

                        radioInternal.prop("checked", context.type_internal);
                        radioExternal.prop("checked", !context.type_internal);

                        updatePanelVisibility([radioInternal, radioExternal], [panelInternal, panelExternal]);

                        // internal panel
                        valueSetSelect.change(function () {
                            context.value_set_code = valueSetSelect.val();
                            if (context.value_set_code.length === 0) context.value_set_code = undefined;
                            updateInternalAssumedValue(assumedValueSelect);
                        });

                        updateInternalValueSet(valueSetSelect);
                        updateInternalAssumedValue(assumedValueSelect);


                        targetElement.find("#" + context.panel_id + "_value_set_edit").click(function () {
                            ArchetypeEditorTerminology.openUpdateValueSetDialog(stage.archetypeModel, context.value_set_code,
                                {readOnly: stage.readOnly},
                                function (newValueSetId) {
                                    context.value_set_code = newValueSetId;
                                    updateInternalValueSet(valueSetSelect);
                                    updateInternalAssumedValue(assumedValueSelect);
                                });
                        });
                        targetElement.find("#" + context.panel_id + "_value_set_new").click(function () {
                            ArchetypeEditorTerminology.openUpdateValueSetDialog(stage.archetypeModel, undefined, {},
                                function (newValueSetId) {
                                    context.value_set_code = newValueSetId;
                                    updateInternalValueSet(valueSetSelect);
                                    updateInternalAssumedValue(assumedValueSelect);
                                });
                        });


                        assumedValueSelect.change(function () {
                            context.assumed_value = assumedValueSelect.val();
                        });

                        // external panel
                        updateExternalSelect(externalSelect);

                        targetElement.find("#" + context.panel_id + "_external_edit").click(function () {
                            ArchetypeEditorTerminology.openUpdateExternalTerminologyDialog(stage.archetypeModel, context.external_term_code,
                                {readOnly: stage.readOnly},
                                function (externalTermId) {
                                    context.external_term_code = externalTermId;
                                    updateExternalSelect(externalSelect);
                                });
                        });
                        targetElement.find("#" + context.panel_id + "_external_new").click(function () {
                            ArchetypeEditorTerminology.openUpdateExternalTerminologyDialog(stage.archetypeModel, undefined,
                                {},
                                function (externalTermId) {
                                    context.external_term_code = externalTermId;
                                    updateExternalSelect(externalSelect);
                                });
                        });


                    });

                };

                handler.updateContext = function (stage, context, targetElement) {
                };

                handler.updateConstraint = function (stage, context, cons) {

                    delete cons.assumed_value;
                    if (context.type_internal) {
                        if (context.isParentConstrained) {
                            if (stage.archetypeModel.isSpecialized(context.value_set_code)) {
                                stage.archetypeModel.removeValueSet(context.value_set_code);
                                context.value_set_code = context.parent_value_set_code;
                            }
                            if (Stream(context.valueSetItems).allMatch({checked: true})) {
                                cons.constraint = context.value_set_code;
                            } else {
                                //var parentValueSet = stage.archetypeModel.data.ontology.value_sets[context.parent_value_set_code];
                                var members = Stream(context.valueSetItems).filter({checked: true}).map('code').toArray();

                                context.value_set_code = stage.archetypeModel.specializeTermDefinition(context.parent_value_set_code);
                                stage.archetypeModel.data.terminology.value_sets[context.value_set_code] = {
                                    id: context.value_set_code,
                                    members: members
                                };
                                cons.constraint = context.value_set_code;
                            }
                            cons.assumed_value = AmUtils.undefinedIfEmpty(context.assumed_value);

                        } else {
                            if (context.value_set_code && context.value_set_code.length > 0) {
                                cons.constraint  = context.value_set_code;
                                cons.assumed_value = AmUtils.undefinedIfEmpty(context.assumed_value);
                            } else {
                                cons.constraint = null;
                            }
                        }
                    } else {
                        if (context.external_term_code && context.external_term_code.length > 0) {
                            cons.constraint = context.external_term_code;
                        } else {
                            cons.constraint = null;
                        }
                    }


                    return cons;
                };
            };
            AmUtils.extend(CTerminologyCodeHandler, PrimitiveRmHandler);

            var CBooleanHandler = function () {
                var handler = this;
                PrimitiveRmHandler.call(handler);

                handler.createContext = function (stage, cons, parentCons) {
                    cons = cons || {};
                    var context = handler.createCommonContext(stage, cons, parentCons);
                    context.type = 'C_BOOLEAN';
                    if (cons.constraint && cons.constraint.length>0) {
                        context.true_valid = Stream(cons.constraint).anyMatch(function (t) {
                            return t === true
                        });
                        context.false_valid = Stream(cons.constraint).anyMatch(function (t) {
                            return t === false
                        });
                    } else {
                        context.true_valid=true;
                        context.false_valid=true;
                    }
                    context.assumed_value = cons.assumed_value === undefined ? "" : (cons.assumed_value ? "true" : "false");

                    return context;
                };

                handler.show = function (stage, context, targetElement) {
                    function populateAssumedValueSelect(trueValid, falseValid, assumedValue) {
                        assumedValue.empty();
                        var noAssumedValue = $("<option>").attr("value", "").text("");
                        assumedValue.append(noAssumedValue);
                        assumedValue.val('');
                        if (trueValid.prop("checked")) {
                            assumedValue.append($("<option>").attr("value", "true").text("True"));
                            if (context.assumed_value === 'true') assumedValue.val('true');
                        }
                        if (falseValid.prop("checked")) {
                            assumedValue.append($("<option>").attr("value", "false").text("False"));
                            if (context.assumed_value === 'false') assumedValue.val('false');
                        }
                        context.assumed_value = assumedValue.val();
                    }


                    GuiUtils.applyTemplate("properties/constraint-primitive|C_BOOLEAN", context, function (html) {
                        targetElement.append(html);

                        var trueValid = targetElement.find("#" + context.panel_id + "_true_valid");
                        var falseValid = targetElement.find("#" + context.panel_id + "_false_valid");
                        var assumedValue = targetElement.find("#" + context.panel_id + "_assumed_value");

                        trueValid.prop('checked', context.true_valid);
                        falseValid.prop('checked', context.false_valid);
                        populateAssumedValueSelect(trueValid, falseValid, assumedValue);

                        trueValid.change(function () {
                            populateAssumedValueSelect(trueValid, falseValid, assumedValue);
                        });
                        falseValid.change(function () {
                            populateAssumedValueSelect(trueValid, falseValid, assumedValue);
                        });

                        assumedValue.change(function () {
                            context.assumed_value = assumedValue.val();
                        });
                    });
                };

                handler.updateContext = function (stage, context, targetElement) {
                    var trueValid = targetElement.find("#" + context.panel_id + "_true_valid");
                    var falseValid = targetElement.find("#" + context.panel_id + "_false_valid");
                    var assumedValue = targetElement.find("#" + context.panel_id + "_assumed_value");

                    context.true_valid = trueValid.prop('checked');
                    context.false_valid = falseValid.prop('checked');
                    context.assumed_value = assumedValue.val();

                };

                handler.updateConstraint = function (stage, context, cons) {
                    cons.constraint=[];
                    if (context.true_valid===true) {
                        cons.constraint.push(true);
                    }
                    if (context.false_valid===true) {
                        cons.constraint.push(false);
                    }
                    cons.assumed_value = context.assumed_value === 'true' ? true : (context.assumed_value === 'false' ? false : undefined);
                };

            };
            AmUtils.extend(CBooleanHandler, PrimitiveRmHandler);

            var CDurationHandler = function () {
                var handler = this;
                PrimitiveRmHandler.call(handler);

                function maxPeriodUnit(period) {
                    return period.years ? "years" : period.months ? "months" : period.weeks ? "weeks" : period.days ? "days" : period.minutes ? "minutes" : period.seconds ? "seconds" : "years";
                }

                function getInt(str) {
                    if (str === undefined) return undefined;
                    var num = parseInt(str);
                    if (isNaN(num)) return undefined;
                    return num;
                }

                function parsePattern(str) {
                    var result = {};
                    if (str === undefined || str.length === 0) {
                        result.all = true;
                        return result;
                    }
                    var i = 1; // skip first 'P'
                    var timePart = false;
                    while (i < str.length) {
                        var c = str.charAt(i++);
                        switch (c) {
                            case 'Y':
                                result.years = true;
                                break;
                            case 'M':
                                if (timePart) result.minutes = true; else result.months = true;
                                break;
                            case 'W':
                                result.weeks = true;
                                break;
                            case 'D':
                                result.days = true;
                                break;
                            case 'T':
                                timePart = true;
                                break;
                            case 'H':
                                result.hours = true;
                                break;
                            case 'S':
                                result.seconds = true;
                                break;
                        }
                    }
                    return result;
                }

                function patternToString(pattern) {
                    if (pattern.all) return undefined;
                    var result = 'P';
                    if (pattern.years) result += 'Y';
                    if (pattern.months) result += 'M';
                    if (pattern.weeks) result += 'W';
                    if (pattern.days) result += 'D';
                    var time = '';
                    if (pattern.hours) time += 'H';
                    if (pattern.minutes) time += 'M';
                    if (pattern.seconds) time += 'S';
                    if (time.length > 0) {
                        result += 'T' + time;
                    }
                    return result;
                }

                handler.createContext = function (stage, cons, parentCons) {
                    cons = cons || {};
                    var context = handler.createCommonContext(stage, cons, parentCons);
                    context.type = 'C_DURATION';
                    var consRange = undefined;
                    if (cons.constraint && cons.constraint.length>0) {
                        consRange = cons.constraint[0];
                        var anyPeriod = consRange.lower || consRange.upper;
                        if (anyPeriod) {
                            context.range = {
                                lower_included: consRange.lower_included, upper_included: consRange.upper_included
                            };

                            anyPeriod = Iso8601Period.of(anyPeriod);
                            context.units = maxPeriodUnit(anyPeriod.period);

                            context.range.lower = consRange.lower ? Iso8601Period.of(consRange.lower).period[context.units] : undefined;
                            context.range.upper = consRange.upper ? Iso8601Period.of(consRange.upper).period[context.units] : undefined;
                        }
                    }
                    if (cons.assumed_value) {
                        if (!context.units) {
                            context.units = maxPeriodUnit(Iso8601Period.of(cons.assumed_value));
                        }
                        context.assumed_value = Iso8601Period.of(cons.assumed_value).period[context.units];
                    }
                    context.units = context.units || "years";
                    if (!context.range) {
                        context.range = {
                            lower_included: true, lower: '', upper_included: true, upper: ''
                        };
                    }
                    context.pattern = parsePattern(cons.pattern_constraint);
                    return context;
                };

                handler.show = function (stage, context, targetElement) {
                    function walkPatternCheckboxes(containerElement, callback) {
                        var unitStrings = ['all', 'years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
                        for (var i in unitStrings) {
                            var unit = unitStrings[i];
                            var element = containerElement.find('#' + context.panel_id + '_pattern_' + unit);
                            callback(unit, element);
                        }
                    }

                    GuiUtils.applyTemplate("properties/constraint-primitive|C_DURATION", context, function (html) {
                        targetElement.append(html);


                        var units = targetElement.find('#' + context.panel_id + '_units');

                        var lowerIncluded = targetElement.find('#' + context.panel_id + '_lower_included');
                        var upperIncluded = targetElement.find('#' + context.panel_id + '_upper_included');

                        var patternAll = targetElement.find('#' + context.panel_id + '_pattern_all');

                        var patternCustomPanel = targetElement.find('#' + context.panel_id + '_pattern_custom');

                        GuiUtils.setVisible(patternCustomPanel, !patternAll.prop('checked'));

                        patternAll.change(function () {
                            GuiUtils.setVisible(patternCustomPanel, !patternAll.prop('checked'));
                        });

                        context.pattern = {};
                        walkPatternCheckboxes(targetElement, function (unit, checkbox) {
                            context.pattern[unit] = checkbox.prop('checked');
                            if (context.isParentConstrained) {
                                checkbox.prop('disabled', !context.pattern[unit]);
                            }
                        });
                        //var unitStrings = ['all', 'years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
                        //for (var i in unitStrings) {
                        //    var unit = unitStrings[i];
                        //    var element = targetElement.find('#' + context.panel_id + '_pattern_' + unit);
                        //    context.pattern[unit] = element.prop('checked');
                        //}


                        units.val(context.units);

                        lowerIncluded.val(String(context.range.lower_included));
                        upperIncluded.val(String(context.range.upper_included));
                    });
                };

                handler.updateContext = function (stage, context, targetElement) {
                    var units = targetElement.find('#' + context.panel_id + '_units');

                    var lowerIncluded = targetElement.find('#' + context.panel_id + '_lower_included');
                    var upperIncluded = targetElement.find('#' + context.panel_id + '_upper_included');

                    var lower = targetElement.find('#' + context.panel_id + '_lower');
                    var upper = targetElement.find('#' + context.panel_id + '_upper');
                    var assumedValue = targetElement.find('#' + context.panel_id + '_assumed_value');

                    context.units = units.val();
                    context.range.lower_included = lowerIncluded.val() === 'true';
                    context.range.upper_included = upperIncluded.val() === 'true';
                    context.range.lower = getInt(lower.val());
                    context.range.upper = getInt(upper.val());
                    context.assumed_value = getInt(assumedValue.val());

                    context.pattern = {};
                    var unitStrings = ['all', 'years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
                    for (var i in unitStrings) {
                        var unit = unitStrings[i];
                        var element = targetElement.find('#' + context.panel_id + '_pattern_' + unit);
                        context.pattern[unit] = element.prop('checked');
                    }
                };

                handler.validate = function (stage, context, errors) {
                    if (context.range && (context.range.lower !== undefined || context.range.upper != undefined)) {
                        if (context.range.lower !== undefined && context.range.upper !== undefined && context.range.lower > context.range.upper) {
                            errors.add("lower bound is greater than upper bound", "range")
                        }
                    }
                };
                handler.updateConstraint = function (stage, context, cons) {
                    if (context.range && (context.range.lower !== undefined || context.range.upper != undefined)) {
                        var upper, lower;
                        if (context.range.lower !== undefined) {
                            lower = Iso8601Period.ofUnits(context.units, context.range.lower).toString();
                        }
                        if (context.range.upper !== undefined) {
                            upper = Iso8601Period.ofUnits(context.units, context.range.upper).toString();
                        }
                        cons.constraint = [AmInterval.of(lower, upper, "INTERVAL_OF_DURATION")];
                        cons.constraint[0].lower_included = context.range.lower_included === 'true';
                        cons.constraint[0].upper_included = context.range.upper_included === 'true';
                    } else {
                        cons.constraint = [];
                    }
                    if (context.assumed_value !== undefined) {
                        cons.assumed_value = Iso8601Period.ofUnits(context.units, context.assumed_value).toString();
                    } else {
                        cons.assumed_value = undefined;
                    }
                    cons.pattern_constraint = patternToString(context.pattern);
                };
            };
            AmUtils.extend(CDurationHandler, PrimitiveRmHandler);

            var CDateTimeHandler = function () {
                var handler = this;
                PrimitiveRmHandler.call(handler);

                // separate list of id to data as jstree doesn't allow additional data on nodes
                var formatPatterns = {
                    "allow_all": {type: "C_DATE_TIME", pattern: undefined, label: "Allow all"},
                    "date_and_time": {type: "C_DATE_TIME", pattern: "yyyy-mm-ddTHH:MM:SS", label: "Date and time"},
                    "date_and_partial_time": {
                        type: "C_DATE_TIME",
                        pattern: "yyyy-mm-ddTHH:??:??}",
                        label: "Date and partial time"
                    },
                    "date_only": {type: "C_DATE", pattern: undefined, label: "Date only"},
                    "full_date": {type: "C_DATE", pattern: "yyyy-mm-dd", label: "Full date"},
                    "partial_date": {type: "C_DATE", pattern: "yyyy-??-XX", label: "Partial date"},
                    "partial_date_with_month": {
                        type: "C_DATE",
                        pattern: "yyyy-mm-??",
                        label: "Partial date with month"
                    },
                    "time_only": {type: "C_TIME", pattern: undefined, label: "Time only"},
                    "full_time": {type: "C_TIME", pattern: "HH:MM:SS", label: "Full time"},
                    "partial_time": {type: "C_TIME", pattern: "HH:??:XX", label: "Partial time"},
                    "partial_time_with_minutes": {
                        type: "C_TIME",
                        pattern: "HH:MM:??",
                        label: "Partial time with minutes"
                    }
                };


                handler.createContext = function (stage, cons, parentCons) {
                    cons = cons || {};
                    var context = handler.createCommonContext(stage, cons, parentCons);
                    context.type = cons["@type"] || "C_DATE_TIME";

                    context.pattern = cons.pattern_constraint;


                    return context;
                };

                handler.show = function (stage, context, targetElement) {

                    function buildPatternTree() {
                        var tree = [];
                        // Allow All
                        tree.push({
                            id: "allow_all",
                            text: "Allow all"
                        });
                        // Date and time
                        tree.push({
                                id: "date_and_time",
                                text: "Date and time",
                                children: [{
                                    id: "date_and_partial_time",
                                    text: "Date and partial time"
                                }]
                            }
                        );
                        // Date only
                        tree.push({
                            id: "date_only",
                            text: "Date only",
                            children: [{
                                id: "full_date",
                                text: "Full date"
                            }, {
                                id: "partial_date",
                                text: "Partial date",
                                children: [{
                                    id: "partial_date_with_month",
                                    text: "Partial date with month"
                                }]
                            }]
                        });
                        // Time only
                        tree.push({
                            id: "time_only",
                            text: "Time only",
                            children: [{
                                id: "full_time",
                                text: "Full time"
                            }, {
                                id: "partial_time",
                                text: "Partial time",
                                children: [{
                                    id: "partial_date_with_minutes",
                                    text: "Partial date with minutes"
                                }]
                            }]
                        });

                        return tree;
                    }

                    /**
                     *  returns tree node id for a given pattern and ctype
                     * @param {string?} pattern Input pattern. If absent, only undefined pattern will match
                     * @param {string?} type AOM type. If absent, any type will match
                     * @returns {string} pattern id, one of keys from formatPatterns
                     */
                    function findIdFromPattern(pattern, type) {
                        var pattern_id, pat;
                        for (pattern_id in formatPatterns) {
                            pat = formatPatterns[pattern_id];
                            if ((type === undefined || type === pat.type) && pat.pattern === pattern) {
                                return pattern_id;
                            }
                        }
                        // no match by pattern and type, just check for type
                        for (pattern_id in formatPatterns) {
                            pat = formatPatterns[pattern_id];
                            if ((type === undefined || type === pat.type)) {
                                return pattern_id;
                            }
                        }
                        return "allow_all"; // should never happen
                    }


                    GuiUtils.applyTemplate("properties/constraint-primitive|C_DATE_TIME", context, function (html) {
                        targetElement.append(html);
                        var patternId;

                        var patternElement = targetElement.find('#' + context.panel_id + '_pattern');
                        if (context.isTemplate) {
                            patternId = findIdFromPattern(context.pattern, context.type);
                            patternElement.text(formatPatterns[patternId].label)
                        } else {
                            patternElement.jstree(
                                {
                                    'core': {
                                        'data': buildPatternTree(),
                                        'multiple': false
                                    }
                                });
                            patternId = findIdFromPattern(context.pattern, context.type);
                            patternElement.on('ready.jstree', function () {
                                patternElement.jstree('open_all');
                                patternElement.jstree('select_node', patternId);
                            });

                            patternElement.on('select_node.jstree', function (event, treeEvent) {
                                var formatPattern = formatPatterns[treeEvent.node.id];
                                context.type = formatPattern.type;
                                context.pattern = formatPattern.pattern;
                            });
                        }


                    });
                };

                handler.hide = function (stage, context, targetElement) {
                    var patternElement = targetElement.find('#' + context.panel_id + '_pattern');
                    patternElement.jstree('destroy');
                };

                handler.updateContext = function (stage, context, targetElement) {
                };

                handler.updateConstraint = function (stage, context, cons) {
                    cons["@type"] = context.type;
                    cons.rm_type_name = context.type;
                    cons.pattern = context.pattern_constraint;
                };
            };
            AmUtils.extend(CDateTimeHandler, PrimitiveRmHandler);


            var CAttributeHandler = function () {
                var handler = this;
                PrimitiveRmHandler.call(handler);

                handler.createContext = function (stage, cons, parentCons) {
                    cons = cons || {};
                    var context = handler.createCommonContext(stage, cons, parentCons);
                    context.type = 'C_ATTRIBUTE';
                    var parentRmType = stage.archetypeEditor.referenceModel.getType(cons[".parent"].rm_type_name);
                    var rmAttribute = parentRmType && parentRmType.attributes[cons.rm_attribute_name];


                    var existence = stage.archetypeEditor.referenceModel.getExistence(cons);
                    context.existenceMandatory = existence && existence.lower === 1;
                    context.existenceUpdatable = existence && rmAttribute && rmAttribute.existence.lower === 0;
                    context.multiple = rmAttribute && rmAttribute.existence.upper === undefined;
                    if (context.multiple) {
                        if (cons.cardinality) {
                            context.cardinality = {
                                ordered: cons.cardinality.is_ordered,
                                unique: cons.cardinality.is_unique
                            };
                            if (cons.cardinality.interval) {
                                context.cardinality.lower = cons.cardinality.lower || 0;
                                context.cardinality.upperBounded = !cons.cardinality.interval.upper_unbounded;
                                context.cardinality.upper = cons.cardinality.upper || 1;
                            } else {
                                context.cardinality.lower = 0;
                                context.cardinality.upperBounded = false;
                                context.cardinality.upper = 1;
                            }
                        } else {
                            context.cardinality = {
                                lower: 0,
                                upperBounded: false,
                                upper: 1,
                                ordered: true,
                                unique: false
                            };
                        }
                    }

                    return context;
                };

                handler.show = function (stage, context, targetElement) {
                    GuiUtils.applyTemplate("properties/constraint-primitive|C_ATTRIBUTE", context, function (html) {
                        html = $(html);

                        var existenceMandatory = html.find('#' + context.panel_id + "_existenceMandatory");

                        existenceMandatory.prop('disabled', !context.existenceUpdatable);

                        function updateCardinalityUpperBoundVisibility() {
                            GuiUtils.setVisible(cardinalityUpperBound, !cardinalityUpperUnbounded.prop('checked'))
                        }

                        if (context.multiple) {
                            var cardinalityOrdered = html.find('#' + context.panel_id + "_ordered");
                            var cardinalityUnique = html.find('#' + context.panel_id + "_unique");
                            var cardinalityLowerBound = html.find('#' + context.panel_id + "_lowerBound");
                            var cardinalityUpperBound = html.find('#' + context.panel_id + "_upperBound");
                            var cardinalityUpperUnbounded = html.find('#' + context.panel_id + "_upperUnbounded");

                            cardinalityUpperUnbounded.on('change', updateCardinalityUpperBoundVisibility);
                            cardinalityUpperUnbounded.prop('checked', !context.cardinality.upperBounded);
                            updateCardinalityUpperBoundVisibility();
                        }
                        targetElement.append(html);

                    });
                };

                handler.updateContext = function (stage, context, targetElement) {
                    var existenceMandatory = targetElement.find('#' + context.panel_id + "_existenceMandatory");
                    context.existenceMandatory = existenceMandatory.val();

                    if (context.multiple) {
                        var cardinalityOrdered = targetElement.find('#' + context.panel_id + "_ordered");
                        var cardinalityUnique = targetElement.find('#' + context.panel_id + "_unique");
                        var cardinalityLowerBound = targetElement.find('#' + context.panel_id + "_lowerBound");
                        var cardinalityUpperBound = targetElement.find('#' + context.panel_id + "_upperBound");
                        var cardinalityUpperUnbounded = targetElement.find('#' + context.panel_id + "_upperUnbounded");

                        context.cardinality.ordered = cardinalityOrdered.prop('checked');
                        context.cardinality.unique = cardinalityUnique.prop('checked');
                        context.cardinality.lower = Number(cardinalityLowerBound.val());
                        context.cardinality.upper = Number(cardinalityUpperBound.val());
                        context.cardinality.upperBounded = !cardinalityUpperUnbounded.prop('checked');
                    }

                };


                handler.validate = function (stage, context, errors) {
                    if (context.multiple) {
                        errors.validate(AmUtils.isInt(context.cardinality.lower), "Not a valid integer", "cardinality.lower");
                        errors.validate(AmUtils.isInt(context.cardinality.upper), "Not a valid integer", "cardinality.upper");
                        errors.validate(context.cardinality.lower >= 0, "Must not be negative", "cardinality.lower");
                        if (context.cardinality.upperBounded) {
                            errors.validate(context.cardinality.lower < context.cardinality.upper,
                                "Lower bound greater than upper bound", "cardinality");
                        }
                    }

                };

                handler.updateConstraint = function (stage, context, cons) {
                    if (context.existenceUpdatable) {
                        if (context.existenceMandatory) {
                            cons.existence = AmInterval.of(1, 1, "MULTIPLICITY_INTERVAL");
                        } else {
                            cons.existence = AmInterval.of(0, 1, "MULTIPLICITY_INTERVAL");
                        }
                    }
                    if (context.multiple) {
                        cons.cardinality = AOM.newCardinality();
                        cons.cardinality.is_ordered = context.cardinality.ordered;
                        cons.cardinality.is_unique = context.cardinality.unique;
                        cons.cardinality.interval = AmInterval.of(context.cardinality.lower,
                            context.cardinality.upperBounded ? context.cardinality.upper : undefined,
                            "MULTIPLICITY_INTERVAL");
                    }
                }
            };
            AmUtils.extend(CAttributeHandler, PrimitiveRmHandler);


            self.handlers = {};
            self.handlers["C_REAL"] = new CRealHandler();
            self.handlers["C_INTEGER"] = new CIntegerHandler();
            self.handlers["C_TERMINOLOGY_CODE"] = new CTerminologyCodeHandler();
            self.handlers["C_BOOLEAN"] = new CBooleanHandler();
            self.handlers["C_DURATION"] = new CDurationHandler();
            self.handlers["C_DATE_TIME"] = new CDateTimeHandler();
            self.handlers['C_DATE'] = self.handlers['C_DATE_TIME'];
            self.handlers['C_TIME'] = self.handlers['C_DATE_TIME'];
            self.handlers['C_ATTRIBUTE'] = new CAttributeHandler();

        };

        ArchetypeEditor.addRmModule(new PrimitiveModule());
    }(ArchetypeEditor || {})
)
;