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

(function (mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function (CodeMirror) {
    "use strict";

    function set(str) {
        var obj = {}, words = str.split(" ");
        for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
        return obj;
    }

    function tokenizeString(stream, state) {
        var ch;
        while ((ch = stream.next()) != null) {
            if (ch == '\\') {
                ch = stream.next();
                ch = stream.next();
            }
            if (ch === state.stringQuote) {
                state.tokenize = null;
                state.stringQuote = null;
                break;
            }
        }
        if (state.lastOpenBrace==='[') {
            return "string-2";
        } else {
            return "string";
        }
    }


    var keywords = set("archetype template template_overlay rm_release adl_version generated concept language original_language translations author description original_author details purpose use misuse copyright lifecycle_state other_contributors other_details definition ontology term_definitions text matches terminology term_bindings value_sets occurrences unordered annotations include exclude allow_archetype cardinality use_node use_archetype accreditation keywords specialize specialise");
    var rmTypes = set("AUDIT_DETAILS TERMINOLOGY_ID DV_TIME RESOURCE_ANNOTATION_NODE_ITEMS REVISION_HISTORY_ITEM DV_PARSABLE DV_COUNT DV_DATE_TIME DV_DURATION CLUSTER PARTY_RELATED INSTRUCTION RESOURCE_DESCRIPTION RESOURCE_ANNOTATIONS GENERIC_ID EVALUATION DV_AMOUNT ITEM ARCHETYPED FEEDER_AUDIT_DETAILS ORIGINAL_VERSION PARTY_PROXY POINT_EVENT CODE_PHRASE INSTRUCTION_DETAILS FEEDER_AUDIT DV_TIME_SPECIFICATION EVENT_CONTEXT ITEM_SINGLE DV_PROPORTION DV_ORDERED DV_QUANTITY CONTENT_ITEM DATA_VALUE RESOURCE_ANNOTATION_NODES DV_ORDINAL OBJECT_ID UID_BASED_ID DV_MULTIMEDIA PARTY_SELF RM_OBJECT DV_PARAGRAPH REFERENCE_RANGE CARE_ENTRY ITEM_TREE ELEMENT DV_GENERAL_TIME_SPECIFICATION VERSION DV_DATE DV_STATE ITEM_LIST DURATION HISTORY DV_PERIODIC_TIME_SPECIFICATION RESOURCE_DESCRIPTION_ITEM TERM_MAPPING EVENT OBSERVATION LOCATABLE DV_TEMPORAL ISM_TRANSITION PARTICIPATION FOLDER ENTRY OBJECT_VERSION_ID DV_INTERVAL DV_ENCAPSULATED INTERVAL_EVENT ITEM_TABLE ATTESTATION REVISION_HISTORY DV_IDENTIFIER DV_CODED_TEXT DATE_TIME ISO8601_DATE LOCATABLE_REF DV_EHR_URI ARCHETYPE_ID LIST PARTY_REF TEMPLATE_ID ADMIN_ENTRY PARTY_IDENTIFIED COMPOSITION LINK TRANSLATION_DETAILS ACCESS_GROUP_REF OBJECT_REF GENERIC_ENTRY DV_QUANTIFIED IMPORTED_VERSION DV_URI DV_BOOLEAN DV_TEXT ACTION ITEM_STRUCTURE HIER_OBJECT_ID SECTION ACTIVITY");

    CodeMirror.defineMode("adl", function () {

        //var cons = ['true', 'false', 'on', 'off', 'yes', 'no'];
        //var keywordRegex = new RegExp("\\b((" + cons.join(")|(") + "))$", 'i');
//        var rmTypes = parserConfig.keywords || {};
        var atCodeRegex = new RegExp("(id|at|ac)([0-9]+)(\\.[0-9]+)*");

        return {
            token: function (stream, state) {
                var ch = stream.peek();

                if (state.tokenize === "string") {
                    return tokenizeString(stream, state);
                }


                if (ch === '"' || ch === "'") {
                    state.tokenize = "string";
                    state.stringQuote = ch;
                    stream.next();
                    return tokenizeString(stream, state);
                }

                /* comments */
                if (ch === "-" && stream.match("--")) {
                    // 1-line comments --
                    stream.skipToEnd();
                    return "comment";
                }

                if (ch==='[' && stream.match(/\[[^\]:]*::[^\]:]*]/)) {
                    return "atom"
                }

                if (stream.match(/[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z0-9/%\-_\.=?~:#\[\]@!$@'()*+,;]+/)) {
                    return "link";
                }


                if (stream.match(/[0-9]+(\.[0-9]+)?/)) {
                    return "number";
                }


                ///* references */
                if (stream.match(atCodeRegex)) {
                    return 'variable';
                }
                // archetype_id
                if (stream.match(/openEHR\-[\w_]+\-[A-Z_]+\.[^\.\s]+\.v[0-9]+(\.[0-9A-Za-z_]+)*/)) {
                    return 'variable';
                }
                var match;
                if (match = stream.match(/[a-zA-Z_][a-zA-Z_0-9]*/)) {
                    if (rmTypes[match[0]]) {
                        return "variable-2"
                    } else if (keywords[match[0]]) {
                        return "keyword"
                    } else {
                        return "meta";
                    }
                }
                if (ch === '<' || ch === '{' || ch === '[') {
                    state.lastOpenBrace = ch
                }  else if (ch === '>' || ch === '}' || ch === ']') {
                    state.lastOpenBrace = null;
                }

                /* nothing found, continue */
                stream.next();
                return null;
            },
            startState: function () {
                return {
                    tokenize: null,
                    stringQuote: null,
                    lastOpenBrace: null
                };
            }
        };
    });


    CodeMirror.defineMIME("text/adl", {
        name: "adl"

    });

});
