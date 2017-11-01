/*******************************
	graphIt
Dynamically builds Graphs from 
input Text. 
This is the Main function.

Based on the 'Arrows' library:
https://github.com/apcj/arrows

	----------------
Copyright Nulli - 2017
Proprietary and Confidential

author: ababeanu@nulli.com
version: 1.0
since: Oct. 2017
*******************************/
function graphIt (text) {

	console.log ("Entering Function graphIt...");

	// Global Variables:
	//-----------------
	// Can change these:
	//------------------
	// Node Offset (drives spacing of nodes)
	offset = 150;
	// max Diagram coordinates
	maxX = 500;
	maxY = 500;
	// Relationship Type Delimiter (e.g., "_" for "has_friend")
	relDelim = "_";
	// Properties delimiter
	propDelim = "-";
	//-------------------
	// DO NOT change these:
	//------------------
	// Nb of Nodes
	nbNodes = 0;
	// Cache for all nodes
	// item Format: "{nodeID: Name, X: 100, Y: 100, nbNearNodes: 3}"
	nodeAry = [];
	//------------------

	// Generated HTML string
	var genGraph;
	
	if(isBlank(text)) {
		genGraph = text;
	} else{ 
		// Open HTML Graph elements
		genGraph = "<figure class='graph-diagram'><ul class='graph-diagram-markup'>"

		// Get Lines
		var lines = text.split('\n');

		// Process each line
		for(var i=0, len=lines.length; i < len; i++){
			// Check If comma
			var propAry = lines[i].split(propDelim);
			// The Sentence
			var sentence = propAry[0];
			// The property clause
			var prop = "";
			if (propAry.length > 1) {
				// We do have properties
				// Make it a JSON string - remove blanks too
				prop = "{" + propAry[1].replace(/\s/g,'') + "}";
			}
			// Analyse Sentence
			genGraph += analyseSentence(sentence.trim(), prop);
		}

		// Close HTML Elements
		genGraph += "</ul></figure>";
	}

	// Set generated Graph HTML
	document.getElementById("dynamicGraph").innerHTML = genGraph;
	// Render Graph
	d3.selectAll( "figure.graph-diagram" ).call( gd.figure() );
}
function analyseSentence (s, props) {

	console.log ("Entering Function analyseSentence...");
	var outStr = "";

	if (!isBlank(s)) {
		// Sentence has at least 1 letter
		var words = s.split(" ");
		var wl = words.length;
		if (wl > 0) {

			// Build Properties String
			var propStr = "";
			if (props) {
				propStr = createProps(props);
			}

			// Check if the node exists already
			var nIdx = getNodeIndex(words[0]);
			
			if (wl == 1) {
				// Only 1 word: it's a lone Node
				if (nIdx == -1) {
					// Node doesn't exist yet
					outStr += createLoneNode(words[0], propStr);
				} else {
					// Node already exists: increment close node counter
					nodeAry[nIdx].nbNearNodes++;
				}
			}
			if (wl > 1) {
				// More than 1 word: the 1st and last words are NODEs
				// These are close nodes: created together
				var nIdx2 = getNodeIndex(words[wl-1]);

				// 4 Cases
				// 1 - Both nodes are new
				if ((nIdx == -1) && (nIdx2 == -1)) {
					// Create 1st Node
					outStr += createLoneNode(words[0], propStr);
					// then Create 2nd close to 1st
					outStr += createCloseNode(words[wl-1], words[0], 0, "");
				}
				// 2 - 1st node only exists
				if ((nIdx > -1) && (nIdx2 == -1)) {
					// Create 2nd close to 1st
					outStr += createCloseNode(words[wl-1], words[0], nIdx, "");
				} 
				// 3- 2nd node only exists
				if ((nIdx == -1) && (nIdx2 > -1)) {
					// Create 1st node close to 2nd
					outStr += createCloseNode(words[0], words[wl-1], nIdx2, "");
				}
				// 4 - Both nodes exist
				if ((nIdx > -1) && (nIdx2 > -1)) {
					// Just increment the near node counters
					nodeAry[nIdx].nbNearNodes++;
					nodeAry[nIdx2].nbNearNodes++
				}

				// More than 2 words: it's a relationship
				if (wl > 2) {
					// Concatenate all middle words to produce the relType
					var relType = "";
					for (i=1; i<=wl-2; i++) {
						relType += words[i];
						if ((i>=1) && (i<wl-2)) {
							// Add space if multi-word type
							relType+= relDelim;
						}
					}
					outStr+= createRel(words[0], words[wl-1], relType, propStr);
				}
			}
		}
	}
	return outStr;
}
function isBlank(str) {
	console.log ("Entering Function isBlank...");
    return (!str || /^\s*$/.test(str));
}
function createLoneNode(nodeName, props) {
	console.log ("Entering Function createLoneNode...");
	nbNodes++;
	if (nbNodes === 1) {
		// Cache new node
		addNodeData(nodeName, 0, 0, 0);
		// Create new node
		return "<li class='node' data-node-id='" + nodeName + "' data-x='0' data-y='0'><span class='caption'>" + nodeName + "</span>" + props + "</li>";
	} else {
		if (nbNodes > 1) {
			// format: {X:val, Y:val}
			var coord = getNewLoneNodeCoord();
			if (coord.X === 'N') {
				alert("Couldn't place node " + nodeName + ". Graph too crowded!");
				return "";
			} else {
				// Cache new node
				addNodeData(nodeName, coord.X, coord.Y, 0);
				// Create new node
				return "<li class='node' data-node-id='" + nodeName + "' data-x='" + coord.X + "' data-y='" + coord.Y + "'><span class='caption'>" + nodeName + "</span>" + props + "</li>";
			}
		}
	}
}
function createCloseNode(node, close2node, nd2Idx, props) {
	// This function assumes that 'close2node' refers to a node ALREADY CREATED!
	console.log ("Entering Function createCloseNode...");
	
	// Does the node exist already?
	var nd2 = getNodeData(close2node);
	if ((nd2=="") || (nd2==="undefined")) {
		// Pb, stop here
		console.log("ERROR: node:" + close2Node + " is supposed to exist already. PB likely caused by wrong function usage.");
	} else {
		// node 2 exists, point to it 
		nbNodes++;
		var xInit = nd2.X;
		var yInit = nd2.Y;
		var c = 0, x, y;
		// Generate coordinates, making sure there isn't another node already there:
		do {
			x = getX(xInit + (c*offset), nd2.nbNearNodes);
			y = getY(yInit + (c*offset), nd2.nbNearNodes);
			c++;
		} while (isNodeAt(x,y) && (c < 10));
		// Consider no space after trying to place a near node 10 times
		if (c<20) {
			// Cache New node
			addNodeData(node, x, y, 1);
			// Increment close counter on 2nd node
			nodeAry[nd2Idx].nbNearNodes++;
			return "<li class='node' data-node-id='" + node + "' data-x='" + x + "' data-y='" + y + "'><span class='caption'>" + node + "</span>" + props + "</li>";
		} else {
			alert("Could not place node: " + node + " near node: " + close2node + " - Not enough space.");
		}
	}
}
function createRel(node1, node2, type, props) {
	return "<li class='relationship' data-from='" + node1 +"' data-to='" + node2 + "'><span class='type'>" + type + "</span>" + props + "</li>";
}
function createProps (props) {
	var propStr = "<dl class='properties'>";
	var propJ = JSON.parse(props);
	for (var key in propJ) {
    	if (propJ.hasOwnProperty(key)) {
        	propStr += "<dt>" + key + "</dt><dd>" + propJ[key] + "</dd>";
        }
    }
    propStr += "</dl>"

    return propStr;
}
function getX (xI, nbNear) {
	console.log ("Entering Function getX...");
	var X = xI;

	if (nbNear == 0) {
		X-=offset;
	}
	if (nbNear == 1) {
		X+=offset;
	}
	if (nbNear == 2) {
		X+=offset;
	}
	if (nbNear == 3) {
		X-=offset;
	}
	if (nbNear == 4) {
		X+=offset;
	}
	if (nbNear == 6) {
		X-=offset;
	}

	return X;
}
function getY (yI, nbNear) {
	console.log ("Entering Function getY...");
	var Y = yI;

	if (nbNear == 0) {
		Y+=offset;
	}
	if (nbNear == 1) {
		Y+=offset;
	}
	if (nbNear == 2) {
		Y-=offset;
	}
	if (nbNear == 3) {
		Y-=offset;
	}
	if (nbNear == 5) {
		Y-=offset;
	}
	if (nbNear == 7) {
		Y+=offset;
	}

	return Y;
}
function getNodeData (NodeName) {
	console.log ("Entering Function getNodeData...");
	var obj = "";
	if (nodeAry) {
		// returns 'undefined' if not found
		obj = nodeAry.find(x => x.nodeID === NodeName);
	}
	return obj;
}
function getNodeIndex (NodeName) {
	console.log ("Entering Function getNodeIndex...");
	return nodeAry.map(x => x.nodeID).indexOf(NodeName);
}
function isNodeAt (x, y) {
	console.log ("Entering Function isNodeAt...");
	var isit = false;
	if (nbNodes > 0 ) {
		for (i=0; i<nodeAry.length; i++) {
			var node = nodeAry[i];
			//true if at, or near, the given coordinates.
			// Near here means within "offset" distance
			if (((node.X === x) && (node.Y ===y)) ||
				((Math.abs(x-node.X) < offset) && (Math.abs(y-node.Y) < offset))) {
				isit = true;
				break;
			}
		}
	}
	return isit;
}
function getNewLoneNodeCoord () {
	console.log ("Entering Function getNewLoneNodeCoord...");
	var Xopt;
	var Yopt;
	var c = 0;
	do {
		// Filp a coin: + or - Coord
		var sign = (Math.floor(Math.random() * 2) == 0)? -1 : 1;
		// random number based on Canvas size and offset
		Xopt = (Math.floor(Math.random() * Math.floor(maxX / offset)) * offset) * sign;
		Yopt = (Math.floor(Math.random() * Math.floor(maxX / offset)) * offset) * sign;
		c++;
	} while (isNodeAt(Xopt,Yopt) && (c < 1000));
		// consider there is no place left on canvas after 1000 failed attemps at placing a new node.
	if (c >=1000) {
		Xopt='N';
		Yopt='N';
	}
	return {"X":Xopt, "Y":Yopt};
}
function addNodeData (ndename, x, y, nbNearND) {
	console.log ("Entering Function addNodeData...");
	nodeAry.push({"nodeID":ndename, "X":x, "Y":y, "nbNearNodes": nbNearND});
}