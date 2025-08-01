import { LiteGraph, LGraphCanvas } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
import './utils/LiteGraphPatch.js'; // Apply comprehensive patches

// window2 is now defined in index.html as a getter

import { registerCustomNodes } from './nodes/index.js';
import { AudioEngine } from './audio/engine.js';
import { CodeGenerator } from './codegen/generator.js';
import { SimpleGrid } from './canvas/SimpleGrid.js';
import { NodeStyler } from './canvas/NodeStyler.js';
import { HighDPICanvas } from './canvas/HighDPICanvas.js';
import { KeyboardShortcuts } from './utils/KeyboardShortcuts.js';
import { notifications } from './utils/NotificationSystem.js';
import { UndoRedoManager, AddNodeCommand, RemoveNodeCommand, MoveNodeCommand } from './utils/UndoRedoManager.js';
import { NodePresets } from './utils/NodePresets.js';
import { PresetBrowser } from './ui/PresetBrowser.js';

class AmyNodeApp {
    constructor() {
        this.graph = new LiteGraph.LGraph();
        this.canvas = null;
        this.highDPICanvas = null;
        this.audioEngine = new AudioEngine();
        this.codeGenerator = new CodeGenerator();
        this.selectedNode = null;
        this.keyboardShortcuts = null;
        this.undoRedoManager = new UndoRedoManager();
        this.nodePresets = new NodePresets();
        this.presetBrowser = new PresetBrowser(this, this.nodePresets);
        this.statusIndicators = {
            amy: document.getElementById('amy-status'),
            audio: document.getElementById('audio-status')
        };
        
        this.init();
    }
    
    init() {
        // window2 is now defined in index.html as a getter
        
        // Apply custom styling
        new NodeStyler();
        
        registerCustomNodes();
        
        this.setupCanvas();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupNodeSearch();
        this.setupGraph();
        
        // Initialize grid after canvas is setup
        this.grid = new SimpleGrid(this.canvas);
        
        // Apply High DPI fixes with error handling
        try {
            this.highDPICanvas = new HighDPICanvas(this.canvas);
        } catch (error) {
            console.error('Failed to initialize HighDPICanvas:', error);
            // Continue without High DPI support
        }
        
        // Fix LiteGraph's DOM references
        this.patchLiteGraphDOM();
        
        // Fix window2 reference issue in LiteGraph
        this.patchLiteGraphWindow();
        
        // Override Litegraph's resize method to support high DPI
        const originalResize = this.canvas.resize.bind(this.canvas);
        this.canvas.resize = () => {
            // Call original resize first
            originalResize();
            // Then apply our high DPI fixes
            this.highDPICanvas.onResize();
        };
        
        // Initialize keyboard shortcuts
        this.keyboardShortcuts = new KeyboardShortcuts(this);
        
        // Initialize status indicators
        this.initializeStatusIndicators();
        
        // Force initial render with proper DPI scaling
        setTimeout(() => {
            this.resizeCanvas();
            if (this.highDPICanvas) {
                this.highDPICanvas.onResize();
            }
            this.canvas.setDirty(true, true);
        }, 100);
    }
    
    setupCanvas() {
        const canvasElement = document.getElementById('graph-canvas');
        
        // window2 is already defined in index.html
        
        // Temporarily override LGraphCanvas prototype methods before instantiation
        const originalStartRendering = LiteGraph.LGraphCanvas.prototype.startRendering;
        const originalRenderFrame = LiteGraph.LGraphCanvas.prototype.renderFrame;
        
        // Replace with safe versions
        LiteGraph.LGraphCanvas.prototype.startRendering = function() {
            console.log('Rendering started with safe method');
        };
        
        LiteGraph.LGraphCanvas.prototype.renderFrame = function() {
            if (this.ctx && !this.pause_rendering) {
                this.draw(true, true);
            }
        };
        
        // Create canvas
        this.canvas = new LGraphCanvas(canvasElement, this.graph);
        
        // Wrap all canvas mouse events to prevent errors
        const mouseEvents = ['processMouseMove', 'processMouseDown', 'processMouseUp', 'processDrop'];
        mouseEvents.forEach(eventName => {
            const original = this.canvas[eventName];
            if (original && typeof original === 'function') {
                this.canvas[eventName] = function(...args) {
                    try {
                        // Ensure window refs exist
                        if (typeof window2 === 'undefined') window.window2 = window;
                        if (typeof ref_window2 === 'undefined') window.ref_window2 = window;
                        return original.apply(this, args);
                    } catch (error) {
                        if (!error.message || !error.message.includes('window2')) {
                            console.warn(`Canvas ${eventName} error:`, error);
                        }
                        // Continue operation despite error
                    }
                };
            }
        });
        
        // Restore original methods if needed (though we'll keep our safe versions)
        // LiteGraph.LGraphCanvas.prototype.startRendering = originalStartRendering;
        // LiteGraph.LGraphCanvas.prototype.renderFrame = originalRenderFrame;
        
        // Start our own rendering loop
        const render = () => {
            if (this.canvas && this.canvas.ctx && !this.canvas.pause_rendering) {
                this.canvas.draw(true, true);
            }
            window.requestAnimationFrame(render);
        };
        window.requestAnimationFrame(render);
        
        // Enable high DPI support
        const dpr = window.devicePixelRatio || 1;
        this.canvas.use_high_dpi = true;
        this.canvas.graph_scale = 1;
        
        // Disable default background
        this.canvas.background_image = false;
        this.canvas.render_shadows = false;
        this.canvas.render_connection_arrows = true;
        this.canvas.clear_background = false;
        
        // Enable node interaction
        this.canvas.allow_dragcanvas = true;
        this.canvas.allow_dragnodes = true;
        this.canvas.allow_interaction = true;
        
        // Set font rendering for crisp text on Retina displays
        this.canvas.render_font_quality = 'high';
        this.canvas.render_curved_connections = true; // Keep curves but render them better
        this.canvas.render_connection_arrows = true; // Keep arrows for clarity
        this.canvas.highquality_render = true;
        this.canvas.antialiasing = true;
        this.canvas.render_only_selected = false;
        this.canvas.clear_background = true;
        this.canvas.connections_width = dpr > 1 ? 2 : 3; // Thinner lines on Retina
        this.canvas.connections_shadow = false; // Disable shadows on Retina for clarity
        
        // Additional Retina optimizations
        if (dpr > 1) {
            this.canvas.link_type_colors = {
                audio: "#4CAF50",
                number: "#FF9800",
                default: "#4CAF50"
            };
        }
        
        this.canvas.onNodeSelected = (node) => {
            console.log('Node selected:', node);
            this.selectedNode = node;
            if (node) {
                this.updatePropertiesPanel(node);
            }
        };
        
        this.canvas.onNodeDeselected = () => {
            console.log('Node deselected');
            this.selectedNode = null;
            this.updatePropertiesPanel(null);
        };
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            // LiteGraphのresize呼び出しを削除（resizeCanvas内で処理）
            this.canvas.setDirty(true, true);
        });
        
        // Ensure canvas has proper size for Retina displays
        this.resizeCanvas();
        
        // Resume rendering after setup
        this.canvas.pause_rendering = false;
    }
    
    setupEventListeners() {
        document.getElementById('play-btn').addEventListener('click', async () => {
            try {
                this.updateAudioStatus('loading', 'Audio: Starting...');
                await this.audioEngine.start();
                this.updateAudioConnections();
                this.updateAudioStatus('playing', 'Audio: Playing');
                notifications.success('Audio Started', 'Web preview is now playing');
            } catch (error) {
                this.updateAudioStatus('error', 'Audio: Error');
                notifications.error('Audio Failed', 'Could not start audio engine', {
                    details: error.message
                });
            }
        });
        
        document.getElementById('stop-btn').addEventListener('click', () => {
            this.audioEngine.stop();
            this.updateAudioStatus('stopped', 'Audio: Stopped');
            notifications.info('Audio Stopped', 'Web preview stopped');
        });
        
        document.getElementById('export-btn').addEventListener('click', async () => {
            await this.exportCode();
        });
        
        const modal = document.getElementById('code-modal');
        document.querySelector('.close-btn').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        document.getElementById('copy-code-btn').addEventListener('click', () => {
            this.copyGeneratedCode();
        });
        
        document.getElementById('download-code-btn').addEventListener('click', () => {
            this.downloadGeneratedCode();
        });
        
        document.getElementById('save-btn').addEventListener('click', () => {
            this.savePatch();
        });
        
        document.getElementById('load-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.loadPatch(e.target.files[0]);
        });
        
        // Undo/Redo button events
        document.getElementById('undo-btn').addEventListener('click', () => {
            this.keyboardShortcuts.undo();
            this.updateUndoRedoButtons();
        });
        
        document.getElementById('redo-btn').addEventListener('click', () => {
            this.keyboardShortcuts.redo();
            this.updateUndoRedoButtons();
        });
        
        // Presets button event
        document.getElementById('presets-btn').addEventListener('click', () => {
            this.presetBrowser.show();
        });
    }
    
    setupDragAndDrop() {
        const nodeItems = document.querySelectorAll('.node-item');
        
        nodeItems.forEach(item => {
            item.setAttribute('draggable', 'true');
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                const nodeType = item.dataset.nodeType;
                console.log('Drag start:', nodeType);
                e.dataTransfer.setData('text/plain', nodeType);
                e.dataTransfer.effectAllowed = 'copy';
                
                // Visual feedback
                item.style.opacity = '0.5';
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', (e) => {
                item.style.opacity = '';
                item.classList.remove('dragging');
            });
        });
        
        const canvasContainer = document.querySelector('.canvas-container');
        
        canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            canvasContainer.classList.add('drag-over');
        });
        
        canvasContainer.addEventListener('dragleave', (e) => {
            if (e.target === canvasContainer) {
                canvasContainer.classList.remove('drag-over');
            }
        });
        
        canvasContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            canvasContainer.classList.remove('drag-over');
            
            const nodeType = e.dataTransfer.getData('text/plain');
            console.log('Drop event - nodeType:', nodeType);
            
            if (nodeType) {
                // Try multiple coordinate conversion methods
                let canvasPos;
                try {
                    canvasPos = this.canvas.convertEventToCanvasOffset(e);
                } catch (error) {
                    console.warn('convertEventToCanvasOffset failed, using manual conversion:', error);
                    const canvasRect = this.canvas.canvas.getBoundingClientRect();
                    const x = e.clientX - canvasRect.left;
                    const y = e.clientY - canvasRect.top;
                    const offset = this.canvas.ds?.offset || [0, 0];
                    const scale = this.canvas.ds?.scale || 1;
                    canvasPos = [(x - offset[0]) / scale, (y - offset[1]) / scale];
                }
                
                console.log('Canvas position:', canvasPos);
                
                // Snap to grid
                const gridSize = 20;
                const snappedX = Math.round(canvasPos[0] / gridSize) * gridSize;
                const snappedY = Math.round(canvasPos[1] / gridSize) * gridSize;
                
                this.createNode(nodeType, snappedX, snappedY);
                
                // Force canvas update
                this.canvas.setDirty(true, true);
            }
        });
        
        // Alternative: Click to add nodes
        nodeItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const nodeType = item.dataset.nodeType;
                console.log('Click event - nodeType:', nodeType);
                console.log('Item dataset:', item.dataset);
                
                // Add node at center of visible area
                const visibleArea = this.canvas.visible_area;
                let centerX, centerY;
                
                if (visibleArea) {
                    centerX = visibleArea[0] + visibleArea[2] / 2;
                    centerY = visibleArea[1] + visibleArea[3] / 2;
                } else {
                    // Fallback to canvas center
                    centerX = 0;
                    centerY = 0;
                }
                
                // Snap to grid
                const gridSize = 20;
                const snappedX = Math.round(centerX / gridSize) * gridSize;
                const snappedY = Math.round(centerY / gridSize) * gridSize;
                
                console.log('Adding node at:', snappedX, snappedY);
                this.createNode(nodeType, snappedX, snappedY);
                
                // Visual feedback
                item.classList.add('clicked');
                setTimeout(() => item.classList.remove('clicked'), 200);
                
                // Force canvas update
                this.canvas.setDirty(true, true);
            });
        });
    }
    
    setupNodeSearch() {
        const searchInput = document.getElementById('node-search');
        const nodeItems = document.querySelectorAll('.node-item');
        
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            nodeItems.forEach(item => {
                const nodeName = item.querySelector('.node-name')?.textContent.toLowerCase() || '';
                const nodeDesc = item.querySelector('.node-description')?.textContent.toLowerCase() || '';
                const keywords = item.dataset.keywords?.toLowerCase() || '';
                
                const matches = nodeName.includes(searchTerm) || 
                               nodeDesc.includes(searchTerm) || 
                               keywords.includes(searchTerm);
                
                if (searchTerm === '' || matches) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
        
        // Clear search on Escape
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                nodeItems.forEach(item => item.classList.remove('hidden'));
                searchInput.blur();
            }
        });
    }
    
    setupGraph() {
        this.graph.onConnectionChange = () => {
            if (this.audioEngine.isRunning) {
                this.updateAudioConnections();
            }
        };
        
        this.graph.start();
    }
    
    createNode(type, x, y) {
        console.log('Creating node:', type, 'at', x, y);
        
        const nodeType = `amy/${type}`;
        const validX = isFinite(x) ? x : 100;
        const validY = isFinite(y) ? y : 100;
        
        // Create and execute add node command
        const command = new AddNodeCommand(this.graph, nodeType, { x: validX, y: validY });
        
        if (this.undoRedoManager.execute(command)) {
            const node = command.node;
            
            // Ensure node has size
            if (!node.size || !node.size[0] || !node.size[1]) {
                node.size = [180, 100];
            }
            
            console.log('Node created successfully:', node);
            
            // Force canvas update
            this.canvas.setDirty(true, true);
            
            // Update Undo/Redo button states
            this.updateUndoRedoButtons();
            
            // Show success notification for complex nodes
            if (['oscillator', 'filter', 'reverb', 'chorus', 'echo', 'envelope'].includes(type)) {
                notifications.success('Node Added', `${type} node created successfully`);
            }
            
            return node;
        }
        
        notifications.error('Node Creation Failed', `Unknown node type: ${type}`);
        console.warn(`Unknown node type: ${type}`);
        return null;
    }
    
    updatePropertiesPanel(node) {
        const propertiesContent = document.getElementById('properties-content');
        
        if (!node) {
            propertiesContent.innerHTML = '<p class="placeholder-text">Select a node to edit properties</p>';
            return;
        }
        
        propertiesContent.innerHTML = '';
        
        const titleGroup = document.createElement('div');
        titleGroup.className = 'property-group';
        titleGroup.innerHTML = `
            <label class="property-label">Node Title</label>
            <input type="text" class="property-input" value="${node.title}" 
                   onchange="window.amyApp.updateNodeProperty('title', this.value)">
        `;
        propertiesContent.appendChild(titleGroup);
        
        if (node.properties) {
            Object.entries(node.properties).forEach(([key, value]) => {
                const group = document.createElement('div');
                group.className = 'property-group';
                
                const inputType = typeof value === 'number' ? 'number' : 'text';
                const step = key.includes('freq') ? '0.1' : '1';
                
                group.innerHTML = `
                    <label class="property-label">${this.formatPropertyName(key)}</label>
                    <input type="${inputType}" class="property-input" value="${value}" 
                           ${inputType === 'number' ? `step="${step}"` : ''}
                           onchange="window.amyApp.updateNodeProperty('${key}', this.value)">
                `;
                propertiesContent.appendChild(group);
            });
        }
    }
    
    formatPropertyName(name) {
        return name.replace(/_/g, ' ')
                   .replace(/\b\w/g, c => c.toUpperCase());
    }
    
    updateNodeProperty(property, value) {
        if (!this.selectedNode) return;
        
        if (property === 'title') {
            this.selectedNode.title = value;
        } else if (this.selectedNode.properties) {
            const numValue = parseFloat(value);
            this.selectedNode.properties[property] = isNaN(numValue) ? value : numValue;
            
            if (this.selectedNode.onPropertyChanged) {
                this.selectedNode.onPropertyChanged(property, this.selectedNode.properties[property]);
            }
        }
        
        this.canvas.setDirty(true, true);
    }
    
    updateAudioConnections() {
        this.audioEngine.updateFromGraph(this.graph);
    }
    
    async exportCode() {
        const loadingId = notifications.showLoading('Generating Code', 'Creating Arduino sketch from your patch...');
        
        try {
            await this.codeGenerator.loadTemplate();
            const code = this.codeGenerator.generate(this.graph);
            
            if (!code || code.trim().length === 0) {
                notifications.finishLoading(loadingId, false, 'Generation Failed', 'Generated code is empty');
                return;
            }
            
            document.getElementById('generated-code').textContent = code;
            document.getElementById('code-modal').classList.remove('hidden');
            
            notifications.finishLoading(loadingId, true, 'Code Generated', `${code.split('\n').length} lines of Arduino code ready`);
        } catch (error) {
            notifications.finishLoading(loadingId, false, 'Generation Failed', error.message);
        }
    }
    
    copyGeneratedCode() {
        const code = document.getElementById('generated-code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.getElementById('copy-code-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
            
            notifications.success('Code Copied', 'Arduino code copied to clipboard');
        }).catch(() => {
            notifications.error('Copy Failed', 'Could not copy code to clipboard');
        });
    }
    
    downloadGeneratedCode() {
        const code = document.getElementById('generated-code').textContent;
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'amy_patch.ino';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    savePatch() {
        const patchData = {
            version: '1.0',
            graph: this.graph.serialize(),
            timestamp: new Date().toISOString(),
            metadata: {
                title: 'AmyNode Patch',
                author: '',
                description: ''
            }
        };
        
        const jsonStr = JSON.stringify(patchData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amy_patch_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    async loadPatch(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const patchData = JSON.parse(text);
            
            if (!patchData.graph) {
                throw new Error('Invalid patch file');
            }
            
            this.graph.clear();
            this.graph.configure(patchData.graph);
            this.canvas.draw(true, true);
            
            console.log(`Loaded patch: ${patchData.metadata?.title || 'Untitled'}`);
        } catch (error) {
            console.error('Error loading patch:', error);
            alert('Failed to load patch file. Please check the file format.');
        }
    }
    
    patchLiteGraphDOM() {
        // Fix LiteGraph's DOM manipulation methods that can cause errors
        const self = this;
        
        // Patch closeAllContextMenus to handle missing document
        if (LiteGraph.closeAllContextMenus) {
            const originalCloseAll = LiteGraph.closeAllContextMenus;
            LiteGraph.closeAllContextMenus = function(ref_window) {
                try {
                    // Get the correct document reference
                    const doc = ref_window ? ref_window.document : document;
                    
                    // Ensure document exists before querying
                    if (doc && doc.body && doc.querySelectorAll) {
                        const menus = doc.querySelectorAll('.litecontextmenu');
                        if (menus && menus.length) {
                            menus.forEach(menu => {
                                if (menu && menu.parentNode) {
                                    menu.parentNode.removeChild(menu);
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.warn('closeAllContextMenus error:', e);
                }
            };
        }
        
        // Patch context menu creation to handle DOM queries safely
        if (LiteGraph.ContextMenu) {
            const originalAddItem = LiteGraph.ContextMenu.prototype.addItem;
            LiteGraph.ContextMenu.prototype.addItem = function(name, value, options) {
                try {
                    // Ensure the root element exists before querying
                    if (this.root && this.root.querySelectorAll) {
                        return originalAddItem.call(this, name, value, options);
                    } else {
                        console.warn('ContextMenu root not ready for addItem');
                        return null;
                    }
                } catch (e) {
                    console.warn('ContextMenu addItem error:', e);
                    return null;
                }
            };
        }
        
        // Patch LiteGraph's querySelector usage
        const originalCreateContextMenu = LiteGraph.LGraphCanvas.prototype.createContextMenu;
        if (originalCreateContextMenu) {
            LiteGraph.LGraphCanvas.prototype.createContextMenu = function(values, options) {
                try {
                    // Ensure document is available
                    if (typeof document !== 'undefined' && document.body) {
                        return originalCreateContextMenu.call(this, values, options);
                    } else {
                        console.warn('Document not ready for context menu');
                        return null;
                    }
                } catch (e) {
                    console.warn('Context menu creation error:', e);
                    return null;
                }
            };
        }
        
        // Patch any querySelector calls in LiteGraph
        if (LiteGraph.ContextMenu && LiteGraph.ContextMenu.prototype.close) {
            const originalClose = LiteGraph.ContextMenu.prototype.close;
            LiteGraph.ContextMenu.prototype.close = function() {
                try {
                    if (this.root && this.root.parentNode) {
                        return originalClose.call(this);
                    }
                } catch (e) {
                    console.warn('ContextMenu close error:', e);
                }
            };
        }
    }
    
    patchLiteGraphWindow() {
        // Fix window2 reference issue in LiteGraph
        if (typeof window !== 'undefined') {
            // Ensure window2 points to window
            window.window2 = window;
            
            // Also patch the renderFrame method if it exists
            if (this.canvas && typeof this.canvas.renderFrame === 'function') {
                const originalRenderFrame = this.canvas.renderFrame.bind(this.canvas);
                this.canvas.renderFrame = function() {
                    try {
                        // Use standard window.requestAnimationFrame
                        if (window.requestAnimationFrame) {
                            window.requestAnimationFrame(() => {
                                originalRenderFrame.call(this);
                            });
                        } else {
                            // Fallback
                            setTimeout(() => {
                                originalRenderFrame.call(this);
                            }, 16);
                        }
                    } catch (e) {
                        console.warn('renderFrame error:', e);
                    }
                };
            }
            
            // Override the startRendering method to use correct window reference
            if (LiteGraph.LGraphCanvas && LiteGraph.LGraphCanvas.prototype.startRendering) {
                const originalStartRendering = LiteGraph.LGraphCanvas.prototype.startRendering;
                LiteGraph.LGraphCanvas.prototype.startRendering = function() {
                    try {
                        // Make sure window2 is defined before calling original method
                        if (typeof window !== 'undefined') {
                            window.window2 = window;
                        }
                        return originalStartRendering.call(this);
                    } catch (e) {
                        console.warn('startRendering error:', e);
                        // Try to start rendering manually
                        if (this.renderFrame) {
                            this.renderFrame();
                        }
                    }
                };
            }
        }
    }
    
    resizeCanvas() {
        const canvasElement = this.canvas.canvas;
        const container = canvasElement.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Get device pixel ratio for high DPI displays
        const scale = window.devicePixelRatio || 1;
        
        // MDNの例に従って表示サイズを設定（CSS におけるピクセル数）
        const width = rect.width;
        const height = rect.height;
        canvasElement.style.width = `${width}px`;
        canvasElement.style.height = `${height}px`;
        
        // メモリー上における実際のサイズを設定（ピクセル密度の分だけ倍増）
        canvasElement.width = Math.floor(width * scale);
        canvasElement.height = Math.floor(height * scale);
        
        // CSS 上のピクセル数を前提としているシステムに合わせる
        const ctx = canvasElement.getContext('2d');
        ctx.scale(scale, scale);
        
        // LiteGraphに高DPIスケールを通知
        this.canvas.use_high_dpi = true;
        this.canvas.high_dpi_scale = scale;
        
        console.log('Canvas resized:', width, 'x', height, 'Scale:', scale);
    }
    
    applyHighDPIFixes() {
        const canvasElement = this.canvas.canvas;
        const rect = canvasElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Always apply proper DPI scaling
        const ctx = canvasElement.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Apply text rendering optimizations
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Handle additional canvases that Litegraph might create
        const canvases = [
            this.canvas.canvas_mouse,
            this.canvas.bgcanvas,
            this.canvas.frontcanvas
        ];
        
        canvases.forEach(canvas => {
            if (canvas && canvas.getContext && typeof canvas.getContext === 'function') {
                try {
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    canvas.style.width = rect.width + 'px';
                    canvas.style.height = rect.height + 'px';
                    
                    const canvasCtx = canvas.getContext('2d');
                    if (canvasCtx && canvasCtx.setTransform) {
                        canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                        canvasCtx.imageSmoothingEnabled = true;
                        canvasCtx.imageSmoothingQuality = 'high';
                    }
                } catch (e) {
                    console.warn('Could not apply DPI scaling to canvas:', e);
                }
            }
        });
        
        // Force canvas re-render with new settings
        this.canvas.setDirty(true, true);
    }
    
    // Status Indicator Management
    initializeStatusIndicators() {
        this.updateAmyStatus('loading', 'AMY WASM: Loading...');
        this.updateAudioStatus('stopped', 'Audio: Stopped');
        
        // Initialize AMY WASM status check
        this.checkAmyWasmStatus();
    }
    
    updateAmyStatus(status, text) {
        if (this.statusIndicators.amy) {
            this.statusIndicators.amy.className = `status-indicator ${status}`;
            this.statusIndicators.amy.querySelector('.status-text').textContent = text;
        }
    }
    
    updateAudioStatus(status, text) {
        if (this.statusIndicators.audio) {
            this.statusIndicators.audio.className = `status-indicator ${status}`;
            this.statusIndicators.audio.querySelector('.status-text').textContent = text;
        }
    }
    
    async checkAmyWasmStatus() {
        try {
            // Check if AMY WASM is available
            if (this.audioEngine && this.audioEngine.amyWasm) {
                await this.audioEngine.amyWasm.initialize();
                this.updateAmyStatus('ready', 'AMY WASM: Ready');
                notifications.success('AMY WASM Ready', 'Audio synthesis engine loaded successfully');
            } else {
                // Simulate AMY WASM loading for demo purposes
                setTimeout(() => {
                    this.updateAmyStatus('ready', 'AMY WASM: Ready');
                }, 2000);
            }
        } catch (error) {
            this.updateAmyStatus('error', 'AMY WASM: Error');
            console.error('AMY WASM initialization failed:', error);
        }
    }
    
    // Update Undo/Redo button states
    updateUndoRedoButtons() {
        const state = this.undoRedoManager.getState();
        
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (undoBtn) {
            undoBtn.disabled = !state.canUndo;
            undoBtn.title = state.canUndo ? 'Undo last action' : 'Nothing to undo';
        }
        
        if (redoBtn) {
            redoBtn.disabled = !state.canRedo;
            redoBtn.title = state.canRedo ? 'Redo last action' : 'Nothing to redo';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.amyApp = new AmyNodeApp();
});