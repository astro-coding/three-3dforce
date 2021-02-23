// Import stylesheets
import "./style.css";
import ForceGraph3D from "3d-force-graph";
let d3 = require("d3-scale-chromatic");
let _data = require("./datasets/la.json");
const _themes = require("./themes.json");

var CurrentTheme = 0;
var colorMap;
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
document.getElementById("theme").addEventListener("click", ChangeTheme);

//interpolations at https://github.com/d3/d3-scale-chromatic
SetColorMap(_themes[CurrentTheme].nodeInterpolation);
function SetColorMap(interpolation) {
  console.log(interpolation);
  colorMap = {};
  var entityCount = 0;
  _data.nodes.forEach(d => {
    if (!colorMap[d.subtype]) {
      entityCount++;
      colorMap[d.subtype] = { index: entityCount };
    }
  });
  for (var i in colorMap) {
    var el = colorMap[i];
    el.color = d3[interpolation](el.index / entityCount);
  }
  console.log(colorMap);
}
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

function ChangeTheme() {
  CurrentTheme++;
  if (CurrentTheme >= _themes.length) {
    CurrentTheme = 0;
  }
  var t = _themes[CurrentTheme];
  console.log(t, CurrentTheme);
  SetColorMap(t.nodeInterpolation);
  myGraph
    .backgroundColor(t.background)
    .linkColor(myGraph.linkColor())
    .nodeColor(myGraph.nodeColor());
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
function GetNodeColor(d) {
  if (highlightNodes.has(d)) {
    return "black";
  }
  return colorMap[d.subtype].color;
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
function LinkColor(link) {
  if (highlightLinks.has(link)) {
    return "white";
  }
  return _themes[CurrentTheme].lineColor;
}

var config: any = { antialias: false, alpha: false };
//more tuning can be done in the config of myraph using these properties...
//https://threejs.org/docs/#api/en/renderers/WebGLRenderer

var myGraph = ForceGraph3D(config);
myGraph(appDiv)
  .graphData(_data)
  .nodeId("GUID")

  //defaults
  .showNavInfo(false)
  .backgroundColor(_themes[CurrentTheme].background)
  .warmupTicks(40)
  //"ngraph might be better at scale, but not interactive"
  .forceEngine("d3")
  .numDimensions(currentDimensions)
  .dagMode("") //"","bu","td","lr","zin","zout","radialin","radialout"

  //node
  //.nodeThreeObject([Object3d, str or fn])
  .nodeRelSize(4)
  .nodeResolution(10)

  //.nodeAutoColorBy("subtype")
  .nodeColor(GetNodeColor)
  .nodeLabel(nodeLabel)
  .onNodeHover(node => (appDiv.style.cursor = node ? "pointer" : null))
  .onNodeClick(NodeClicked)
  .onNodeRightClick(NodeRightClicked)
  .onNodeDragEnd(node => {
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  })

  //link
  //.linkAutoColorBy("strength")
  .linkColor(LinkColor)
  .linkWidth(link => (highlightLinks.has(link) ? 4 : ""))
  .linkDirectionalParticles(link => (highlightLinks.has(link) ? 4 : 0))
  //.linkDirectionalParticles(0)
  .linkDirectionalParticleSpeed(0.006)
  .linkDirectionalParticleColor(() => "white")
  .linkDirectionalParticleWidth(2)
  .linkLabel(linkLabel)
  .linkHoverPrecision(2)
  .onLinkHover(link => {
    //console.log(link);
    //myGraph.emitParticle(link);
  })
  .onLinkClick(LinkClicked);

//*/PARTICLE HOVER WORK

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
