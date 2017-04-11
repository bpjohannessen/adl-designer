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

var ArchetypeEditorTerminology = (function () {
        var my = {};


        var createTerminologyTerms = function (archetypeModel, targetElement, prefix) {
            var context = {
                table_id: GuiUtils.generateId()
            };
            GuiUtils.applyTemplate("terminology/terms|terms", context, function (html) {
                html = $(html);

                archetypeModel.data.terminology.term_definitions = archetypeModel.data.terminology.term_definitions || {};
                var language = archetypeModel.defaultLanguage;

                var defaultTermDefinitions = archetypeModel.getAllTerminologyDefinitionsWithPrefix(prefix);
                var data = [];
                for (var code in defaultTermDefinitions) {
                    var term = defaultTermDefinitions[code];
                    data.push({
                        code: code,
                        text: term.text,
                        description: term.description
                    });
                }

                var tableElement = html.find('#' + context.table_id);
                tableElement.bootstrapTable({
                    data: data
//                    onPostBody: function() {
//    	              	tableElement.bootstrapTable('resetView', {
//    	                  height: getBoostrapTableHeight(targetElement)
//    	              	})
//                    }
                });
                
//                tableElement.on('load-success.bs.table', function() {
//	                $(window).resize(function () {
//	                	tableElement.bootstrapTable('resetView', {
//	                      height: getBoostrapTableHeight()
//	                  });
//	              	});   
//	              	tableElement.bootstrapTable('resetView', {
//	                  height: getBoostrapTableHeight()
//	              	});
//								});
                
                tableElement.on('click-row.bs.table', function (e, row, $element) {
                    row.text = row.text + 'ABC';
                    my.openUpdateTermDefinitionDialog(archetypeModel, row.code, function () {
                        var term = archetypeModel.getTermDefinition(row.code, language);
                        row.text = term.text;
                        row.description = term.description;

                        tableElement.bootstrapTable('updateRow', {index: $element.data('index'), row: row});
                    });
                });


                targetElement.empty();
                targetElement.append(html);
                
                $(window).resize(function () {
                	tableElement.bootstrapTable('resetView', {
                      height: getBoostrapTableHeight(targetElement)
                  });
              	});                
            });
        };
        
        var getBoostrapTableHeight = function (targetElement) {
        	var height = targetElement.find(".bootstrap-table").height();
          return height > 0 ? height : null;
      	}
        
        var createValueSetsTable = function (archetypeModel, targetElement) {
            var context = {
                panel_id: GuiUtils.generateId()
            };
            GuiUtils.applyTemplate("terminology/terms|valueSets", context, function (html) {

                function loadData() {
                    var language = archetypeModel.defaultLanguage;
                    var value_sets = archetypeModel.data.terminology.value_sets;
                    var data = [];
                    for (var nodeId in value_sets) {
                        var term = archetypeModel.getTermDefinition(nodeId, language);
                        data.push({
                            code: nodeId,
                            text: term.text,
                            description: term.description
                        });
                    }
                    return data;
                }

                html = $(html);
                var data = loadData();

                var tableElement = html.find('#' + context.panel_id + "_table");
                tableElement.bootstrapTable({
                    data: data,
                    onPostBody: function() {
    	              	tableElement.bootstrapTable('resetView', {
    	                  height: getBoostrapTableHeight(targetElement)
    	              	});
                    }
                });
                
                tableElement.on('click-row.bs.table', function (e, row, $element) {
                    my.openUpdateValueSetDialog(archetypeModel, row.code,
                        {},
                        function (newCode) {
                            var term = archetypeModel.getTermDefinition(row.code);

                            var thisRow = Stream(data).filter({code: newCode}).findFirst().orElse(null);
                            if (thisRow) {
                                thisRow.text = term.text;
                                thisRow.description = term.description;
                                tableElement.bootstrapTable('load', data);
                            } else {
                                var newTerm = archetypeModel.getTermDefinition(newCode);
                                row = {
                                    code: newCode,
                                    text: newTerm.text,
                                    description: newTerm.description
                                };
                                data.push(row);
                            }
                            tableElement.bootstrapTable('load', data);
                        });
                });

                html.find('#' + context.panel_id + '_new').click(function () {
                    my.openUpdateValueSetDialog(archetypeModel, undefined, {}, function () {
                        data = loadData();
                        tableElement.bootstrapTable('load', data);
                    });
                });


                targetElement.empty();
                targetElement.append(html);
                
                $(window).resize(function () {
                	tableElement.bootstrapTable('resetView', {
                      height: getBoostrapTableHeight(targetElement)
                  });
              	});
                
            });
        };
        var createExternalTerminologyTable = function (archetypeModel, targetElement) {
            var context = {
                panel_id: GuiUtils.generateId()
            };
            GuiUtils.applyTemplate("terminology/terms|externalTerminologies", context, function (html) {

                function loadData() {
                    var nodeIds = archetypeModel.getExternalTerminologyCodes();
                    var data = [];
                    for (var i in nodeIds) {
                        var nodeId = nodeIds[i];
                        if (!archetypeModel.data.terminology.value_sets[nodeId]) {
                            var term = archetypeModel.getTermDefinition(nodeId);
                            data.push({
                                code: nodeId,
                                text: term.text,
                                description: term.description
                            });
                        }
                    }
                    return data;
                }

                html = $(html);
                var data = loadData();

                var tableElement = html.find('#' + context.panel_id + "_table");
                tableElement.bootstrapTable({
                    data: data,
                    onPostBody: function() {
    	              	tableElement.bootstrapTable('resetView', {
    	                  height: getBoostrapTableHeight(targetElement)
    	              	});
                    }
                });

                tableElement.on('click-row.bs.table', function (e, row, $element) {
                    my.openUpdateExternalTerminologyDialog(archetypeModel, row.code, {}, function () {
                        data = loadData();
                        tableElement.bootstrapTable('load', data);
                    });
                });

                html.find('#' + context.panel_id + '_new').click(function () {
                    my.openUpdateExternalTerminologyDialog(archetypeModel, undefined, {}, function () {
                        data = loadData();
                        tableElement.bootstrapTable('load', data);
                    });
                });

                targetElement.empty();
                targetElement.append(html);
                
                $(window).resize(function () {
                	tableElement.bootstrapTable('resetView', {
                      height: getBoostrapTableHeight(targetElement)
                  });
              	});                
            });
        };

        my.openUpdateTermDefinitionDialog = function (archetypeModel, term_id, updateCallback) {
            var contentContext = {
                id: GuiUtils.generateId(),
                term_id: term_id,
                terms: archetypeModel.exportTermDefinitions(term_id)
            };

            GuiUtils.applyTemplate("terminology/terms|updateTermDefinitionDialog", contentContext, function (content) {
                content = $(content);


                GuiUtils.openSimpleDialog({
                    title: "Update term definition",
                    buttons: {"update": "Update"},
                    content: content,
                    callback: function () {

                        content.find('input').each(function () {
                            var input = $(this);
                            contentContext.terms[input.data('lang')][input.data('field')] = input.val().trim();
                        });
                        archetypeModel.importTermDefinitions(term_id, contentContext.terms);
                        if (updateCallback) {
                            updateCallback();
                        }
                    }
                });
            });
        };


        /**
         * Opens an Update/Create/Specialize valueSet dialog.
         *
         * @param {AOM.ArchetypeModel} archetypeModel
         * @param {string|undefined} valueSetId Id of the valueSet to be updated. If undefined, allows creation of new value set
         * @param options Dialog options.
         * @param {function(string, boolean)} updateCallback Called when the action is confirmed.
         */
        my.openUpdateValueSetDialog = function (archetypeModel, valueSetId, options, updateCallback) {
            var defaultOptions = {canSpecialize: false, readOnly: false};
            options = $.extend({}, defaultOptions, options);

            var context = {
                panel_id: GuiUtils.generateId(),
                term: archetypeModel.getTermDefinition(valueSetId)
            };
            context.members = {};
            if (valueSetId) {
                Stream(archetypeModel.data.terminology.value_sets[valueSetId].members).forEach(function (member_id) {
                    context.members[member_id] = archetypeModel.getTermDefinition(member_id);
                });
            }


            GuiUtils.applyTemplate("terminology/terms|updateValueSetDialog", context, function (content) {


                function setReadOnly(readOnly) {
                    addNewMember.prop('disabled', readOnly);
                    removeMember.prop('disabled', readOnly);
                    addExistingMember.prop('disabled', readOnly);
                    textElement.prop('disabled', readOnly);
                    descriptionElement.prop('disabled', readOnly);
                    select.prop('disabled', readOnly);
                }

                function addDefinedTerm(nodeId) {
                    var term = archetypeModel.getTermDefinition(nodeId);
                    var select = content.find("#" + context.panel_id + "_members");
                    var option = $("<option>").attr("value", nodeId).attr('title', nodeId + ": " + term.description).text(term.text);
                    select.append(option);
                    context.members[nodeId] = term;
                }

                function getAvailableInternalTerms(context) {

                    var availableTerminologyCodes = archetypeModel.getAllTerminologyDefinitionsWithPrefix("at");
                    var result = {};
                    for (var code in availableTerminologyCodes) {
                        if (!context.members[code]) {
                            result[code] = availableTerminologyCodes[code];
                        }
                    }
                    return result;
                }


                content = $(content);


                var select = content.find("#" + context.panel_id + "_members");

                var addNewMember = content.find('#' + context.panel_id + "_add_new_member");
                addNewMember.click(function () {
                    ArchetypeEditor.openAddNewTermDefinitionDialog(archetypeModel, function (nodeId) {
                        addDefinedTerm(nodeId);
                    })
                })/*.prop('disabled', parentConstrained)*/;

                var removeMember = content.find('#' + context.panel_id + "_remove_member");
                removeMember.click(function () {
                    var option = select.find(":selected");
                    if (option.length > 0) {
                        var nodeId = option.val();
                        delete context.members[nodeId];
                        option.remove();
                    }
                });

                var addExistingMember = content.find('#' + context.panel_id + "_add_existing_member");
                addExistingMember.click(function () {
                    var dialogContext = {
                        terms: getAvailableInternalTerms(context)
                    };
                    if ($.isEmptyObject(dialogContext.terms)) return;

                    ArchetypeEditor.openAddExistingTermsDialog(archetypeModel, dialogContext, function (selectedTerms) {
                        for (var i in selectedTerms) {
                            var nodeId = selectedTerms[i];
                            addDefinedTerm(nodeId);
                        }
                    });
                });

                var textElement = content.find('#' + context.panel_id + '_text');
                var descriptionElement = content.find('#' + context.panel_id + '_description');

                var opts = {buttons: {}};
                if (options.readOnly) {
                    setReadOnly(true);
                    opts.title = "View Value Set";
                } else if (!valueSetId) {
                    setReadOnly(false);
                    opts.title = "Create Value Set";
                    opts.buttons['create'] = "Create";
                } else {
                    var specialized = archetypeModel.isSpecialized(valueSetId);
                    setReadOnly(!specialized);
                    if (specialized) {
                        opts.title = "Update Value Set";
                        opts.buttons['update'] = "Update";
                    } else if (options.canSpecialize) {
                        opts.title = "View/Specialize Value Set";
                        opts.buttons['specialize'] = "Specialize";
                    }

                }
                GuiUtils.openSimpleDialog({
                    title: opts.title,
                    buttons: opts.buttons,
                    content: content,
                    callback: function (content, button) {


                        if (button === 'create' || button === 'update') {

                            var text = textElement.val().trim();
                            var description = descriptionElement.val().trim();

                            if (text.length === 0) {
                                return "text is required";
                            }
                            if (AmUtils.keys(context.members).length === 0) {
                                return "At least one code is required"
                            }

                            if (button === 'create') {
                                valueSetId = archetypeModel.generateSpecializedTermId("ac");
                            }

                            archetypeModel.setTermDefinition(valueSetId, undefined, text, description);
                            archetypeModel.data.terminology.value_sets[valueSetId] = {
                                id: valueSetId,
                                members: AmUtils.keys(context.members)
                            };

                            if (updateCallback) updateCallback(valueSetId, false);
                        } else if (button === "specialize") {
                            var newValueSetId = archetypeModel.specializeValueSet(valueSetId);
                            my.openUpdateValueSetDialog(archetypeModel, newValueSetId, options, updateCallback);
                            if (updateCallback) updateCallback(newValueSetId, true);
                        }
                    }
                });
            });
        };


        my.openUpdateExternalTerminologyDialog = function (archetypeModel, termId, options, updateCallback) {
            var create = termId === undefined;

            var defaultOptions = {readOnly: false};
            options = $.extend({}, defaultOptions, options);

            var context = {
                panel_id: GuiUtils.generateId(),
                term: archetypeModel.getTermDefinition(termId),
                bindings: {}
            };
            var tbs = archetypeModel.data.terminology.term_bindings;
            for (var terminology in tbs) {
                if (tbs[terminology][termId]) {
                    context.bindings[terminology] = tbs[terminology][termId];
                }
            }

            GuiUtils.applyTemplate("terminology/terms|updateExternalTerminologyDialog", context, function (content) {
                function addTerminologyBinding(terminology) {
                    var create = terminology === undefined;
                    var addTerminologyContext = {
                        id: GuiUtils.generateId(),
                        create: create,
                        terminology: terminology,
                        terminologies: [],
                        url: ''
                    };
                    if (create) {
                        var ontology = archetypeModel.data.terminology;
                        if (ontology.term_bindings) {
                            for (var term in ontology.term_bindings) {
                                if (!context.bindings[term]) {
                                    addTerminologyContext.terminologies.push(term);
                                }
                            }
                        }
                    } else {
                        addTerminologyContext.url = context.bindings[terminology];
                    }
                    GuiUtils.applyTemplate("terminology/terms|updateExternalTerminologyDialog/addBinding", addTerminologyContext, function (html) {


                        var dialogBody = $(html);
                        var terminologyInput = dialogBody.find('#' + addTerminologyContext.id + '_terminology');

                        terminologyInput.prop('disabled', terminology !== undefined);

                        dialogBody.find('a').click(function () {
                            var a = $(this);
                            var key = a.attr('data-key');
                            terminologyInput.val(key);
                        });

                        var opts = {buttons: {}};
                        if (create) {
                            opts.title = "Add external terminology binding";
                            opts.buttons['add'] = 'Add';
                        } else {
                            opts.title = "Update external terminology binding";
                            opts.buttons['update'] = 'Update';

                        }
                        GuiUtils.openSimpleDialog({
                            title: opts.title,
                            buttons: opts.buttons,
                            content: dialogBody,
                            callback: function (content, button) {
                                var terminology = terminologyInput.val().trim();
                                var url = dialogBody.find('#' + addTerminologyContext.id + "_url").val().trim();
                                if (!terminology || terminology.length === 0) {
                                    return "Terminology must not be empty";
                                }
                                if (url.length === 0) {
                                    return "Url must not be empty";
                                }

                                if (button === 'create') {
                                    if (context.bindings[terminology]) {
                                        return "Binding is already defined";
                                    }
                                }
                                context.bindings[terminology] = url;
                                populateTerminologiesTable(terminologiesTable);
                            }
                        });

                    });


                }

                function populateTerminologiesTable(terminologiesTable) {

                    function updateExternalTerminologyTableRows(tableBody) {
                        tableBody.empty();
                        for (var terminology in context.bindings) {
                            var rowCtx = {
                                terminology: terminology,
                                url: context.bindings[terminology]
                            };
                            GuiUtils.applyTemplate("terminology/terms|updateExternalTerminologyDialog/bindingRow", rowCtx,
                                function (html, rowCtx) {
                                    html = $(html);
                                    tableBody.append(html);

                                    var editButton = html.find('button[name="edit"]');
                                    editButton.click(function () {
                                        addTerminologyBinding(rowCtx.terminology);
                                    });

                                    var removeButton = html.find('button[name="remove"]');
                                    removeButton.click(function () {
                                        delete context.bindings[rowCtx.terminology];
                                        updateExternalTerminologyTableRows(tableBody);
                                    });
                                });
                        }
                    }

                    updateExternalTerminologyTableRows(terminologiesTable.find('tbody'));
                }

                function setReadOnly(readOnly) {
                    if (readOnly) {
                        content.find('.data').prop('disabled', true);
                    }
                }


                content = $(content);


                var terminologiesTable = content.find('#' + context.panel_id + '_terminologies');

                var addBindingButton = content.find('#' + context.panel_id + '_add_binding');
                addBindingButton.click(function () {
                    addTerminologyBinding(context.terminology)
                });

                var textElement = content.find('#' + context.panel_id + '_text');
                var descriptionElement = content.find('#' + context.panel_id + '_description');

                populateTerminologiesTable(terminologiesTable);


                var opts = {buttons: {}};
                if (options.readOnly) {
                    opts.title = 'View External Terminology';
                    setReadOnly(true);
                } else if (create) {
                    opts.title = 'Create External Terminology';
                    opts.buttons['create'] = 'Create';
                } else {
                    opts.title = 'Update External Terminology';
                    opts.buttons['update'] = 'Update';
                }

                GuiUtils.openSimpleDialog({
                    title: opts.title,
                    buttons: opts.buttons,
                    content: content,
                    callback: function (content, button) {
                        var text = textElement.val().trim();
                        var description = descriptionElement.val().trim();

                        if (text.length === 0) {
                            return "text is required";
                        }

                        if (button === 'create') {
                            termId = archetypeModel.generateSpecializedTermId("ac");
                        }

                        archetypeModel.setTermDefinition(termId, undefined, text, description);
                        archetypeModel.setExternalTerminologyBinding(termId, context.bindings);

                        if (updateCallback) updateCallback();
                    }
                });
            });

        };


        var createBindings = function (archetypeModel, targetElement) {


            targetElement.empty();
            var context = {
                panel_id: GuiUtils.generateId(),
                terminology: ''
            };

            GuiUtils.applyTemplate("terminology/terms|bindings", context, function (content) {

                function populateTerminologySelect() {
                    terminologySelect.empty();
                    Stream(terminologies).forEach(function (t) {
                        var option = $("<option>").attr("value", t).text(t);
                        option.prop('selected', context.terminology === t);
                        terminologySelect.append(option);
                    });
                    //if (!terminologySelect.val() && terminologies.length > 0) {
                    //    terminologySelect.val(terminologies[0]);
                    //}
                }

                function populateTermBindingTable(tableBody) {
                    tableBody.empty();
                    var terminology = terminologySelect.val();

                    var bindings = archetypeModel.data.terminology.term_bindings[terminology] || {};
                    for (var termId in bindings) {

                        if (termId.substring(0, 2) === 'at') {
                            var term = archetypeModel.getTermDefinition(termId);
                            if (term) {
                                var context = {
                                    termId: termId,
                                    term: term,
                                    binding: bindings[termId]
                                };
                                GuiUtils.applyTemplate('terminology/terms|bindings/termTableRow', context, function (rowHtml) {
                                    rowHtml = $(rowHtml);
                                    tableBody.append(rowHtml);

                                    rowHtml.find("button[data-action='edit']").click(function () {
                                        var termId = $(this).data('term');
                                        my.updateTermBindingDialog(archetypeModel, terminology, termId, function () {
                                            populateTermBindingTable(tableBody);
                                        });
                                    });
                                    rowHtml.find("button[data-action='remove']").click(function () {
                                        var termId = $(this).data('term');
                                        var term_bindings = archetypeModel.data.terminology.term_bindings[terminology];
                                        delete term_bindings[termId];
                                        rowHtml.remove();
                                    });
                                });
                            }
                        }
                    }
                }

                function populateNodeBindingTable(tableBody) {
                    tableBody.empty();
                    var terminology = terminologySelect.val();

                    var bindings = archetypeModel.data.terminology.term_bindings[terminology] || {};
                    for (var termId in bindings) {

                        if (termId.substring(0, 2) === 'id') {
                            var term = archetypeModel.getTermDefinition(termId);
                            if (term) {
                                var context = {
                                    termId: termId,
                                    term: term,
                                    binding: bindings[termId]
                                };
                                GuiUtils.applyTemplate('terminology/terms|bindings/nodeTableRow', context, function (rowHtml) {
                                    rowHtml = $(rowHtml);
                                    tableBody.append(rowHtml);

                                    rowHtml.find("button[data-action='edit']").click(function () {
                                        var termId = $(this).data('term');
                                        my.updateNodeBindingDialog(archetypeModel, terminology, termId, function () {
                                            populateNodeBindingTable(tableBody);
                                        });
                                    });
                                    rowHtml.find("button[data-action='remove']").click(function () {
                                        var termId = $(this).data('term');
                                        var term_bindings = archetypeModel.data.terminology.term_bindings[terminology];
                                        delete term_bindings[termId];
                                        rowHtml.remove();
                                    });
                                });
                            }
                        }
                    }
                }

                content = $(content);
                targetElement.append(content);

                var terminologies = archetypeModel.getAvailableTerminologies();
                var terminologySelect = content.find('#' + context.panel_id + "_terminology");
                populateTerminologySelect();


                var termTable = content.find('#' + context.panel_id + '_termTable');
                var termTableBody = termTable.find('tbody');

                content.find('#' + context.panel_id + '_newTermBinding').click(function () {
                    var terminology = terminologySelect.val();
                    if (!terminology || terminology.length === 0) return;
                    my.updateTermBindingDialog(archetypeModel, terminology, undefined, function () {
                        populateTermBindingTable(termTableBody);
                    });

                });

                var nodeTable = content.find('#' + context.panel_id + '_nodeTable');
                var nodeTableBody = nodeTable.find('tbody');

                content.find('#' + context.panel_id + '_newNodeBinding').click(function () {
                    var terminology = terminologySelect.val();
                    if (!terminology || terminology.length === 0) return;
                    my.updateNodeBindingDialog(archetypeModel, terminology, undefined, function () {
                        populateNodeBindingTable(nodeTableBody);
                    });

                });

                populateTermBindingTable(termTableBody);
                populateNodeBindingTable(nodeTableBody);

                terminologySelect.change(function () {
                    populateTermBindingTable(termTableBody);
                    populateNodeBindingTable(nodeTableBody);
                });

            });
        };

        my.updateTermBindingDialog = function (archetypeModel, terminology, termId, callback) {

            var term_bindings = archetypeModel.data.terminology.term_bindings;
            if (!term_bindings[terminology]) term_bindings[terminology] = {};
            var terminologyBindings = term_bindings[terminology];

            var context = {
                panel_id: GuiUtils.generateId(),
                terminology: terminology,
                create: termId === undefined
            };

            if (!context.create) {
                context.term = archetypeModel.getTermDefinition(termId);
            }


            GuiUtils.applyTemplate("terminology/terms|bindings/updateTermBindingDialog", context, function (content) {

                    function populateTermSelect() {
                        termSelect.empty();
                        var terms = archetypeModel.getAllTerminologyDefinitionsWithPrefix("at");
                        for (var termId in terms) {
                            if (!terminologyBindings[termId]) {
                                var term = archetypeModel.getTermDefinition(termId);
                                var option = $("<option>").attr('value', termId).text(term.text);
                                termSelect.append(option);
                            }
                        }
                    }

                    content = $(content);

                    var termSelect = content.find('#' + context.panel_id + '_term');
                    var termBinding = content.find('#' + context.panel_id + '_binding');


                    var opts = {buttons: {}};
                    if (context.create) {
                        opts.title = 'Create term binding';
                        opts.buttons['create'] = "Create";
                        populateTermSelect();
                    } else {
                        opts.title = 'Update term binding';
                        opts.buttons['update'] = "Update";
                        termBinding.val(terminologyBindings[termId]);
                    }


                    GuiUtils.openSimpleDialog({
                        title: opts.title,
                        buttons: opts.buttons,
                        content: content,
                        callback: function (content, button) {
                            var binding = termBinding.val().trim();
                            if (binding.length === 0) {
                                return "Binding must not be empty"
                            }


                            if (button === 'create') {
                                termId = termSelect.val();
                            }
                            terminologyBindings[termId] = binding;
                            if (callback) callback(termId);
                        }
                    });

                }
            );
        };

        my.updateNodeBindingDialog = function (archetypeModel, terminology, termId, callback) {

            var term_bindings = archetypeModel.data.terminology.term_bindings;
            if (!term_bindings[terminology]) term_bindings[terminology] = {};
            var terminologyBindings = term_bindings[terminology];

            var context = {
                panel_id: GuiUtils.generateId(),
                terminology: terminology,
                create: termId === undefined
            };

            if (!context.create) {
                context.term = archetypeModel.getTermDefinition(termId);
            }


            GuiUtils.applyTemplate("terminology/terms|bindings/updateNodeBindingDialog", context, function (content) {

                    function populateTermSelect() {
                        termSelect.empty();
                        var terms = archetypeModel.getAllTerminologyDefinitionsWithPrefix("id");
                        for (var termId in terms) {
                            if (!terminologyBindings[termId]) {
                                var term = archetypeModel.getTermDefinition(termId);
                                var option = $("<option>").attr('value', termId).text(term.text);
                                termSelect.append(option);
                            }
                        }
                    }

                    content = $(content);

                    var termSelect = content.find('#' + context.panel_id + '_term');
                    var termBinding = content.find('#' + context.panel_id + '_binding');


                    var opts = {buttons: {}};
                    if (context.create) {
                        opts.title = 'Create node binding';
                        opts.buttons['create'] = "Create";
                        populateTermSelect();
                    } else {
                        opts.title = 'Update node binding';
                        opts.buttons['update'] = "Update";
                        termBinding.val(terminologyBindings[termId]);
                    }


                    GuiUtils.openSimpleDialog({
                        title: opts.title,
                        buttons: opts.buttons,
                        content: content,
                        callback: function (content, button) {
                            var binding = termBinding.val().trim();
                            if (binding.length === 0) {
                                return "Binding must not be empty"
                            }


                            if (button === 'create') {
                                termId = termSelect.val();
                            }
                            terminologyBindings[termId] = binding;
                            if (callback) callback(termId);
                        }
                    });

                }
            );
        };

        my.showTerminology = function (archetypeModel, mainTargetElement) {
            mainTargetElement.empty();

            var context = {
                panel_id: GuiUtils.generateId()
            };

            GuiUtils.applyTemplate('terminology/main|mainTabs', context, function (html) {
                html = $(html);
                createTerminologyTerms(archetypeModel, html.find('#' + context.panel_id + '_nodes'), "id");
                createTerminologyTerms(archetypeModel, html.find('#' + context.panel_id + '_terms'), "at");
                createBindings(archetypeModel, html.find('#' + context.panel_id + '_bindings'));
                createValueSetsTable(archetypeModel, html.find('#' + context.panel_id + '_value_sets'));
                createExternalTerminologyTable(archetypeModel, html.find('#' + context.panel_id + '_external_terminologies'));
//                html.find('a[href="#' + context.panel_id + '_nodes"]').on('show.bs.tab', function (e) {
//                  var targetElement = html.find('#' + context.panel_id + '_nodes');
//                  targetElement.find("table").bootstrapTable('resetView', {
//                     height: getBoostrapTableHeight(targetElement)
//          				});
//              	});
                mainTargetElement.append(html);
                
                html.find('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                  var curTab = $($(e.target).attr("href")); // activated tab
                	curTab.find("table").bootstrapTable('resetView', {
                     height: getBoostrapTableHeight(curTab)
          				});
                });                   
                
            });
            setTimeout(function() {
            	var curTab = $('#' + context.panel_id + '_nodes');
            	curTab.find("table.table").bootstrapTable('resetView', {
                 height: getBoostrapTableHeight(curTab)
      				});
            }, 500);
            
            
            
        };

        return my;
    }() );