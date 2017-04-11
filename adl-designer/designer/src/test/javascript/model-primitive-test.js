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

describe("CRealHandler", function () {

    var handler = ReferenceModels.Primitive.getHandler("C_REAL", "C_REAL");

    it("is found", function () {
        expect(handler).not.toBeUndefined();
    });

    it("creates range gui", function () {
        var rangeCons = {
            "@type": "C_REAL",
            "list": [],
            "range": {
                "@type": "INTERVAL_OF_REAL",
                "lower": 0,
                "upper": 100,
                "lower_included": true,
                "upper_included": true,
                "lower_unbounded": false,
                "upper_unbounded": false
            },
            "occurrences": {
                "@type": "MULTIPLICITY_INTERVAL",
                "lower_included": true,
                "upper_included": true,
                "lower_unbounded": false,
                "upper_unbounded": false,
                "lower": 1,
                "upper": 1
            },
            "rm_type_name": "C_REAL"
        };
        var gui = handler.createModel(undefined, rangeCons);
        expect(gui.range.lower).toEqual(0);
        expect(gui.range.upper).toEqual(100);

    });

    it("detects invalid occurrences", function () {
        var cons = {
            "@type": "C_REAL",
            "list": [],
            "range": {
                "@type": "INTERVAL_OF_REAL",
                "lower": 0,
                "upper": 100,
                "lower_included": true,
                "upper_included": true,
                "lower_unbounded": false,
                "upper_unbounded": false
            },
            "occurrences": {
                "@type": "MULTIPLICITY_INTERVAL",
                "lower_included": true,
                "upper_included": true,
                "lower_unbounded": false,
                "upper_unbounded": false,
                "lower": 2,
                "upper": 1
            },
            "rm_type_name": "C_REAL"
        };
        var gui = handler.createModel(undefined, cons);
        var errors = new AmUtils.Errors();
        handler.validateModel(undefined, gui, cons, errors);
        expect(errors.empty()).toEqual(false);
        expect(errors.getErrors().length).toEqual(1);
        expect(errors.getErrors()[0].error).toEqual("constraint.validation.invalid_occurrences");
    });

    it("updates range", function () {
        var cons = {
            "@type": "C_REAL",
            "list": [],
            "range": {
                "@type": "INTERVAL_OF_REAL",
                "lower": 0,
                "upper": 100,
                "lower_included": true,
                "upper_included": true,
                "lower_unbounded": false,
                "upper_unbounded": false
            },
            "rm_type_name": "C_REAL"
        };
        var gui = handler.createModel(undefined, cons);
        gui.range.lower = 10;
        handler.saveModel(undefined, gui, cons);
        expect(cons.range.lower).toEqual(10);
    });


});

describe("CBooleanHandler", function () {
    var handler = ReferenceModels.Primitive.getHandler("C_BOOLEAN", "C_BOOLEAN");
    it("is found", function () {
        expect(handler).not.toBeUndefined();
    });

});

describe("CDurationHandler", function () {
    var handler = ReferenceModels.Primitive.getHandler("C_DURATION", "C_DURATION");

    var minuteConsAssumed = {
        "@type": "C_DURATION",
        "assumed_value": "PT5M",
        "occurrences": {
            "@type": "MULTIPLICITY_INTERVAL",
            "lower_included": true,
            "upper_included": true,
            "lower_unbounded": false,
            "upper_unbounded": false,
            "lower": 1,
            "upper": 1
        },
        "rm_type_name": "C_DURATION"
    };
    var dayConsRange = {
        "@type": "C_DURATION",
        "occurrences": {
            "@type": "MULTIPLICITY_INTERVAL",
            "lower_included": true,
            "upper_included": true,
            "lower_unbounded": false,
            "upper_unbounded": false,
            "lower": 1,
            "upper": 1
        },
        "range": {
            "@type": "INTERVAL_OF_REAL",
            "lower": "P4D",
            "upper": undefined,
            "lower_included": false,
            "upper_included": true,
            "lower_unbounded": false,
            "upper_unbounded": false
        },
        "rm_type_name": "C_DURATION"
    };

    it("creates model from assumed value only", function () {

        var gui = handler.createModel(undefined, minuteConsAssumed);
        expect(gui.range.lower_included).toEqual(true);
        expect(gui.range.lower_included).toEqual(true);
        expect(gui.units).toEqual("minutes");
    });


    it("creates model from range only", function () {
        var gui = handler.createModel(undefined, dayConsRange);
        expect(gui.range.lower_included).toEqual(false);
        expect(gui.range.upper_included).toEqual(true);
        expect(gui.range.lower).toEqual(4);
        expect(gui.range.upper).toBeUndefined();
        expect(gui.units).toEqual("days");
    });
    it("validates valid model", function () {
        var errors = new AmUtils.Errors();
        var gui = handler.createModel(undefined, minuteConsAssumed);
        handler.validateModel(undefined, gui, minuteConsAssumed, errors);
        expect(errors.empty()).toEqual(true);
        gui = handler.createModel(undefined, dayConsRange);
        handler.validateModel(undefined, gui, dayConsRange, errors);
        expect(errors.empty()).toEqual(true);
    });


});
