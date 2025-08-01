/**
 * Canvas-based node editor for AmyNode
 * Provides visual interface for node graph editing
 */

import { SignalTypes } from './NodeSystem.js';

export class NodeCanvas {
    constructor(canvas, graph) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.graph = graph;
        
        // Visual settings
        this.gridSize = 20;
        this.majorGridSize = 100;
        this.nodeWidth = 180;
        this.nodeHeaderHeight = 30;
        this.portRadius = 6;
        this.portSpacing = 25;
        
        // View state
        this.offset = { x: 0, y: 0 };
        this.scale = 1.0;
        this.minScale = 0.1;
        this.maxScale = 3.0;
        
        // Interaction state
        this.draggedNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.hoveredNode = null;
        this.hoveredPort = null;
        this.selectedNodes = new Set();
        
        // Connection creation
        this.connectionStart = null;
        this.connectionPreview = null;
        this.mousePosition = { x: 0, y: 0 };
        
        // Canvas state
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        
        // Colors
        this.theme = {
            background: '#1e1e1e',
            grid: '#2a2a2a',
            majorGrid: '#353535',
            nodeBackground: '#2d2d2d',
            nodeHeader: '#404040',
            nodeBorder: '#555',
            nodeSelectedBorder: '#ff6600',
            nodeText: '#fff',
            portStroke: '#666',
            connectionStroke: 3,
            connectionPreview: '#888'
        };
        
        this.init();
    }
    
    init() {
        // Set up high DPI canvas
        this.setupHighDPI();
        
        // Bind events
        this.bindEvents();
        
        // Listen to graph events
        this.graph.on('nodeAdded', () => this.render());
        this.graph.on('nodeRemoved', () => this.render());
        this.graph.on('connectionAdded', () => this.render());
        this.graph.on('connectionRemoved', () => this.render());
        
        // Start render loop
        this.startRenderLoop();
    }
    
    setupHighDPI() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        
        // Keyboard events
        this.canvas.addEventListener('keydown', (e) => this.onKeyDown(e));
        this.canvas.tabIndex = 1; // Make canvas focusable
        
        // Context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Window resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    startRenderLoop() {
        const render = () => {
            this.render();
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }
    
    // Coordinate transforms
    screenToCanvas(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (x - rect.left - this.offset.x) / this.scale,
            y: (y - rect.top - this.offset.y) / this.scale
        };
    }
    
    canvasToScreen(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: x * this.scale + this.offset.x + rect.left,
            y: y * this.scale + this.offset.y + rect.top
        };
    }
    
    // Hit testing
    getNodeAt(x, y) {
        const canvasPos = this.screenToCanvas(x, y);
        
        // Check nodes in reverse order (top to bottom)
        const nodes = Array.from(this.graph.nodes.values()).reverse();
        
        for (const node of nodes) {
            if (canvasPos.x >= node.position.x &&
                canvasPos.x <= node.position.x + node.size.width &&
                canvasPos.y >= node.position.y &&
                canvasPos.y <= node.position.y + node.size.height) {
                return node;
            }
        }
        
        return null;
    }
    
    getPortAt(x, y) {
        const canvasPos = this.screenToCanvas(x, y);
        
        for (const node of this.graph.nodes.values()) {
            // Check input ports
            for (let i = 0; i < node.inputs.length; i++) {
                const portPos = this.getPortPosition(node, node.inputs[i], i, true);
                const dist = Math.hypot(canvasPos.x - portPos.x, canvasPos.y - portPos.y);
                if (dist <= this.portRadius + 4) {
                    return { node, port: node.inputs[i], isInput: true };
                }
            }
            
            // Check output ports
            for (let i = 0; i < node.outputs.length; i++) {
                const portPos = this.getPortPosition(node, node.outputs[i], i, false);
                const dist = Math.hypot(canvasPos.x - portPos.x, canvasPos.y - portPos.y);
                if (dist <= this.portRadius + 4) {
                    return { node, port: node.outputs[i], isInput: false };
                }
            }
        }
        
        return null;
    }
    
    getPortPosition(node, port, index, isInput) {
        const x = isInput ? node.position.x : node.position.x + node.size.width;
        const y = node.position.y + this.nodeHeaderHeight + (index + 1) * this.portSpacing;
        return { x, y };
    }
    
    // Event handlers
    onMouseDown(e) {
        const x = e.clientX;
        const y = e.clientY;
        
        this.canvas.focus();
        
        // Check for port click (connection creation)
        const portInfo = this.getPortAt(x, y);
        if (portInfo) {
            this.startConnection(portInfo);
            return;
        }
        
        // Check for node click
        const node = this.getNodeAt(x, y);
        if (node) {
            if (e.shiftKey) {
                // Toggle selection
                if (this.selectedNodes.has(node)) {
                    this.selectedNodes.delete(node);
                } else {
                    this.selectedNodes.add(node);
                }
            } else if (!this.selectedNodes.has(node)) {
                // Select only this node
                this.selectedNodes.clear();
                this.selectedNodes.add(node);
            }
            
            // Start dragging
            const canvasPos = this.screenToCanvas(x, y);
            this.draggedNode = node;
            this.dragOffset = {
                x: canvasPos.x - node.position.x,
                y: canvasPos.y - node.position.y
            };
            
            return;
        }
        
        // Start panning or selection box
        if (e.button === 2 || e.button === 1 || (e.button === 0 && e.altKey)) {
            // Right click or middle click or alt+left click: pan
            this.isPanning = true;
            this.panStart = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grab';
        } else {
            // Clear selection
            this.selectedNodes.clear();
        }
    }
    
    onMouseMove(e) {
        const x = e.clientX;
        const y = e.clientY;
        
        this.mousePosition = this.screenToCanvas(x, y);
        
        // Update connection preview
        if (this.connectionStart) {
            this.connectionPreview = { x, y };
            return;
        }
        
        // Handle node dragging
        if (this.draggedNode) {
            const canvasPos = this.screenToCanvas(x, y);
            
            // Snap to grid
            const snappedX = Math.round((canvasPos.x - this.dragOffset.x) / this.gridSize) * this.gridSize;
            const snappedY = Math.round((canvasPos.y - this.dragOffset.y) / this.gridSize) * this.gridSize;
            
            // Move all selected nodes
            const dx = snappedX - this.draggedNode.position.x;
            const dy = snappedY - this.draggedNode.position.y;
            
            this.selectedNodes.forEach(node => {
                node.position.x += dx;
                node.position.y += dy;
            });
            
            return;
        }
        
        // Handle panning
        if (this.isPanning) {
            this.offset.x += e.clientX - this.panStart.x;
            this.offset.y += e.clientY - this.panStart.y;
            this.panStart = { x: e.clientX, y: e.clientY };
            return;
        }
        
        // Update hover states
        this.hoveredPort = this.getPortAt(x, y);
        this.hoveredNode = this.hoveredPort ? null : this.getNodeAt(x, y);
        
        // Update cursor
        if (this.hoveredPort) {
            this.canvas.style.cursor = 'crosshair';
        } else if (this.hoveredNode) {
            this.canvas.style.cursor = 'move';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    onMouseUp(e) {
        // Complete connection
        if (this.connectionStart) {
            const portInfo = this.getPortAt(e.clientX, e.clientY);
            if (portInfo && this.connectionStart.port.canConnectTo(portInfo.port)) {
                try {
                    if (this.connectionStart.isInput) {
                        this.graph.connectNodes(
                            portInfo.node.id, portInfo.port.id,
                            this.connectionStart.node.id, this.connectionStart.port.id
                        );
                    } else {
                        this.graph.connectNodes(
                            this.connectionStart.node.id, this.connectionStart.port.id,
                            portInfo.node.id, portInfo.port.id
                        );
                    }
                } catch (error) {
                    console.error('Connection failed:', error);
                }
            }
            
            this.connectionStart = null;
            this.connectionPreview = null;
        }
        
        // Stop dragging
        this.draggedNode = null;
        
        // Stop panning
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY;
        const scaleFactor = 1.1;
        const newScale = delta < 0 ? this.scale * scaleFactor : this.scale / scaleFactor;
        
        // Clamp scale
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
        
        // Zoom towards mouse position
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scaleChange = newScale / this.scale;
        this.offset.x = mouseX - (mouseX - this.offset.x) * scaleChange;
        this.offset.y = mouseY - (mouseY - this.offset.y) * scaleChange;
    }
    
    onDoubleClick(e) {
        // Check for connection double-click to delete
        const canvasPos = this.screenToCanvas(e.clientX, e.clientY);
        
        for (const connection of this.graph.connections) {
            const start = this.getPortPosition(
                connection.outputNode,
                connection.outputPort,
                connection.outputNode.outputs.indexOf(connection.outputPort),
                false
            );
            const end = this.getPortPosition(
                connection.inputNode,
                connection.inputPort,
                connection.inputNode.inputs.indexOf(connection.inputPort),
                true
            );
            
            // Simple distance check from line
            const dist = this.pointToLineDistance(canvasPos, start, end);
            if (dist < 10) {
                this.graph.removeConnection(connection.id);
                break;
            }
        }
    }
    
    onKeyDown(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // Delete selected nodes
            this.selectedNodes.forEach(node => {
                this.graph.removeNode(node.id);
            });
            this.selectedNodes.clear();
        }
    }
    
    onResize() {
        this.setupHighDPI();
    }
    
    startConnection(portInfo) {
        this.connectionStart = portInfo;
        this.connectionPreview = this.canvasToScreen(
            ...Object.values(this.getPortPosition(
                portInfo.node,
                portInfo.port,
                portInfo.isInput ? 
                    portInfo.node.inputs.indexOf(portInfo.port) :
                    portInfo.node.outputs.indexOf(portInfo.port),
                portInfo.isInput
            ))
        );
    }
    
    // Rendering
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        // Clear canvas
        ctx.fillStyle = this.theme.background;
        ctx.fillRect(0, 0, width, height);
        
        // Save transform
        ctx.save();
        
        // Apply view transform
        ctx.translate(this.offset.x, this.offset.y);
        ctx.scale(this.scale, this.scale);
        
        // Draw grid
        this.drawGrid(ctx, width, height);
        
        // Draw connections
        this.graph.connections.forEach(conn => this.drawConnection(ctx, conn));
        
        // Draw connection preview
        if (this.connectionStart && this.connectionPreview) {
            this.drawConnectionPreview(ctx);
        }
        
        // Draw nodes
        this.graph.nodes.forEach(node => this.drawNode(ctx, node));
        
        // Restore transform
        ctx.restore();
    }
    
    drawGrid(ctx, width, height) {
        const startX = Math.floor(-this.offset.x / this.scale / this.gridSize) * this.gridSize;
        const startY = Math.floor(-this.offset.y / this.scale / this.gridSize) * this.gridSize;
        const endX = startX + width / this.scale + this.gridSize;
        const endY = startY + height / this.scale + this.gridSize;
        
        ctx.strokeStyle = this.theme.grid;
        ctx.lineWidth = 1;
        
        // Minor grid
        ctx.beginPath();
        for (let x = startX; x <= endX; x += this.gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += this.gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
        
        // Major grid
        ctx.strokeStyle = this.theme.majorGrid;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += this.majorGridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += this.majorGridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
    }
    
    drawNode(ctx, node) {
        const x = node.position.x;
        const y = node.position.y;
        const width = node.size.width;
        const height = node.size.height;
        
        // Update node height based on ports
        const portCount = Math.max(node.inputs.length, node.outputs.length);
        node.size.height = this.nodeHeaderHeight + (portCount + 1) * this.portSpacing;
        
        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Background
        ctx.fillStyle = this.theme.nodeBackground;
        this.roundRect(ctx, x, y, width, node.size.height, 8);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        
        // Header
        ctx.fillStyle = this.theme.nodeHeader;
        this.roundRect(ctx, x, y, width, this.nodeHeaderHeight, 8, true, false);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = this.selectedNodes.has(node) ? 
            this.theme.nodeSelectedBorder : this.theme.nodeBorder;
        ctx.lineWidth = this.selectedNodes.has(node) ? 2 : 1;
        this.roundRect(ctx, x, y, width, node.size.height, 8);
        ctx.stroke();
        
        // Title
        ctx.fillStyle = this.theme.nodeText;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.title, x + width / 2, y + this.nodeHeaderHeight / 2);
        
        // Draw ports
        node.inputs.forEach((port, i) => this.drawPort(ctx, node, port, i, true));
        node.outputs.forEach((port, i) => this.drawPort(ctx, node, port, i, false));
    }
    
    drawPort(ctx, node, port, index, isInput) {
        const pos = this.getPortPosition(node, port, index, isInput);
        const signalType = SignalTypes[port.type];
        
        // Port circle
        ctx.fillStyle = signalType.color;
        ctx.strokeStyle = this.theme.portStroke;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.portRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Hover highlight
        if (this.hoveredPort && this.hoveredPort.port === port) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.portRadius + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Port label
        ctx.fillStyle = this.theme.nodeText;
        ctx.font = '12px sans-serif';
        ctx.textAlign = isInput ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        const labelX = isInput ? pos.x + 15 : pos.x - 15;
        ctx.fillText(port.name, labelX, pos.y);
    }
    
    drawConnection(ctx, connection) {
        const start = this.getPortPosition(
            connection.outputNode,
            connection.outputPort,
            connection.outputNode.outputs.indexOf(connection.outputPort),
            false
        );
        const end = this.getPortPosition(
            connection.inputNode,
            connection.inputPort,
            connection.inputNode.inputs.indexOf(connection.inputPort),
            true
        );
        
        const signalType = SignalTypes[connection.outputPort.type];
        
        ctx.strokeStyle = signalType.color;
        ctx.lineWidth = this.theme.connectionStroke;
        
        // Draw bezier curve
        this.drawBezierConnection(ctx, start, end);
    }
    
    drawConnectionPreview(ctx) {
        if (!this.connectionStart) return;
        
        const start = this.getPortPosition(
            this.connectionStart.node,
            this.connectionStart.port,
            this.connectionStart.isInput ?
                this.connectionStart.node.inputs.indexOf(this.connectionStart.port) :
                this.connectionStart.node.outputs.indexOf(this.connectionStart.port),
            this.connectionStart.isInput
        );
        
        const signalType = SignalTypes[this.connectionStart.port.type];
        
        ctx.strokeStyle = signalType.color;
        ctx.lineWidth = this.theme.connectionStroke;
        ctx.setLineDash([5, 5]);
        
        if (this.connectionStart.isInput) {
            this.drawBezierConnection(ctx, this.mousePosition, start);
        } else {
            this.drawBezierConnection(ctx, start, this.mousePosition);
        }
        
        ctx.setLineDash([]);
    }
    
    drawBezierConnection(ctx, start, end) {
        const cp1x = start.x + (end.x - start.x) * 0.5;
        const cp1y = start.y;
        const cp2x = end.x - (end.x - start.x) * 0.5;
        const cp2y = end.y;
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, end.x, end.y);
        ctx.stroke();
    }
    
    // Utility functions
    roundRect(ctx, x, y, width, height, radius, topOnly = false, bottomOnly = false) {
        ctx.beginPath();
        if (topOnly) {
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.arcTo(x + width, y, x + width, y + radius, radius);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x, y + radius);
            ctx.arcTo(x, y, x + radius, y, radius);
        } else if (bottomOnly) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width, y + height - radius);
            ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
            ctx.lineTo(x + radius, y + height);
            ctx.arcTo(x, y + height, x, y + height - radius, radius);
            ctx.lineTo(x, y);
        } else {
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.arcTo(x + width, y, x + width, y + radius, radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
            ctx.lineTo(x + radius, y + height);
            ctx.arcTo(x, y + height, x, y + height - radius, radius);
            ctx.lineTo(x, y + radius);
            ctx.arcTo(x, y, x + radius, y, radius);
        }
        ctx.closePath();
    }
    
    pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }
        
        const dx = point.x - xx;
        const dy = point.y - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
}