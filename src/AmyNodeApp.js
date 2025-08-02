/**
 * Main application class for AmyNode
 * Integrates the new node system without LiteGraph
 */

import { NodeGraph } from './graph/NodeSystem.js';
import { NodeCanvas } from './graph/NodeCanvas.js';
import { createNodeFromType, NODE_TYPES } from './graph/AmyNodeDefinitions.js';
import { AudioEngine } from './audio/engine.js';
import { CodeGenerator } from './codegen/generator.js';
import { NodePresets } from './utils/NodePresets.js';
import { PresetBrowser } from './ui/PresetBrowser.js';
import { KeyboardShortcuts } from './utils/KeyboardShortcuts.js';
import { notifications } from './utils/NotificationSystem.js';
import { UndoRedoManager, AddNodeCommand, RemoveNodeCommand, MoveNodeCommand } from './utils/UndoRedoManager.js';

export class AmyNodeApp {
    constructor() {
        // Core systems
        this.graph = new NodeGraph();
        this.canvas = null;
        this.nodeCanvas = null;
        
        // Audio and code generation
        this.audioEngine = new AudioEngine();
        this.codeGenerator = new CodeGenerator();
        
        // UI systems
        this.nodePresets = new NodePresets();
        this.presetBrowser = null; // Will be initialized after graph is ready
        this.keyboardShortcuts = null;
        this.undoRedoManager = new UndoRedoManager();
        
        // Status indicators
        this.statusIndicators = {
            amy: document.getElementById('amy-status'),
            audio: document.getElementById('audio-status')
        };
        
        // Node creation factory
        this.graph.createNodeFromType = (type) => createNodeFromType(type);
        
        this.init();
    }
    
    async init() {
        console.log('Initializing AmyNode without LiteGraph...');
        
        // Set up canvas
        this.setupCanvas();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up drag and drop
        this.setupDragAndDrop();
        
        // Set up node panel
        this.setupNodePanel();
        
        // Initialize keyboard shortcuts
        this.keyboardShortcuts = new KeyboardShortcuts(this);
        
        // Initialize preset browser
        this.presetBrowser = new PresetBrowser(this, this.nodePresets);
        
        // Initialize status indicators
        this.initializeStatusIndicators();
        
        // Set up graph event listeners
        this.setupGraphListeners();
        
        console.log('AmyNode initialized successfully');
    }
    
    setupCanvas() {
        const canvasElement = document.getElementById('graph-canvas');
        if (!canvasElement) {
            console.error('Canvas element not found');
            return;
        }
        
        // Ensure DOM layout is complete before creating canvas
        setTimeout(() => {
            // Create node canvas with our graph
            this.nodeCanvas = new NodeCanvas(canvasElement, this.graph);
            
            // Force a resize after a short delay to ensure proper sizing
            setTimeout(() => {
                if (this.nodeCanvas) {
                    this.nodeCanvas.setupHighDPI();
                    this.nodeCanvas.render();
                }
            }, 100);
            
            // Expose canvas for compatibility
            const self = this;
            this.canvas = {
                // Compatibility layer for existing code
                setDirty: () => self.nodeCanvas && self.nodeCanvas.render(),
                draw: () => self.nodeCanvas && self.nodeCanvas.render(),
                ds: {
                    get offset() { return self.nodeCanvas ? self.nodeCanvas.offset : {x: 0, y: 0}; },
                    get scale() { return self.nodeCanvas ? self.nodeCanvas.scale : 1; }
                },
                selected_nodes: [],
                selectNodes: (nodes) => {
                    self.nodeCanvas.selectedNodes.clear();
                    nodes.forEach(node => self.nodeCanvas.selectedNodes.add(node));
                }
            };
        }, 10);
    }
    
    setupEventListeners() {
        // Play/Stop buttons
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
        
        // Export button
        document.getElementById('export-btn').addEventListener('click', async () => {
            await this.exportCode();
        });
        
        // Save/Load buttons
        document.getElementById('save-btn').addEventListener('click', () => {
            this.savePatch();
        });
        
        document.getElementById('load-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.loadPatch(e.target.files[0]);
        });
        
        // Undo/Redo buttons
        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undo();
        });
        
        document.getElementById('redo-btn').addEventListener('click', () => {
            this.redo();
        });
        
        // Presets button
        document.getElementById('presets-btn').addEventListener('click', () => {
            this.presetBrowser.show();
        });
        
        // Modal close buttons
        document.querySelector('.close-btn').addEventListener('click', () => {
            document.getElementById('code-modal').classList.add('hidden');
        });
        
        document.getElementById('copy-code-btn').addEventListener('click', () => {
            this.copyGeneratedCode();
        });
        
        document.getElementById('download-code-btn').addEventListener('click', () => {
            this.downloadGeneratedCode();
        });
    }
    
    setupDragAndDrop() {
        const nodeItems = document.querySelectorAll('.node-item');
        const canvasContainer = document.querySelector('.canvas-container');
        
        nodeItems.forEach(item => {
            item.setAttribute('draggable', 'true');
            
            item.addEventListener('dragstart', (e) => {
                const nodeType = item.dataset.nodeType;
                e.dataTransfer.setData('text/plain', nodeType);
                e.dataTransfer.effectAllowed = 'copy';
                item.style.opacity = '0.5';
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', () => {
                item.style.opacity = '';
                item.classList.remove('dragging');
            });
        });
        
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
            if (nodeType) {
                const rect = canvasContainer.getBoundingClientRect();
                const canvasPos = this.nodeCanvas.screenToCanvas(
                    e.clientX - rect.left,
                    e.clientY - rect.top
                );
                
                // Snap to grid
                const gridSize = this.nodeCanvas.gridSize;
                const x = Math.round(canvasPos.x / gridSize) * gridSize;
                const y = Math.round(canvasPos.y / gridSize) * gridSize;
                
                this.createNode(nodeType, x, y);
            }
        });
    }
    
    setupNodePanel() {
        // Search functionality
        const searchInput = document.getElementById('node-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterNodes(e.target.value);
            });
        }
        
        // Node item clicks
        const nodeItems = document.querySelectorAll('.node-item');
        nodeItems.forEach(item => {
            item.addEventListener('click', () => {
                const nodeType = item.dataset.nodeType;
                const centerX = this.nodeCanvas.canvas.width / 2 / window.devicePixelRatio;
                const centerY = this.nodeCanvas.canvas.height / 2 / window.devicePixelRatio;
                const canvasPos = this.nodeCanvas.screenToCanvas(centerX, centerY);
                
                // Snap to grid
                const gridSize = this.nodeCanvas.gridSize;
                const x = Math.round(canvasPos.x / gridSize) * gridSize;
                const y = Math.round(canvasPos.y / gridSize) * gridSize;
                
                this.createNode(nodeType, x, y);
            });
        });
    }
    
    setupGraphListeners() {
        // Update properties panel when node is selected
        this.graph.on('nodeSelected', ({ node }) => {
            this.updatePropertiesPanel(node);
        });
        
        // Clear properties when no selection
        this.graph.on('selectionCleared', () => {
            this.updatePropertiesPanel(null);
        });
    }
    
    createNode(type, x, y) {
        console.log('Creating node:', type, 'at', x, y);
        
        try {
            const node = createNodeFromType(type);
            if (!node) {
                throw new Error(`Unknown node type: ${type}`);
            }
            
            node.position = { x, y };
            this.graph.addNode(node);
            
            // Add to undo history
            const command = {
                type: 'add_node',
                execute: () => {
                    this.graph.addNode(node);
                },
                undo: () => {
                    this.graph.removeNode(node.id);
                }
            };
            this.undoRedoManager.execute(command);
            
            this.updateUndoRedoButtons();
            
            // Show success notification for complex nodes
            if (['oscillator', 'filter', 'reverb', 'chorus', 'echo', 'envelope'].includes(type)) {
                notifications.success('Node Added', `${type} node created successfully`);
            }
            
            return node;
        } catch (error) {
            notifications.error('Node Creation Failed', error.message);
            console.error('Failed to create node:', error);
            return null;
        }
    }
    
    updatePropertiesPanel(node) {
        const propertiesContent = document.getElementById('properties-content');
        
        if (!node) {
            propertiesContent.innerHTML = '<p class="placeholder-text">Select a node to edit properties</p>';
            return;
        }
        
        let html = `<h3>${node.title}</h3>`;
        
        // Add parameter controls
        Object.entries(node.parameters).forEach(([name, param]) => {
            html += `<div class="property-group">`;
            html += `<label class="property-label">${name.replace(/_/g, ' ')}</label>`;
            
            if (param.type === 'select') {
                html += `<select class="property-input" data-param="${name}">`;
                // Get options from node
                const options = node[name + 's'] || [];
                options.forEach(opt => {
                    const selected = param.value === opt ? 'selected' : '';
                    html += `<option value="${opt}" ${selected}>${opt}</option>`;
                });
                html += `</select>`;
            } else if (param.type === 'boolean') {
                const checked = param.value ? 'checked' : '';
                html += `<input type="checkbox" class="property-input" data-param="${name}" ${checked}>`;
            } else {
                html += `<input type="${param.type || 'number'}" class="property-input" 
                    data-param="${name}" 
                    value="${param.value}"
                    ${param.min !== null ? `min="${param.min}"` : ''}
                    ${param.max !== null ? `max="${param.max}"` : ''}
                    ${param.step !== null ? `step="${param.step}"` : ''}>`;
            }
            
            html += `</div>`;
        });
        
        propertiesContent.innerHTML = html;
        
        // Bind change events
        propertiesContent.querySelectorAll('.property-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const paramName = e.target.dataset.param;
                let value = e.target.type === 'checkbox' ? 
                    e.target.checked : 
                    (e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value);
                
                node.setParameter(paramName, value);
                this.updateAudioConnections();
            });
        });
    }
    
    updateAudioConnections() {
        if (!this.audioEngine.isRunning) {
            console.log('Audio engine not running, skipping connection update');
            return;
        }
        
        console.log('Updating audio connections from graph state');
        
        // Update audio engine with current graph state
        this.audioEngine.updateFromGraph(this.graph);
        
        // Check for output nodes and connect them
        const outputNodes = this.graph.getNodes().filter(node => 
            node.type === 'output' || node.type === 'amy/output'
        );
        
        if (outputNodes.length > 0) {
            console.log(`Found ${outputNodes.length} output node(s), audio should be connected`);
        } else {
            console.log('No output nodes found - adding default output connection');
            // If no explicit output nodes, try to connect oscillators directly for testing
            const oscillatorNodes = this.graph.getNodes().filter(node => 
                node.type === 'oscillator' || node.type === 'amy/oscillator'
            );
            
            if (oscillatorNodes.length > 0) {
                console.log(`Found ${oscillatorNodes.length} oscillator(s) without output - enabling direct connection`);
                // Enable direct oscillator connection for testing
                this.audioEngine.enableDirectOscillatorOutput = true;
            }
        }
    }
    
    filterNodes(searchTerm) {
        const nodeItems = document.querySelectorAll('.node-item');
        const term = searchTerm.toLowerCase();
        
        nodeItems.forEach(item => {
            const keywords = (item.dataset.keywords || '').toLowerCase();
            const nodeType = (item.dataset.nodeType || '').toLowerCase();
            const visible = !term || keywords.includes(term) || nodeType.includes(term);
            
            item.classList.toggle('hidden', !visible);
        });
    }
    
    async exportCode() {
        const code = this.generateArduinoCode();
        
        // Show code in modal
        const modal = document.getElementById('code-modal');
        const codeElement = document.getElementById('generated-code');
        codeElement.textContent = code;
        modal.classList.remove('hidden');
        
        // Store for copy/download
        this.generatedCode = code;
        
        notifications.success('Code Generated', 'Arduino code generated successfully');
    }
    
    generateArduinoCode() {
        let code = `// Generated by AmyNode
// AMY Audio Library Arduino Sketch

#include "amy.h"

// Pin definitions
`;
        
        // Collect pin definitions from ADC/GPIO nodes
        const adcNodes = [];
        const gpioNodes = [];
        
        this.graph.nodes.forEach(node => {
            if (node.type === 'adc') adcNodes.push(node);
            if (node.type === 'gpio') gpioNodes.push(node);
        });
        
        adcNodes.forEach(node => {
            code += `const int ADC${node.getParameter('pin')}_PIN = ${node.getParameter('pin')};\n`;
        });
        
        gpioNodes.forEach(node => {
            code += `const int GPIO${node.getParameter('pin')}_PIN = ${node.getParameter('pin')};\n`;
        });
        
        code += `
void setup() {
    Serial.begin(115200);
    
    // Initialize AMY
    amy_start();
    
`;
        
        // Generate setup code for each node
        const processingOrder = this.graph.getProcessingOrder();
        let oscIndex = 0;
        
        processingOrder.forEach(node => {
            if (node.oscIndex === undefined && (node.type === 'oscillator' || node.type === 'lfo')) {
                node.oscIndex = oscIndex++;
            }
            
            const nodeCode = node.generateCode();
            if (nodeCode) {
                code += '    ' + nodeCode.replace(/\n/g, '\n    ') + '\n';
            }
        });
        
        code += `}

void loop() {
    // Read inputs and update parameters
    
`;
        
        // Generate loop code for input nodes
        adcNodes.forEach(node => {
            code += `    // ${node.title} processing\n`;
            code += `    ${node.generateCode().replace(/\n/g, '\n    ')}\n`;
        });
        
        gpioNodes.forEach(node => {
            code += `    // ${node.title} processing\n`;
            code += `    ${node.generateCode().replace(/\n/g, '\n    ')}\n`;
        });
        
        code += `    
    delay(10); // Update rate
}
`;
        
        return code;
    }
    
    copyGeneratedCode() {
        if (!this.generatedCode) return;
        
        navigator.clipboard.writeText(this.generatedCode)
            .then(() => {
                notifications.success('Copied!', 'Code copied to clipboard');
            })
            .catch(err => {
                notifications.error('Copy Failed', 'Could not copy to clipboard');
            });
    }
    
    downloadGeneratedCode() {
        if (!this.generatedCode) return;
        
        const blob = new Blob([this.generatedCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'amy_patch.ino';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    savePatch() {
        const patchData = {
            version: '2.0', // New format version
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
        
        notifications.success('Patch Saved', 'Patch saved successfully');
    }
    
    async loadPatch(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const patchData = JSON.parse(text);
            
            if (!patchData.graph) {
                throw new Error('Invalid patch file');
            }
            
            this.graph.deserialize(patchData.graph);
            
            notifications.success('Patch Loaded', `Loaded: ${patchData.metadata?.title || 'Untitled'}`);
        } catch (error) {
            console.error('Error loading patch:', error);
            notifications.error('Load Failed', 'Failed to load patch file');
        }
    }
    
    undo() {
        if (this.undoRedoManager.undo()) {
            this.updateUndoRedoButtons();
            console.log('Undo successful');
        }
    }
    
    redo() {
        if (this.undoRedoManager.redo()) {
            this.updateUndoRedoButtons();
            console.log('Redo successful');
        }
    }
    
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
    
    // Status indicator management
    initializeStatusIndicators() {
        this.updateAmyStatus('loading', 'AMY WASM: Loading...');
        this.updateAudioStatus('stopped', 'Audio: Stopped');
        
        // Simulate AMY WASM loading
        setTimeout(() => {
            this.updateAmyStatus('ready', 'AMY WASM: Ready');
        }, 2000);
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
}