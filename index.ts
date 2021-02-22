// Import stylesheets
import "./style.css";
import ForceGraph3D from "3d-force-graph";
let _data = require("./datasets/current.json");

var Results = [];
var FocusedNode = null;
const highlightNodes = new Set();
const highlightLinks = new Set();
let hoverNode = null;
var currentDimensions = 3;

const appDiv: HTMLElement = document.getElementById("app");
appDiv.addEventListener("click", StageClicked);
const overlayDiv: HTMLElement = document.getElementById("overlay");
const searchBox: HTMLElement = document.getElementById("search-box");
const resultsPane: HTMLElement = document.getElementById("search-results");
searchBox.addEventListener("keyup", e => {
  var searchstring = (searchBox as any).value;
  if (searchstring.length > 1) {
    Results = FindNodes(searchstring);
    RenderResults();
  }
});
function FindNodes(st: string) {
  return _data.nodes.filter(d => {
    return (
      d.name.toLowerCase().indexOf(st.toLowerCase()) > -1 ||
      d.subtype.toLowerCase().indexOf(st.toLowerCase()) > -1
    );
  });
}
function RenderResults() {
  //I wish I had angular here haha
  var u = resultsPane.querySelector("ul");
  u.innerHTML = null;
  Results.forEach(d => {
    var l = document.createElement("li");
    l.innerText = d.name;
    l.addEventListener("click", () => {
      NodeRightClicked(d);
    });
    u.appendChild(l);
  });
}
document.getElementById("3d-button").addEventListener("click", e => {
  if (currentDimensions === 2) {
    currentDimensions = 3;
  } else {
    currentDimensions = 2;
  }
  //console.log(currentDimensions);
  myGraph.numDimensions(currentDimensions);
});
document
  .getElementById("default-layout")
  .addEventListener("click", e => SetLayout(""));
document
  .getElementById("lr-layout")
  .addEventListener("click", e => SetLayout("lr"));
document
  .getElementById("bu-layout")
  .addEventListener("click", e => SetLayout("bu"));
document
  .getElementById("td-layout")
  .addEventListener("click", e => SetLayout("td"));
document
  .getElementById("zi-layout")
  .addEventListener("click", e => SetLayout("zin"));
document
  .getElementById("zo-layout")
  .addEventListener("click", e => SetLayout("zout"));
document
  .getElementById("ri-layout")
  .addEventListener("click", e => SetLayout("radialin"));
document
  .getElementById("ro-layout")
  .addEventListener("click", e => SetLayout("radialout"));
function SetLayout(st) {
  myGraph.dagMode(st);
}
function StageClicked(e) {
  if (FocusedNode) {
    FocusedNode = null;
    overlayDiv.classList.remove("fade-in");
    overlayDiv.style.display = "none";
  }
  if (Results.length > 0) {
    Results = [];
    resultsPane.querySelector("ul").innerHTML = null;
    (searchBox as any).value = "";
  }
}

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
  if ((!node && !highlightNodes.size) || (node && hoverNode === node)) return;

  highlightNodes.clear();
  highlightLinks.clear();
  if (node) {
    highlightNodes.add(node);
    //console.log(node);
    node.linkedNodes.forEach(neighbor => {
      highlightNodes.add(neighbor);
    });
    FindLinks(node.GUID);
  }
  hoverNode = node || null;
  updateHighlight();
}

function updateHighlight() {
  // trigger update of highlighted objects in scene
  myGraph
    .nodeColor(myGraph.nodeColor())
    .linkWidth(myGraph.linkWidth())
    .linkColor(myGraph.linkColor())
    .linkDirectionalParticles(myGraph.linkDirectionalParticles());
}

function FindLinks(guid) {
  _data.links.forEach(d => {
    if (guid === d.source.GUID || d.target.GUID === guid) {
      highlightLinks.add(d);
    }
  });
}
function NodeRightClicked(node) {
  FocusedNode = node;
  (overlayDiv.querySelector(".double-overlay h4") as any).innerText = node.name;
  (overlayDiv.querySelector(".double-overlay p") as any).innerText =
    node.subtype;
  overlayDiv.style.display = "block";
  overlayDiv.classList.add("fade-in");
  const distance = 40;
  const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
  myGraph.cameraPosition(
    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
    node, // lookAt ({ x, y, z })
    3000 // ms transition duration
  );
}
function LinkClicked(link, event) {
  console.log(link);
}

var myGraph = ForceGraph3D();
myGraph(appDiv)
  .graphData(_data)
  .nodeId("GUID")
  .nodeAutoColorBy("subtype")
  .showNavInfo(false)
  //.linkAutoColorBy("strength")
  .linkColor(link => (highlightLinks.has(link) ? "white" : "orange"))
  .warmupTicks(40)

  .onNodeClick(NodeClicked)
  .onLinkClick(LinkClicked)
  .onNodeRightClick(NodeRightClicked)
  .onNodeDragEnd(node => {
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  })

  .nodeLabel(nodeLabel)
  .linkLabel(linkLabel)
  .forceEngine("d3")
  .numDimensions(currentDimensions)
  .dagMode("") //"","bu","td","lr","zin","zout","radialin","radialout"
  .onNodeHover(node => (appDiv.style.cursor = node ? "pointer" : null))
  //*/PARTICLE HOVER WORK
  .onLinkHover(link => {
    //console.log(link);
    //myGraph.emitParticle(link);
  })
  .linkWidth(link => (highlightLinks.has(link) ? 4 : ""))
  .linkDirectionalParticles(link => (highlightLinks.has(link) ? 4 : 0))
  //.linkDirectionalParticles(0)
  .linkDirectionalParticleSpeed(0.006)
  .linkDirectionalParticleColor(() => "white")
  .linkDirectionalParticleWidth(2)
  .linkHoverPrecision(2);
//*/
//*
//can't do on hover for large graphs. super slow
/*/
  .onLinkHover(link => {
    highlightNodes.clear();
    highlightLinks.clear();

    if (link) {
      highlightLinks.add(link);
      highlightNodes.add(link.source);
      highlightNodes.add(link.target);
    }

    updateHighlight();
  });
//*/

//slows down
//.linkDirectionalArrowLength(2)

//blows up
// .linkCurvature(0.1)
//.linkWidth(1)

/*/ camera orbit
Conflicts with mouse
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

/*/Making data (linkedNodes should break this?)
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
