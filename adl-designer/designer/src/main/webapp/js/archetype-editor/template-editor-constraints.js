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

(function (TemplateEditor, ArchetypeEditor) {

    var TemplateModule = function () {
        var self = this;

        self.name = "@template";


        var TopTemplateHandler = function () {
            var handler = this;

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
                    if (!occ.lower) {
                        result['prohibited'] = 'prohibited';
                        if (occ.upper !== 0) {
                            result['optional'] = 'optional';
                        }
                    }
                    if (occ.upper !== 0) {
                        result['mandatory'] = 'mandatory';
                    }
                    return result;
                }

                function createMultiplicityMap(occ) {
                    var result = {};
                    result['not_repeating'] = 'not repeating';
                    if (occ.upper === undefined || occ.upper > 1) {
                        result['bounded'] = 'bounded';
                    }
                    if (occ.upper === undefined) {
                        result['unbounded'] = 'unbounded';
                    }
                    return result;
                }

                //targetElement.empty();
                GuiUtils.applyTemplate("template-editor|constraintTop", context, function (html) {

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
                    var parentOcc = AmInterval.parseContainedString(context.parent.occurrences);
                    var occ = AmInterval.parseContainedString(context.occurrences);

                    var existenceMap = createExistenceMap(parentOcc);
                    var multiplicityMap = createMultiplicityMap(parentOcc);

                    var existenceSelect = html.find('#' + context.panel_id + "_existence");
                    var multiplicitySelect = html.find('#' + context.panel_id + "_multiplicity");
                    var multiplicityBoundInput = html.find('#' + context.panel_id + "_multiplicity_bound");

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
                var existenceSelect = targetElement.find('#' + context.panel_id + "_existence");
                var multiplicitySelect = targetElement.find('#' + context.panel_id + "_multiplicity");
                var multiplicityBoundInput = targetElement.find('#' + context.panel_id + "_multiplicity_bound");

                var existence = existenceSelect.val();
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
                }
            };

            handler.validate = function (stage, context, errors) {
                var occ = AmInterval.parseContainedString(context.occurrences);
                var parentOcc = AmInterval.parseContainedString(context.parent.occurrences);

                if (!errors.validate(occ, "Invalid occurrences format", "occurrences")) return;
                if (!AmInterval.contains(parentOcc, occ)) {
                    errors.add('Occurrences ' + AmInterval.toContainedString(occ) + ' do not conform to parent occurrences ' + AmInterval.toContainedString(parentOcc), 'occurrences');
                }
            };

            handler.updateConstraint = function (stage, context, cons) {

                cons.occurrences =
                    AmInterval.parseContainedString(context.occurrences, "MULTIPLICITY_INTERVAL");
            };
        };


        var MainTemplateHandler = function () {
            var handler = this;
            ArchetypeEditor.Modules.RmHandler.call(handler);


            handler.createContext = function (stage, cons, parentCons) {
                return stage.constraintHandler.createContext(stage, cons, parentCons);
            };

            handler.show = function (stage, context, targetElement) {
                var topHandler = self.handlers["top"];
//                topHandler.show(stage, context.top, targetElement.find('#' + context.top.panel_id));
                topHandler.show(stage, context.top, targetElement);

//                stage.constraintHandler.show(stage, context, targetElement);
            };

            handler.hide = function (stage, context, targetElement) {
                if (stage.constraintHandler.hide) {
                    stage.constraintHandler.hide(stage, context, targetElement);
                }
            };

            handler.hide = function (stage, context, targetElement) {
            };

            handler.updateContext = function (stage, context, targetElement) {
                var topHandler = self.handlers["top"];
//                topHandler.updateContext(stage, context.top, targetElement.find('#' + context.top.panel_id));
                topHandler.updateContext(stage, context.top, targetElement);
            };

            handler.validate = function (stage, context, errors) {
                var topHandler = self.handlers["top"];
                topHandler.validate(stage, context.top, errors);
                //stage.constraintHandler.validate(stage, context, errors);
            };

            handler.updateConstraint = function (stage, context, cons) {
                var topHandler = self.handlers["top"];
                topHandler.updateConstraint(stage, context.top, cons);
                //stage.constraintHandler.updateConstraint(stage, context, cons);
            };
        };


        self.handlers = {};
        self.handlers["main"] = new MainTemplateHandler();
        self.handlers["top"] = new TopTemplateHandler();
    };


    ArchetypeEditor.addRmModule(new TemplateModule());
}(TemplateEditor, ArchetypeEditor) );
