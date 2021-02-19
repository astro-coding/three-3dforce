// Import stylesheets
import "./style.css";
import ForceGraph3D from "3d-force-graph";
let _data = require("./datasets/large.json");

// Write TypeScript code!
const appDiv: HTMLElement = document.getElementById("app");
const overlayDiv: HTMLElement = document.getElementById("overlay");
/*/Making data
var graph = require("ngraph.generators").wattsStrogatz(10000, 3, 0.1);
//var graph = require("ngraph.generators").grid3(20, 10, 5);
var _n = [];
var _l = [];
graph.forEachNode(d => {
  _n.push({ GUID: d.id });
});
graph.forEachLink(d => {
  _l.push({ source: d.fromId, target: d.toId });
});
var _data = { nodes: _n, links: _l };
//*/
function nodeLabel(d) {
  if (d.subtype && d.name) {
    return (
      "<div class='lbl'><p>" + d.subtype + "</p><h4>" + d.name + "</h4></div>"
    );
  }
  return "";
}
function linkLabel(d) {
  var lbl = "link";
  if (d.Label) {
    lbl = d.Label;
    var sp = d.Label.indexOf(";;");
    if (sp > -1) {
      lbl = d.Label.slice(sp + 2);
    }
  }

  return "<div class='lbl'>" + lbl + "</div>";
}

function NodeClicked(node, event) {
  console.log(node);
}
function LinkClicked(link, event) {
  console.log(link);
}

/*/ cross-link node objects
_data.links.forEach(link => {
  const a = _data.nodes[link.source.GUID];
  const b = _data.nodes[link.target.GUID];
  !a.neighbors && (a.neighbors = []);
  !b.neighbors && (b.neighbors = []);
  a.neighbors.push(b);
  b.neighbors.push(a);

  !a.links && (a.links = []);
  !b.links && (b.links = []);
  a.links.push(link);
  b.links.push(link);
});
//*/

const highlightNodes = new Set();
const highlightLinks = new Set();
let hoverNode = null;
//const distance = 1400;

var myGraph = ForceGraph3D();
myGraph(appDiv)
  .graphData(_data)
  .nodeId("GUID")
  .nodeAutoColorBy("subtype")
  .linkAutoColorBy("strength")
  //  .cameraPosition({ z: distance })
  .warmupTicks(40)
  .onNodeDragEnd(node => {
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  })

  .onNodeClick(NodeClicked)
  .onLinkClick(LinkClicked)
  //slows down
  //.linkDirectionalArrowLength(2)

  //blows up
  // .linkCurvature(0.1)
  //.linkWidth(1)

  .nodeLabel(nodeLabel)
  .linkLabel(linkLabel)

  .forceEngine("d3")

  .numDimensions(3)
  .dagMode("zin") //"","bu","td","lr","zin","zout","radialin","radialout"
  .onNodeHover(node => (appDiv.style.cursor = node ? "pointer" : null))
  .onNodeRightClick(node => {
    // Aim at node from outside it
    overlayDiv.style.display = "block";
    overlayDiv.classList.add("fade-in");
    const distance = 40;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    myGraph.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
      node, // lookAt ({ x, y, z })
      3000 // ms transition duration
    );
  });
/*/
  .linkDirectionalParticles(2)
  .linkDirectionalParticleWidth(0.8)
  .linkDirectionalParticleSpeed(0.006);
  //*/
/*
  .onNodeHover(node => {
    // no state change
    if ((!node && !highlightNodes.size) || (node && hoverNode === node)) return;

    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node);
      node.neighbors.forEach(neighbor => highlightNodes.add(neighbor));
      node.links.forEach(link => highlightLinks.add(link));
    }

    hoverNode = node || null;

    updateHighlight();
  })
  .onLinkHover(link => {
    highlightNodes.clear();
    highlightLinks.clear();

    if (link) {
      highlightLinks.add(link);
      highlightNodes.add(link.source);
      highlightNodes.add(link.target);
    }

    updateHighlight();
  })
  //*/

function updateHighlight() {
  // trigger update of highlighted objects in scene
  myGraph
    .nodeColor(myGraph.nodeColor())
    .linkWidth(myGraph.linkWidth())
    .linkDirectionalParticles(myGraph.linkDirectionalParticles());
}

/*/ camera orbit
let angle = 0;
setInterval(() => {
  myGraph.cameraPosition({
    x: distance * Math.sin(angle),
    z: distance * Math.cos(angle)
  });
  angle += Math.PI / 300;
}, 10);
//*/
//not working
//.d3Force("center")
//myGraph(appDiv).jsonUrl("./datasets/medium.json");
