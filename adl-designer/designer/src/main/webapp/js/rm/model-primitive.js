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

(function (ReferenceModels) {
    ReferenceModels.Primitive = (function () {
        var my = this;
        var handlers = {};

        var PrimitiveRmHandler = function () {
            var handler = this;
            ReferenceModels.BaseHandler.call(handler);
        };
        AmUtils.extend(PrimitiveRmHandler, ReferenceModels.BaseHandler);

        var CBooleanHandler = function () {
            var handler = this;
            PrimitiveRmHandler.call(handler);

            handler.createModel = function (archetypeModel, cons) {
                cons = cons || {};
                var gui = handler.createModelBase(archetypeModel, cons);
                gui.true_valid = cons.true_valid !== false;
                gui.false_valid = cons.false_valid !== true;
                gui.assumed_value = cons.assumed_value;

                return gui;
            };


            handler.validateModel = function (archetypeModel, gui, cons, errors) {
                handler.validateModelBase(archetypeModel, gui, cons, errors);

                if (!gui.false_valid && !gui.true_valid) {
                    errors.add("constraint.validation.no_valid_values");
                }
                if (gui.assumed_value !== undefined) {
                    if (typeof gui.assumed_value !== "boolean"
                        || gui.assumed_value && !gui.true_valid
                        || !gui.assumed_value && !gui.false_valid) {
                        errors.add("constraint.validation.invalid_assumed_value", "assumed_value");
                    }
                }
            };

            handler.saveModel = function (archetypeModel, gui, cons) {
                handler.saveModelBase(archetypeModel, gui, cons);

                cons.true_valid = gui.true_valid;
                cons.false_valid = gui.false_valid;
                cons.assumed_value = gui.assumed_value;
            };
        };
        AmUtils.extend(CBooleanHandler, PrimitiveRmHandler);


        var CRealHandler = function () {
            var handler = this;
            PrimitiveRmHandler.call(handler);

            handler.createModel = function (archetypeModel, cons) {
                cons = cons || {};
                var gui = handler.createModelBase(archetypeModel, cons);

                gui.range = ReferenceModels.consIntervalToGui(cons.range);
                gui.assumed_value = cons.assumed_value;
                return gui;
            };


            handler.validateModel = function (archetypeModel, gui, cons, errors) {
                handler.validateModelBase(archetypeModel, gui, cons, errors);
                ReferenceModels.validateGuiInterval(gui.range, errors.sub('range'));
                ReferenceModels.validateValueFitsGuiInterval(gui.range, gui.assumed_value, errors.sub('assumed_value'));
            };

            handler.saveModel = function (archetypeModel, gui, cons) {
                handler.saveModelBase(archetypeModel, gui, cons);

                if (gui.range.lower !== undefined || gui.range.upper !== undefined) {
                    cons.range = AmInterval.of(gui.range.lower, gui.range.upper, "INTERVAL_OF_REAL");
                } else {
                    delete cons.range;
                }
                cons.assumed_value = gui.assumed_value;
            };
        };
        AmUtils.extend(CRealHandler, PrimitiveRmHandler);

        var CIntegerHandler = function () {
            var handler = this;
            PrimitiveRmHandler.call(handler);

            handler.createModel = function (archetypeModel, cons) {
                cons = cons || {};
                var gui = handler.createModelBase(archetypeModel, cons);

                gui.range = ReferenceModels.consIntervalToGui(cons.range);
                gui.assumed_value = cons.assumed_value;
                return gui;

            };


            handler.validateModel = function (archetypeModel, gui, cons, errors) {
                handler.validateModelBase(archetypeModel, gui, cons, errors);
                ReferenceModels.validateGuiInterval(gui.range, errors.sub('range'));
                ReferenceModels.validateValueFitsGuiInterval(gui.range, gui.assumed_value, errors.sub('assumed_value'));
            };

            handler.saveModel = function (archetypeModel, gui, cons) {
                handler.saveModelBase(archetypeModel, gui, cons);

                if (gui.range.lower !== undefined || gui.range.upper !== undefined) {
                    cons.range = AmInterval.of(gui.range.lower, gui.range.upper, "INTERVAL_OF_REAL");
                } else {
                    delete cons.range;
                }
                cons.assumed_value = gui.assumed_value;
            };
        };
        AmUtils.extend(CIntegerHandler, PrimitiveRmHandler);


        var CDurationHandler = function () {
            var handler = this;
            PrimitiveRmHandler.call(handler);

            function maxPeriodUnit(period) {
                if (period.years) return "years";
                if (period.months) return "months";
                if (period.weeks) return "weeks";
                if (period.days) return "days";
                if (period.minutes) return "minutes";
                if (period.seconds) return "seconds";
                return "years";
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
                            if (timePart) result.months = true; else result.minutes = true;
                            break;
                        case 'W':
                            result.weeks = true;
                            break;
                        case 'D':
                            res.days = true;
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

            handler.createModel = function (archetypeModel, cons) {
                cons = cons || {};
                var gui = handler.createModelBase(archetypeModel, cons);


                if (cons.range) {
                    var anyPeriod = cons.range.lower || cons.range.upper;
                    if (anyPeriod) {
                        gui.range = {
                            lower_included: cons.range.lower_included,
                            upper_included: cons.range.upper_included
                        };

                        anyPeriod = Iso8601Period.of(anyPeriod);
                        gui.units = maxPeriodUnit(anyPeriod.period);

                        gui.range.lower = cons.range.lower ? Iso8601Period.of(cons.range.lower).period[gui.units] : undefined;
                        gui.range.upper = cons.range.upper ? Iso8601Period.of(cons.range.upper).period[gui.units] : undefined;
                    }
                }
                if (cons.assumed_value) {
                    if (!gui.units) {
                        gui.units = maxPeriodUnit(Iso8601Period.of(cons.assumed_value).period);
                    }
                    gui.assumed_value = Iso8601Period.of(cons.assumed_value).period[gui.units];
                }
                gui.units = gui.units || "years";
                if (!gui.range) {
                    gui.range = {
                        lower_included: true, lower: undefined, upper_included: true, upper: undefined
                    };
                }
                gui.pattern = parsePattern(cons.pattern);

                return gui;
            };

            handler.validateModel = function (archetypeModel, gui, cons, errors) {
                handler.validateModelBase(archetypeModel, gui, cons, errors);
                ReferenceModels.validateGuiInterval(gui.range, errors.sub('range'));
                ReferenceModels.validateValueFitsGuiInterval(gui.range, gui.assumed_value, errors.sub('assumed_value'));
            };

            handler.saveModel = function (archetypeModel, gui, cons) {
                handler.saveModelBase(archetypeModel, gui, cons);

                if (gui.range && (gui.range.lower !== undefined || gui.range.upper != undefined)) {
                    var upper, lower;
                    if (gui.range.lower !== undefined) {
                        lower = Iso8601Period.ofUnits(gui.units, gui.range.lower).toString();
                    }
                    if (gui.range.upper !== undefined) {
                        upper = Iso8601Period.ofUnits(gui.units, gui.range.upper).toString();
                    }
                    cons.range = AmInterval.of(lower, upper, "INTERVAL_OF_DURATION");
                    if (cons.range) {
                        cons.range.lower_included = gui.range.lower_included;
                        cons.range.upper_included = gui.range.upper_included;
                    }
                } else {
                    cons.range = undefined;
                }
                if (gui.assumed_value !== undefined) {
                    cons.assumed_value = Iso8601Period.ofUnits(gui.units, gui.assumed_value).toString();
                } else {
                    cons.assumed_value = undefined;
                }
                cons.pattern = patternToString(gui.pattern);
            };
        };

        var CDateTimeHandler = function () {
            var handler = this;
            PrimitiveRmHandler.call(handler);

            handler.formatPatterns = {
                "allow_all": {type: "C_DATE_TIME", pattern: undefined},
                "date_and_time": {type: "C_DATE_TIME", pattern: "yyyy-mm-ddTHH:MM:SS"},
                "date_and_partial_time": {type: "C_DATE_TIME", pattern: "yyyy-mm-ddTHH:??:??}"},
                "date_only": {type: "C_DATE", pattern: undefined},
                "full_date": {type: "C_DATE", pattern: "yyyy-mm-dd"},
                "partial_date": {type: "C_DATE", pattern: "yyyy-??-XX"},
                "partial_date_with_month": {type: "C_DATE", pattern: "yyyy-mm-??"},
                "time_only": {type: "C_TIME", pattern: undefined},
                "full_time": {type: "C_TIME", pattern: "HH:MM:SS"},
                "partial_time": {type: "C_TIME", pattern: "HH:??:XX"},
                "partial_time_with_minutes": {type: "C_TIME", pattern: "HH:MM:??"}
            };

            /**
             *  returns tree node id for a given pattern and ctype
             * @param {string?} pattern Input pattern. If absent, only undefined pattern will match
             * @param {string?} type AOM type. If absent, any type will match
             * @returns {string} pattern id, one of keys from formatPatterns
             */
            function findIdFromPattern(pattern, type) {
                var pattern_id, pat;
                for (pattern_id in handler.formatPatterns) {
                    pat = handler.formatPatterns[pattern_id];
                    if ((type === undefined || type === pat.type) && pat.pattern === pattern) {
                        return pattern_id;
                    }
                }
                // no match by pattern and type, just check for type
                for (pattern_id in handler.formatPatterns) {
                    pat = handler.formatPatterns[pattern_id];
                    if ((type === undefined || type === pat.type)) {
                        return pattern_id;
                    }
                }
                return "allow_all"; // should never happen
            }


            handler.createModel = function (archetypeModel, cons) {
                cons = cons || {};
                var gui = handler.createModelBase(archetypeModel, cons);
                gui.pattern_id = findIdFromPattern(cons.pattern, cons.rm_type_name || "C_DATE_TIME");

                return gui;
            };

            handler.validateModel = function (archetypeModel, gui, cons, errors) {
                handler.validateModelBase(archetypeModel, gui, cons, errors);
                errors.validate(handler.formatPatterns[gui.pattern_id],
                    "constraint.validation.invalid_pattern", "pattern"
                );
            };

            handler.saveModel = function (archetypeModel, gui, cons) {
                handler.saveModelBase(archetypeModel, gui, cons);
                var pattern = handler.formatPatterns[gui.pattern_id];
                cons.rm_type_name = pattern.type;
                cons.pattern = pattern.pattern;

            };
        };
        AmUtils.extend(CDateTimeHandler, PrimitiveRmHandler);


        handlers["C_BOOLEAN"] = new CBooleanHandler();
        handlers["C_REAL"] = new CRealHandler();
        handlers["C_INTEGER"] = new CIntegerHandler();
        handlers["C_DURATION"] = new CDurationHandler();
        handlers["C_DATE_TIME"] = new CDateTimeHandler();
        handlers["C_DATE"] = handlers["C_DATE_TIME"];
        handlers["C_TIME"] = handlers["C_DATE_TIME"];

        my.getHandler = function (amType, rmType) {
            return handlers[rmType];
        };

        return my;
    }());
}(ReferenceModels) );