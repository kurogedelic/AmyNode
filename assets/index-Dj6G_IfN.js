(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();const P={AUDIO:{name:"Audio",color:"#4CAF50",defaultValue:0,validator:d=>typeof d=="number"&&d>=-1&&d<=1},CONTROL:{name:"Control",color:"#2196F3",defaultValue:0,validator:d=>typeof d=="number"},FREQUENCY:{name:"Frequency",color:"#9C27B0",defaultValue:440,validator:d=>typeof d=="number"&&d>=0},GATE:{name:"Gate",color:"#FF9800",defaultValue:!1,validator:d=>typeof d=="boolean"},TRIGGER:{name:"Trigger",color:"#F44336",defaultValue:!1,validator:d=>typeof d=="boolean"}},I={AUDIO:["AUDIO","CONTROL"],CONTROL:["AUDIO","CONTROL","FREQUENCY"],FREQUENCY:["CONTROL","FREQUENCY"],GATE:["GATE","TRIGGER"],TRIGGER:["GATE","TRIGGER"]};class ${constructor(e,t,s,i,o=null,n=null,r=null,a=null){this.id=e,this.name=t,this.type=s,this.isInput=i,this.defaultValue=o!==null?o:P[s].defaultValue,this.value=this.defaultValue,this.min=n,this.max=r,this.step=a,this.connections=[],this.node=null}canConnectTo(e){var i;if(this.isInput===e.isInput||this.node===e.node)return!1;const t=this.isInput?e.type:this.type,s=this.isInput?this.type:e.type;return((i=I[t])==null?void 0:i.includes(s))||!1}connect(e){if(!this.canConnectTo(e))throw new Error(`Cannot connect ${this.type} to ${e.type}`);return this.isInput&&this.connections.length>0&&this.disconnect(this.connections[0]),e.isInput&&e.connections.length>0&&e.disconnect(e.connections[0]),this.connections.push(e),e.connections.push(this),!0}disconnect(e){const t=this.connections.indexOf(e);if(t!==-1){this.connections.splice(t,1);const s=e.connections.indexOf(this);s!==-1&&e.connections.splice(s,1)}}disconnectAll(){for(;this.connections.length>0;)this.disconnect(this.connections[0])}getValue(){return this.isInput&&this.connections.length>0?this.connections[0].getValue():this.value}setValue(e){P[this.type].validator(e)&&(this.value=e)}serialize(){return{id:this.id,name:this.name,type:this.type,isInput:this.isInput,defaultValue:this.defaultValue,value:this.value,min:this.min,max:this.max,step:this.step}}}class M{constructor(e,t=null){this.type=e,this.id=t||`node_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,this.title=e,this.position={x:0,y:0},this.size={width:180,height:100},this.inputs=[],this.outputs=[],this.parameters={},this.selected=!1,this.graph=null}addInput(e,t,s=null,i=null,o=null,n=null){const r=new $(`in_${this.inputs.length}`,e,t,!0,s,i,o,n);return r.node=this,this.inputs.push(r),r}addOutput(e,t,s=null){const i=new $(`out_${this.outputs.length}`,e,t,!1,s);return i.node=this,this.outputs.push(i),i}addParameter(e,t,s=null,i=null,o=null,n="number",r=null){this.parameters[e]={value:t,defaultValue:t,min:s,max:i,step:o,type:n,options:r,label:e.charAt(0).toUpperCase()+e.slice(1).replace(/_/g," ")}}getParameter(e){var t;return((t=this.parameters[e])==null?void 0:t.value)??null}setParameter(e,t){var s;this.parameters[e]&&(this.parameters[e].value=t,(s=this.onParameterChanged)==null||s.call(this,e,t))}onParameterChanged(e,t){}process(){}generateCode(){return""}serialize(){return{id:this.id,type:this.type,title:this.title,position:{...this.position},parameters:Object.entries(this.parameters).reduce((e,[t,s])=>(e[t]=s.value,e),{}),inputs:this.inputs.map(e=>e.serialize()),outputs:this.outputs.map(e=>e.serialize())}}deserialize(e){this.id=e.id,this.title=e.title||this.type,this.position={...e.position},Object.entries(e.parameters||{}).forEach(([t,s])=>{this.parameters[t]&&(this.parameters[t].value=s)})}}class T{constructor(e,t){this.id=`conn_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,this.outputPort=e,this.inputPort=t,this.outputNode=e.node,this.inputNode=t.node}serialize(){return{id:this.id,outputNodeId:this.outputNode.id,outputPortId:this.outputPort.id,inputNodeId:this.inputNode.id,inputPortId:this.inputPort.id}}}class O{constructor(){this.nodes=new Map,this.connections=[],this.listeners=new Map}addNode(e,t=null){return t&&(e.position={...t}),e.graph=this,this.nodes.set(e.id,e),this.emit("nodeAdded",{node:e}),e}removeNode(e){const t=this.nodes.get(e);return t?([...t.inputs,...t.outputs].forEach(s=>s.disconnectAll()),this.connections=this.connections.filter(s=>s.outputNode.id!==e&&s.inputNode.id!==e),this.nodes.delete(e),this.emit("nodeRemoved",{node:t}),!0):!1}connectNodes(e,t,s,i){const o=this.nodes.get(e),n=this.nodes.get(s);if(!o||!n)throw new Error("Invalid node IDs");const r=o.outputs.find(l=>l.id===t),a=n.inputs.find(l=>l.id===i);if(!r||!a)throw new Error("Invalid port IDs");r.connect(a);const c=new T(r,a);return this.connections.push(c),this.emit("connectionAdded",{connection:c}),c}removeConnection(e){const t=this.connections.findIndex(i=>i.id===e);if(t===-1)return!1;const s=this.connections[t];return s.outputPort.disconnect(s.inputPort),this.connections.splice(t,1),this.emit("connectionRemoved",{connection:s}),!0}getProcessingOrder(){const e=new Set,t=[],s=i=>{e.has(i.id)||(e.add(i.id),i.inputs.forEach(o=>{o.connections.forEach(n=>{n.node&&s(n.node)})}),t.push(i))};return this.nodes.forEach(i=>{i.outputs.length===0&&s(i)}),this.nodes.forEach(i=>{s(i)}),t}process(){this.getProcessingOrder().forEach(t=>t.process())}clear(){this.connections=[],this.nodes.clear(),this.emit("graphCleared")}getNodes(){return Array.from(this.nodes.values())}serialize(){return{nodes:Array.from(this.nodes.values()).map(e=>e.serialize()),connections:this.connections.map(e=>e.serialize())}}deserialize(e){this.clear();const t=new Map;e.nodes.forEach(s=>{const i=this.createNodeFromType(s.type);i&&(i.deserialize(s),this.addNode(i),t.set(s.id,i))}),e.connections.forEach(s=>{try{this.connectNodes(s.outputNodeId,s.outputPortId,s.inputNodeId,s.inputPortId)}catch(i){console.warn("Failed to restore connection:",i)}})}createNodeFromType(e){throw new Error("createNodeFromType must be implemented")}on(e,t){this.listeners.has(e)||this.listeners.set(e,[]),this.listeners.get(e).push(t)}off(e,t){const s=this.listeners.get(e);if(s){const i=s.indexOf(t);i!==-1&&s.splice(i,1)}}emit(e,t){const s=this.listeners.get(e);s&&s.forEach(i=>i(t))}}class L{constructor(e,t){this.canvas=e,this.ctx=e.getContext("2d"),this.graph=t,this.gridSize=20,this.majorGridSize=100,this.nodeWidth=180,this.nodeHeaderHeight=30,this.portRadius=6,this.portSpacing=25,this.offset={x:0,y:0},this.scale=1,this.minScale=.1,this.maxScale=3,this.draggedNode=null,this.dragOffset={x:0,y:0},this.hoveredNode=null,this.hoveredPort=null,this.selectedNodes=new Set,this.connectionStart=null,this.connectionPreview=null,this.mousePosition={x:0,y:0},this.isPanning=!1,this.panStart={x:0,y:0},this.theme={background:"#1e1e1e",grid:"#2a2a2a",majorGrid:"#353535",nodeBackground:"#2d2d2d",nodeHeader:"#404040",nodeBorder:"#555",nodeSelectedBorder:"#ff6600",nodeText:"#fff",portStroke:"#666",connectionStroke:3,connectionPreview:"#888"},this.init()}init(){this.setupHighDPI(),this.bindEvents(),this.graph.on("nodeAdded",()=>this.render()),this.graph.on("nodeRemoved",()=>this.render()),this.graph.on("connectionAdded",()=>this.render()),this.graph.on("connectionRemoved",()=>this.render()),this.startRenderLoop()}setupHighDPI(){const t=this.canvas.parentElement.getBoundingClientRect(),s=this.canvas.getBoundingClientRect(),i=t.width>0?t.width:s.width,o=t.height>0?t.height:s.height,n=Math.max(i,800),r=Math.max(o,600),a=window.devicePixelRatio||1;this.canvas.width=n*a,this.canvas.height=r*a,this.ctx.scale(a,a),this.canvas.style.width=n+"px",this.canvas.style.height=r+"px",console.log(`Canvas resized: ${n} x ${r} DPR: ${a}`)}bindEvents(){this.canvas.addEventListener("mousedown",e=>this.onMouseDown(e)),this.canvas.addEventListener("mousemove",e=>this.onMouseMove(e)),this.canvas.addEventListener("mouseup",e=>this.onMouseUp(e)),this.canvas.addEventListener("wheel",e=>this.onWheel(e)),this.canvas.addEventListener("dblclick",e=>this.onDoubleClick(e)),this.canvas.addEventListener("keydown",e=>this.onKeyDown(e)),this.canvas.tabIndex=1,this.canvas.addEventListener("contextmenu",e=>e.preventDefault()),window.addEventListener("resize",()=>this.onResize())}startRenderLoop(){const e=()=>{this.render(),requestAnimationFrame(e)};requestAnimationFrame(e)}screenToCanvas(e,t){const s=this.canvas.getBoundingClientRect();return{x:(e-s.left-this.offset.x)/this.scale,y:(t-s.top-this.offset.y)/this.scale}}canvasToScreen(e,t){const s=this.canvas.getBoundingClientRect();return{x:e*this.scale+this.offset.x+s.left,y:t*this.scale+this.offset.y+s.top}}getNodeAt(e,t){const s=this.screenToCanvas(e,t),i=Array.from(this.graph.nodes.values()).reverse();for(const o of i)if(s.x>=o.position.x&&s.x<=o.position.x+o.size.width&&s.y>=o.position.y&&s.y<=o.position.y+o.size.height)return o;return null}getPortAt(e,t){const s=this.screenToCanvas(e,t);for(const i of this.graph.nodes.values()){for(let o=0;o<i.inputs.length;o++){const n=this.getPortPosition(i,i.inputs[o],o,!0);if(Math.hypot(s.x-n.x,s.y-n.y)<=this.portRadius+4)return{node:i,port:i.inputs[o],isInput:!0}}for(let o=0;o<i.outputs.length;o++){const n=this.getPortPosition(i,i.outputs[o],o,!1);if(Math.hypot(s.x-n.x,s.y-n.y)<=this.portRadius+4)return{node:i,port:i.outputs[o],isInput:!1}}}return null}getPortPosition(e,t,s,i){const o=i?e.position.x:e.position.x+e.size.width,n=e.position.y+this.nodeHeaderHeight+(s+1)*this.portSpacing;return{x:o,y:n}}onMouseDown(e){const t=e.clientX,s=e.clientY;this.canvas.focus();const i=this.getPortAt(t,s);if(i){this.startConnection(i);return}const o=this.getNodeAt(t,s);if(o){e.shiftKey?this.selectedNodes.has(o)?this.selectedNodes.delete(o):this.selectedNodes.add(o):this.selectedNodes.has(o)||(this.selectedNodes.clear(),this.selectedNodes.add(o)),this.updatePropertyPanel();const n=this.screenToCanvas(t,s);this.draggedNode=o,this.dragOffset={x:n.x-o.position.x,y:n.y-o.position.y};return}e.button===2||e.button===1||e.button===0&&e.altKey?(this.isPanning=!0,this.panStart={x:e.clientX,y:e.clientY},this.canvas.style.cursor="grab"):(this.selectedNodes.clear(),this.updatePropertyPanel())}onMouseMove(e){const t=e.clientX,s=e.clientY;if(this.mousePosition=this.screenToCanvas(t,s),this.connectionStart){this.connectionPreview={x:t,y:s};return}if(this.draggedNode){const i=this.screenToCanvas(t,s),o=Math.round((i.x-this.dragOffset.x)/this.gridSize)*this.gridSize,n=Math.round((i.y-this.dragOffset.y)/this.gridSize)*this.gridSize,r=o-this.draggedNode.position.x,a=n-this.draggedNode.position.y;this.selectedNodes.forEach(c=>{c.position.x+=r,c.position.y+=a});return}if(this.isPanning){this.offset.x+=e.clientX-this.panStart.x,this.offset.y+=e.clientY-this.panStart.y,this.panStart={x:e.clientX,y:e.clientY};return}this.hoveredPort=this.getPortAt(t,s),this.hoveredNode=this.hoveredPort?null:this.getNodeAt(t,s),this.hoveredPort?this.canvas.style.cursor="crosshair":this.hoveredNode?this.canvas.style.cursor="move":this.canvas.style.cursor="default"}onMouseUp(e){if(this.connectionStart){const t=this.getPortAt(e.clientX,e.clientY);if(t&&this.connectionStart.port.canConnectTo(t.port))try{this.connectionStart.isInput?this.graph.connectNodes(t.node.id,t.port.id,this.connectionStart.node.id,this.connectionStart.port.id):this.graph.connectNodes(this.connectionStart.node.id,this.connectionStart.port.id,t.node.id,t.port.id)}catch(s){console.error("Connection failed:",s)}this.connectionStart=null,this.connectionPreview=null}this.draggedNode=null,this.isPanning&&(this.isPanning=!1,this.canvas.style.cursor="default")}onWheel(e){e.preventDefault();const t=e.deltaY,s=1.1,i=t<0?this.scale*s:this.scale/s;this.scale=Math.max(this.minScale,Math.min(this.maxScale,i));const o=this.canvas.getBoundingClientRect(),n=e.clientX-o.left,r=e.clientY-o.top,a=i/this.scale;this.offset.x=n-(n-this.offset.x)*a,this.offset.y=r-(r-this.offset.y)*a}onDoubleClick(e){const t=this.screenToCanvas(e.clientX,e.clientY);for(const s of this.graph.connections){const i=this.getPortPosition(s.outputNode,s.outputPort,s.outputNode.outputs.indexOf(s.outputPort),!1),o=this.getPortPosition(s.inputNode,s.inputPort,s.inputNode.inputs.indexOf(s.inputPort),!0);if(this.pointToLineDistance(t,i,o)<10){this.graph.removeConnection(s.id);break}}}onKeyDown(e){(e.key==="Delete"||e.key==="Backspace")&&(this.selectedNodes.forEach(t=>{this.graph.removeNode(t.id)}),this.selectedNodes.clear())}onResize(){this.setupHighDPI()}startConnection(e){this.connectionStart=e,this.connectionPreview=this.canvasToScreen(...Object.values(this.getPortPosition(e.node,e.port,e.isInput?e.node.inputs.indexOf(e.port):e.node.outputs.indexOf(e.port),e.isInput)))}render(){const e=this.ctx,t=this.canvas.width/(window.devicePixelRatio||1),s=this.canvas.height/(window.devicePixelRatio||1);e.fillStyle=this.theme.background,e.fillRect(0,0,t,s),e.save(),e.translate(this.offset.x,this.offset.y),e.scale(this.scale,this.scale),this.drawGrid(e,t,s),this.graph.connections.forEach(i=>this.drawConnection(e,i)),this.connectionStart&&this.connectionPreview&&this.drawConnectionPreview(e),this.graph.nodes.forEach(i=>this.drawNode(e,i)),e.restore()}drawGrid(e,t,s){const i=Math.floor(-this.offset.x/this.scale/this.gridSize)*this.gridSize,o=Math.floor(-this.offset.y/this.scale/this.gridSize)*this.gridSize,n=i+t/this.scale+this.gridSize,r=o+s/this.scale+this.gridSize;e.strokeStyle=this.theme.grid,e.lineWidth=1,e.beginPath();for(let a=i;a<=n;a+=this.gridSize)e.moveTo(a,o),e.lineTo(a,r);for(let a=o;a<=r;a+=this.gridSize)e.moveTo(i,a),e.lineTo(n,a);e.stroke(),e.strokeStyle=this.theme.majorGrid,e.lineWidth=2,e.beginPath();for(let a=i;a<=n;a+=this.majorGridSize)e.moveTo(a,o),e.lineTo(a,r);for(let a=o;a<=r;a+=this.majorGridSize)e.moveTo(i,a),e.lineTo(n,a);e.stroke()}drawNode(e,t){const s=t.position.x,i=t.position.y,o=t.size.width;t.size.height;const n=Math.max(t.inputs.length,t.outputs.length);t.size.height=this.nodeHeaderHeight+(n+1)*this.portSpacing,e.shadowColor="rgba(0, 0, 0, 0.5)",e.shadowBlur=10,e.shadowOffsetX=2,e.shadowOffsetY=2,e.fillStyle=this.theme.nodeBackground,this.roundRect(e,s,i,o,t.size.height,8),e.fill(),e.shadowColor="transparent",e.fillStyle=this.theme.nodeHeader,this.roundRect(e,s,i,o,this.nodeHeaderHeight,8,!0,!1),e.fill(),e.strokeStyle=this.selectedNodes.has(t)?this.theme.nodeSelectedBorder:this.theme.nodeBorder,e.lineWidth=this.selectedNodes.has(t)?2:1,this.roundRect(e,s,i,o,t.size.height,8),e.stroke(),e.fillStyle=this.theme.nodeText,e.font="14px sans-serif",e.textAlign="center",e.textBaseline="middle",e.fillText(t.title,s+o/2,i+this.nodeHeaderHeight/2),t.inputs.forEach((r,a)=>this.drawPort(e,t,r,a,!0)),t.outputs.forEach((r,a)=>this.drawPort(e,t,r,a,!1))}drawPort(e,t,s,i,o){const n=this.getPortPosition(t,s,i,o),r=P[s.type];e.fillStyle=r.color,e.strokeStyle=this.theme.portStroke,e.lineWidth=2,e.beginPath(),e.arc(n.x,n.y,this.portRadius,0,Math.PI*2),e.fill(),e.stroke(),this.hoveredPort&&this.hoveredPort.port===s&&(e.strokeStyle="#fff",e.lineWidth=2,e.beginPath(),e.arc(n.x,n.y,this.portRadius+4,0,Math.PI*2),e.stroke()),e.fillStyle=this.theme.nodeText,e.font="12px sans-serif",e.textAlign=o?"left":"right",e.textBaseline="middle";const a=o?n.x+15:n.x-15;e.fillText(s.name,a,n.y)}drawConnection(e,t){const s=this.getPortPosition(t.outputNode,t.outputPort,t.outputNode.outputs.indexOf(t.outputPort),!1),i=this.getPortPosition(t.inputNode,t.inputPort,t.inputNode.inputs.indexOf(t.inputPort),!0),o=P[t.outputPort.type];e.strokeStyle=o.color,e.lineWidth=this.theme.connectionStroke,this.drawBezierConnection(e,s,i)}drawConnectionPreview(e){if(!this.connectionStart)return;const t=this.getPortPosition(this.connectionStart.node,this.connectionStart.port,this.connectionStart.isInput?this.connectionStart.node.inputs.indexOf(this.connectionStart.port):this.connectionStart.node.outputs.indexOf(this.connectionStart.port),this.connectionStart.isInput),s=P[this.connectionStart.port.type];e.strokeStyle=s.color,e.lineWidth=this.theme.connectionStroke,e.setLineDash([5,5]),this.connectionStart.isInput?this.drawBezierConnection(e,this.mousePosition,t):this.drawBezierConnection(e,t,this.mousePosition),e.setLineDash([])}drawBezierConnection(e,t,s){const i=t.x+(s.x-t.x)*.5,o=t.y,n=s.x-(s.x-t.x)*.5,r=s.y;e.beginPath(),e.moveTo(t.x,t.y),e.bezierCurveTo(i,o,n,r,s.x,s.y),e.stroke()}roundRect(e,t,s,i,o,n,r=!1,a=!1){e.beginPath(),r?(e.moveTo(t+n,s),e.lineTo(t+i-n,s),e.arcTo(t+i,s,t+i,s+n,n),e.lineTo(t+i,s+o),e.lineTo(t,s+o),e.lineTo(t,s+n),e.arcTo(t,s,t+n,s,n)):a?(e.moveTo(t,s),e.lineTo(t+i,s),e.lineTo(t+i,s+o-n),e.arcTo(t+i,s+o,t+i-n,s+o,n),e.lineTo(t+n,s+o),e.arcTo(t,s+o,t,s+o-n,n),e.lineTo(t,s)):(e.moveTo(t+n,s),e.lineTo(t+i-n,s),e.arcTo(t+i,s,t+i,s+n,n),e.lineTo(t+i,s+o-n),e.arcTo(t+i,s+o,t+i-n,s+o,n),e.lineTo(t+n,s+o),e.arcTo(t,s+o,t,s+o-n,n),e.lineTo(t,s+n),e.arcTo(t,s,t+n,s,n)),e.closePath()}pointToLineDistance(e,t,s){const i=e.x-t.x,o=e.y-t.y,n=s.x-t.x,r=s.y-t.y,a=i*n+o*r,c=n*n+r*r;let l=-1;c!==0&&(l=a/c);let h,m;l<0?(h=t.x,m=t.y):l>1?(h=s.x,m=s.y):(h=t.x+l*n,m=t.y+l*r);const u=e.x-h,y=e.y-m;return Math.sqrt(u*u+y*y)}updatePropertyPanel(){const e=document.getElementById("properties-content");if(e){if(e.innerHTML="",this.selectedNodes.size===0){e.innerHTML='<p class="placeholder-text">Select a node to edit properties</p>';return}if(this.selectedNodes.size===1){const t=Array.from(this.selectedNodes)[0];this.renderNodeProperties(t,e)}else e.innerHTML=`<p class="placeholder-text">${this.selectedNodes.size} nodes selected</p>`}}renderNodeProperties(e,t){const s=document.createElement("h3");if(s.textContent=e.type.split("/")[1]||e.type,s.className="node-title",t.appendChild(s),e.parameters&&Object.keys(e.parameters).length>0)Object.entries(e.parameters).forEach(([i,o])=>{const n=document.createElement("div");n.className="property-group";const r=document.createElement("label");r.className="property-label",r.textContent=o.label||i;let a;switch(o.type){case"number":a=document.createElement("input"),a.type="number",a.className="property-input",a.value=o.value||o.default||0,o.min!==void 0&&(a.min=o.min),o.max!==void 0&&(a.max=o.max),o.step!==void 0&&(a.step=o.step),a.addEventListener("input",c=>{const l=parseFloat(c.target.value);e.setParameter(i,l)});break;case"string":a=document.createElement("input"),a.type="text",a.className="property-input",a.value=o.value||o.default||"",a.addEventListener("input",c=>{e.setParameter(i,c.target.value)});break;case"select":a=document.createElement("select"),a.className="property-input",o.options&&o.options.forEach(c=>{const l=document.createElement("option");l.value=c.value||c,l.textContent=c.label||c,(c.value===o.value||c===o.value)&&(l.selected=!0),a.appendChild(l)}),a.addEventListener("change",c=>{e.setParameter(i,c.target.value)});break;case"boolean":a=document.createElement("input"),a.type="checkbox",a.className="property-checkbox",a.checked=o.value||o.default||!1,a.addEventListener("change",c=>{e.setParameter(i,c.target.checked)});break;default:a=document.createElement("input"),a.type="text",a.className="property-input",a.value=o.value||o.default||"",a.addEventListener("input",c=>{e.setParameter(i,c.target.value)})}n.appendChild(r),n.appendChild(a),t.appendChild(n)});else{const i=document.createElement("p");i.className="placeholder-text",i.textContent="No parameters available",t.appendChild(i)}}}class g extends M{constructor(e){super(e),this.category="general"}generateAmyEvent(){return{}}}class k extends g{constructor(){super("oscillator"),this.title="Oscillator",this.category="generator",this.addOutput("Audio","AUDIO");const e=["SINE","PULSE","SAW_DOWN","SAW_UP","TRIANGLE","NOISE","KS","PCM","ALGO","PARTIAL"];this.addParameter("wave_type","SINE",null,null,null,"select",e),this.addParameter("frequency",440,20,2e4,1),this.addParameter("amplitude",.5,0,1,.01),this.addParameter("phase",0,0,1,.01),this.addParameter("duty",.5,0,1,.01)}generateCode(){const e=this.getParameter("wave_type"),t=this.getParameter("frequency"),s=this.getParameter("amplitude"),i=this.getParameter("phase");let o=`// ${this.title}
`;return o+=`amy_event e = amy_default_event();
`,o+=`e.osc = ${this.oscIndex||0};
`,o+=`e.wave = ${e};
`,o+=`e.freq = ${t};
`,o+=`e.amp = ${s};
`,o+=`e.phase = ${i};
`,e==="PULSE"&&(o+=`e.duty = ${this.getParameter("duty")};
`),o+=`amy_add_event(&e);
`,o}}class F extends g{constructor(){super("filter"),this.title="Filter",this.category="processor",this.addInput("Audio In","AUDIO"),this.addInput("Freq Mod","CONTROL"),this.addOutput("Audio Out","AUDIO");const e=["LPF","HPF","BPF"];this.addParameter("filter_type","LPF",null,null,null,"select",e),this.addParameter("filter_freq",1e3,20,2e4,1),this.addParameter("filter_resonance",1,.1,20,.1)}generateCode(){const e=this.getParameter("filter_type"),t=this.getParameter("filter_freq"),s=this.getParameter("filter_resonance");let i=`// ${this.title}
`;return i+=`e.filter_type = ${e==="LPF"?1:e==="BPF"?2:3};
`,i+=`e.filter_freq = ${t};
`,i+=`e.filter_resonance = ${s};
`,i}}class U extends g{constructor(){super("envelope"),this.title="Envelope",this.category="modulation",this.addInput("Audio In","AUDIO"),this.addInput("Gate","GATE"),this.addOutput("Audio Out","AUDIO"),this.addParameter("attack",.01,0,5,.01),this.addParameter("decay",.1,0,5,.01),this.addParameter("sustain",.7,0,1,.01),this.addParameter("release",.5,0,5,.01)}generateCode(){const e=this.getParameter("attack"),t=this.getParameter("decay"),s=this.getParameter("sustain"),i=this.getParameter("release");let o=`// ${this.title} - ADSR Envelope
`;return o+=`e.bp0[0] = ${e};     // Attack time
`,o+=`e.bp0[1] = 1.0;      // Attack level
`,o+=`e.bp0[2] = ${t};     // Decay time
`,o+=`e.bp0[3] = ${s};     // Sustain level
`,o+=`e.bp1[0] = ${i};     // Release time
`,o+=`e.bp1[1] = 0.0;      // Release level
`,o}}class R extends g{constructor(){super("lfo"),this.title="LFO",this.category="modulation",this.addOutput("Control","CONTROL"),this.addParameter("frequency",1,.01,20,.01),this.addParameter("amplitude",1,0,1,.01);const e=["SINE","TRIANGLE","SAW_DOWN","SAW_UP","PULSE"];this.addParameter("wave_type","SINE",null,null,null,"select",e)}generateCode(){const e=this.getParameter("frequency"),t=this.getParameter("amplitude"),s=this.getParameter("wave_type");let i=`// ${this.title} - Low Frequency Oscillator
`;return i+=`amy_event lfo = amy_default_event();
`,i+=`lfo.osc = ${this.oscIndex||0};
`,i+=`lfo.wave = ${s};
`,i+=`lfo.freq = ${e};
`,i+=`lfo.amp = ${t};
`,i+=`amy_add_event(&lfo);
`,i}}class G extends g{constructor(){super("mixer"),this.title="Mixer",this.category="utility",this.addInput("Input 1","AUDIO"),this.addInput("Input 2","AUDIO"),this.addInput("Input 3","AUDIO"),this.addInput("Input 4","AUDIO"),this.addOutput("Mix Out","AUDIO"),this.addParameter("gain_1",1,0,2,.01),this.addParameter("gain_2",1,0,2,.01),this.addParameter("gain_3",0,0,2,.01),this.addParameter("gain_4",0,0,2,.01)}generateCode(){let e=`// ${this.title} - 4-channel mixer
`;return e+=`// Mix gains: ${this.getParameter("gain_1")}, ${this.getParameter("gain_2")}, ${this.getParameter("gain_3")}, ${this.getParameter("gain_4")}
`,e}}class D extends g{constructor(){super("reverb"),this.title="Reverb",this.category="processor",this.addInput("Audio In","AUDIO"),this.addOutput("Audio Out","AUDIO"),this.addParameter("level",.3,0,1,.01),this.addParameter("liveness",.7,0,1,.01),this.addParameter("damping",.5,0,1,.01),this.addParameter("xover_hz",3e3,100,1e4,100)}generateCode(){const e=this.getParameter("level"),t=this.getParameter("liveness"),s=this.getParameter("damping"),i=this.getParameter("xover_hz");let o=`// ${this.title} - Global reverb effect
`;return o+=`amy_send_message("r${e.toFixed(3)},${t.toFixed(3)},${s.toFixed(3)},${i}");
`,o}}class q extends g{constructor(){super("chorus"),this.title="Chorus",this.category="processor",this.addInput("Audio In","AUDIO"),this.addOutput("Audio Out","AUDIO"),this.addParameter("level",.5,0,1,.01),this.addParameter("max_delay",320,100,1e3,10),this.addParameter("lfo_freq",.5,.1,10,.1),this.addParameter("depth",.5,0,1,.01)}generateCode(){const e=this.getParameter("level"),t=this.getParameter("max_delay"),s=this.getParameter("lfo_freq"),i=this.getParameter("depth");let o=`// ${this.title} - Global chorus effect
`;return o+=`amy_send_message("c${e.toFixed(3)},${t.toFixed(3)},${s.toFixed(3)},${i.toFixed(3)}");
`,o}}class z extends g{constructor(){super("adc"),this.title="ADC Input",this.category="input",this.addOutput("Control","CONTROL"),this.addParameter("pin",0,0,15,1),this.addParameter("min_value",0,-1e4,1e4,1),this.addParameter("max_value",1,-1e4,1e4,1),this.addParameter("smooth",.1,0,1,.01)}generateCode(){const e=this.getParameter("pin"),t=this.getParameter("min_value"),s=this.getParameter("max_value"),i=this.getParameter("smooth");let o=`// ${this.title} - Analog input
`;return o+=`float adc${e}_raw = analogRead(${e});
`,o+=`float adc${e}_smoothed = adc${e}_smoothed * ${i} + adc${e}_raw * (1.0 - ${i});
`,o+=`float adc${e}_mapped = map(adc${e}_smoothed, 0, 1023, ${t}, ${s});
`,o}}class B extends g{constructor(){super("gpio"),this.title="GPIO Input",this.category="input",this.addOutput("Gate","GATE"),this.addParameter("pin",2,0,40,1),this.addParameter("pullup",!0,null,null,null,"boolean"),this.addParameter("invert",!1,null,null,null,"boolean")}generateCode(){const e=this.getParameter("pin"),t=this.getParameter("pullup"),s=this.getParameter("invert");let i=`// ${this.title} - Digital input
`;return i+=`pinMode(${e}, ${t?"INPUT_PULLUP":"INPUT"});
`,i+=`bool gpio${e} = digitalRead(${e})${s?" == LOW":" == HIGH"};
`,i}}class Y extends g{constructor(){super("output"),this.title="Audio Output",this.category="output",this.addInput("Audio","AUDIO"),this.addParameter("gain",1,0,2,.01)}generateCode(){const e=this.getParameter("gain");let t=`// ${this.title} - Main audio output
`;return t+=`// Output gain: ${e}
`,t}}class V extends g{constructor(){super("map"),this.title="Map Range",this.category="utility",this.addInput("Input","CONTROL"),this.addOutput("Output","CONTROL"),this.addParameter("in_min",0,-1e4,1e4,.1),this.addParameter("in_max",1,-1e4,1e4,.1),this.addParameter("out_min",0,-1e4,1e4,.1),this.addParameter("out_max",1,-1e4,1e4,.1)}generateCode(){const e=this.getParameter("in_min"),t=this.getParameter("in_max"),s=this.getParameter("out_min"),i=this.getParameter("out_max");let o=`// ${this.title} - Value mapping
`;return o+=`// Map from [${e}, ${t}] to [${s}, ${i}]
`,o}}const H={oscillator:k,filter:F,envelope:U,lfo:R,mixer:G,reverb:D,chorus:q,adc:z,gpio:B,output:Y,map:V};function E(d){const e=H[d];if(!e)throw new Error(`Unknown node type: ${d}`);return new e}class W{constructor(){this.amyModule=null,this.isInitialized=!1,this.oscillatorCount=0,this.sampleRate=44100,this.audioContext=null,this.scriptProcessor=null,this.sampleIndex=0,this.fallbackMode=!1}async initialize(e){if(this.isInitialized)return!0;try{if(this.audioContext=e,this.sampleRate=e.sampleRate,console.log("Loading AMY WASM module..."),this.amyModule=await this.loadAmyModule(),console.log("AMY WASM module loaded successfully"),await this.waitForModuleReady(),!this.amyModule._amy_start_web)throw new Error("AMY _amy_start_web function not found");if(this.amyModule.__wasm_call_ctors){console.log("Calling WASM constructors...");try{this.amyModule.__wasm_call_ctors()}catch(t){console.warn("WASM constructors might already be called:",t)}}console.log("Calling AMY _amy_start_web()...");try{this.amyModule._amy_start_web(),console.log("✅ AMY _amy_start_web() called successfully")}catch(t){throw console.error("❌ Failed to call _amy_start_web:",t),t}return await new Promise(t=>setTimeout(t,200)),!this.amyModule.HEAPU8&&!this.amyModule.HEAP8&&(console.warn("⚠️ AMY WASM memory views not available - using fallback mode"),this.fallbackMode=!0),await this.setupScriptProcessor(),this.isInitialized=!0,!0}catch(t){return console.error("Failed to initialize AMY WASM:",t),!1}}async waitForModuleReady(){let e=0;const t=50;for(console.log("Initializing AMY WASM module...");e<t;){if(this.amyModule.HEAPU8&&this.amyModule._malloc&&this.amyModule._free&&this.amyModule._amy_start_web){console.log("✅ AMY WASM module memory views are ready");return}await new Promise(s=>setTimeout(s,100)),e++}this.fallbackMode=!0}async setupScriptProcessor(){try{return this.scriptProcessor=this.audioContext.createScriptProcessor(4096,0,2),this.scriptProcessor.onaudioprocess=t=>{const s=t.outputBuffer,i=s.getChannelData(0),o=s.getChannelData(1);try{if(this.amyModule&&this.amyModule._amy_render){const n=this.amyModule._amy_render(4096);if(n)for(let r=0;r<4096;r++){const a=n[r]||0;i[r]=a*.1,o[r]=a*.1}else{for(let c=0;c<4096;c++){const l=Math.sin(2*Math.PI*440*(this.sampleIndex+c)/this.sampleRate)*.05;i[c]=l,o[c]=l}this.sampleIndex=(this.sampleIndex+4096)%this.sampleRate}}else i.fill(0),o.fill(0)}catch(n){console.error("Audio processing error:",n),i.fill(0),o.fill(0)}},console.log("AMY ScriptProcessor setup complete"),Promise.resolve()}catch(e){throw console.error("Failed to setup ScriptProcessor:",e),e}}connect(e){this.scriptProcessor&&this.scriptProcessor.connect(e)}disconnect(){this.scriptProcessor&&this.scriptProcessor.disconnect()}async loadAmyModule(){return new Promise((e,t)=>{if(typeof window.amyModule=="function"){window.amyModule().then(i=>{console.log("AMY module loaded from cache"),e(i)}).catch(t);return}const s=document.createElement("script");s.src="/amy.js",s.onload=()=>{setTimeout(()=>{const i=window.amyModule;typeof i=="function"?(console.log("Found AMY module factory, initializing..."),i().then(o=>{console.log("AMY module initialized, checking properties..."),console.log("Module properties:",Object.keys(o)),!o.HEAPU8&&o._malloc&&console.warn("HEAPU8 not found on module, might need to wait for initialization"),e(o)}).catch(t)):(console.error("AMY module factory not found:",typeof i),t(new Error("AMY module factory not found after loading amy.js")))},100)},s.onerror=i=>{console.error("Failed to load amy.js:",i),t(new Error("Failed to load amy.js"))},document.head.appendChild(s)})}createOscillator(e={}){if(!this.isInitialized)return console.warn("AmyWASM not initialized, cannot create oscillator"),-1;const t=this.oscillatorCount++;try{const s=this.mapWaveType(e.wave_type||"SINE");return this.setOscillatorType(t,s),this.setFrequency(t,e.frequency||440),this.setAmplitude(t,e.amplitude||.5),e.phase!==void 0&&this.setPhase(t,e.phase),e.duty!==void 0&&e.wave_type==="PULSE"&&this.setDuty(t,e.duty),console.log(`✅ Created AMY oscillator ${t} with type ${e.wave_type||"SINE"}`),t}catch(s){return console.error(`❌ Failed to create AMY oscillator ${t}:`,s),-1}}mapWaveType(e){return{SINE:0,PULSE:1,SAW_DOWN:2,SAW_UP:3,TRIANGLE:4,NOISE:5,KS:6,PCM:7,ALGO:8,PARTIAL:9}[e]||0}setOscillatorType(e,t){this.isInitialized&&this.sendMessage(`v${e}w${t}`)}setFrequency(e,t){this.isInitialized&&this.sendMessage(`v${e}f${t.toFixed(3)}`)}setAmplitude(e,t){this.isInitialized&&this.sendMessage(`v${e}a${t.toFixed(3)}`)}setPhase(e,t){this.isInitialized&&this.sendMessage(`v${e}P${t.toFixed(3)}`)}setDuty(e,t){this.isInitialized&&this.sendMessage(`v${e}d${t.toFixed(3)}`)}setFilter(e,t,s,i){if(!this.isInitialized)return;const n={LPF:1,BPF:2,HPF:3}[t]||1;this.sendMessage(`v${e}F${n}`),this.sendMessage(`v${e}f${s.toFixed(1)}`),this.sendMessage(`v${e}r${i.toFixed(2)}`)}setReverb(e,t,s,i){this.isInitialized&&this.sendMessage(`r${e.toFixed(3)},${t.toFixed(3)},${s.toFixed(3)},${i||3e3}`)}setChorus(e,t,s,i){this.isInitialized&&this.sendMessage(`c${e.toFixed(3)},${t.toFixed(3)},${s.toFixed(3)},${i.toFixed(3)}`)}setEcho(e,t,s,i){this.isInitialized&&this.sendMessage(`E${e.toFixed(3)},${t.toFixed(3)},${s.toFixed(3)},${i.toFixed(3)}`)}noteOn(e,t,s=1){if(!this.isInitialized)return;const i=440*Math.pow(2,(t-69)/12);this.setFrequency(e,i),this.setAmplitude(e,s)}noteOff(e){this.isInitialized&&this.setAmplitude(e,0)}sendMessage(e){if(!(!this.isInitialized||!this.amyModule||this.fallbackMode))try{if(!this.amyModule._malloc||!this.amyModule._free){console.warn("AMY WASM memory functions not available, skipping message:",e);return}let t,s;if(this.amyModule.stringToUTF8){if(t=this.amyModule._malloc(e.length+1),!t){console.error("Failed to allocate memory for AMY message");return}this.amyModule.stringToUTF8(e,t,e.length+1),console.log("Using stringToUTF8 for message conversion")}else if(this.amyModule.HEAPU8){if(s=new TextEncoder().encode(e+"\0"),t=this.amyModule._malloc(s.length),!t){console.error("Failed to allocate memory for AMY message");return}this.amyModule.HEAPU8.set(s,t),console.log("Using TextEncoder + HEAPU8 for message conversion")}else{if(console.warn("No suitable string conversion method available, trying direct buffer approach"),s=new TextEncoder().encode(e+"\0"),t=this.amyModule._malloc(s.length),!t){console.error("Failed to allocate memory for AMY message");return}if(this.amyModule.HEAP8)this.amyModule.HEAP8.set(s,t),console.log("Using HEAP8 as fallback for message conversion");else if(this.amyModule.buffer)new Uint8Array(this.amyModule.buffer,t,s.length).set(s),console.log("Using direct buffer access for message conversion");else{console.error("No memory access method available, cannot send AMY message"),this.amyModule._free(t);return}}this.amyModule._amy_add_message?(this.amyModule._amy_add_message(t),console.log(`✅ AMY message sent: ${e}`)):this.amyModule.ccall?(this.amyModule.ccall("amy_add_message",null,["number"],[t]),console.log(`✅ AMY message sent via ccall: ${e}`)):console.warn("No AMY message function available (_amy_add_message or ccall)"),this.amyModule._free(t)}catch(t){console.error("Error sending AMY message:",t),console.log("AMY module state:",{hasHEAPU8:!!this.amyModule.HEAPU8,hasHEAP8:!!this.amyModule.HEAP8,hasMalloc:!!this.amyModule._malloc,hasFree:!!this.amyModule._free,hasStringToUTF8:!!this.amyModule.stringToUTF8,hasAmyAddMessage:!!this.amyModule._amy_add_message,hasCCall:!!this.amyModule.ccall})}}stopAll(){if(this.isInitialized)for(let e=0;e<this.oscillatorCount;e++)this.setAmplitude(e,0)}reset(){this.isInitialized&&(this.oscillatorCount=0,this.amyModule&&this.amyModule._amy_reset_sysclock&&this.amyModule._amy_reset_sysclock())}getInfo(){return{isInitialized:this.isInitialized,oscillatorCount:this.oscillatorCount,sampleRate:this.sampleRate,wasmSupport:typeof WebAssembly<"u"}}}const v=new W;class j{constructor(){this.context=null,this.nodes=new Map,this.isRunning=!1,this.masterGain=null,this.useAMYWASM=!1,this.amyInitialized=!1}async start(){if(this.context||(this.context=new(window.AudioContext||window.webkitAudioContext),this.masterGain=this.context.createGain(),this.masterGain.connect(this.context.destination)),this.context.state==="suspended"&&await this.context.resume(),!this.amyInitialized)try{console.log("🔄 Initializing audio engine...");const e=await v.initialize(this.context);console.log("🎵 Using WebAudio for preview"),this.amyInitialized=!1,this.createWebAudioFallback()}catch(e){console.error("AMY WASM initialization failed:",e),console.log("⚠️ Using WebAudio fallback due to AMY WASM error"),this.createWebAudioFallback()}this.isRunning=!0}createWebAudioFallback(){this.testOscillator||(this.testOscillator=this.context.createOscillator(),this.testGain=this.context.createGain(),this.testOscillator.frequency.value=440,this.testGain.gain.value=.1,this.testOscillator.connect(this.testGain),this.testGain.connect(this.masterGain),this.testOscillator.start())}stop(){if(this.isRunning=!1,this.clearAllNodes(),this.testOscillator){try{this.testOscillator.stop(),this.testOscillator.disconnect(),this.testGain.disconnect()}catch{}this.testOscillator=null,this.testGain=null,console.log("🔇 Test oscillator stopped")}}clearAllNodes(){this.nodes.forEach(e=>{e.oscillator&&(e.oscillator.stop(),e.oscillator.disconnect()),e.gain&&e.gain.disconnect()}),this.nodes.clear()}updateFromGraph(e){if(!this.isRunning||!this.context)return;const t=e.getNodes(),s=new Set(this.nodes.keys()),i=new Set(t.map(o=>o.id));s.forEach(o=>{i.has(o)||this.removeAudioNode(o)}),t.forEach(o=>{switch(o.type){case"oscillator":case"amy/oscillator":this.updateOscillator(o);break;case"lfo":case"amy/lfo":this.updateLFO(o);break;case"mixer":case"amy/mixer":this.updateMixer(o);break;case"filter":case"amy/filter":this.updateFilter(o);break;case"reverb":case"amy/reverb":this.updateReverb(o);break;case"chorus":case"amy/chorus":this.updateChorus(o);break;case"echo":case"amy/echo":this.updateEcho(o);break;case"amy/sampleplayer":this.updateSamplePlayer(o);break;case"amy/sequencer":this.updateSequencer(o);break;case"amy/clock":this.updateClock(o);break;case"amy/keyboard":this.updateKeyboard(o);break;case"amy/drums":this.updateDrumMachine(o);break;case"output":case"amy/output":this.updateOutput(o);break}}),this.updateConnections(e)}updateOscillator(e){var l,h,m;let t=this.nodes.get(e.id);if(this.amyInitialized&&!t)try{const u=v.createOscillator(e.properties);if(u>=0){t={amyOscId:u,type:"oscillator",isAMY:!0},this.nodes.set(e.id,t),console.log(`✅ Using AMY WASM for oscillator ${e.id}`);return}else console.log(`⚠️ AMY WASM oscillator creation failed, falling back to WebAudio for ${e.id}`)}catch(u){console.error(`❌ AMY WASM oscillator error for ${e.id}:`,u),console.log("🔄 Falling back to WebAudio approximation")}if(!t){const u=this.context.createOscillator(),y=this.context.createGain(),b=this.context.createBiquadFilter();u.connect(b),b.connect(y),y.connect(this.masterGain),u.start(),t={oscillator:u,gain:y,filter:b,type:"oscillator",isAMY:!1},this.nodes.set(e.id,t),console.log(`⚠️ Using WebAudio approximation for oscillator ${e.id}`)}const s={SINE:"sine",PULSE:"square",SAW_DOWN:"sawtooth",SAW_UP:"sawtooth",TRIANGLE:"triangle",NOISE:"sawtooth",KS:"sawtooth",PCM:"sine",PARTIAL:"sine",ALGO:"sine",FM:"sine"};let i,o,n;if(e.getParameter)i=e.getParameter("wave_type")||"SINE",o=e.getParameter("frequency")||440,n=e.getParameter("amplitude")||.5;else{const u=e.properties||{};i=u.wave_type||"SINE",o=u.frequency||440,n=u.amplitude||.5}t.oscillator.type=s[i]||"sine";const r=((l=e.getInputData)==null?void 0:l.call(e,0))??o,a=((h=e.getInputData)==null?void 0:h.call(e,1))??n;if((m=e.getInputData)==null||m.call(e,2),t.isAMY)try{if(v.setFrequency(t.amyOscId,r),v.setAmplitude(t.amyOscId,a),i){const u=v.mapWaveType(i);v.setOscillatorType(t.amyOscId,u)}}catch(u){console.error(`❌ Failed to update AMY oscillator ${t.amyOscId}:`,u)}else t.oscillator.frequency.setValueAtTime(r,this.context.currentTime),t.gain.gain.setValueAtTime(a,this.context.currentTime);const c=e.properties||{};if(!t.isAMY&&t.filter&&c.filter_type!=="NONE"){const u={LPF:"lowpass",HPF:"highpass",BPF:"bandpass"};t.filter.type=u[c.filter_type]||"lowpass",t.filter.frequency.setValueAtTime(c.filter_freq||1e3,this.context.currentTime),t.filter.Q.setValueAtTime(c.filter_resonance||1,this.context.currentTime)}else if(t.isAMY&&c.filter_type&&c.filter_type!=="NONE")try{v.setFilter(t.amyOscId,c.filter_type,c.filter_freq||1e3,c.filter_resonance||1)}catch(u){console.error("Failed to set AMY filter:",u)}if(!t.isAMY&&t.oscillator&&c.phase!==void 0)t.oscillator.detune.setValueAtTime(c.phase*100,this.context.currentTime);else if(t.isAMY&&c.phase!==void 0)try{v.setPhase(t.amyOscId,c.phase)}catch(u){console.error("Failed to set AMY phase:",u)}}updateMixer(e){let t=this.nodes.get(e.id);if(!t){const i=this.context.createGain();i.connect(this.masterGain),t={gain:i,type:"mixer",inputGains:[]};for(let o=0;o<4;o++){const n=this.context.createGain();n.connect(i),t.inputGains.push(n)}this.nodes.set(e.id,t)}const s=e.properties||{};t.gain.gain.setValueAtTime(s.master_gain||1,this.context.currentTime);for(let i=0;i<4;i++){const o=s[`gain${i+1}`]||1;t.inputGains[i].gain.setValueAtTime(o,this.context.currentTime)}}removeAudioNode(e){const t=this.nodes.get(e);if(t){if(t.oscillator)try{t.oscillator.stop(),t.oscillator.disconnect()}catch{}if(t.gain&&t.gain.disconnect(),t.inputGain&&t.inputGain.disconnect(),t.outputGain&&t.outputGain.disconnect(),t.inputGains&&t.inputGains.forEach(s=>s.disconnect()),t.filter&&t.filter.disconnect(),t.convolver&&t.convolver.disconnect(),t.delay&&t.delay.disconnect(),t.feedback&&t.feedback.disconnect(),t.wetGain&&t.wetGain.disconnect(),t.dryGain&&t.dryGain.disconnect(),t.output&&t.output.disconnect(),t.lfo)try{t.lfo.stop(),t.lfo.disconnect()}catch{}if(t.lfoGain&&t.lfoGain.disconnect(),t.noise)try{t.noise.stop(),t.noise.disconnect()}catch{}this.nodes.delete(e)}}updateConnections(e){this.nodes.forEach(t=>{t.gain&&t.type==="oscillator"&&t.gain.disconnect(),t.outputGain&&t.type==="output"&&t.inputGain&&t.inputGain.disconnect()}),e.links&&Object.values(e.links).forEach(t=>{if(t){const s=this.nodes.get(t.origin_id),i=this.nodes.get(t.target_id);s&&i&&(this.connectAudioNodes(s,i,t.target_slot),console.log(`🔗 Connected ${s.type} → ${i.type}`))}}),this.nodes.forEach((t,s)=>{t.type==="oscillator"&&t.gain&&(e.links&&Object.values(e.links).some(o=>o&&o.origin_id===s)||(console.log(`🔗 Fallback: Connecting unconnected ${t.type} to master`),t.gain.connect(this.masterGain)))})}connectAudioNodes(e,t,s=0){if(!e||!t)return;let i=null;e.gain?i=e.gain:e.output?i=e.output:e.oscillator&&(i=e.oscillator);let o=null;if(t.type==="output"&&t.inputGain?o=t.inputGain:t.type==="mixer"&&t.inputGains?o=t.inputGains[s]||t.inputGains[0]:t.input&&Array.isArray(t.input)?o=t.input[0]:t.dryGain?o=t.dryGain:t.filter&&(o=t.filter),i&&o)try{i.connect(o),console.log(`✅ Audio connection: ${e.type} → ${t.type}`)}catch(n){console.error(`❌ Audio connection failed: ${e.type} → ${t.type}`,n)}else console.warn(`⚠️ Could not connect: ${e.type} → ${t.type} (missing nodes)`)}updateLFO(e){let t=this.nodes.get(e.id);if(!t){const o=this.context.createOscillator(),n=this.context.createGain();o.connect(n),o.start(),t={oscillator:o,gain:n,type:"lfo"},this.nodes.set(e.id,t)}const s=e.properties||{},i=Math.max(.1,s.frequency||1);t.oscillator.frequency.setValueAtTime(i,this.context.currentTime),t.gain.gain.setValueAtTime(s.amplitude||1,this.context.currentTime)}updateFilter(e){let t=this.nodes.get(e.id);if(!t){const o=this.context.createBiquadFilter(),n=this.context.createGain();o.connect(n),n.connect(this.masterGain),t={filter:o,gain:n,type:"filter"},this.nodes.set(e.id,t)}const s={LPF:"lowpass",HPF:"highpass",BPF:"bandpass"},i=e.properties||{};t.filter.type=s[i.filter_type]||"lowpass",t.filter.frequency.setValueAtTime(i.frequency||1e3,this.context.currentTime),t.filter.Q.setValueAtTime(i.resonance||1,this.context.currentTime)}updateReverb(e){let t=this.nodes.get(e.id);if(!t){const o=this.context.createConvolver(),n=this.context.createGain(),r=this.context.createGain(),a=this.context.createGain();this.createReverbImpulse(o),n.connect(a),o.connect(r),r.connect(a),a.connect(this.masterGain),t={convolver:o,dryGain:n,wetGain:r,output:a,type:"reverb",input:n},this.nodes.set(e.id,t)}const i=(e.properties||{}).level||.3;t.dryGain.gain.setValueAtTime(1-i,this.context.currentTime),t.wetGain.gain.setValueAtTime(i,this.context.currentTime)}updateChorus(e){let t=this.nodes.get(e.id);if(!t){const i=this.context.createDelay(),o=this.context.createOscillator(),n=this.context.createGain(),r=this.context.createGain(),a=this.context.createGain(),c=this.context.createGain();o.connect(n),n.connect(i.delayTime),i.connect(r),r.connect(c),a.connect(c),c.connect(this.masterGain),o.start(),t={delay:i,lfo:o,lfoGain:n,wetGain:r,dryGain:a,output:c,type:"chorus",input:[i,a]},this.nodes.set(e.id,t)}const s=e.properties||{};t.delay.delayTime.setValueAtTime(s.max_delay||.02,this.context.currentTime),t.lfo.frequency.setValueAtTime(s.lfo_freq||.5,this.context.currentTime),t.lfoGain.gain.setValueAtTime(s.depth||.002,this.context.currentTime),t.wetGain.gain.setValueAtTime(s.level||.5,this.context.currentTime),t.dryGain.gain.setValueAtTime(1-(s.level||.5),this.context.currentTime)}updateEcho(e){let t=this.nodes.get(e.id);if(!t){const i=this.context.createDelay(),o=this.context.createGain(),n=this.context.createGain(),r=this.context.createGain(),a=this.context.createGain();i.connect(o),o.connect(i),i.connect(n),n.connect(a),r.connect(a),a.connect(this.masterGain),t={delay:i,feedback:o,wetGain:n,dryGain:r,output:a,type:"echo",input:[i,r]},this.nodes.set(e.id,t)}const s=e.properties||{};t.delay.delayTime.setValueAtTime(s.delay_time||.3,this.context.currentTime),t.feedback.gain.setValueAtTime(s.feedback||.3,this.context.currentTime),t.wetGain.gain.setValueAtTime(s.level||.5,this.context.currentTime),t.dryGain.gain.setValueAtTime(1-(s.level||.5),this.context.currentTime)}updateSamplePlayer(e){let t=this.nodes.get(e.id);if(!t){const i=this.context.createOscillator(),o=this.context.createGain();i.connect(o),o.connect(this.masterGain),i.type="sine",i.start(),t={oscillator:i,gain:o,type:"sampleplayer",beta:!0},this.nodes.set(e.id,t),console.warn("BETA: Sample Player using sine wave placeholder")}const s=e.properties||{};t.oscillator.frequency.setValueAtTime(s.base_freq||440,this.context.currentTime),t.gain.gain.setValueAtTime(s.amplitude||.5,this.context.currentTime)}updateSequencer(e){let t=this.nodes.get(e.id);t||(t={type:"sequencer",beta:!0,currentStep:0,lastTick:0},this.nodes.set(e.id,t),console.warn("BETA: Sequencer node - timing logic not fully implemented"));const s=e.properties||{};Date.now()-t.lastTick>250&&(t.currentStep=(t.currentStep+1)%(s.steps||16),t.lastTick=Date.now())}updateClock(e){let t=this.nodes.get(e.id);const s=e.properties||{};t||(t={type:"clock",beta:!0,interval:6e4/(s.bpm||120),lastTick:0},this.nodes.set(e.id,t),console.warn("BETA: Clock node - basic timing only")),t.interval=6e4/(s.bpm||120)}updateKeyboard(e){let t=this.nodes.get(e.id);const s=e.properties||{};t||(t={type:"keyboard",beta:!0,currentNote:s.current_note||60,gateOn:!1},this.nodes.set(e.id,t),console.warn("BETA: Keyboard node - web interaction required"))}updateDrumMachine(e){let t=this.nodes.get(e.id);if(!t){const i=2*this.context.sampleRate,o=this.context.createBuffer(1,i,this.context.sampleRate),n=o.getChannelData(0);for(let c=0;c<i;c++)n[c]=Math.random()*2-1;const r=this.context.createBufferSource(),a=this.context.createGain();r.buffer=o,r.loop=!0,r.connect(a),a.connect(this.masterGain),r.start(),t={noise:r,gain:a,type:"drums",beta:!0,currentStep:0},this.nodes.set(e.id,t),console.warn("BETA: Drum Machine using noise generator placeholder")}const s=e.properties||{};t.gain.gain.setValueAtTime(s.volume||.3,this.context.currentTime)}updateOutput(e){let t=this.nodes.get(e.id);if(!t){const o=this.context.createGain(),n=this.context.createGain();o.connect(n),n.connect(this.masterGain),t={inputGain:o,outputGain:n,type:"output",isOutput:!0},this.nodes.set(e.id,t),console.log("✅ Created Audio Output node with input routing")}const s=e.properties||{},i=s.master_volume||1;if(t.outputGain.gain.setValueAtTime(i,this.context.currentTime),this.amyInitialized)try{const o=Math.min(1,i);v.sendMessage(`g${o.toFixed(3)}`),s.stereo_mode&&console.log("📻 AMY Output: Stereo mode enabled")}catch(o){console.error("❌ Failed to set AMY output parameters:",o)}}createReverbImpulse(e){const t=this.context.sampleRate*2,s=this.context.createBuffer(2,t,this.context.sampleRate);for(let i=0;i<2;i++){const o=s.getChannelData(i);for(let n=0;n<t;n++)o[n]=(Math.random()*2-1)*Math.pow(1-n/t,2)}e.buffer=s}}class X{constructor(){this.nodeIdMap=new Map,this.nodeCounter=0,this.template=null}async loadTemplate(){if(!this.template)try{const e=await fetch("/templates/arduino_template.ino");this.template=await e.text()}catch(e){console.error("Failed to load template:",e),this.template=null}return this.template}generate(e){this.nodeIdMap.clear(),this.nodeCounter=0;const t=e._nodes,s=this.extractConnections(e);if(this.template)return this.generateFromTemplate(t,s);{let i=this.generateHeader();return i+=this.generateSetup(t,s),i+=this.generateLoop(t,s),i}}generateFromTemplate(e,t){const s=e.filter(p=>p.type==="amy/oscillator"),i=e.filter(p=>p.type==="amy/lfo"),o=e.filter(p=>p.type==="amy/filter"),n=e.filter(p=>p.type&&(p.type.includes("amy/reverb")||p.type.includes("amy/chorus")||p.type.includes("amy/echo"))),r=e.filter(p=>p.type==="amy/envelope"),a=e.filter(p=>p.type==="amy/mixer"),c=e.filter(p=>p.type==="amy/modmatrix"),l=e.filter(p=>p.type==="amy/sampleplayer"),h=e.filter(p=>p.type==="amy/sequencer"),m=e.filter(p=>p.type==="amy/clock"),u=e.filter(p=>p.type==="amy/drums"),y=e.filter(p=>p.type==="amy/keyboard"),b=e.filter(p=>p.type==="amy/adc"),S=e.filter(p=>p.type==="amy/gpio"),A=e.filter(p=>p.type==="amy/output"),x=e.filter(p=>p.type==="amy/map"),_=s.length+i.length+l.length;console.log(`Code generation: ${s.length} oscillators, ${n.length} effects, ${_} total voices`);const N={PIN_DEFINITIONS:this.generatePinDefinitions(b,S),GLOBAL_VARIABLES:this.generateGlobalVariables(e),OSCILLATOR_INDICES:this.generateOscillatorIndices(s,i),NUM_OSCILLATORS:Math.max(_,1),CONNECTION_ANALYSIS:this.generateConnectionAnalysis(t),PIN_SETUP:this.generatePinSetup(b,S),OSCILLATOR_SETUP:this.generateOscillatorSetupTemplate(s),LFO_SETUP:this.generateLFOSetup(i,s.length),ENVELOPE_SETUP:this.generateEnvelopeSetup(r),MIXER_SETUP:this.generateMixerSetup(a),SAMPLE_SETUP:this.generateSampleSetup(l),FILTER_SETUP:this.generateFilterSetup(o),EFFECT_SETUP:this.generateEffectSetup(n),MODULATION_SETUP:this.generateModulationSetup(c,t),SEQUENCER_SETUP:this.generateSequencerSetup(h,m,u),KEYBOARD_SETUP:this.generateKeyboardSetup(y),OUTPUT_SETUP:this.generateOutputSetup(A),MAPPING_SETUP:this.generateMappingSetup(x),INITIAL_VALUES:this.generateInitialValues(e),INPUT_READING:this.generateInputReading(b,S),MAPPINGS:this.generateMappings(e,t),PARAMETER_UPDATES:this.generateParameterUpdates(e,t),ENVELOPE_HANDLING:this.generateEnvelopeHandling(r,t),SEQUENCER_UPDATES:this.generateSequencerUpdates(h,m,u,y),LOOP_DELAY:this.calculateOptimalLoopDelay(e),HELPER_FUNCTIONS:this.generateHelperFunctions(),PATCH_NAME:this.generatePatchName(e),PATCH_DESCRIPTION:this.generatePatchDescription(e,t)};let w=this.template;return Object.entries(N).forEach(([p,C])=>{w=w.replace(new RegExp(`{{${p}}}`,"g"),C)}),w}generatePinDefinitions(e,t){let s=[];return e.forEach(i=>{s.push(`#define ${this.getNodeVariableName(i).toUpperCase()}_PIN ${i.properties.pin}`)}),t.forEach(i=>{s.push(`#define ${this.getNodeVariableName(i).toUpperCase()}_PIN ${i.properties.pin}`)}),s.join(`
`)}generateGlobalVariables(e){let t=[];return e.forEach(s=>{const i=this.getNodeVariableName(s);s.type==="amy/adc"?(t.push(`int ${i}_raw = 0;`),t.push(`float ${i}_mapped = 0;`)):s.type==="amy/gpio"&&t.push(`bool ${i}_state = false;`)}),t.join(`
`)}generateOscillatorIndices(e,t=[]){let s=[];return e.forEach((i,o)=>{s.push(`#define ${this.getNodeVariableName(i).toUpperCase()}_INDEX ${o}`)}),t.forEach((i,o)=>{s.push(`#define ${this.getNodeVariableName(i).toUpperCase()}_INDEX ${e.length+o}`)}),s.join(`
`)}extractConnections(e){const t=[];return e._nodes.forEach(s=>{s.inputs&&s.inputs.forEach((i,o)=>{if(i.link!==null){const n=e.links[i.link];n&&t.push({source:n.origin_id,sourceSlot:n.origin_slot,target:s.id,targetSlot:o,type:i.type})}})}),t}generateHeader(){return`// Generated by AmyNode
// AMY Audio Library Arduino Sketch

#include "amy.h"

// Global variables
`}generateSetup(e,t){let s=`
void setup() {
    Serial.begin(115200);
    
    // Initialize AMY
    amy_start();
    
`;return e.forEach(i=>{const o=this.getNodeVariableName(i);switch(i.type){case"amy/oscillator":s+=this.generateOscillatorSetup(i,o);break;case"amy/adc":s+=this.generateADCSetup(i,o);break;case"amy/gpio":s+=this.generateGPIOSetup(i,o);break}}),s+=`}

`,s}generateOscillatorSetup(e,t){const s=this.nodeCounter++,{wave_type:i,frequency:o,amplitude:n}=e.properties;return`
    // ${e.title||"Oscillator"} setup
    amy_event e${s} = amy_default_event();
    e${s}.osc = ${s};
    e${s}.wave = ${i.toUpperCase()};
    e${s}.freq = ${o};
    e${s}.amp = ${n};
    amy_add_event(&e${s});
`}generateADCSetup(e,t){return`
    // ${e.title||"ADC Input"} setup
    pinMode(${e.properties.pin}, INPUT);
`}generateGPIOSetup(e,t){const s=e.properties.mode==="input"?"INPUT":"OUTPUT",i=e.properties.pull==="up"?"_PULLUP":"";return`
    // ${e.title||"GPIO Pin"} setup
    pinMode(${e.properties.pin}, ${s}${i});
`}generateLoop(e,t){let s=`void loop() {
`;const i=e.filter(r=>r.type==="amy/adc"),o=e.filter(r=>r.type==="amy/gpio"&&r.properties.mode==="input");return i.forEach(r=>{const a=this.getNodeVariableName(r);s+=`    int ${a} = analogRead(${r.properties.pin});
`,t.filter(l=>l.source===r.id).forEach(l=>{const h=e.find(m=>m.id===l.target);(h==null?void 0:h.type)==="amy/map"&&(s+=this.generateMapCode(r,h,a))})}),o.forEach(r=>{const a=this.getNodeVariableName(r);s+=`    bool ${a} = digitalRead(${r.properties.pin});
`}),t.filter(r=>{const a=e.find(c=>c.id===r.target);return(a==null?void 0:a.type)==="amy/oscillator"}).forEach(r=>{const a=e.find(l=>l.id===r.source),c=e.find(l=>l.id===r.target);if(a&&c){const l=this.getNodeVariableName(a),h=e.filter(m=>m.type==="amy/oscillator").indexOf(c);r.targetSlot===0?s+=`    amy.setFrequency(${h}, ${l}_mapped);
`:r.targetSlot===1&&(s+=`    amy.setAmplitude(${h}, ${l}_mapped / 1023.0);
`)}}),s+=`
    // Update AMY
    amy.update();
    
    delay(10); // Small delay for stability
}
`,s}generateMapCode(e,t,s){const{in_min:i,in_max:o,out_min:n,out_max:r}=t.properties;return`    float ${s}_mapped = map(${s}, ${i}, ${o}, ${n}, ${r});
`}generatePinSetup(e,t){let s=[];return e.forEach(i=>{s.push(`pinMode(${this.getNodeVariableName(i).toUpperCase()}_PIN, INPUT);`)}),t.forEach(i=>{const o=i.properties.mode==="input"?"INPUT":"OUTPUT",n=i.properties.pull==="up"?"_PULLUP":"";s.push(`pinMode(${this.getNodeVariableName(i).toUpperCase()}_PIN, ${o}${n});`)}),s.join(`
    `)}generateOscillatorSetupTemplate(e){return e.map((t,s)=>{const i=this.getNodeVariableName(t).toUpperCase(),o=t.properties;let n=`// ${t.title||"Oscillator "+s}
    amy_event e${s} = amy_default_event();
    e${s}.osc = ${i}_INDEX;
    e${s}.wave = ${o.wave_type};
    e${s}.freq = ${o.frequency};
    e${s}.amp = ${o.amplitude};
    e${s}.phase = ${o.phase};`;if(o.wave_type==="PULSE"&&(n+=`
    e${s}.duty = ${o.duty};`),o.wave_type==="ALGO"&&(n+=`
    e${s}.ratio = ${o.ratio};`,n+=`
    e${s}.algo = ${o.algo||1};`),o.wave_type==="KS"&&(n+=`
    e${s}.feedback = ${o.ks_sustain};`),o.wave_type==="PCM"&&(n+=`
    e${s}.patch = ${o.patch};`),o.wave_type==="PARTIAL"&&(n+=`
    // Partials: ${o.partials}`),o.filter_type!=="NONE"){const r=o.filter_type==="LPF"?"1":o.filter_type==="BPF"?"2":"3";n+=`
    e${s}.filter_type = ${r};`,n+=`
    e${s}.filter_freq = ${o.filter_freq};`,n+=`
    e${s}.filter_resonance = ${o.filter_resonance};`}return n+=`
    amy_add_event(&e${s});`,n}).join(`

    `)}generateInitialValues(e){return"// Initial values set in oscillator setup"}generateInputReading(e,t){let s=[];return e.forEach(i=>{const o=this.getNodeVariableName(i);s.push(`${o}_raw = analogRead(${o.toUpperCase()}_PIN);`)}),t.forEach(i=>{if(i.properties.mode==="input"){const o=this.getNodeVariableName(i);s.push(`${o}_state = digitalRead(${o.toUpperCase()}_PIN);`)}}),s.join(`
    `)}generateMappings(e,t){let s=[];return e.filter(i=>i.type==="amy/map").forEach(i=>{const o=t.find(n=>n.target===i.id);if(o){const n=e.find(r=>r.id===o.source);if(n&&n.type==="amy/adc"){const r=this.getNodeVariableName(n),{in_min:a,in_max:c,out_min:l,out_max:h}=i.properties;s.push(`${r}_mapped = map(${r}_raw, ${a}, ${c}, ${l}, ${h});`)}}}),s.join(`
    `)}generateParameterUpdates(e,t){let s=[];return t.forEach(i=>{const o=e.find(c=>c.id===i.target),n=e.find(c=>c.id===i.source);if(!o||!n)return;const r=this.getNodeVariableName(o).toUpperCase(),a=this.getNodeVariableName(n);if(o.type==="amy/oscillator")switch(i.targetSlot){case 0:s.push(`amy.setFrequency(${r}_INDEX, ${a}_mapped);`);break;case 1:s.push(`amy.setAmplitude(${r}_INDEX, ${a}_mapped / 1023.0);`);break;case 2:s.push(`amy.setModulation(${r}_INDEX, ${this.getNodeVariableName(n).toUpperCase()}_INDEX, ${o.properties.mod_amount});`);break}else if(o.type==="amy/filter")switch(i.targetSlot){case 1:s.push(`amy.setFilterFreq(${r}_INDEX, ${a}_mapped);`);break;case 2:s.push(`amy.setFilterResonance(${r}_INDEX, ${a}_mapped / 1023.0);`);break}else if(o.type&&(o.type.includes("reverb")||o.type.includes("chorus")||o.type.includes("echo"))){const c=o.type.split("/")[1];switch(i.targetSlot){case 1:s.push(`amy.set${c.charAt(0).toUpperCase()+c.slice(1)}Level(${a}_mapped / 1023.0);`);break;case 2:c==="chorus"?s.push(`amy.setChorusRate(${a}_mapped);`):c==="echo"?s.push(`amy.setEchoDelay(${a}_mapped);`):c==="reverb"&&s.push(`amy.setReverbFeedback(${a}_mapped / 1023.0);`);break}}}),s.join(`
    `)}generateEnvelopeHandling(e,t){return"// Envelope handling not yet implemented"}generateFilterSetup(e){return e.length===0?"// No standalone filters configured":e.map((t,s)=>{const i=this.getNodeVariableName(t).toUpperCase();return t.properties,`// ${t.title||"Filter "+s}
    // Note: Filters applied per oscillator in AMY
    #define ${i}_INDEX ${s}`}).join(`

    `)}generateEffectSetup(e){return e.length===0?"// No effects configured":e.map((t,s)=>{const i=t.type.split("/")[1].toLowerCase(),o=t.properties;let n=`// ${t.title||i+" "+s}`;switch(i){case"reverb":n+=`
    amy.setReverb(${o.level}, ${o.feedback}, ${o.liveness}, ${o.damping});`;break;case"chorus":n+=`
    amy.setChorus(${o.level}, ${o.max_delay}, ${o.lfo_freq}, ${o.depth});`;break;case"echo":n+=`
    amy.setEcho(${o.delay_time}, ${o.feedback}, ${o.level}, ${o.max_delay});`;break}return n}).join(`

    `)}generateLFOSetup(e,t){return e.length===0?"// No LFOs configured":e.map((s,i)=>{const o=this.getNodeVariableName(s).toUpperCase(),n=s.properties;return`// ${s.title||"LFO "+i}
    amy.setOscillatorType(${o}_INDEX, AMY_${n.wave_type});
    amy.setFrequency(${o}_INDEX, ${n.frequency}); // Low frequency for modulation
    amy.setAmplitude(${o}_INDEX, ${n.amplitude});
    amy.setPhase(${o}_INDEX, ${n.phase});`}).join(`

    `)}generateModulationSetup(e,t){return e.length===0?"// No modulation matrices configured":e.map((s,i)=>{this.getNodeVariableName(s).toUpperCase();let o=`// ${s.title||"Modulation Matrix "+i}`;for(let n=0;n<4;n++)for(let r=0;r<4;r++){const a=s.properties.matrix[n][r];a!==0&&(o+=`
    // Route source ${n} to dest ${r} with amount ${a}`,o+=`
    amy.setModulationAmount(${n}, ${r}, ${a});`)}return o}).join(`

    `)}generateSampleSetup(e){return e.length===0?"// No sample players configured":e.map((t,s)=>{const i=this.getNodeVariableName(t).toUpperCase(),o=t.properties;return`// ${t.title||"Sample Player "+s}
    #define ${i}_INDEX ${s}
    // Sample patch: ${o.patch} (${o.sample_name})
    // Note: Load sample ${o.sample_name} to patch ${o.patch} in AMY`}).join(`

    `)}generateSequencerSetup(e,t,s){let i=[];return e.length>0&&(i.push("// Sequencer setup"),e.forEach((o,n)=>{const r=this.getNodeVariableName(o).toUpperCase(),a=o.properties;i.push(`// ${o.title||"Sequencer "+n}`),i.push(`#define ${r}_STEPS ${a.steps}`),i.push(`int ${r.toLowerCase()}_sequence[${a.steps}] = {${a.sequence.join(", ")}};`),i.push(`int ${r.toLowerCase()}_gates[${a.steps}] = {${a.gates.join(", ")}};`),i.push(`int ${r.toLowerCase()}_current_step = 0;`)})),t.length>0&&(i.push("// Clock setup"),t.forEach((o,n)=>{const r=this.getNodeVariableName(o).toUpperCase(),a=o.properties;i.push(`// ${o.title||"Clock "+n}`),i.push(`#define ${r}_BPM ${a.bpm}`),i.push(`unsigned long ${r.toLowerCase()}_last_tick = 0;`),i.push(`unsigned long ${r.toLowerCase()}_interval = ${Math.round(6e4/a.bpm)};`)})),s.length>0&&(i.push("// BETA: Drum Machine (Complex timing - future implementation)"),s.forEach((o,n)=>{this.getNodeVariableName(o).toUpperCase(),i.push(`// ${o.title||"Drum Machine "+n} - BETA`),i.push("// TODO: Implement drum pattern sequencing")})),i.length>2?i.join(`
    `):"// No sequencer modules configured"}generateKeyboardSetup(e){return e.length===0?"// No keyboard inputs configured":e.map((t,s)=>{const i=this.getNodeVariableName(t).toUpperCase(),o=t.properties;return`// BETA: ${t.title||"Keyboard "+s} (Interactive input - web only)
    // Note: Keyboard input requires web interface or MIDI hardware
    float ${i.toLowerCase()}_frequency = 440.0;
    int ${i.toLowerCase()}_gate = 0;
    float ${i.toLowerCase()}_velocity = ${o.velocity};`}).join(`

    `)}generateSequencerUpdates(e,t,s,i){let o=[];return t.forEach(n=>{const r=this.getNodeVariableName(n).toUpperCase();o.push(`// Update ${n.title||"Clock"}`),o.push(`if (millis() - ${r.toLowerCase()}_last_tick >= ${r.toLowerCase()}_interval) {`),o.push(`    ${r.toLowerCase()}_last_tick = millis();`),o.push("    // Clock tick - trigger connected sequencers"),o.push("}")}),e.forEach(n=>{const r=this.getNodeVariableName(n).toUpperCase();o.push(`// Update ${n.title||"Sequencer"}`),o.push("// TODO: Connect to clock input for step advancement"),o.push(`// Current note: ${r.toLowerCase()}_sequence[${r.toLowerCase()}_current_step]`)}),s.length>0&&o.push("// BETA: Drum machine updates not implemented - complex pattern timing required"),i.length>0&&o.push("// BETA: Keyboard updates require MIDI or web interface integration"),o.length>0?o.join(`
    `):"// No sequencer updates needed"}generateOutputSetup(e){return e.length===0?"// No output nodes configured":e.map((t,s)=>{this.getNodeVariableName(t).toUpperCase();const i=t.properties;return`// ${t.title||"Audio Output "+s}
    // Master volume: ${i.master_volume||1}
    // Stereo mode: ${i.stereo_mode?"enabled":"disabled"}
    // Output channel: ${i.output_channel||0}
    amy.setGlobalVolume(${i.master_volume||1});`}).join(`

    `)}generateHelperFunctions(){return`// Map function for float values
float mapFloat(float x, float in_min, float in_max, float out_min, float out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// AMY oscillator type constants (if not defined in library)
#ifndef AMY_SINE  
#define AMY_SINE 0
#define AMY_PULSE 1
#define AMY_SAW_DOWN 2
#define AMY_SAW_UP 3
#define AMY_TRIANGLE 4
#define AMY_NOISE 5
#define AMY_KS 6
#define AMY_PCM 7
#define AMY_PARTIAL 8
#define AMY_ALGO 9
#define AMY_FM 10
#endif

// AMY filter constants
#ifndef AMY_FILTER_NONE
#define AMY_FILTER_NONE 0
#define AMY_FILTER_LPF 1
#define AMY_FILTER_HPF 2
#define AMY_FILTER_BPF 3
#endif`}generateConnectionAnalysis(e){if(!e.length)return"// No connections in patch";let t=`// Patch connections analysis:
`;return e.forEach((s,i)=>{t+=`//   ${i+1}. Node ${s.source} output ${s.sourceSlot} → Node ${s.target} input ${s.targetSlot}
`}),t}generateEnvelopeSetup(e){if(!e.length)return"// No envelopes in patch";let t=`
  // Envelope setup (AMY breakpoint format)
`;return e.forEach((s,i)=>{const o=s.properties,n=o.attack||.01,r=o.decay||.1,a=o.sustain||.7,c=o.release||.5;t+=`  amy_event e_env${i} = amy_default_event();
`,t+=`  e_env${i}.osc = ${i};
`,t+=`  e_env${i}.bp0[0] = ${n};     // Attack time
`,t+=`  e_env${i}.bp0[1] = 1.0;           // Attack level
`,t+=`  e_env${i}.bp0[2] = ${r};      // Decay time
`,t+=`  e_env${i}.bp0[3] = ${a};    // Sustain level
`,t+=`  e_env${i}.bp1[0] = ${c};    // Release time
`,t+=`  e_env${i}.bp1[1] = 0.0;           // Release level
`,t+=`  amy_add_event(&e_env${i});
`}),t}generateMixerSetup(e){if(!e.length)return"// No mixers in patch";let t=`
  // Mixer setup
`;return e.forEach((s,i)=>{const o=s.properties;t+=`  // ${s.title||"Mixer"} - 4-channel mixer
`;for(let n=1;n<=4;n++){const r=o[`gain${n}`]||1;r!==1&&(t+=`  amy_send_message("v${i}a${r.toFixed(3)}\\n");
`)}}),t}generateMappingSetup(e){if(!e.length)return"// No value mappings in patch";let t=`
  // Value mapping setup
`;return e.forEach(s=>{const i=s.properties;t+=`  // ${s.title||"Map Range"}: ${i.input_min}-${i.input_max} → ${i.output_min}-${i.output_max}
`}),t}calculateOptimalLoopDelay(e){const t=e.length;return t>20?5:t>10?10:20}generatePatchName(e){if(!e.length)return"Empty Patch";const t=e.filter(i=>i.type==="amy/oscillator").length,s=e.filter(i=>i.type&&i.type.includes("amy/")).length-t;return`AMY Patch (${t} voices, ${s} effects)`}generatePatchDescription(e,t){const s={oscillators:e.filter(o=>o.type==="amy/oscillator").length,lfos:e.filter(o=>o.type==="amy/lfo").length,effects:e.filter(o=>o.type&&(o.type.includes("reverb")||o.type.includes("chorus")||o.type.includes("echo"))).length,filters:e.filter(o=>o.type==="amy/filter").length,envelopes:e.filter(o=>o.type==="amy/envelope").length,connections:t.length};let i=`Generated patch with ${s.oscillators} oscillators`;return s.lfos&&(i+=`, ${s.lfos} LFOs`),s.effects&&(i+=`, ${s.effects} effects`),s.filters&&(i+=`, ${s.filters} filters`),s.envelopes&&(i+=`, ${s.envelopes} envelopes`),i+=`, ${s.connections} connections`,i}getNodeVariableName(e){if(!this.nodeIdMap.has(e.id)){const t=e.type.split("/")[1];this.nodeIdMap.set(e.id,`${t}_${e.id}`)}return this.nodeIdMap.get(e.id)}}class K{constructor(){this.presets=this.getDefaultPresets(),this.loadUserPresets()}getDefaultPresets(){return{basic_sine:{name:"Basic Sine Wave",description:"Simple sine wave oscillator with output",category:"Basic",nodes:[{type:"amy/oscillator",position:[100,100],properties:{wave_type:"SINE",frequency:440,amplitude:.5}},{type:"amy/output",position:[300,100],properties:{}}],connections:[{source:0,sourceSlot:0,target:1,targetSlot:0}]},basic_pulse:{name:"Basic Pulse Wave",description:"Pulse wave with adjustable duty cycle",category:"Basic",nodes:[{type:"amy/oscillator",position:[100,100],properties:{wave_type:"PULSE",frequency:220,amplitude:.5,duty:.5}},{type:"amy/output",position:[300,100],properties:{}}],connections:[{source:0,sourceSlot:0,target:1,targetSlot:0}]},filtered_saw:{name:"Filtered Sawtooth",description:"Sawtooth wave through low-pass filter",category:"Filtered",nodes:[{type:"amy/oscillator",position:[100,100],properties:{wave_type:"SAW_DOWN",frequency:110,amplitude:.7}},{type:"amy/filter",position:[300,100],properties:{filter_type:"LPF",filter_freq:1200,filter_resonance:2}},{type:"amy/output",position:[500,100],properties:{}}],connections:[{source:0,sourceSlot:0,target:1,targetSlot:0},{source:1,sourceSlot:0,target:2,targetSlot:0}]},resonant_filter:{name:"Resonant Filter Sweep",description:"High resonance filter with LFO modulation",category:"Filtered",nodes:[{type:"amy/oscillator",position:[50,100],properties:{wave_type:"SAW_UP",frequency:55,amplitude:.8}},{type:"amy/filter",position:[250,100],properties:{filter_type:"LPF",filter_freq:500,filter_resonance:8}},{type:"amy/lfo",position:[50,250],properties:{frequency:.3,amplitude:400,wave_type:"SINE"}},{type:"amy/output",position:[450,100],properties:{}}],connections:[{source:0,sourceSlot:0,target:1,targetSlot:0},{source:2,sourceSlot:0,target:1,targetSlot:1},{source:1,sourceSlot:0,target:3,targetSlot:0}]},pluck_synth:{name:"Plucked String Synth",description:"Karplus-Strong plucked string synthesis",category:"Synthesis",nodes:[{type:"amy/oscillator",position:[100,100],properties:{wave_type:"KS",frequency:330,amplitude:.6,feedback:.95}},{type:"amy/envelope",position:[300,100],properties:{attack:.01,decay:.3,sustain:.4,release:2}},{type:"amy/output",position:[500,100],properties:{}}],connections:[{source:0,sourceSlot:0,target:1,targetSlot:0},{source:1,sourceSlot:0,target:2,targetSlot:0}]},pad_synth:{name:"Warm Pad Synth",description:"Warm pad sound with reverb",category:"Synthesis",nodes:[{type:"amy/oscillator",position:[50,80],properties:{wave_type:"TRIANGLE",frequency:220,amplitude:.4}},{type:"amy/oscillator",position:[50,180],properties:{wave_type:"SINE",frequency:330,amplitude:.3}},{type:"amy/mixer",position:[250,130],properties:{gain_1:.7,gain_2:.5}},{type:"amy/filter",position:[400,130],properties:{filter_type:"LPF",filter_freq:2e3,filter_resonance:1}},{type:"amy/reverb",position:[550,130],properties:{level:.3,liveness:.7,damping:.4}},{type:"amy/output",position:[700,130],properties:{}}],connections:[{source:0,sourceSlot:0,target:2,targetSlot:0},{source:1,sourceSlot:0,target:2,targetSlot:1},{source:2,sourceSlot:0,target:3,targetSlot:0},{source:3,sourceSlot:0,target:4,targetSlot:0},{source:4,sourceSlot:0,target:5,targetSlot:0}]},fm_bass:{name:"FM Bass",description:"Deep FM bass sound",category:"FM Synthesis",nodes:[{type:"amy/oscillator",position:[100,100],properties:{wave_type:"ALGO",frequency:110,amplitude:.8,ratio:2,algo:1}},{type:"amy/envelope",position:[300,100],properties:{attack:.01,decay:.5,sustain:.6,release:.8}},{type:"amy/filter",position:[500,100],properties:{filter_type:"LPF",filter_freq:800,filter_resonance:1.5}},{type:"amy/output",position:[700,100],properties:{}}],connections:[{source:0,sourceSlot:0,target:1,targetSlot:0},{source:1,sourceSlot:0,target:2,targetSlot:0},{source:2,sourceSlot:0,target:3,targetSlot:0}]},wobble_bass:{name:"Wobble Bass",description:"LFO-modulated filter wobble effect",category:"Modulated",nodes:[{type:"amy/oscillator",position:[50,100],properties:{wave_type:"SAW_DOWN",frequency:65,amplitude:.9}},{type:"amy/filter",position:[250,100],properties:{filter_type:"LPF",filter_freq:300,filter_resonance:10}},{type:"amy/lfo",position:[50,250],properties:{frequency:4,amplitude:800,wave_type:"SINE"}},{type:"amy/output",position:[450,100],properties:{}}],connections:[{source:0,sourceSlot:0,target:1,targetSlot:0},{source:2,sourceSlot:0,target:1,targetSlot:1},{source:1,sourceSlot:0,target:3,targetSlot:0}]}}}loadUserPresets(){try{const e=localStorage.getItem("amynode_user_presets");if(e){const t=JSON.parse(e);this.presets={...this.presets,...t}}}catch(e){console.error("Failed to load user presets:",e)}}saveUserPresets(){try{const e={};Object.entries(this.presets).forEach(([t,s])=>{s.category==="User"&&(e[t]=s)}),localStorage.setItem("amynode_user_presets",JSON.stringify(e))}catch(e){console.error("Failed to save user presets:",e)}}getPresetsByCategory(){const e={};return Object.entries(this.presets).forEach(([t,s])=>{const i=s.category||"Other";e[i]||(e[i]=[]),e[i].push({key:t,...s})}),e}getPreset(e){return this.presets[e]||null}addUserPreset(e,t){this.presets[e]={...t,category:"User",timestamp:new Date().toISOString()},this.saveUserPresets()}removeUserPreset(e){return this.presets[e]&&this.presets[e].category==="User"?(delete this.presets[e],this.saveUserPresets(),!0):!1}createPresetFromGraph(e,t,s,i="User"){const o=e._nodes.map(a=>({type:a.type,position:[a.pos[0],a.pos[1]],properties:{...a.properties}})),n=[];return e._links.forEach(a=>{if(a){const c=o.findIndex(h=>e._nodes[h]&&e._nodes[h].id===a.origin_id),l=o.findIndex(h=>e._nodes[h]&&e._nodes[h].id===a.target_id);c>=0&&l>=0&&n.push({source:c,sourceSlot:a.origin_slot,target:l,targetSlot:a.target_slot})}}),{key:t.toLowerCase().replace(/\s+/g,"_"),preset:{name:t,description:s,category:i,nodes:o,connections:n}}}}class Q{constructor(e,t){this.app=e,this.nodePresets=t,this.isOpen=!1,this.selectedCategory="Basic"}show(){this.isOpen||(this.isOpen=!0,this.createModal())}hide(){if(!this.isOpen)return;const e=document.getElementById("preset-browser-modal");e&&e.remove(),this.isOpen=!1}createModal(){const e=document.getElementById("preset-browser-modal");e&&e.remove();const t=document.createElement("div");t.id="preset-browser-modal",t.className="modal";const s=this.nodePresets.getPresetsByCategory(),i=Object.keys(s);t.innerHTML=`
            <div class="modal-content preset-browser-content">
                <div class="modal-header">
                    <h2>Node Presets</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body preset-browser-body">
                    <div class="preset-sidebar">
                        <div class="preset-categories">
                            ${i.map(o=>`
                                <div class="preset-category ${o===this.selectedCategory?"active":""}" 
                                     data-category="${o}">
                                    ${o}
                                    <span class="preset-count">${s[o].length}</span>
                                </div>
                            `).join("")}
                        </div>
                        <div class="preset-actions">
                            <button class="preset-action-btn" id="save-preset-btn">
                                💾 Save Preset
                            </button>
                        </div>
                    </div>
                    <div class="preset-main">
                        <div class="preset-header">
                            <h3 id="category-title">${this.selectedCategory}</h3>
                            <div class="preset-search">
                                <input type="text" id="preset-search" placeholder="Search presets...">
                                <span class="search-icon">🔍</span>
                            </div>
                        </div>
                        <div class="preset-grid" id="preset-grid">
                            ${this.renderPresetGrid(s[this.selectedCategory]||[])}
                        </div>
                    </div>
                </div>
            </div>
        `,this.addStyles(),document.body.appendChild(t),this.bindEvents(t,s),t.addEventListener("click",o=>{o.target===t&&this.hide()})}renderPresetGrid(e){return e.map(t=>`
            <div class="preset-item" data-preset-key="${t.key}">
                <div class="preset-preview">
                    <div class="preset-nodes">
                        ${this.renderPresetPreview(t)}
                    </div>
                </div>
                <div class="preset-info">
                    <h4 class="preset-name">${t.name}</h4>
                    <p class="preset-description">${t.description}</p>
                    <div class="preset-meta">
                        <span class="preset-node-count">${t.nodes.length} nodes</span>
                        ${t.category==="User"?'<button class="preset-delete-btn" title="Delete preset">🗑️</button>':""}
                    </div>
                </div>
            </div>
        `).join("")}renderPresetPreview(e){return e.nodes.slice(0,4).map((t,s)=>{const i=t.type.split("/")[1];return`<span class="preview-node" title="${i}">${{oscillator:"🎵",filter:"🎛️",mixer:"🎚️",reverb:"🌊",chorus:"🌀",envelope:"📈",lfo:"〰️",output:"🔊"}[i]||"⚙️"}</span>`}).join("")}bindEvents(e,t){e.querySelectorAll(".preset-category").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".preset-category").forEach(r=>r.classList.remove("active")),i.classList.add("active");const o=i.dataset.category;this.selectedCategory=o,e.querySelector("#category-title").textContent=o;const n=e.querySelector("#preset-grid");n.innerHTML=this.renderPresetGrid(t[o]||[]),this.bindPresetEvents(e)})}),e.querySelector("#preset-search").addEventListener("input",i=>{this.filterPresets(e,t,i.target.value)}),e.querySelector("#save-preset-btn").addEventListener("click",()=>{this.showSavePresetDialog()}),this.bindPresetEvents(e)}bindPresetEvents(e){e.querySelectorAll(".preset-item").forEach(t=>{t.addEventListener("click",()=>{const s=t.dataset.presetKey;this.loadPreset(s)})}),e.querySelectorAll(".preset-delete-btn").forEach(t=>{t.addEventListener("click",s=>{s.stopPropagation();const i=t.closest(".preset-item").dataset.presetKey;this.deletePreset(i)})})}filterPresets(e,t,s){const o=(t[this.selectedCategory]||[]).filter(r=>r.name.toLowerCase().includes(s.toLowerCase())||r.description.toLowerCase().includes(s.toLowerCase())),n=e.querySelector("#preset-grid");n.innerHTML=this.renderPresetGrid(o),this.bindPresetEvents(e)}loadPreset(e){const t=this.nodePresets.getPreset(e);if(!t){console.error("Preset not found:",e);return}try{this.app.graph.clear();const s=new Map;t.nodes.forEach((i,o)=>{const n=i.type.includes("/")?i.type.split("/")[1]:i.type,r=this.app.createNode(n,i.position[0],i.position[1]);r&&(i.properties&&Object.entries(i.properties).forEach(([a,c])=>{r.setParameter(a,c)}),s.set(o,r))}),t.connections.forEach(i=>{const o=s.get(i.source),n=s.get(i.target);if(o&&n)try{const r=o.outputs[i.sourceSlot],a=n.inputs[i.targetSlot];r&&a&&this.app.graph.connectNodes(o.id,r.id,n.id,a.id)}catch(r){console.warn("Failed to create connection:",r)}}),this.app.nodeCanvas.render(),this.app.nodeCanvas.offset.x=0,this.app.nodeCanvas.offset.y=0,this.app.nodeCanvas.scale=1,this.app.undoRedoManager.clear(),this.app.updateUndoRedoButtons(),setTimeout(()=>{this.app.updateAudioConnections()},100),console.log(`Loaded preset: ${t.name}`),this.hide()}catch(s){console.error("Failed to load preset:",s),alert("Failed to load preset. Please try again.")}}showSavePresetDialog(){const e=document.createElement("div");e.className="modal",e.innerHTML=`
            <div class="modal-content save-preset-dialog">
                <div class="modal-header">
                    <h2>Save Preset</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="preset-name">Preset Name:</label>
                        <input type="text" id="preset-name" placeholder="My Awesome Synth" required>
                    </div>
                    <div class="form-group">
                        <label for="preset-description">Description:</label>
                        <textarea id="preset-description" placeholder="Describe your preset..." rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="preset-category-select">Category:</label>
                        <select id="preset-category-select">
                            <option value="User">User</option>
                            <option value="Basic">Basic</option>
                            <option value="Filtered">Filtered</option>
                            <option value="Synthesis">Synthesis</option>
                            <option value="Modulated">Modulated</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="control-btn" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="control-btn" id="save-preset-confirm">Save Preset</button>
                </div>
            </div>
        `,document.body.appendChild(e),e.querySelector("#save-preset-confirm").addEventListener("click",()=>{this.saveCurrentPreset(e)}),e.querySelector("#preset-name").focus()}saveCurrentPreset(e){const t=e.querySelector("#preset-name").value.trim(),s=e.querySelector("#preset-description").value.trim(),i=e.querySelector("#preset-category-select").value;if(!t){alert("Please enter a preset name");return}try{const{key:o,preset:n}=this.nodePresets.createPresetFromGraph(this.app.graph,t,s,i);this.nodePresets.addUserPreset(o,n),console.log(`Saved preset: ${t}`),e.remove(),this.hide(),alert(`Preset "${t}" saved successfully!`)}catch(o){console.error("Failed to save preset:",o),alert("Failed to save preset. Please try again.")}}deletePreset(e){const t=this.nodePresets.getPreset(e);t&&confirm(`Delete preset "${t.name}"?`)&&this.nodePresets.removeUserPreset(e)&&(console.log(`Deleted preset: ${t.name}`),this.hide(),setTimeout(()=>this.show(),100))}addStyles(){if(document.getElementById("preset-browser-styles"))return;const e=document.createElement("style");e.id="preset-browser-styles",e.textContent=`
            .preset-browser-content {
                max-width: 900px;
                max-height: 80vh;
            }
            
            .preset-browser-body {
                display: flex;
                gap: 1rem;
                height: 60vh;
            }
            
            .preset-sidebar {
                width: 200px;
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .preset-categories {
                flex: 1;
                border-right: 1px solid var(--border-color);
                padding-right: 1rem;
            }
            
            .preset-category {
                padding: 0.5rem 0.75rem;
                margin-bottom: 0.25rem;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background-color 0.2s;
            }
            
            .preset-category:hover {
                background-color: var(--bg-primary);
            }
            
            .preset-category.active {
                background-color: var(--accent-color);
                color: white;
            }
            
            .preset-count {
                font-size: 0.75rem;
                opacity: 0.7;
                background: rgba(255,255,255,0.2);
                padding: 1px 6px;
                border-radius: 10px;
            }
            
            .preset-actions {
                padding-top: 1rem;
                border-top: 1px solid var(--border-color);
            }
            
            .preset-action-btn {
                width: 100%;
                padding: 0.5rem;
                background-color: var(--accent-color);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.875rem;
            }
            
            .preset-action-btn:hover {
                background-color: var(--accent-hover);
            }
            
            .preset-main {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            
            .preset-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid var(--border-color);
            }
            
            .preset-search {
                position: relative;
                width: 200px;
            }
            
            .preset-search input {
                width: 100%;
                padding: 0.5rem 2rem 0.5rem 0.75rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background-color: var(--bg-primary);
            }
            
            .preset-search .search-icon {
                position: absolute;
                right: 0.5rem;
                top: 50%;
                transform: translateY(-50%);
                opacity: 0.5;
            }
            
            .preset-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 1rem;
                overflow-y: auto;
                flex: 1;
            }
            
            .preset-item {
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 1rem;
                cursor: pointer;
                transition: all 0.2s;
                background-color: var(--bg-primary);
            }
            
            .preset-item:hover {
                border-color: var(--accent-color);
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }
            
            .preset-preview {
                height: 60px;
                background: linear-gradient(135deg, var(--bg-dark), var(--bg-secondary));
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 0.75rem;
                position: relative;
                overflow: hidden;
            }
            
            .preset-nodes {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
            
            .preview-node {
                font-size: 1.2rem;
                opacity: 0.8;
            }
            
            .preset-name {
                font-size: 1rem;
                font-weight: 600;
                margin-bottom: 0.25rem;
                color: var(--text-primary);
            }
            
            .preset-description {
                font-size: 0.875rem;
                color: var(--text-secondary);
                margin-bottom: 0.5rem;
                line-height: 1.3;
            }
            
            .preset-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.75rem;
                color: var(--text-secondary);
            }
            
            .preset-delete-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 3px;
                opacity: 0.6;
                transition: all 0.2s;
            }
            
            .preset-delete-btn:hover {
                opacity: 1;
                background-color: rgba(244, 67, 54, 0.1);
            }
            
            .save-preset-dialog {
                max-width: 500px;
            }
            
            .form-group {
                margin-bottom: 1rem;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: var(--text-secondary);
            }
            
            .form-group input,
            .form-group textarea,
            .form-group select {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background-color: var(--bg-primary);
                color: var(--text-primary);
            }
            
            .form-group textarea {
                resize: vertical;
                min-height: 60px;
            }
        `,document.head.appendChild(e)}}class J{constructor(e){this.app=e,this.shortcuts=new Map,this.isShortcutMode=!1,this.setupShortcuts(),this.bindEvents()}setupShortcuts(){this.registerShortcut("ctrl+s",()=>this.app.savePatch(),"Save patch"),this.registerShortcut("ctrl+o",()=>this.app.loadPatch(),"Open patch"),this.registerShortcut("ctrl+e",()=>this.app.exportCode(),"Export Arduino code"),this.registerShortcut("ctrl+n",()=>this.newPatch(),"New patch"),this.registerShortcut("ctrl+p",()=>this.app.presetBrowser.show(),"Show presets"),this.registerShortcut("ctrl+z",()=>this.undo(),"Undo"),this.registerShortcut("ctrl+y",()=>this.redo(),"Redo"),this.registerShortcut("ctrl+shift+z",()=>this.redo(),"Redo (alternative)"),this.registerShortcut("space",()=>this.togglePlayback(),"Play/Stop audio"),this.registerShortcut("ctrl+space",()=>this.app.audioEngine.stop(),"Stop audio"),this.registerShortcut("delete",()=>this.deleteSelectedNodes(),"Delete selected nodes"),this.registerShortcut("backspace",()=>this.deleteSelectedNodes(),"Delete selected nodes"),this.registerShortcut("ctrl+a",()=>this.selectAllNodes(),"Select all nodes"),this.registerShortcut("ctrl+d",()=>this.duplicateSelectedNodes(),"Duplicate selected nodes"),this.registerShortcut("ctrl+plus",()=>this.zoomIn(),"Zoom in"),this.registerShortcut("ctrl+minus",()=>this.zoomOut(),"Zoom out"),this.registerShortcut("ctrl+0",()=>this.resetZoom(),"Reset zoom"),this.registerShortcut("ctrl+f",()=>this.focusSearch(),"Focus node search"),this.registerShortcut("1",()=>this.createNodeQuick("oscillator"),"Create Oscillator"),this.registerShortcut("2",()=>this.createNodeQuick("filter"),"Create Filter"),this.registerShortcut("3",()=>this.createNodeQuick("mixer"),"Create Mixer"),this.registerShortcut("4",()=>this.createNodeQuick("reverb"),"Create Reverb"),this.registerShortcut("5",()=>this.createNodeQuick("envelope"),"Create Envelope"),this.registerShortcut("6",()=>this.createNodeQuick("lfo"),"Create LFO"),this.registerShortcut("7",()=>this.createNodeQuick("output"),"Create Output"),this.registerShortcut("f1",()=>this.showHelp(),"Show keyboard shortcuts"),this.registerShortcut("?",()=>this.showHelp(),"Show keyboard shortcuts"),this.registerShortcut("escape",()=>this.handleEscape(),"Cancel/Close")}registerShortcut(e,t,s=""){this.shortcuts.set(e.toLowerCase(),{callback:t,description:s,key:e})}bindEvents(){document.addEventListener("keydown",e=>{this.handleKeyDown(e)}),document.addEventListener("keyup",e=>{this.handleKeyUp(e)})}handleKeyDown(e){if(this.isInputFocused(e.target))return;const t=this.getShortcutString(e),s=this.shortcuts.get(t);if(s){e.preventDefault(),e.stopPropagation();try{s.callback(),console.log(`Executed shortcut: ${t} (${s.description})`)}catch(i){console.error(`Error executing shortcut ${t}:`,i)}}}handleKeyUp(e){}getShortcutString(e){const t=[];(e.ctrlKey||e.metaKey)&&t.push("ctrl"),e.altKey&&t.push("alt"),e.shiftKey&&t.push("shift");let s=e.key.toLowerCase();return s={" ":"space","+":"plus","-":"minus","=":"plus","/":"?"}[s]||s,t.push(s),t.join("+")}isInputFocused(e){return["input","textarea","select"].includes(e.tagName.toLowerCase())||e.contentEditable==="true"}newPatch(){confirm("Create new patch? Any unsaved changes will be lost.")&&(this.app.graph.clear(),this.app.canvas.draw(!0,!0),console.log("Created new patch"))}async togglePlayback(){if(this.app.audioEngine.isRunning)this.app.audioEngine.stop(),this.app.updateAudioStatus("stopped","Audio: Stopped");else try{this.app.updateAudioStatus("loading","Audio: Starting..."),await this.app.audioEngine.start(),this.app.updateAudioConnections(),this.app.updateAudioStatus("playing","Audio: Playing")}catch(e){this.app.updateAudioStatus("error","Audio: Error"),console.error("Audio start failed:",e)}}deleteSelectedNodes(){const e=this.app.canvas.selected_nodes;e&&e.length>0&&(e.forEach(t=>{this.app.graph.remove(t)}),this.app.canvas.draw(!0,!0),console.log(`Deleted ${e.length} nodes`))}selectAllNodes(){const e=this.app.graph._nodes;this.app.canvas.selectNodes(e),this.app.canvas.draw(!0,!0),console.log(`Selected ${e.length} nodes`)}duplicateSelectedNodes(){const e=this.app.canvas.selected_nodes;if(e&&e.length>0){const t=[];e.forEach(s=>{const i=s.clone();i.pos[0]+=20,i.pos[1]+=20,this.app.graph.add(i),t.push(i)}),this.app.canvas.selectNodes(t),this.app.canvas.draw(!0,!0),console.log(`Duplicated ${e.length} nodes`)}}zoomIn(){this.app.canvas.ds&&(this.app.canvas.ds.scale*=1.2,this.app.canvas.setDirty(!0,!0))}zoomOut(){this.app.canvas.ds&&(this.app.canvas.ds.scale*=.8,this.app.canvas.setDirty(!0,!0))}resetZoom(){this.app.canvas.ds&&(this.app.canvas.ds.scale=1,this.app.canvas.ds.offset=[0,0],this.app.canvas.setDirty(!0,!0))}focusSearch(){const e=document.getElementById("node-search");e&&(e.focus(),e.select())}createNodeQuick(e){const t=this.app.canvas.canvas.getBoundingClientRect(),s=t.width/2,i=t.height/2;let o=[s,i];this.app.canvas.ds&&(o[0]=(s-this.app.canvas.ds.offset[0])/this.app.canvas.ds.scale,o[1]=(i-this.app.canvas.ds.offset[1])/this.app.canvas.ds.scale);const n=20,r=Math.round(o[0]/n)*n,a=Math.round(o[1]/n)*n,c=this.app.createNode(e,r,a);c&&(this.app.canvas.selectNodes([c]),console.log(`Created ${e} node via keyboard shortcut`))}handleEscape(){this.app.canvas.selectNodes([]),document.querySelectorAll(".modal:not(.hidden)").forEach(s=>{s.classList.add("hidden")});const t=document.getElementById("node-search");t&&t.value&&(t.value="",t.dispatchEvent(new Event("input"))),this.app.canvas.draw(!0,!0)}showHelp(){this.createHelpModal()}createHelpModal(){const e=document.getElementById("help-modal");e&&e.remove();const t=document.createElement("div");t.id="help-modal",t.className="modal";const i=Array.from(this.shortcuts.entries()).filter(([n,r])=>r.description).sort(([n],[r])=>n.localeCompare(r)).map(([n,r])=>`
                <div class="shortcut-item">
                    <code class="shortcut-key">${n.replace(/ctrl/g,"⌘").replace(/shift/g,"⇧").replace(/alt/g,"⌥")}</code>
                    <span class="shortcut-desc">${r.description}</span>
                </div>
            `).join("");t.innerHTML=`
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-grid">
                        ${i}
                    </div>
                </div>
            </div>
        `;const o=document.createElement("style");o.textContent=`
            .shortcuts-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 8px;
                max-height: 60vh;
                overflow-y: auto;
            }
            .shortcut-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: var(--bg-primary);
                border-radius: 4px;
            }
            .shortcut-key {
                font-family: Monaco, 'Courier New', monospace;
                background: var(--bg-dark);
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 12px;
                color: var(--accent-color);
            }
            .shortcut-desc {
                color: var(--text-secondary);
                font-size: 14px;
            }
        `,document.head.appendChild(o),document.body.appendChild(t),t.addEventListener("click",n=>{n.target===t&&t.remove()})}getAllShortcuts(){return Array.from(this.shortcuts.entries()).map(([e,t])=>({key:e,description:t.description}))}undo(){this.app.undoRedoManager.undo()?(this.app.canvas.setDirty(!0,!0),this.app.updateUndoRedoButtons(),console.log("Undo successful")):console.log("Nothing to undo")}redo(){this.app.undoRedoManager.redo()?(this.app.canvas.setDirty(!0,!0),this.app.updateUndoRedoButtons(),console.log("Redo successful")):console.log("Nothing to redo")}}class Z{constructor(){this.container=null,this.notifications=new Map,this.nextId=1,this.createContainer(),this.setupErrorHandling()}createContainer(){this.container=document.createElement("div"),this.container.id="notification-container",this.container.className="notification-container";const e=document.createElement("style");e.textContent=`
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: 400px;
            }
            
            .notification {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius);
                padding: 12px 16px;
                box-shadow: var(--shadow-md);
                pointer-events: auto;
                transform: translateX(420px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: flex-start;
                gap: 12px;
                position: relative;
                overflow: hidden;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification.hide {
                transform: translateX(420px);
                opacity: 0;
            }
            
            .notification::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background: var(--accent-color);
            }
            
            .notification.success::before {
                background: #4CAF50;
            }
            
            .notification.warning::before {
                background: #FF9800;
            }
            
            .notification.error::before {
                background: #F44336;
            }
            
            .notification.info::before {
                background: #2196F3;
            }
            
            .notification-icon {
                font-size: 18px;
                line-height: 1;
                flex-shrink: 0;
                margin-top: 1px;
            }
            
            .notification-content {
                flex: 1;
                min-width: 0;
            }
            
            .notification-title {
                font-weight: 600;
                font-size: 14px;
                color: var(--text-primary);
                margin-bottom: 4px;
                line-height: 1.2;
            }
            
            .notification-message {
                font-size: 13px;
                color: var(--text-secondary);
                line-height: 1.3;
                word-wrap: break-word;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                font-size: 16px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 2px;
                transition: background-color 0.2s;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                background: var(--bg-primary);
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: rgba(255, 255, 255, 0.1);
                overflow: hidden;
            }
            
            .notification-progress-bar {
                height: 100%;
                background: var(--accent-color);
                transition: width 0.1s linear;
                transform-origin: left;
            }
            
            .notification.success .notification-progress-bar {
                background: #4CAF50;
            }
            
            .notification.warning .notification-progress-bar {
                background: #FF9800;
            }
            
            .notification.error .notification-progress-bar {
                background: #F44336;
            }
            
            .notification.info .notification-progress-bar {
                background: #2196F3;
            }
        `,document.head.appendChild(e),document.body.appendChild(this.container)}setupErrorHandling(){window.addEventListener("error",t=>{this.error("Script Error",t.message,{persistent:!0,details:`File: ${t.filename}:${t.lineno}:${t.colno}`})}),window.addEventListener("unhandledrejection",t=>{var s,i;this.error("Promise Rejection",((s=t.reason)==null?void 0:s.message)||"Unhandled promise rejection",{persistent:!0,details:(i=t.reason)==null?void 0:i.stack})});const e=console.error;console.error=(...t)=>{e.apply(console,t);const s=t.join(" ");!s.includes("Warning:")&&!s.includes("closeAllContextMenus")&&this.warning("Console Error",s.substring(0,100))}}show(e,t,s,i={}){const o=this.nextId++,n=this.createNotification(o,e,t,s,i);if(this.notifications.set(o,n),this.container.appendChild(n.element),requestAnimationFrame(()=>{n.element.classList.add("show")}),!i.persistent){const r=i.duration||this.getDefaultDuration(e);this.startDismissTimer(o,r)}return o}createNotification(e,t,s,i,o){const n=document.createElement("div");n.className=`notification ${t}`,n.dataset.id=e;const r=this.getIcon(t),a=!o.persistent;return n.innerHTML=`
            <div class="notification-icon">${r}</div>
            <div class="notification-content">
                <div class="notification-title">${this.escapeHtml(s)}</div>
                <div class="notification-message">${this.escapeHtml(i)}</div>
                ${o.details?`<div class="notification-message" style="margin-top: 4px; font-size: 11px; opacity: 0.7;">${this.escapeHtml(o.details)}</div>`:""}
            </div>
            <button class="notification-close" onclick="window.notificationSystem.dismiss(${e})">&times;</button>
            ${a?'<div class="notification-progress"><div class="notification-progress-bar"></div></div>':""}
        `,{element:n,type:t,title:s,message:i,options:o,startTime:Date.now()}}getIcon(e){return{success:"✅",warning:"⚠️",error:"❌",info:"ℹ️"}[e]||"ℹ️"}getDefaultDuration(e){return{success:3e3,warning:5e3,error:7e3,info:4e3}[e]||4e3}startDismissTimer(e,t){const s=this.notifications.get(e);if(!s)return;const i=s.element.querySelector(".notification-progress-bar");if(i){let o=0;const n=50,r=n/t*100,a=setInterval(()=>{o+=r,i.style.width=`${Math.min(o,100)}%`,o>=100&&(clearInterval(a),this.dismiss(e))},n);s.timer=a}else s.timer=setTimeout(()=>{this.dismiss(e)},t)}dismiss(e){const t=this.notifications.get(e);t&&(t.timer&&(clearTimeout(t.timer),clearInterval(t.timer)),t.element.classList.add("hide"),setTimeout(()=>{t.element.parentNode&&t.element.parentNode.removeChild(t.element),this.notifications.delete(e)},300))}dismissAll(){Array.from(this.notifications.keys()).forEach(e=>{this.dismiss(e)})}success(e,t,s){return this.show("success",e,t,s)}warning(e,t,s){return this.show("warning",e,t,s)}error(e,t,s){return this.show("error",e,t,{persistent:!0,...s})}info(e,t,s){return this.show("info",e,t,s)}showLoading(e,t){return this.show("info",e,t,{persistent:!0})}updateLoading(e,t,s){const i=this.notifications.get(e);if(i){const o=i.element.querySelector(".notification-title"),n=i.element.querySelector(".notification-message");o&&(o.textContent=t),n&&(n.textContent=s)}}finishLoading(e,t=!0,s,i){const o=this.notifications.get(e);if(o){const n=t?"success":"error";o.element.className=`notification ${n} show`;const r=o.element.querySelector(".notification-icon");r&&(r.textContent=this.getIcon(n)),(s||i)&&this.updateLoading(e,s||o.title,i||o.message),setTimeout(()=>{this.startDismissTimer(e,t?2e3:4e3)},500)}}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}}window.notificationSystem=new Z;const f=window.notificationSystem;class ee{constructor(e=50){this.history=[],this.currentIndex=-1,this.maxHistorySize=e,this.isApplying=!1}execute(e){if(!this.isApplying)try{return e.execute(),this.history=this.history.slice(0,this.currentIndex+1),this.history.push(e),this.currentIndex++,this.history.length>this.maxHistorySize&&(this.history.shift(),this.currentIndex--),console.log(`Executed command: ${e.type}`),!0}catch(t){return console.error("Failed to execute command:",t),!1}}undo(){if(!this.canUndo())return!1;try{this.isApplying=!0;const e=this.history[this.currentIndex];return e.undo(),this.currentIndex--,console.log(`Undid command: ${e.type}`),!0}catch(e){return console.error("Failed to undo command:",e),!1}finally{this.isApplying=!1}}redo(){if(!this.canRedo())return!1;try{this.isApplying=!0,this.currentIndex++;const e=this.history[this.currentIndex];return e.execute(),console.log(`Redid command: ${e.type}`),!0}catch(e){return console.error("Failed to redo command:",e),this.currentIndex--,!1}finally{this.isApplying=!1}}canUndo(){return this.currentIndex>=0}canRedo(){return this.currentIndex<this.history.length-1}clear(){this.history=[],this.currentIndex=-1,console.log("Cleared undo/redo history")}getState(){return{canUndo:this.canUndo(),canRedo:this.canRedo(),historyLength:this.history.length,currentIndex:this.currentIndex}}}class te{constructor(){this.graph=new O,this.canvas=null,this.nodeCanvas=null,this.audioEngine=new j,this.codeGenerator=new X,this.nodePresets=new K,this.presetBrowser=null,this.keyboardShortcuts=null,this.undoRedoManager=new ee,this.statusIndicators={amy:document.getElementById("amy-status"),audio:document.getElementById("audio-status")},this.graph.createNodeFromType=e=>E(e),this.init()}async init(){console.log("Initializing AmyNode without LiteGraph..."),this.setupCanvas(),this.setupEventListeners(),this.setupDragAndDrop(),this.setupNodePanel(),this.keyboardShortcuts=new J(this),this.presetBrowser=new Q(this,this.nodePresets),this.initializeStatusIndicators(),this.setupGraphListeners(),console.log("AmyNode initialized successfully")}setupCanvas(){const e=document.getElementById("graph-canvas");if(!e){console.error("Canvas element not found");return}setTimeout(()=>{this.nodeCanvas=new L(e,this.graph),setTimeout(()=>{this.nodeCanvas&&(this.nodeCanvas.setupHighDPI(),this.nodeCanvas.render())},100);const t=this;this.canvas={setDirty:()=>t.nodeCanvas&&t.nodeCanvas.render(),draw:()=>t.nodeCanvas&&t.nodeCanvas.render(),ds:{get offset(){return t.nodeCanvas?t.nodeCanvas.offset:{x:0,y:0}},get scale(){return t.nodeCanvas?t.nodeCanvas.scale:1}},selected_nodes:[],selectNodes:s=>{t.nodeCanvas.selectedNodes.clear(),s.forEach(i=>t.nodeCanvas.selectedNodes.add(i))}}},10)}setupEventListeners(){document.getElementById("play-btn").addEventListener("click",async()=>{try{this.updateAudioStatus("loading","Audio: Starting..."),await this.audioEngine.start(),this.updateAudioConnections(),this.updateAudioStatus("playing","Audio: Playing"),f.success("Audio Started","Web preview is now playing")}catch(e){this.updateAudioStatus("error","Audio: Error"),f.error("Audio Failed","Could not start audio engine",{details:e.message})}}),document.getElementById("stop-btn").addEventListener("click",()=>{this.audioEngine.stop(),this.updateAudioStatus("stopped","Audio: Stopped"),f.info("Audio Stopped","Web preview stopped")}),document.getElementById("export-btn").addEventListener("click",async()=>{await this.exportCode()}),document.getElementById("save-btn").addEventListener("click",()=>{this.savePatch()}),document.getElementById("load-btn").addEventListener("click",()=>{document.getElementById("file-input").click()}),document.getElementById("file-input").addEventListener("change",e=>{this.loadPatch(e.target.files[0])}),document.getElementById("undo-btn").addEventListener("click",()=>{this.undo()}),document.getElementById("redo-btn").addEventListener("click",()=>{this.redo()}),document.getElementById("presets-btn").addEventListener("click",()=>{this.presetBrowser.show()}),document.querySelector(".close-btn").addEventListener("click",()=>{document.getElementById("code-modal").classList.add("hidden")}),document.getElementById("copy-code-btn").addEventListener("click",()=>{this.copyGeneratedCode()}),document.getElementById("download-code-btn").addEventListener("click",()=>{this.downloadGeneratedCode()})}setupDragAndDrop(){const e=document.querySelectorAll(".node-item"),t=document.querySelector(".canvas-container");e.forEach(s=>{s.setAttribute("draggable","true"),s.addEventListener("dragstart",i=>{const o=s.dataset.nodeType;i.dataTransfer.setData("text/plain",o),i.dataTransfer.effectAllowed="copy",s.style.opacity="0.5",s.classList.add("dragging")}),s.addEventListener("dragend",()=>{s.style.opacity="",s.classList.remove("dragging")})}),t.addEventListener("dragover",s=>{s.preventDefault(),s.dataTransfer.dropEffect="copy",t.classList.add("drag-over")}),t.addEventListener("dragleave",s=>{s.target===t&&t.classList.remove("drag-over")}),t.addEventListener("drop",s=>{s.preventDefault(),t.classList.remove("drag-over");const i=s.dataTransfer.getData("text/plain");if(i){const o=t.getBoundingClientRect(),n=this.nodeCanvas.screenToCanvas(s.clientX-o.left,s.clientY-o.top),r=this.nodeCanvas.gridSize,a=Math.round(n.x/r)*r,c=Math.round(n.y/r)*r;this.createNode(i,a,c)}})}setupNodePanel(){const e=document.getElementById("node-search");e&&e.addEventListener("input",s=>{this.filterNodes(s.target.value)}),document.querySelectorAll(".node-item").forEach(s=>{s.addEventListener("click",()=>{const i=s.dataset.nodeType,o=this.nodeCanvas.canvas.width/2/window.devicePixelRatio,n=this.nodeCanvas.canvas.height/2/window.devicePixelRatio,r=this.nodeCanvas.screenToCanvas(o,n),a=this.nodeCanvas.gridSize,c=Math.round(r.x/a)*a,l=Math.round(r.y/a)*a;this.createNode(i,c,l)})})}setupGraphListeners(){this.graph.on("nodeSelected",({node:e})=>{this.updatePropertiesPanel(e)}),this.graph.on("selectionCleared",()=>{this.updatePropertiesPanel(null)})}createNode(e,t,s){console.log("Creating node:",e,"at",t,s);try{const i=E(e);if(!i)throw new Error(`Unknown node type: ${e}`);i.position={x:t,y:s},this.graph.addNode(i);const o={type:"add_node",execute:()=>{this.graph.addNode(i)},undo:()=>{this.graph.removeNode(i.id)}};return this.undoRedoManager.execute(o),this.updateUndoRedoButtons(),["oscillator","filter","reverb","chorus","echo","envelope"].includes(e)&&f.success("Node Added",`${e} node created successfully`),i}catch(i){return f.error("Node Creation Failed",i.message),console.error("Failed to create node:",i),null}}updatePropertiesPanel(e){const t=document.getElementById("properties-content");if(!e){t.innerHTML='<p class="placeholder-text">Select a node to edit properties</p>';return}let s=`<h3>${e.title}</h3>`;Object.entries(e.parameters).forEach(([i,o])=>{if(s+='<div class="property-group">',s+=`<label class="property-label">${i.replace(/_/g," ")}</label>`,o.type==="select")s+=`<select class="property-input" data-param="${i}">`,(e[i+"s"]||[]).forEach(r=>{const a=o.value===r?"selected":"";s+=`<option value="${r}" ${a}>${r}</option>`}),s+="</select>";else if(o.type==="boolean"){const n=o.value?"checked":"";s+=`<input type="checkbox" class="property-input" data-param="${i}" ${n}>`}else s+=`<input type="${o.type||"number"}" class="property-input" 
                    data-param="${i}" 
                    value="${o.value}"
                    ${o.min!==null?`min="${o.min}"`:""}
                    ${o.max!==null?`max="${o.max}"`:""}
                    ${o.step!==null?`step="${o.step}"`:""}>`;s+="</div>"}),t.innerHTML=s,t.querySelectorAll(".property-input").forEach(i=>{i.addEventListener("change",o=>{const n=o.target.dataset.param;let r=o.target.type==="checkbox"?o.target.checked:o.target.type==="number"?parseFloat(o.target.value):o.target.value;e.setParameter(n,r),this.updateAudioConnections()})})}updateAudioConnections(){if(!this.audioEngine.isRunning){console.log("Audio engine not running, skipping connection update");return}console.log("Updating audio connections from graph state"),this.audioEngine.updateFromGraph(this.graph);const e=this.graph.getNodes().filter(t=>t.type==="output"||t.type==="amy/output");if(e.length>0)console.log(`Found ${e.length} output node(s), audio should be connected`);else{console.log("No output nodes found - adding default output connection");const t=this.graph.getNodes().filter(s=>s.type==="oscillator"||s.type==="amy/oscillator");t.length>0&&(console.log(`Found ${t.length} oscillator(s) without output - enabling direct connection`),this.audioEngine.enableDirectOscillatorOutput=!0)}}filterNodes(e){const t=document.querySelectorAll(".node-item"),s=e.toLowerCase();t.forEach(i=>{const o=(i.dataset.keywords||"").toLowerCase(),n=(i.dataset.nodeType||"").toLowerCase(),r=!s||o.includes(s)||n.includes(s);i.classList.toggle("hidden",!r)})}async exportCode(){const e=this.generateArduinoCode(),t=document.getElementById("code-modal"),s=document.getElementById("generated-code");s.textContent=e,t.classList.remove("hidden"),this.generatedCode=e,f.success("Code Generated","Arduino code generated successfully")}generateArduinoCode(){let e=`// Generated by AmyNode
// AMY Audio Library Arduino Sketch

#include "amy.h"

// Pin definitions
`;const t=[],s=[];this.graph.nodes.forEach(n=>{n.type==="adc"&&t.push(n),n.type==="gpio"&&s.push(n)}),t.forEach(n=>{e+=`const int ADC${n.getParameter("pin")}_PIN = ${n.getParameter("pin")};
`}),s.forEach(n=>{e+=`const int GPIO${n.getParameter("pin")}_PIN = ${n.getParameter("pin")};
`}),e+=`
void setup() {
    Serial.begin(115200);
    
    // Initialize AMY
    amy_start();
    
`;const i=this.graph.getProcessingOrder();let o=0;return i.forEach(n=>{n.oscIndex===void 0&&(n.type==="oscillator"||n.type==="lfo")&&(n.oscIndex=o++);const r=n.generateCode();r&&(e+="    "+r.replace(/\n/g,`
    `)+`
`)}),e+=`}

void loop() {
    // Read inputs and update parameters
    
`,t.forEach(n=>{e+=`    // ${n.title} processing
`,e+=`    ${n.generateCode().replace(/\n/g,`
    `)}
`}),s.forEach(n=>{e+=`    // ${n.title} processing
`,e+=`    ${n.generateCode().replace(/\n/g,`
    `)}
`}),e+=`    
    delay(10); // Update rate
}
`,e}copyGeneratedCode(){this.generatedCode&&navigator.clipboard.writeText(this.generatedCode).then(()=>{f.success("Copied!","Code copied to clipboard")}).catch(e=>{f.error("Copy Failed","Could not copy to clipboard")})}downloadGeneratedCode(){if(!this.generatedCode)return;const e=new Blob([this.generatedCode],{type:"text/plain"}),t=URL.createObjectURL(e),s=document.createElement("a");s.href=t,s.download="amy_patch.ino",s.click(),URL.revokeObjectURL(t)}savePatch(){const e={version:"2.0",graph:this.graph.serialize(),timestamp:new Date().toISOString(),metadata:{title:"AmyNode Patch",author:"",description:""}},t=JSON.stringify(e,null,2),s=new Blob([t],{type:"application/json"}),i=URL.createObjectURL(s),o=document.createElement("a");o.href=i,o.download=`amy_patch_${Date.now()}.json`,o.click(),URL.revokeObjectURL(i),f.success("Patch Saved","Patch saved successfully")}async loadPatch(e){var t;if(e)try{const s=await e.text(),i=JSON.parse(s);if(!i.graph)throw new Error("Invalid patch file");this.graph.deserialize(i.graph),f.success("Patch Loaded",`Loaded: ${((t=i.metadata)==null?void 0:t.title)||"Untitled"}`)}catch(s){console.error("Error loading patch:",s),f.error("Load Failed","Failed to load patch file")}}undo(){this.undoRedoManager.undo()&&(this.updateUndoRedoButtons(),console.log("Undo successful"))}redo(){this.undoRedoManager.redo()&&(this.updateUndoRedoButtons(),console.log("Redo successful"))}updateUndoRedoButtons(){const e=this.undoRedoManager.getState(),t=document.getElementById("undo-btn"),s=document.getElementById("redo-btn");t&&(t.disabled=!e.canUndo,t.title=e.canUndo?"Undo last action":"Nothing to undo"),s&&(s.disabled=!e.canRedo,s.title=e.canRedo?"Redo last action":"Nothing to redo")}initializeStatusIndicators(){this.updateAmyStatus("loading","AMY WASM: Loading..."),this.updateAudioStatus("stopped","Audio: Stopped"),setTimeout(()=>{this.updateAmyStatus("ready","AMY WASM: Ready")},2e3)}updateAmyStatus(e,t){this.statusIndicators.amy&&(this.statusIndicators.amy.className=`status-indicator ${e}`,this.statusIndicators.amy.querySelector(".status-text").textContent=t)}updateAudioStatus(e,t){this.statusIndicators.audio&&(this.statusIndicators.audio.className=`status-indicator ${e}`,this.statusIndicators.audio.querySelector(".status-text").textContent=t)}}window.addEventListener("DOMContentLoaded",()=>{console.log("Starting AmyNode without LiteGraph..."),window.amyApp=new te});
