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

    var AmGraph = function () {
        var self = this;
        var graph = {
            "types": {
                "C_SECOND_ORDER": {
                    "type": "C_SECOND_ORDER",
                    "parent": "AM_OBJECT"
                },
                "OPERATIONAL_TEMPLATE": {
                    "type": "OPERATIONAL_TEMPLATE",
                    "parent": "ARCHETYPE"
                },
                "C_ATTRIBUTE_TUPLE": {
                    "type": "C_ATTRIBUTE_TUPLE",
                    "parent": "C_SECOND_ORDER"
                },
                "TERMINAL_STATE": {
                    "type": "TERMINAL_STATE",
                    "parent": "STATE"
                },
                "C_DATE": {
                    "type": "C_DATE",
                    "parent": "C_PRIMITIVE_OBJECT"
                },
                "FLAT_ARCHETYPE_ONTOLOGY": {
                    "type": "FLAT_ARCHETYPE_ONTOLOGY",
                    "parent": "ARCHETYPE_ONTOLOGY"
                },
                "T_VIEW": {
                    "type": "T_VIEW",
                    "parent": "AM_OBJECT"
                },
                "C_DV_QUANTITY": {
                    "type": "C_DV_QUANTITY",
                    "parent": "C_DOMAIN_TYPE"
                },
                "EXPR_ITEM": {
                    "type": "EXPR_ITEM",
                    "parent": "AM_OBJECT"
                },
                "T_CONSTRAINT": {
                    "type": "T_CONSTRAINT",
                    "parent": "AM_OBJECT"
                },
                "C_DEFINED_OBJECT": {
                    "type": "C_DEFINED_OBJECT",
                    "parent": "C_OBJECT"
                },
                "ASSERTION": {
                    "type": "ASSERTION",
                    "parent": "AM_OBJECT"
                },
                "C_BOOLEAN": {
                    "type": "C_BOOLEAN",
                    "parent": "C_PRIMITIVE_OBJECT"
                },
                "C_DURATION": {
                    "type": "C_DURATION",
                    "parent": "C_PRIMITIVE_OBJECT"
                },
                "C_TERMINOLOGY_CODE": {
                    "type": "C_TERMINOLOGY_CODE",
                    "parent": "C_PRIMITIVE_OBJECT"
                },
                "ARCHETYPE_ONTOLOGY": {
                    "type": "ARCHETYPE_ONTOLOGY",
                    "parent": "AM_OBJECT"
                },
                "C_DV_STATE": {
                    "type": "C_DV_STATE",
                    "parent": "C_DOMAIN_TYPE"
                },
                "ConstraintBindingSet": {
                    "type": "ConstraintBindingSet",
                    "parent": "AM_OBJECT"
                },
                "CodeDefinitionSet": {
                    "type": "CodeDefinitionSet",
                    "parent": "AM_OBJECT"
                },
                "C_OBJECT_GROUP": {
                    "type": "C_OBJECT_GROUP",
                    "parent": "ARCHETYPE_CONSTRAINT"
                },
                "C_PRIMITIVE_OBJECT": {
                    "type": "C_PRIMITIVE_OBJECT",
                    "parent": "C_DEFINED_OBJECT"
                },
                "ARCHETYPE_SLOT": {
                    "type": "ARCHETYPE_SLOT",
                    "parent": "C_OBJECT"
                },
                "EXPR_UNARY_OPERATOR": {
                    "type": "EXPR_UNARY_OPERATOR",
                    "parent": "EXPR_OPERATOR"
                },
                "AM_OBJECT": {
                    "type": "AM_OBJECT",
                    "parent": null
                },
                "SIBLING_ORDER": {
                    "type": "SIBLING_ORDER",
                    "parent": "AM_OBJECT"
                },
                "CONSTRAINT_BINDING_ITEM": {
                    "type": "CONSTRAINT_BINDING_ITEM",
                    "parent": "AM_OBJECT"
                },
                "C_REAL": {
                    "type": "C_REAL",
                    "parent": "C_PRIMITIVE_OBJECT"
                },
                "ARCHETYPE_TERM": {
                    "type": "ARCHETYPE_TERM",
                    "parent": "AM_OBJECT"
                },
                "STATE_MACHINE": {
                    "type": "STATE_MACHINE",
                    "parent": "AM_OBJECT"
                },
                "C_ARCHETYPE_ROOT": {
                    "type": "C_ARCHETYPE_ROOT",
                    "parent": "C_COMPLEX_OBJECT"
                },
                "EXPR_OPERATOR": {
                    "type": "EXPR_OPERATOR",
                    "parent": "EXPR_ITEM"
                },
                "TERM_BINDING_ITEM": {
                    "type": "TERM_BINDING_ITEM",
                    "parent": "AM_OBJECT"
                },
                "ARCHETYPE_CONSTRAINT": {
                    "type": "ARCHETYPE_CONSTRAINT",
                    "parent": "AM_OBJECT"
                },
                "C_QUANTITY_ITEM": {
                    "type": "C_QUANTITY_ITEM",
                    "parent": "AM_OBJECT"
                },
                "TermBindingSet": {
                    "type": "TermBindingSet",
                    "parent": "AM_OBJECT"
                },
                "C_OBJECT": {
                    "type": "C_OBJECT",
                    "parent": "ARCHETYPE_CONSTRAINT"
                },
                "STATE": {
                    "type": "STATE",
                    "parent": "AM_OBJECT"
                },
                "C_CODE_REFERENCE": {
                    "type": "C_CODE_REFERENCE",
                    "parent": "C_CODE_PHRASE"
                },
                "C_STRING": {
                    "type": "C_STRING",
                    "parent": "C_PRIMITIVE_OBJECT"
                },
                "T_COMPLEX_OBJECT": {
                    "type": "T_COMPLEX_OBJECT",
                    "parent": "C_COMPLEX_OBJECT"
                },
                "C_OBJECT_TUPLE": {
                    "type": "C_OBJECT_TUPLE",
                    "parent": "C_SECOND_ORDER"
                },
                "CARDINALITY": {
                    "type": "CARDINALITY",
                    "parent": "AM_OBJECT"
                },
                "C_INTEGER": {
                    "type": "C_INTEGER",
                    "parent": "C_PRIMITIVE_OBJECT"
                },
                "C_DOMAIN_TYPE": {
                    "type": "C_DOMAIN_TYPE",
                    "parent": "C_DEFINED_OBJECT"
                },
                "AUTHORED_RESOURCE": {
                    "type": "AUTHORED_RESOURCE",
                    "parent": null
                },
                "C_DATE_TIME": {
                    "type": "C_DATE_TIME",
                    "parent": "C_PRIMITIVE_OBJECT"
                },
                "ARCHETYPE_INTERNAL_REF": {
                    "type": "ARCHETYPE_INTERNAL_REF",
                    "parent": "C_OBJECT"
                },
                "C_DV_ORDINAL": {
                    "type": "C_DV_ORDINAL",
                    "parent": "C_DOMAIN_TYPE"
                },
                "C_CODE_PHRASE": {
                    "type": "C_CODE_PHRASE",
                    "parent": "C_DOMAIN_TYPE"
                },
                "NON_TERMINAL_STATE": {
                    "type": "NON_TERMINAL_STATE",
                    "parent": "STATE"
                },
                "CONSTRAINT_REF": {
                    "type": "CONSTRAINT_REF",
                    "parent": "C_OBJECT"
                },
                "C_COMPLEX_OBJECT": {
                    "type": "C_COMPLEX_OBJECT",
                    "parent": "C_DEFINED_OBJECT"
                },
                "TRANSITION": {
                    "type": "TRANSITION",
                    "parent": "AM_OBJECT"
                },
                "VALUE_SET_ITEM": {
                    "type": "VALUE_SET_ITEM",
                    "parent": "AM_OBJECT"
                },
                "ASSERTION_VARIABLE": {
                    "type": "ASSERTION_VARIABLE",
                    "parent": "AM_OBJECT"
                },
                "T_ATTRIBUTE": {
                    "type": "T_ATTRIBUTE",
                    "parent": "AM_OBJECT"
                },
                "ARCHETYPE": {
                    "type": "ARCHETYPE",
                    "parent": "AUTHORED_RESOURCE"
                },
                "C_ATTRIBUTE": {
                    "type": "C_ATTRIBUTE",
                    "parent": "ARCHETYPE_CONSTRAINT"
                },
                "EXPR_LEAF": {
                    "type": "EXPR_LEAF",
                    "parent": "EXPR_ITEM"
                },
                "C_TIME": {
                    "type": "C_TIME",
                    "parent": "C_PRIMITIVE_OBJECT"
                },
                "EXPR_BINARY_OPERATOR": {
                    "type": "EXPR_BINARY_OPERATOR",
                    "parent": "EXPR_OPERATOR"
                }
            }
        };


        self.getType = function (amType) {
            return graph.types[amType];
        }
    };
    var amGraph = new AmGraph();


    function extend(childClass, parentClass) {
        childClass.prototype = Object.create(parentClass.prototype);
        childClass.prototype.constructor = childClass;
    }

    var AmObjectMixin = function () {
        var self = this;

        self.isAttribute = function () {
            return false;
        };

        self.isConstraint = function () {
            return false;
        };


        self.isSlot = function () {
            return false;
        };

        self.isPrimitive = function () {
            return false;
        };

        self.isArchetypeRoot = function () {
            return false;
        }
    };

    var CObjectMixin = function () {
        var self = this;
        AmObjectMixin.call(self);

        self.isConstraint = function () {
            return true;
        };

        self.isPrimitive = function () {
            return false;
        }
    };
    extend(CObjectMixin, AmObjectMixin);

    var CAttributeMixin = function () {
        var self = this;
        AmObjectMixin.call(self);

        self.isAttribute = function () {
            return true;
        };
        self.isPrimitive = function () {
            return false;
        }
    };
    extend(CAttributeMixin, AmObjectMixin);


    var CDefinedObjectMixin = function () {
        var self = this;
        CObjectMixin.call(self);

    };

    var CComplexObjectMixin = function () {
        var self = this;
        CDefinedObjectMixin.call(self);

    };
    extend(CComplexObjectMixin, CDefinedObjectMixin);

    var CArchetypeRootMixin = function () {
        var self = this;
        CComplexObjectMixin.call(self);

        self.isArchetypeRoot = function () {
            return true;
        }
    };
    extend(CArchetypeRootMixin, CComplexObjectMixin);

    var CPrimitiveObjectMixin = function () {
        var self = this;
        CDefinedObjectMixin.call(self);

        self.isPrimitive = function () {
            return true;
        }
    };
    extend(CPrimitiveObjectMixin, CDefinedObjectMixin);

    var COrderedMixin = function () {
        var self = this;
        CPrimitiveObjectMixin.call(self);

    };
    extend(COrderedMixin, CPrimitiveObjectMixin);

    var CStringMixin = function () {
        var self = this;
        COrderedMixin.call(self);


    };
    extend(CStringMixin, COrderedMixin);

    var CTerminologyCodeMixin = function () {
        var self = this;
        CPrimitiveObjectMixin.call(self);


    };
    extend(CTerminologyCodeMixin, CPrimitiveObjectMixin);

    var ArchetypeSlotMixin = function () {
        var self = this;
        CObjectMixin.call(self);

        self.isSlot = function () {
            return true;
        };

        self.equals = function (first, second) {
            function assertionsEquals(f, s) {
                return JSON.stringify(f) === JSON.stringify(s)
            }
            
            if (!AOM.mixin(first).isSlot() || !AOM.mixin(second).isSlot()) {
                return false;
            }
            if (first.node_id !== second.node_id) return false;
            if (first.is_closed !== second.is_closed) return false;
            if (!assertionsEquals(first.includes, second.includes)) return false;
            if (!assertionsEquals(first.excludes, second.excludes)) return false;
                
            return true;
        };

        function buildAssertionPredicate(assertionList, defaultValue) {
            if (!assertionList || assertionList.length == 0) {
                return function (archetypeId) {
                    return defaultValue;
                }
            }
            var regularExpressions = [];
            for (var i in assertionList) {
                var ass = assertionList[i];
                var start = ass.string_expression.indexOf("{");
                var end = ass.string_expression.lastIndexOf("}");
                if (start >= 0 && end >= 0) {
                    var expr = ass.string_expression.substring(start + 1, end);
                    start = expr.indexOf("/");
                    end = expr.lastIndexOf("/");
                    if (start >= 0 && end >= 0) {
                        expr = expr.substring(start + 1, end);
                        regularExpressions.push(new RegExp(expr))
                    }
                }
            }

            return function (archetypeId) {
                for (var re in regularExpressions) {
                    if (regularExpressions[re].test(archetypeId)) {
                        return true;
                    }
                }
                return false;
            }
        }

        /**
         * Builds a function than matches archetype ids for compatibility with include/exclude patterns
         *
         * @param {object} cons constraint of the archetyoe slot
         * @return {function(archetypeId): boolean} a function that tests a given archetype id
         */
        self.buildArchetypeMatcher = function (cons) {
            var includesPredicate = buildAssertionPredicate(cons.includes, false);
            var excludesPredicate = buildAssertionPredicate(cons.excludes, true);

            return function (archetypeId) {
                if (includesPredicate(archetypeId)) return true;
                if (excludesPredicate(archetypeId)) return false;
                return true;
            }
        }

    };
    extend(ArchetypeSlotMixin, CObjectMixin);


    var mixinClasses = {
        "AM_OBJECT": new AmObjectMixin(),
        "C_OBJECT": new CObjectMixin(),
        "C_DEFINED_OBJECT": new CDefinedObjectMixin(),
        "C_PRIMITIVE_OBJECT": new CPrimitiveObjectMixin(),
        "C_ORDERED": new COrderedMixin(),
        "C_STRING": new CStringMixin(),
        "C_TERMINOLOGY_CODE": new CTerminologyCodeMixin(),
        "C_ATTRIBUTE": new CAttributeMixin(),
        "ARCHETYPE_SLOT": new ArchetypeSlotMixin(),
        "C_COMPLEX_OBJECT": new CComplexObjectMixin(),
        "C_ARCHETYPE_ROOT": new CArchetypeRootMixin()
    };


    /**
     * Gets a mixin object for a particular constraint. If there is no mixin for this particular am type, returns the
     * mixin for the best matching parent.
     *
     * @param {object|string} type A constraint object or an AM type name (such as "C_STRING")
     * @return {AmObjectMixin} Returns the best matching mixin for this am object
     */
    my.mixin = function (type) {
        var amTypeName = type;
        if (typeof amTypeName === "object") {
            amTypeName = type["@type"];
        }
        while (amTypeName) {
            var mixin = mixinClasses[amTypeName];
            if (mixin) return mixin;
            var type = amGraph.getType(amTypeName);
            amTypeName = type.parent;
        }
        return undefined;
    }

    return my;
}(AOM));