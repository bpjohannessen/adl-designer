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

var ReferenceModels = (function () {
    var my = this;

    my.consIntervalToGui = function (interval) {
        if (!interval) {
            return {
                lower_included: true,
                upper_included: true
            }
        }
        return {
            lower_included: interval.lower_included,
            upper_included: interval.upper_included,
            lower: interval.lower_unbounded ? undefined : interval.lower,
            upper: interval.upper_unbounded ? undefined : interval.upper
        }
    };

    my.guiIntervalToCons = function (interval, amType) {
        if (!interval) return undefined;
        if (interval.lower === undefined && interval.upper === undefined) return undefined;

        var result = {
            lower: interval.lower,
            upper: interval.upper
        };
        result.lower_included = interval.lower_included;
        result.upper_included = interval.upper_included;
        result.lower_unbounded = interval.lower === undefined;
        result.upper_unbounded = interval.upper === undefined;
        result["@type"] = amType;
        return result;
    };


    function builtinComparator(o1, o2) {
        if (o1 < o2) return -1;
        if (o1 > o2) return 1;
        return 0;
    }

    /**
     *
     * @param {object} int interval to validate
     * @param {AmUtils.Errors} errors target errors
     * @param {function?} comparator Comparator to use. Default is builtin &lt;
     */
    my.validateGuiInterval = function (int, errors, comparator) {
        comparator = comparator || builtinComparator;


        if (int.lower !== undefined && int.upper != undefined) {
            if (comparator(int.lower, int.upper) > 0) {
                errors.add("constraint.validation.interval.lower_bound_above_upper");
            }
        }
    };

    /**
     *
     * @param {object} int Interval used to validate value
     * @param value value to validate
     * @param {AmUtils.Errors} errors target errors
     * @param {function?} comparator Comparator to use. Default is builtin &lt;
     */
    my.validateValueFitsGuiInterval = function (int, value, errors, comparator) {
        if (value === undefined) return;

        comparator = comparator || builtinComparator;
        var c;
        if (int.lower !== undefined) {
            c = comparator(int.lower, value);
            if (c > 0 || !int.lower_included && c === 0) {
                errors.add("constraint.validation.out_of_range");
            }
        }
        if (int.upper !== undefined) {
            c = comparator(int.upper, value);
            if (c < 0 || !int.upper_included && c === 0) {
                errors.add("constraint.validation.out_of_range");
            }
        }
    };


    /**
     * @constructor
     */
    my.BaseHandler = function () {
        var handler = this;

        handler.createModelBase = function (archetypeModel, cons) {
            cons = cons || {};
            var gui = {};
            gui.node_id = cons.node_id;
            if (cons.occurrences) {
                gui.occurrences = consIntervalToGui(cons.occurrences);
            } else {
                gui.occurrences = {
                    lower_included: true,
                    upper_included: true,
                    lower: 0,
                    upper: 1
                }
            }

            return gui;
        };


        /**
         * Creates context (a gui model from existing or new constrains)
         * @param {AOM.ArchetypeModel} archetypeModel model of the archetype
         * @param {object} cons Object for which to create the context. undefined if it does not exist yet
         * @returns {object} guiModel
         */
        handler.createModel = function (archetypeModel, cons) {
        };


        handler.validateModelBase = function (archetypeModel, gui, cons, errors) {
            if (gui.occurrences.lower !== undefined && gui.occurrences.lower < 0) {
                errors.add("constraint.validation.invalid_occurrences", "occurrences");
            }
            if (gui.occurrences.lower !== undefined && gui.occurrences.upper !== undefined) {
                if (gui.occurrences.lower > gui.occurrences.upper) {
                    errors.add("constraint.validation.invalid_occurrences", "occurrences");
                }
            }
        };

        /**
         * Validates a gui model
         * @param {AOM.ArchetypeModel} archetypeModel model of the archetype
         * @param {object} gui to validate
         * @param {object} cons constraint object
         * @param {AmUtils.Errors} errors Target for any validation errors
         */
        handler.validateModel = function (archetypeModel, gui, cons, errors) {
        };


        handler.saveModelBase = function (archetypeModel, gui, cons) {

            cons.occurrences = AmInterval.of(gui.occurrences.lower, gui.occurrences.upper, "MULTIPLICITY_INTERVAL");
        };

        /**
         * Updates constraint values from the context values.
         *
         * @param {object} archetypeModel archetypeModel model of the archetype
         * @param gui contains values that are to be copied on the context
         * @param cons target constrains where the context values will be written
         */
        handler.saveModel = function (archetypeModel, gui, cons) {
        };
    };
    return my;
}() );