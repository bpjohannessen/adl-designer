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

var GuiUtils = (function () {
    var my = {};

    var compiledHandlebarTemplates = {};

    var nextGeneratedId = 0;

    my.generateId = function () {
        return "gid_" + (nextGeneratedId++).toString(36);
    };


    my.applyTemplate = function (path, context, callback) {
        function applyTemplateAndCallback(template) {
            var html = template(context);
            if (typeof callback === "function") {
                callback(html, context);
            } else if (callback instanceof jQuery) {
                callback.append(html);
            }
        }

        if (compiledHandlebarTemplates[path]) {
            var template = compiledHandlebarTemplates[path];
            var def = $.Deferred();
            applyTemplateAndCallback(template);
            def.resolve();
            return def.promise();
        } else {
            var pathobj;
            var pipePos = path.indexOf("|");
            if (pipePos >= 0) {
                pathobj = {
                    path: path.substring(0, pipePos),
                    id: path.substring(pipePos + 1)
                }
            } else {
                pathobj = {
                    path: path
                }
            }
            var promise = my.loadTemplates(pathobj.path, pipePos >= 0);
            promise.done(function () {
                var template = compiledHandlebarTemplates[path];
                if (!template) {
                    console.error("No handlebars template for path " + path);
                    return;
                }
                applyTemplateAndCallback(template)
            });
            return promise;
        }
    };

    my.preloadTemplates = function (paths, callback) {
//        var latch = new CountdownLatch(paths.length);
        var array = [];
        for (var i in paths) {
            array[i]=my.loadTemplates(paths[i], true);
        }

        return $.when.apply($, array).done(function() {
            if (callback) {
                callback();
            }
        });


    };
    my.loadTemplates = function (path, multi) {
        function splitTemplateStringById(string) {
            var hbs_id_re = /^{>.+}\s*$/;

            var linesRe = /\r\n|\n\r|\n|\r/g;
            var lines = string.replace(linesRe, "\n").split("\n");
            var result = {};

            var hbsId;
            for (var i in lines) {
                var line = lines[i];
                if (hbs_id_re.test(line)) {
                    line = line.trim();
                    var idEnd = line.indexOf("}", 2);
                    hbsId = line.substring(2, idEnd).trim();
                    result[hbsId] = [];
                } else if (hbsId) {
                    result[hbsId].push(line);
                }
            }
            for (var id in result) {
                result[id] = result[id].join("\n");
            }
            return result;
        }

        return $.ajax({
            url: "templates/" + path + ".hbs",
            success: function (data) {
                if (multi) {
                    var templatesById = splitTemplateStringById(data);
                    for (var id in templatesById) {
                        var template = Handlebars.compile(templatesById[id]);
                        compiledHandlebarTemplates[path + "|" + id] = template;
                    }
                } else {
                    var template = Handlebars.compile(data);
                    compiledHandlebarTemplates[path] = template;
                }
            }
        });
    };

    my.processAjaxError = function (jxhr) {
        var status = {};

        status.status = jxhr.status;
        if (status.status === 0) {
            status.message = "Server unreachable";
        } else {
            if (jxhr.responseText.length > 0) {
                var responseJson = JSON.parse(jxhr.responseText);
                status.message = responseJson.message || jxhr.statusText;
            }
        }
        if (status && status.message) {
            toastr.error(status.message);
        }

    };

    /**
     *
     * @param {object} options
     * @param {string} options.type success|info|warning|error
     * @param {string?} options.text Text to display
     * @param {string?} options.title Title to display
     */
    my.alert = function (options) {
        options.panel_id = my.generateId();


        GuiUtils.applyTemplate("dialog-common|alert", options, function (html) {
            html = $(html);
            html.modal();
        });
    };

    my.openSimpleDialog = function (options) {
        var defaultOptions = {buttons: {"ok": "Ok"}, title: "Dialog"};
        options = $.extend({}, defaultOptions, options);


        var frameContext = {
            title: options.title
        };
        frameContext.buttons = [];
        for (var key in options.buttons) {
            var buttonContext = {
                name: key,
                label: options.buttons[key],
                class: "btn"
            };
            frameContext.buttons.push(buttonContext);
        }

        if (frameContext.buttons.length > 0) {
            frameContext.buttons[frameContext.buttons.length - 1].class = "btn btn-primary";
        }

        var content = options.content;
        if (typeof content === "string") {
            content = $(content);
        }

        GuiUtils.applyTemplate("dialog-common|frame", frameContext, function (html) {
            var dialogElement = $(html);
            var modalBody = dialogElement.find(".modal-body");
            modalBody.append(content);

            var modalFooter = dialogElement.find(".modal-footer");
            modalFooter.find("button[name]").click(function () {
                var buttonName = $(this).attr('name');

                if (options.callback) {
                    var result = options.callback(content, buttonName, options);
                    if (typeof result === "string") {
                        var alertDiv = modalFooter.find(".alert");
                        alertDiv.text(result).removeClass("hidden");
                        return;
                    }
                }
                dialogElement.modal('hide');
            });

            dialogElement.on('hidden.bs.modal', function (e) {
                dialogElement.remove();
            });
            dialogElement.modal({backdrop: 'static'});
        });
    };

    my.openSingleTextInputDialog = function (options) {

        var context = {
            id: my.generateId(),
            label: options.inputLabel || options.title,
            value: options.inputValue
        };
        my.applyTemplate("dialog-common|singleTextInput", context, function (content) {
            options.content = content;
            my.openSimpleDialog(options);
        });
    };

    /**
     * A dialog with a single select button
     * @param {object} options
     * @param {string} options.title Title of the text box
     * @param {object[]} options.selectOptions An array of objects with (key,label) properties, or one key:value object
     * @param {string?} options.selectedKey key of the preselected choice
     * @param {function} options.callback callback function with the selected key as the parameter
     */
    my.openSingleSelectInputDialog = function (options) {

        var context = {
            id: my.generateId(),
            label: options.title
        };
        var dialogOptions = AmUtils.clone(options);
        my.applyTemplate("dialog-common|singleSelectInput", context, function (content) {

            dialogOptions.content = $(content);
            var select = dialogOptions.content.find('#' + context.id + "_select");
            my.populateSelect(select, options.selectOptions, options.selectedKey);

            dialogOptions.callback = function () {
                options.callback(select.val());
            };
            my.openSimpleDialog(dialogOptions);
        });
    };

    /**
     * Populates a select element with options
     * @param {object} select jQuery select element
     * @param {object[]|object} selectOptions An array of (key,label) objects, or one (key: label) object. Used to
     *                      populate select options
     * @param {string?} selectedKey key of the selected option
     */
    my.populateSelect = function (select, selectOptions, selectedKey) {
        select.empty();
        var first = true;
        if (Array.isArray(selectOptions)) {
            for (var i in selectOptions) {
                var opt = selectOptions[i];
                select.append($("<option>").attr("value", opt.key).text(opt.label));
                if (first) select.val(opt.key);
                first = false;
            }
            select.val()
        } else if (typeof selectOptions === "object") {
            for (var key in selectOptions) {
                select.append($("<option>").attr("value", key).text(selectOptions[key]));
                if (first) select.val(key);
                first = false;
            }

        }
        if (selectedKey) {
            select.val(selectedKey);
        }
    };


    /**
     * adds or removes .hidden class
     * @param {jQuery} element
     * @param {boolean} visible
     */
    my.setVisible = function (element, visible) {
        if (visible) {
            element.removeClass('hidden')
        } else {
            element.addClass('hidden')
        }
    };

    my.TableMap = function (map, targetElement) {
        var self = this;
        var nextRowId = 1;
        var panel_id = GuiUtils.generateId();

        var tableElement, tableBodyElement;

        function createTableElement() {
            var context = {
                panel_id: panel_id
            };
            GuiUtils.applyTemplate("util|tableMap", context, function (html) {
                html = $(html);
                tableElement = html;
                tableBodyElement = tableElement.find('tbody');

                tableElement.find('#' + context.panel_id + '_add').click(function () {
                    self.addRow("", "");
                    self.onBlur(blurHandler);
                });

                for (var key in map || {}) {
                    self.addRow(key, map[key]);
                }
                targetElement.append(tableElement);
            });
        }

        self.addRow = function (key, value) {
            var context = {
                panel_id: panel_id,
                row_id: nextRowId++,
                key: key,
                value: value
            };
            GuiUtils.applyTemplate("util|tableMap/row", context, function (html) {
                html = $(html);
                var removeBtn = html.find('#' + context.panel_id + '_' + context.row_id + '_remove');
                removeBtn.click(function (e) {
                    removeBtn.closest('tr').remove();
                    if (blurHandler) blurHandler(e, self);
                });
                tableBodyElement.append(html);
            });
            return context.row_id;
        };

        self.getAsMap = function () {
            var result = {};

            tableBodyElement.find('tr').each(function () {
                var tr = $(this);
                var key = tr.find('input[name="key"]').val();
                var value = tr.find('input[name="value"]').val();
                if (key.length > 0) {
                    result[key] = value;
                }
            });
            return result;
        };

        var blurHandler;
        self.onBlur = function (handler) {
            blurHandler = handler;
            if (handler) {
                tableElement.find('input').blur(function (e) {
                    handler(e, self);
                });
            } else {
                tableElement.find('input').off('blur');
            }
        };

        createTableElement();
    };

    my.StringList = function (list, targetElement, options) {
        var self = this;
        var defaultOptions = {size: 10, item: "item"};
        options = $.extend({}, defaultOptions, options || {});

        var selectElement;

        function createElement() {
            var context = {
                panel_id: GuiUtils.generateId(),
                size: options.size
            };

            GuiUtils.applyTemplate("util|stringList", context, function (html) {

                function addSelectString(string) {
                    var option = $("<option>").attr("value", string).text(string);
                    selectElement.append(option);

                }

                function populateSelectElement() {
                    selectElement.empty();
                    for (var i in list) {
                        addSelectString(list[i]);
                        if (i === 0) {
                            selectElement.find('option').prop('selected', true);
                        }
                    }
                }

                html = $(html);

                selectElement = html.find('#' + context.panel_id);
                populateSelectElement();

                html.find('#' + context.panel_id + '_add').click(function () {
                    GuiUtils.openSingleTextInputDialog({
                        title: "Add " + options.item,
                        inputLabel: options.item,
                        callback: function (content) {
                            var newItem = content.find("input").val().trim();
                            if (newItem.length > 0) {
                                addSelectString(newItem)
                                if (changeHandler) {
                                    changeHandler(self.getAsList())
                                }
                            }
                        }
                    })
                });
                html.find('#' + context.panel_id + '_remove').click(function () {
                    var option = selectElement.find(":selected");
                    if (option.length > 0) {
                        option.remove();
                        if (changeHandler) {
                            changeHandler(self.getAsList())
                        }
                    }
                });
                html.find('#' + context.panel_id + '_edit').click(function () {
                    var option = selectElement.find(":selected");
                    if (option.length > 0) {
                        GuiUtils.openSingleTextInputDialog({
                            title: "Edit " + options.item,
                            inputLabel: options.item,
                            inputValue: option.val(),
                            callback: function (content) {
                                var newItem = content.find("input").val().trim();
                                if (newItem.length > 0) {
                                    option.val(newItem);
                                    if (changeHandler) {
                                        changeHandler(self.getAsList())
                                    }
                                }
                            }
                        })
                    }
                });


                targetElement.append(html);
            })
        }

        var changeHandler = undefined;

        self.onChange = function (handler) {
            changeHandler = handler;
        };

        self.getAsList = function () {
            var result = [];
            selectElement.find('option').each(function () {
                result.push($(this).val());
            });
            return result;
        };

        self.onChange = function (handler) {
            changeHandler = handler;
        };


        createElement();
        return self;
    };

    /**
     * @param {object} options checkbox list options
     * @param {string} options.title Title of the checkbox
     * @param {object[]} options.items checkbox items, format; {code: string, label: string, checked: boolean}
     * @param {object} options.targetElement container for the dropdown element
     * @constructor
     */
    my.DropDownCheckboxList = function (options) {
        var self = this;

        self.panel_id = my.generateId();

        var changeHandler;
        var context = {
            panel_id: self.panel_id,
            title: options.title,
            items: AmUtils.clone(options.items)
        };

        GuiUtils.applyTemplate("util|dropdownCheckboxList", context, function (html) {

            html = $(html);

            html.find('#' + context.panel_id + '_menu').on('click', function (e) {
                if ($(this).hasClass('dropdown-menu-form')) {
                    e.stopPropagation();
                }
            });

            html.find('input').on('change', function () {
                if (changeHandler) {
                    changeHandler(self);
                }
            });

            options.targetElement.append(html);
        });

        self.getItemSelectionList = function () {
            var result = [];
            for (var index in options.items) {
                var checked = options.targetElement.find('#' + self.panel_id + '_check_' + index).prop('checked');
                result.push(checked);
            }
            return result;
        };

        self.onChange = function (handler) {
            changeHandler = handler;
        };

    };


    return my;
}() );

