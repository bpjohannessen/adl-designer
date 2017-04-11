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

describe(
    "AmInterval", function () {
        it("parses closed contained interval", function () {
            var interval = AmInterval.parseContainedString("[0..100]");
            expect(interval).toEqual(jasmine.objectContaining(
                {
                    lower: 0, lower_included: true, lower_unbounded: false,
                    upper: 100, upper_included: true, upper_unbounded: false
                }));
        });

        it("parses open contained interval", function () {
            var interval = AmInterval.parseContainedString("(10..90)");
            expect(interval).toEqual(jasmine.objectContaining(
                {
                    lower: 10, lower_included: false, lower_unbounded: false,
                    upper: 90, upper_included: false, upper_unbounded: false
                }));
        });

        it("parses half-open contained interval", function () {
            var interval = AmInterval.parseContainedString("[0..100)");
            expect(interval).toEqual(jasmine.objectContaining(
                {
                    lower: 0, lower_included: true, lower_unbounded: false,
                    upper: 100, upper_included: false, upper_unbounded: false
                }));

        });

        it("parses upper unbounded interval", function () {
            var interval = AmInterval.parseContainedString("[0..*)");
            expect(interval).toEqual(jasmine.objectContaining(
                {
                    lower: 0, lower_included: true, lower_unbounded: false,
                    upper_included: false, upper_unbounded: true
                }));
        });

        it("parses lower unbounded interval", function () {
            var interval = AmInterval.parseContainedString("(*..10)");
            expect(interval).toEqual(jasmine.objectContaining(
                {
                    lower_included: false, lower_unbounded: true,
                    upper: 10, upper_included: false, upper_unbounded: false
                }));
        });

        it("parses fully unbounded interval", function () {
            var interval = AmInterval.parseContainedString("(*..*)");
            expect(interval).toEqual(jasmine.objectContaining(
                {
                    lower_included: false, lower_unbounded: true,
                    upper_included: false, upper_unbounded: true
                }));
        });

    });


describe(
    "AmUtils.Errors", function () {
        it("adds a simple error", function () {
            var errors = new AmUtils.Errors();
            errors.add("first error");
            errors.add("second error", "second location");

            expect(errors.getErrors().length).toEqual(2);
            expect(errors.getErrors()[0]).toEqual({error: "first error"});
            expect(errors.getErrors()[1]).toEqual({error: "second error", location: "second location"});
        });

        it("pushes context", function () {
            var errors = new AmUtils.Errors();
            errors.add("first error", "input_1");
            var nameErrors = errors.sub("name");
            nameErrors.add("Bad first name", "first");
            var addressErrors = errors.sub("address");
            addressErrors.add("Bad Street", "street");

            expect(errors.getErrors().length).toEqual(3);
            expect(errors.getErrors()[0]).toEqual({error: "first error", location: "input_1"});
            expect(errors.getErrors()[1]).toEqual({error: "Bad first name", location: "name.first"});
            expect(errors.getErrors()[2]).toEqual({error: "Bad Street", location: "address.street"});
        });

    });


describe(
    "AmUtils.cleanObjectProperties", function () {
        it("removes undefined", function () {
            var obj = {
                one: 1,
                undef: undefined,
                zero: 0,
                fls: false,
                empty_list: [],
                empty_obj: {},
                list: [1],
                obj: {val: "val"}
            };
            AmUtils.cleanObjectProperties(obj);
            expect(obj).toEqual({
                one: 1,
                zero: 0,
                fls: false,
                empty_list: [],
                empty_obj: {},
                list: [1],
                obj: {val: "val"}
            });
        });

        it("removes undefined/false", function () {
            var obj = {
                one: 1,
                undef: undefined,
                zero: 0,
                fls: false,
                empty_list: [],
                empty_obj: {},
                list: [1],
                obj: {val: "val"}
            };
            AmUtils.cleanObjectProperties(obj, 1);
            expect(obj).toEqual({one: 1, zero: 0, empty_list: [], empty_obj: {}, list: [1], obj: {val: "val"}});
        });
        it("removes falsy", function () {
            var obj = {
                one: 1,
                undef: undefined,
                zero: 0,
                fls: false,
                empty_list: [],
                empty_obj: {},
                list: [1],
                obj: {val: "val"}
            };
            AmUtils.cleanObjectProperties(obj, 2);
            expect(obj).toEqual({one: 1, empty_list: [], empty_obj: {}, list: [1], obj: {val: "val"}});
        });
        it("removes falsy/empty", function () {
            var obj = {
                one: 1,
                undef: undefined,
                zero: 0,
                fls: false,
                empty_list: [],
                empty_obj: {},
                list: [1],
                obj: {val: "val"}
            };
            AmUtils.cleanObjectProperties(obj, 3);
            expect(obj).toEqual({one: 1, list: [1], obj: {val: "val"}});
        });
        it("removes custom", function () {
            var obj = {
                one: 1,
                undef: undefined,
                zero: 0,
                fls: false,
                empty_list: [],
                empty_obj: {},
                list: [1],
                obj: {val: "val"}
            };
            AmUtils.cleanObjectProperties(obj, function (v) {
                return typeof v === "number"
            });
            expect(obj).toEqual({one: 1, zero: 0});
        });

    });

describe(
    "AmUtils.isInt", function () {
        it("string is not integer", function () {
            expect(AmUtils.isInt('abc')).toEqual(false);
            expect(AmUtils.isInt('10')).toEqual(false);
        });

        it("nan is not integer", function () {
            expect(AmUtils.isInt(NaN)).toEqual(false);
        });
        it("float is not integer", function () {
            expect(AmUtils.isInt(1.3)).toEqual(false);
        });
        it("integer is integer", function () {
            expect(AmUtils.isInt(1)).toEqual(true);
            expect(AmUtils.isInt(13.0)).toEqual(true);
        });
    });

describe(
    "Iso8601Period", function () {
        it("parses simple year duration", function () {
            expect(Iso8601Period.of('P2Y').period).toEqual({years: 2});
        });
        it("parses simple minutes duration", function () {
            expect(Iso8601Period.of('PT3M').period).toEqual({minutes: 3});
        });
        it("parses full duration", function () {
            expect(Iso8601Period.of('P1Y2M3W4DT5H6M7S').period).toEqual({
                years: 1,
                months: 2,
                weeks: 3,
                days: 4,
                hours: 5,
                minutes: 6,
                seconds: 7
            });
        });
        it("simple to string", function () {
            expect(Iso8601Period.of('P12Y').toString()).toEqual('P12Y');
        });
        it("complex to string", function () {
            expect(Iso8601Period.of('P1Y2M3W4DT5H6M7S').toString()).toEqual('P1Y2M3W4DT5H6M7S');
        });
    });

