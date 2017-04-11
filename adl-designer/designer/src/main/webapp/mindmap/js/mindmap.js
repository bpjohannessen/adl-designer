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

var mindmapModel;
var nodeDataArray = [],
    brushArray = {readonly: "grey", rmnode: "skyblue", subtree: "darkseagreen", added: "forestgreen"};

var initializeMindMap = function(panelId, archetypeModel, referenceModel, language, info) {
		mindmapModel = null;
		nodeDataArray = [];
		var mindmapOptions = {};
		var targetId = panelId + '_mindmap';
		mindmapOptions.archetypeModel = archetypeModel;
	  mindmapOptions.referenceModel = referenceModel;
	  if(language)
	  	mindmapOptions.language = language;
	  $("#" + panelId + "_mindmap_container").show().append('<div id="' + panelId + '_mindmap" class="definition-mindmap"></div>');
	  var openEHR = ArchetypeEditor.getRmModule('openEHR');
	  mindmapModel = new openEHR.MindmapModel(mindmapOptions);
	  var model = mindmapModel.convertToMindmap();
    var goJS = go.GraphObject.make;
    var myDiagram =
        goJS(go.Diagram, (targetId || "diagram-target"),
            {
                "commandHandler.copiesTree": true,
                "commandHandler.deletesTree": true,
                "draggingTool.dragsTree": true,
                initialContentAlignment: go.Spot.Center,  // center the whole graph
                "undoManager.isEnabled": false,
                initialAutoScale: go.Diagram.Uniform,
                allowMove: false
            });

    myDiagram.toolManager.draggingTool.isEnabled = false;
    myDiagram.toolManager.panningTool.isEnabled = false;
    myDiagram.toolManager.dragSelectingTool.isEnabled = false;
    
    var defaultNodeAdornmentTemplate = goJS(go.Adornment, "Spot",
      goJS(go.Panel, "Auto",
          goJS(go.Shape, "RoundedRectangle", { fill: null, stroke: null, strokeWidth: 2 }),
          goJS(go.Placeholder, { margin: new go.Margin(-10,6,-10,0) })
      ),
      goJS(go.Panel, "Horizontal", {
          alignment: go.Spot.TopRight, 
          alignmentFocus: go.Spot.BottomRight
        },
				goJS("Button", {
			 				width: 20, 
			 				height: 20,
		          "ButtonBorder.fill": "lightblue",
		          "ButtonBorder.stroke": "dodgerblue",
		          "_buttonFillOver": "rgb(0,128,255)",
		          "_buttonStrokeOver": null,
		          "_buttonStrokeNormal": "dodgerblue",
		          "_buttonFillNormal": "lightblue",
		          alignment: go.Spot.TopRight, 
		          alignmentFocus: go.Spot.BottomLeft,
		          margin: new go.Margin(0,3,0,0),
              cursor: "pointer",                 
                click: function(e, obj) {
                	addDefaultNodeAndLink(e, obj);
                  e.event.stopPropagation();
                  e.event.stopImmediatePropagation();
                  return false;
              	}  
          },
          goJS(go.TextBlock, " + ",  // the Button content
              { font: "bold 12pt sans-serif" }),
          new go.Binding("visible", "fixed", function(v) { return !v; })
        ),
        goJS("Button", {
	 				width: 20,
	 				height: 20,
          "ButtonBorder.fill": "lightblue",
          "ButtonBorder.stroke": "dodgerblue",
          "_buttonFillOver": "rgb(0,128,255)",
          "_buttonStrokeOver": null,
          "_buttonStrokeNormal": "dodgerblue",
          "_buttonFillNormal": "lightblue",
          alignment: go.Spot.TopRight, 
          alignmentFocus: go.Spot.BottomLeft,
          cursor: "pointer",                 
            click: function(e, obj) {
            	removeNodeAndLink(e, obj);
            	info.propertiesPanel.clear();
              e.event.stopPropagation();
              e.event.stopImmediatePropagation();
              return false;
          	}  
          },
          goJS(go.TextBlock, " - ",  // the Button content
              { font: 'bold 12pt "Helvetica Neue", Helvetica, Arial, sans-serif' }),
          new go.Binding("visible", "mandatory", function(v) { return !v; })
        )
    	)
    );
    
    var simpleTemplate = goJS(go.Node, "Auto", {
				selectionAdornmentTemplate: defaultNodeAdornmentTemplate,
  			click: function(e, obj) {
  				repaintPropertiesPanel(obj, info);
  			},
      	selectionChanged: function(node) {
			    var box = node.findObject("BOX");
		      if (node.isSelected) {
//		      	box.stroke = "Navy";
		      	box.strokeWidth = 3;
		      } else {
//		      	box.stroke = !node.data.mandatory ? "darkblue" : "darkgray";
		      	box.strokeWidth = 1;
		      }
			  }
    	},
  		goJS(go.Shape, {
  			name: "BOX",
      	figure: "RoundedRectangle",
      	strokeWidth: 1,
      	margin: new go.Margin(1,1,1,1)
      }, 
      new go.Binding("fill", "mandatory", function(v) { return !v ? "lightblue" : "lightgray"; }),
      new go.Binding("stroke", "mandatory", function(v) { return !v ? "darkblue" : "darkgray"; })
      ),    
      goJS(go.Panel, "Horizontal",
        { 
    			margin: new go.Margin(1,1,1,1),
    			defaultAlignment: go.Spot.Left,
    			stretch: go.GraphObject.Horizontal,
    			minSize: new go.Size(30, 20)
    		},
    		goJS("TreeExpanderButton", {
          width: 14,
          "ButtonBorder.fill": "whitesmoke",
          "ButtonBorder.stroke": null,
          "_buttonFillOver": "rgba(0,128,255,0.25)",
          "_buttonStrokeOver": null
        }),
        goJS(go.TextBlock, {
            name: "TEXT",
            font: '12px "Helvetica Neue", Helvetica, Arial, sans-serif',
            margin: new go.Margin(0, 8, 0, 4),
            isMultiline: false
          },
          new go.Binding("text", "text").makeTwoWay(),
          new go.Binding("editable", "mandatory", function(v) { return !v; })
        )
      ),
      new go.Binding("isTreeExpanded", "expand")
    );

    var rootTemplate = goJS(go.Node, "Auto", {
    		selectionAdorned: false,
  			click: function(e, obj) {
  				repaintPropertiesPanel(obj, info);
  			},
      	selectionChanged: function(node) {
			    var box = node.findObject("BOX");
		      if (node.isSelected) {
//		      	box.stroke = "Navy";
		      	box.strokeWidth = 3;
		      } else {
//		      	box.stroke = !node.data.mandatory ? "darkblue" : "darkgray";
		      	box.strokeWidth = 1;
		      }
			  }
    	},
        goJS(go.Shape, {
        	name: "BOX",
        	figure: "Ellipse",
        	strokeWidth: 1,
        	margin: new go.Margin(1,1,1,1)
        }, 
        new go.Binding("fill", "mandatory", function(v) { return !v ? "lightblue" : "lightgray"; }),
        new go.Binding("stroke", "mandatory", function(v) { return !v ? "darkblue" : "darkgray"; })),            
      goJS(go.Panel, "Horizontal",
          { 
      			margin: new go.Margin(1,1,1,1),
      			defaultAlignment: go.Spot.Left,
      			stretch: go.GraphObject.Horizontal,
      			minSize: new go.Size(10, 10)
      		},    
          goJS(go.TextBlock, {
              name: "TEXT",
              font: '13px "Helvetica Neue", Helvetica, Arial, sans-serif',
              margin: new go.Margin(3, 0, 3, 0),
              editable: false
            },
            new go.Binding("text", "text").makeTwoWay()
          )
        )
      );  // end Node    
    
    var rmNodeTemplate = goJS(go.Node, "Auto",  {
    	  name: "NODE",
				selectionAdornmentTemplate: defaultNodeAdornmentTemplate,
				cursor: "pointer",
  			click: function(e, obj) {
  				repaintPropertiesPanel(obj, info);
  			},
      	selectionChanged: function(node) {
			    var box = node.findObject("BOX");
		      if (node.isSelected) {
//		      	box.stroke = "Navy";
		      	box.strokeWidth = 3;
		      } else {
//		      	box.stroke = !node.data.mandatory ? "darkblue" : "darkgray";
		      	box.strokeWidth = 1;
		      }
			  }
  		},
    		goJS(go.Shape, {
    			name: "BOX",
        	figure: "RoundedRectangle",
        	strokeWidth: 1,
        	margin: new go.Margin(1,1,1,1)
        }, 
        new go.Binding("fill", "mandatory", function(v) { return !v ? "lightblue" : "lightgray"; }),
        new go.Binding("stroke", "mandatory", function(v) { return !v ? "darkblue" : "darkgray"; })),     		
      goJS(go.Panel, "Horizontal",
        { 
    			margin: new go.Margin(1,1,1,1),
    			defaultAlignment: go.Spot.Left,
    			stretch: go.GraphObject.Horizontal,
    			minSize: new go.Size(30, 15)
    		},
    		goJS("TreeExpanderButton", {
          width: 14,
          "ButtonBorder.fill": "whitesmoke",
          "ButtonBorder.stroke": null,
          "_buttonFillOver": "rgba(0,128,255,0.25)",
          "_buttonStrokeOver": null
        }),    		
        // icon
        goJS(go.Picture, {
        	name: "ICON",
      		desiredSize: new go.Size(15, 15),
      		margin: new go.Margin(2, 2, 2, 5),
          imageStretch: go.GraphObject.Uniform,
          alignment: go.Spot.TopRight,
          cursor: "pointer",
          click: function(e, obj) {
          	createRmTypeSelect(myDiagram, obj, info);
            e.event.stopPropagation();
            e.event.stopImmediatePropagation();
            return false;
          }
        }, new go.Binding("source", "img", function(v,f,g,h) { 
        	return v;
        })),
        // text
        goJS(go.TextBlock, {
            name: "TEXT",
            font: '12px "Helvetica Neue", Helvetica, Arial, sans-serif',
            margin: new go.Margin(0, 8, 0, 4),
            isMultiline: false
          },
          new go.Binding("text", "text").makeTwoWay(),
          new go.Binding("editable", "mandatory", function(v) { return !v; })
        )
      ),
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      new go.Binding("locationSpot", "dir", function(d) { return spotConverter(d, false); }),
      new go.Binding("isTreeExpanded", "expand")
    );  
    
    var templmap = new go.Map("string", go.Node);
    templmap.add("simple", simpleTemplate);
    templmap.add("root", rootTemplate);
    templmap.add("rmNode", rmNodeTemplate);
    templmap.add("", myDiagram.nodeTemplate);
    myDiagram.nodeTemplateMap = templmap;
    
    myDiagram.linkTemplate =  goJS(go.Link,
      {
        curve: go.Link.Bezier,
        fromShortLength: -1,
        toShortLength: -1,
        selectable: false
      },
      goJS(go.Shape,
        { strokeWidth: 2 },
        new go.Binding("stroke", "toNode", function(n) { return n.data.brush; }).ofObject())
    );

    
    // Diagram event listeners
    myDiagram.addDiagramListener("ChangedSelection", function(e) {
    	$("#customNodeEditor").remove();
    });

    myDiagram.addDiagramListener("TreeExpanded", function(e) {
  		layoutAll(e.diagram);
    });

    myDiagram.addDiagramListener("TreeCollapsed", function(e) {
  		layoutAll(e.diagram);
    });
    
    myDiagram.addDiagramListener("BackgroundSingleClicked", function(e) {
			info.propertiesPanel.clear();
    });
    
    myDiagram.addDiagramListener("TextEdited", function(e) {
			mindmapModel.renameConstraint(e.subject.part.data.node.rmPath, e.subject.text);
			repaintMindmapNode(e.subject.part, e.subject.part.data.node.rmPath);
    });
    
  $("#getMindmapModel").on("click touchstart", function() { // "Generate" button
      console.log(myDiagram.model.toJson());
  });
  
  // Fill data & arrange nodes
  myDiagram.model = go.Model.fromJson(formatBuilder(model));
  arrangeLayout(myDiagram);
}

function createRmTypeSelect(myDiagram, obj, info) {
  var loc = obj.getDocumentPoint(go.Spot.BottomLeft);
  var svgPosition = myDiagram.transformDocToView(loc);
	var panelPosition = $(myDiagram.div).offset();
	$("#customNodeEditor").remove();
	var rmPath = obj.part.data.node.rmPath;
	if(rmPath != undefined) {
		var availableOptions = mindmapModel.getValidRmTypesForConstraint(rmPath);
		if(availableOptions.length > 1) {
  		$("body").append("<div id='customNodeEditor' style='display:inline;position:absolute;z-index:1000;'><select id='availableRmTypes'></div>");
  		$("#customNodeEditor").offset({left: panelPosition.left + svgPosition.x, top: panelPosition.top + svgPosition.y});
      for (var i = 0; i < availableOptions.length; i++) {
      	$("#availableRmTypes").append("<option value='" + availableOptions[i] + "'></option>");
      	$("#availableRmTypes").find("option").last().text(availableOptions[i]);
      }
      $("#availableRmTypes").val(obj.part.data.node.rmType);
      $("#availableRmTypes").change(obj, function(ev) {
      	var newNode = mindmapModel.changeConstraintType(rmPath, $(this).val());
  			repaintMindmapNode(ev.data.part, rmPath);
  			repaintPropertiesPanel(obj, info);
      	$(this).parent().remove();
      });
		}       		
	}
}

function repaintPropertiesPanel(obj, info) {
	var rmPath = obj.part.data.node.rmPath;
	if(rmPath != undefined) {
    var fullObject = mindmapModel.getConstraintObject(rmPath);
    var current = {
        mindmapNode: obj.part.data,
        data: fullObject
    };
    var constraintData = {
        info: info,
        cons: fullObject
    };
    constraintData.specializeCallback = function () {
        //specializeConstraint(archetypeModel, constraintData, treeEvent.node);
    };
    constraintData.saveCallback = function() {
    	repaintMindmapNode(obj.part, rmPath);
    };
    info.propertiesPanel.show(constraintData);   
	} else {
		info.propertiesPanel.clear();
	}
}

function repaintMindmapNode(oldNode, rmPath) {
  var adorn = oldNode.part;
  var diagram = adorn.diagram;
	var nodeData = mindmapModel.getMindmapConstraint(rmPath);
	var rmTypeChanged = nodeData.rmType != oldNode.data.node.rmType;
//	var parentLink = oldNode.findTreeParentLink();
//	var parentNode = diagram.model.findNodeDataForKey(oldNode.data.parent);
  //oldNode.data = createNewNodeData(nodeData, oldNode.data.key, oldNode.data.parent, oldNode.data.brush, oldNode.data.dir);
	// diagram.model.addNodeData(createNewNodeData(nodeData, oldNode.data.key, oldNode.data.parent, oldNode.data.brush, oldNode.data.dir));
//	var newNodeData = diagram.model.findNodeDataForKey(oldNode.data.key);
//	var newNode = diagram.findNodeForData(oldNode);
//	oldNode.setProperties({
//    "ICON.source": nodeIconPath(nodeData.rmType, nodeData.isSlot),
//    "TEXT.text": nodeData.label
//	});
//	oldNode.data.node = nodeData;
	updateNodeData(oldNode, nodeData);
  oldNode.findObject("NODE").updateAdornments();
  if(rmTypeChanged) {
  	deleteNode(diagram, oldNode, true);
  }
//	parentLink.toNode(newNode);
	arrangeLayout(diagram);
//	diagram.model

}

function formatBuilder(data) {
  var key = 0;
  if (data) {
  	var nodeData = $.extend({}, data);
  	delete nodeData.children;
    nodeDataArray.push({
    	"key": key, 
    	"text": data.label, 
    	"loc":"0 0", 
    	"category": "root", 
    	"node": nodeData, 
    	"mandatory": true
    });
    if (data.children){
        recursiveChildrenFormatBuilder(data.children, key);
    }
  }
  return { "class": "go.TreeModel", "nodeDataArray": nodeDataArray };
}

function recursiveChildrenFormatBuilder(data, parentKey, brush, dir) {
  for (var i=0; i<data.length; i++) {
    var key = "";
    var brush = brushArray["rmnode"];
    if (data[i].children && !data[i].rmType) {
    	brush = brushArray["subtree"];
    }
    if(parentKey == 0){
        key = (i + 1);
        brush = brush;
        dir = (dir == "left") ? "right" : "left";
    }
    else {
        key = parentKey + "" + (i + 1);
    }
  	var nodeData = $.extend({}, data[i]);
    nodeDataArray.push(createNewNodeData(nodeData, key, parentKey, brush, dir));
    if (data[i].children){
        recursiveChildrenFormatBuilder(data[i].children , key, brush, dir);
    }
  }
}

function updateNodeData(oldNode, newNodeData) {
	oldNode.data.text = newNodeData.label;
	oldNode.data.node = newNodeData;
	oldNode.data.expand = (newNodeData.section != "description" && newNodeData.section != "attribution");
  if (newNodeData.rmType) {
  		oldNode.data["img"] = nodeIconPath(newNodeData.rmType, newNodeData.isSlot);
      oldNode.data["category"] = "rmNode";
  } else {
  	oldNode.data["category"] = "simple";
  }
  if(newNodeData.hasOwnProperty("canDelete") && newNodeData.canDelete) {
  	oldNode.data["mandatory"] = false;
  } else {
  	oldNode.data["mandatory"] = true;
  }
  if(newNodeData.hasOwnProperty("canAddChildren") && newNodeData.canAddChildren) {
  	oldNode.data["fixed"] = false;
  } else {
  	oldNode.data["fixed"] = true;
  }
	oldNode.setProperties({
    "ICON.source": nodeIconPath(newNodeData.rmType, newNodeData.isSlot),
    "TEXT.text": newNodeData.label
	});
}


function createNewNodeData(nodeData, key, parentKey, brush, dir) {
	delete nodeData.children;
  var nodeObj = {
  		"key": parseInt(key), 
  		"parent": parentKey, 
  		"text": nodeData.label, 
  		"brush": brush, 
  		"dir": dir, 
  		"node": nodeData, 
  		"expand": (nodeData.section != "description" && nodeData.section != "attribution")
  };
  if (nodeData.rmType) {
      nodeObj["img"] = nodeIconPath(nodeData.rmType, nodeData.isSlot);
      nodeObj["category"] = "rmNode";
  } else {
  	nodeObj["category"] = "simple";
  }
  if(nodeData.hasOwnProperty("canDelete") && nodeData.canDelete) {
  	nodeObj["mandatory"] = false;
  } else {
  	nodeObj["mandatory"] = true;
  }
  if(nodeData.hasOwnProperty("canAddChildren") && nodeData.canAddChildren) {
  	nodeObj["fixed"] = false;
  } else {
  	nodeObj["fixed"] = true;
  }
  return nodeObj;
}

//function createRandomId() {
//  return Math.floor(Math.random() * 1000);
//}

function spotConverter(dir, from) {
  if (dir === "left") {
      return (from ? go.Spot.Left : go.Spot.Right);
  } else {
      return (from ? go.Spot.Right : go.Spot.Left);
  }
}

function nodeIconPath(rmType, isSlot) {
	isSlot = isSlot || false;
	return "images/icons/" + (rmType ? rmType.toLowerCase() : "DV_TEXT".toLowerCase()) + (isSlot ? "_slot" : "") + ".png";
}

//function toggleTextWeight(obj) {
//  var adorn = obj.part;
//  adorn.diagram.startTransaction("Change Text Weight");
//  var node = adorn.adornedPart;
//  var tb = node.findObject("TEXT");
//  var idx = tb.font.indexOf("bold");
//  if (idx < 0) {
//      tb.font = "bold " + tb.font;
//  } else {
//      tb.font = tb.font.substr(idx + 5);
//  }
//  adorn.diagram.commitTransaction("Change Text Weight");
//}

function addDefaultNodeAndLink(e, obj) {
  var adorn = obj.part;
  var diagram = adorn.diagram;
  diagram.startTransaction("Add Node");
  var oldnode = adorn.adornedPart;
  var olddata = oldnode.data;
  var rmPath = olddata.node.rmPath;
  var newNode = null;
  if(rmPath != undefined) {
    newNode = mindmapModel.createConstraintChild(rmPath);
  }
  var label = "New " + (newNode.rmType ? newNode.rmType.substring("DV_".length) : "TEXT").toLowerCase();
  var newdata = { 
  		text: label, 
  		brush: brushArray["added"], 
  		dir: olddata.dir, 
  		parent: olddata.key, 
  		mandatory: false, 
  		fixed: true, 
  		category: "rmNode", 
  		img: nodeIconPath(newNode.rmType, newNode.isSlot),
  		node: {
  			label: label,
  			rmPath: newNode.rmPath,
  			rmType: newNode.rmType
  		}
  };
  diagram.model.addNodeData(newdata);
  mindmapModel.renameConstraint(newNode.rmPath, label);
  layoutTree(diagram, oldnode);
  diagram.commitTransaction("Add Node");
  layoutAll(diagram);
}

function removeNodeAndLink(e, obj) {
  var adorn = obj.part;
  var diagram = adorn.diagram;
  diagram.startTransaction("Remove Node");
  var oldnode = adorn.adornedPart;
  var olddata = oldnode.data;
  deleteNode(diagram, oldnode);
  mindmapModel.removeConstraint(olddata.node.rmPath);
  layoutTree(diagram, oldnode);
  diagram.commitTransaction("Remove Node");
  layoutAll(diagram);
}

function deleteNode(mydiagram, deletedItem, keepParent)
{
		keepParent = keepParent || false;
    var nodeToDelete = mydiagram.selection.iterator.first();    
    var childNodes = getChildNodes(mydiagram, deletedItem);
//    $.each(childNodes, function()
//    {
//         myDiagram.remove(this);
//    });
    if(!keepParent)
    	mydiagram.commandHandler.deleteSelection();
    else
    	mydiagram.removeParts(childNodes, false);
}

function getChildNodes(mydiagram, deleteNode)
{
    var children = [];
//    var allConnected= deleteNode.findNodesConnected();
    var allConnected = deleteNode.findNodesOutOf()
    while (allConnected.next())
    {
        var child = allConnected.value;
//        if (isChildNode(mydiagram, deleteNode, child))
//        {
            children.push(child);
            var subChildren = getChildNodes(mydiagram, child);
            $.each(subChildren, function()
            {
                children.push(this);
            });
//       }
   }
   return children;
}

//function isChildNode(mydiagram, currNode, currChild)
//{
//    var links = mydiagram.links.iterator;
//    while (links.next())
//    {
//        var currentLinkModel = links.value.data;
//        if (currentLinkModel.from === currNode.data.key &&   currentLinkModel.to === currChild.data.key)
//        {
//             return true;
//        }
//    }
//    return false;
//}

function layoutAll(myDiagram) {
  var root = myDiagram.findNodeForKey(0);
  if (root === null) return;
  myDiagram.startTransaction("Layout");
  var rightward = new go.Set(go.Part);
  var leftward = new go.Set(go.Part);
  root.findLinksConnected().each(function(link) {
      var child = link.toNode;
      if (child.data.dir === "left") {
          leftward.add(root);
          leftward.add(link);
          leftward.addAll(child.findTreeParts());
      } else {
          rightward.add(root);
          rightward.add(link);
          rightward.addAll(child.findTreeParts());
      }
  });
  layoutAngle(rightward, 0);
  layoutAngle(leftward, 180);
  myDiagram.commitTransaction("Layout");
}

function layoutTree(myDiagram, node) {
  if (node.data.key === 0) {
      layoutAll(myDiagram);
  } else {
      var parts = node.findTreeParts();
      layoutAngle(parts, node.data.dir === "left" ? 180 : 0);
  }
}

function layoutAngle(parts, angle) {
  var layout = go.GraphObject.make(go.TreeLayout,
      { angle: angle,
          arrangement: go.TreeLayout.ArrangementFixedRoots,
          nodeSpacing: 5,
          layerSpacing: 20 });
  layout.doLayout(parts);
}

$( window ).resize(function() {
	// Do nothing for now. Maybe in the future this will be needed.
});

function arrangeLayout (myDiagram) {
  var root = myDiagram.findNodeForKey(0);
  if (root === null) return;
  myDiagram.startTransaction("Layout");
  var rightward = new go.Set(go.Part);
  var leftward = new go.Set(go.Part);
  root.findLinksConnected().each(function(link) {
      var child = link.toNode;
      if (child.data.dir === "left") {
          leftward.add(root);
          leftward.add(link);
          leftward.addAll(child.findTreeParts());
      } else {
          rightward.add(root);
          rightward.add(link);
          rightward.addAll(child.findTreeParts());
      }
  });
  layoutAngle(rightward, 0);
  layoutAngle(leftward, 180);
  myDiagram.commitTransaction("Layout");
}
