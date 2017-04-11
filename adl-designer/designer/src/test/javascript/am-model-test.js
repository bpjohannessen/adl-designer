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

describe("NodeId", function () {
    it("parses root node", function () {
        var nodeId = new AOM.NodeId("id1");
        expect(nodeId.getSpecializationDepth()).toEqual(1);
        expect(nodeId.toString()).toEqual("id1");
    });

    it("parses specialized", function () {
        var nodeId = new AOM.NodeId("id1.2.3");
        expect(nodeId.getSpecializationDepth()).toEqual(3);
        expect(nodeId.toString()).toEqual("id1.2.3");
    });
});


describe("ArchetypeModel", function () {
    var am = new AOM.ArchetypeModel(AmUtils.clone(Resources.archetypes.bodyWeight));
    it("extracts term definition", function () {
        expect(am.getTermDefinitionText("id5")).toEqual("Weight");
    });
});

describe("ArchetypeModel.getRmPath", function () {
    var am = new AOM.ArchetypeModel(AmUtils.clone(Resources.archetypes.bodyWeight));
    it("gets regular rm path", function () {
        var cons = AOM.AmQuery.get(am.data.definition, "/data[id3]/events[id4]/data[id2]/items[id5]/value[id30]");

        var rmPath = am.getRmPath(cons).toString();
        expect(rmPath).toEqual("/data[id3]/events[id4]/data[id2]/items[id5]/value[id30]");
    });

    it("gets tuple rm path", function () {
        var cons = AOM.AmQuery.get(am.data.definition, "/data[id3]/events[id4]/data[id2]/items[id5]/value[id30]");
        cons = cons.attribute_tuples[0].children[0].members[0];
        var rmPath = am.getRmPath(cons).toString();
        expect(rmPath).toEqual("/data[id3]/events[id4]/data[id2]/items[id5]/value[id30]/magnitude");
    });

    it("updates annotations", function () {
        var cons = AOM.AmQuery.get(am.data.definition, "/data[id3]/events[id4]/data[id2]/items[id5]/value[id30]");
        var annotations = {"en": {"one": "1", "two": "2"}};
        am.updateAnnotationsForNode(cons, annotations);
        expect(am.data.annotations.items["en"]["/data[id3]/events[id4]/data[id2]/items[id5]/value[id30]"]["one"]).toEqual("1");
        annotations = {"en": {"one": "1", "three": "3"}};
        am.updateAnnotationsForNode(cons, annotations);
        expect(am.data.annotations.items["en"]["/data[id3]/events[id4]/data[id2]/items[id5]/value[id30]"]["two"]).toBeUndefined();
        expect(am.data.annotations.items["en"]["/data[id3]/events[id4]/data[id2]/items[id5]/value[id30]"]["three"]).toEqual("3");

    });

});
describe("ArchetypeModel.generateSpecializedTermId", function () {
    var am = new AOM.ArchetypeModel(AmUtils.clone(Resources.archetypes.bodyWeight));
    it("generates new specialized node by prefix", function () {
        expect(am.generateSpecializedTermId("id")).toEqual("id38");
        expect(am.generateSpecializedTermId("at")).toEqual("at20");
    });

});

describe("ArchetypeId", function () {
    it("parses archetype id", function () {
        var aid = new AOM.ArchetypeId("openEHR-EHR-OBSERVATION.test.v1");
        expect(aid.data).toEqual(jasmine.objectContaining({
            context: {publisher: "openEHR", rm_package: "EHR", rm_class: "OBSERVATION"},
            concept: "test",
            version: jasmine.objectContaining({major: 1})
        }));

        aid = new AOM.ArchetypeId("openEHR-DEMOGRAPHIC-ADDRESS.test2.v1.1.0-rc.22");
        expect(aid.data).toEqual(jasmine.objectContaining({
            context: {publisher: "openEHR", rm_package: "DEMOGRAPHIC", rm_class: "ADDRESS"},
            concept: "test2",
            version: {major: 1, minor: 1, patch: 0, status: "rc", build_count: 22}
        }));
    });

    it("parses and recreates archetype id", function () {
        var aid = new AOM.ArchetypeId("openEHR-EHR-OBSERVATION.test.v1");
        expect(aid.toString()).toEqual("openEHR-EHR-OBSERVATION.test.v1");
        aid = new AOM.ArchetypeId("openEHR-DEMOGRAPHIC-ADDRESS.test2.v1.1.0-rc.22");
        expect(aid.toString()).toEqual("openEHR-DEMOGRAPHIC-ADDRESS.test2.v1.1.0-rc.22");

        // no status
        aid = new AOM.ArchetypeId("openEHR-DEMOGRAPHIC-ADDRESS.test2.v1.1.0.22");
        expect(aid.toString()).toEqual("openEHR-DEMOGRAPHIC-ADDRESS.test2.v1.1.0.22");

        // no patch
        aid = new AOM.ArchetypeId("openEHR-DEMOGRAPHIC-ADDRESS.test2.v1.2-release.54");
        expect(aid.toString()).toEqual("openEHR-DEMOGRAPHIC-ADDRESS.test2.v1.2-release.54");
    });
});


describe("ArchetypeModel.addUnconstrainedAttributes", function () {
    var am = new AOM.ArchetypeModel(AmUtils.clone(Resources.archetypes.bodyWeight));
    it("adds simple attribute", function () {
        var cons = AOM.AmQuery.get(am.data.definition, "/data[id3]/events[id4]/data[id2]/items[id25]");

        var targetCons = AOM.newCComplexObject(cons.rm_type_name);
        am.addUnconstrainedAttributes(cons, targetCons);
        expect(targetCons.attributes.length).toEqual(1);
        expect(AOM.AmQuery.get(targetCons, "/value[id31]")).not.toBeUndefined();

        // should not add another attribute, as it already exists
        am.addUnconstrainedAttributes(cons, targetCons);
        expect(targetCons.attributes.length).toEqual(1);
    });

    it("adds attribute and tuple", function () {
        var cons = AOM.AmQuery.get(am.data.definition, "/data[id3]/events[id4]/data[id2]/items[id5]/value[id30]");

        var targetCons = AOM.newCComplexObject(cons.rm_type_name);
        am.addUnconstrainedAttributes(cons, targetCons);
        expect(targetCons.attributes.length).toEqual(1);
        expect(AOM.AmQuery.get(targetCons, "/property")).not.toBeUndefined();
        expect(targetCons.attribute_tuples.length).toEqual(1);
        expect(targetCons.attribute_tuples[0].members[0].rm_attribute_name).toEqual("magnitude");
        expect(targetCons.attribute_tuples[0].members[1].rm_attribute_name).toEqual("units");

        // should not add another attribute/tuple, as they already exist
        am.addUnconstrainedAttributes(cons, targetCons);
        expect(targetCons.attributes.length).toEqual(1);
        expect(AOM.AmQuery.get(targetCons, "/property")).not.toBeUndefined();
        expect(targetCons.attribute_tuples.length).toEqual(1);
        expect(targetCons.attribute_tuples[0].members[0].rm_attribute_name).toEqual("magnitude");
        expect(targetCons.attribute_tuples[0].members[1].rm_attribute_name).toEqual("units");
    });

    it("does not add attribute if tuple exists", function () {
        var cons = AOM.AmQuery.get(am.data.definition, "/data[id3]/events[id4]/data[id2]/items[id5]");

        var targetCons = AOM.newCComplexObject(cons.rm_type_name);
        targetCons.attribute_tuples.push(AOM.newCAttributeTuple(["value", "other_value"]));
        targetCons.attribute_tuples[0].children.push(AOM.newCObjectTuple([AOM.newCString(["kg"]), AOM.newCString(["name", "same"])]));

        am.addUnconstrainedAttributes(cons, targetCons);

        expect(targetCons.attributes.length).toEqual(0);
    });

});

describe("RmPath", function () {
    it("parses simple path", function () {
        var rmPath = new AOM.RmPath("/name/value");
        expect(rmPath.segments.length).toEqual(2);
        expect(rmPath.segments[0]).toEqual(jasmine.objectContaining({attribute: "name"}));
        expect(rmPath.segments[1]).toEqual(jasmine.objectContaining({attribute: "value"}));
    });

    it("parses path with node ids", function () {
        var rmPath = new AOM.RmPath("/content[id1]/data[id2.3]/events/items[id0.3]/value");

        expect(rmPath.segments.length).toEqual(5);
        expect(rmPath.segments[0]).toEqual(jasmine.objectContaining({attribute: "content", node_id: "id1"}));
        expect(rmPath.segments[1]).toEqual(jasmine.objectContaining({attribute: "data", node_id: "id2.3"}));
        expect(rmPath.segments[2]).toEqual(jasmine.objectContaining({attribute: "events"}));
        expect(rmPath.segments[3]).toEqual(jasmine.objectContaining({attribute: "items", node_id: "id0.3"}));
        expect(rmPath.segments[4]).toEqual(jasmine.objectContaining({attribute: "value"}));
    });

    it("builds rm path string", function () {
        var rmPath = new AOM.RmPath([
            {attribute: "content", node_id: "id1"},
            {attribute: "data", node_id: "id2.3"},
            {attribute: "events"}]);

        expect(rmPath.toString()).toEqual("/content[id1]/data[id2.3]/events");
    });

});

describe("AmQuery", function () {
    it("queries on simple path", function () {
        var matches = AOM.AmQuery.findAll(Resources.archetypes.bodyWeight.definition, "/data/events/data/items");
        expect(matches).not.toBeUndefined();
        expect(matches.length).toEqual(2);
        expect(matches[0].node_id).toEqual("id5");
        expect(matches[1].node_id).toEqual("id25");
    });

    it("queries with node ids", function () {
        var matches = AOM.AmQuery.findAll(Resources.archetypes.bodyWeight.definition, "/data[id3]/events[id4]/data[id2]/items[id5]");
        expect(matches).not.toBeUndefined();
        expect(matches.length).toEqual(1);
        expect(matches[0].node_id).toEqual("id5");
    });


    it("queries for tuples", function () {
        var matches = AOM.AmQuery.findAll(Resources.archetypes.bodyWeight.definition, "/data[id3]/events[id4]/data[id2]/items[id5]/value[id30]/magnitude");
        expect(matches.length).toEqual(2);
        expect(matches[0].range).toEqual(jasmine.objectContaining({lower: 0, upper: 1000})); //kg
        expect(matches[1].range).toEqual(jasmine.objectContaining({lower: 0, upper: 2000})); //lb

        matches = AOM.AmQuery.findAll(Resources.archetypes.bodyWeight.definition, "/data[id3]/events[id4]/data[id2]/items[id5]/value[id30]/units");
        expect(matches.length).toEqual(2);
        expect(matches[0].list).toEqual(["kg"]);
        expect(matches[1].list).toEqual(["lb"]);
    });

});


describe("ArchetypeModel.moveBefore", function () {
    var am = new AOM.ArchetypeModel(AmUtils.clone(Resources.archetypes.bodyWeight));
    it("moves before existing", function () {
        var consStateOfDress = AOM.AmQuery.get(am.data.definition, "/data[id3]/events[id4]/state[id9]/items[id10]");
        var consPregnant = AOM.AmQuery.get(am.data.definition, "/data[id3]/events[id4]/state[id9]/items[id29]");
        var consConfoundingFactors = AOM.AmQuery.get(am.data.definition, "/data[id3]/events[id4]/state[id9]/items[id26]");

        am.moveBefore(consPregnant, consStateOfDress);

        var list = AOM.AmQuery.findAll(am.data.definition, "/data[id3]/events[id4]/state[id9]/items");

        expect(list.length).toEqual(3);
        expect(list[0]).toBe(consPregnant);
        expect(list[1]).toBe(consStateOfDress);
        expect(list[2]).toBe(consConfoundingFactors);
    });

    it("moves on end", function () {
        var consWeight = AOM.AmQuery.get(am.data.definition, "/data[id3]/events[id4]/data[id2]/items[id5]");
        var consComment = AOM.AmQuery.get(am.data.definition, "/data[id3]/events[id4]/data[id2]/items[id25]");

        am.moveBefore(consWeight, null);

        var constraintList = AOM.AmQuery.findAll(am.data.definition, "/data[id3]/events[id4]/data[id2]/items");

        expect(constraintList.length).toEqual(2);
        expect(constraintList[0]).toBe(consComment);
        expect(constraintList[1]).toBe(consWeight);
    });


})

