// Keyboard Shortcuts for AmyNode

export class KeyboardShortcuts {
    constructor(app) {
        this.app = app;
        this.shortcuts = new Map();
        this.isShortcutMode = false;
        
        this.setupShortcuts();
        this.bindEvents();
    }
    
    setupShortcuts() {
        // File operations
        this.registerShortcut('ctrl+s', () => this.app.savePatch(), 'Save patch');
        this.registerShortcut('ctrl+o', () => this.app.loadPatch(), 'Open patch');
        this.registerShortcut('ctrl+e', () => this.app.exportCode(), 'Export Arduino code');
        this.registerShortcut('ctrl+n', () => this.newPatch(), 'New patch');
        this.registerShortcut('ctrl+p', () => this.app.presetBrowser.show(), 'Show presets');
        
        // Undo/Redo operations
        this.registerShortcut('ctrl+z', () => this.undo(), 'Undo');
        this.registerShortcut('ctrl+y', () => this.redo(), 'Redo');
        this.registerShortcut('ctrl+shift+z', () => this.redo(), 'Redo (alternative)');
        
        // Audio operations
        this.registerShortcut('space', () => this.togglePlayback(), 'Play/Stop audio');
        this.registerShortcut('ctrl+space', () => this.app.audioEngine.stop(), 'Stop audio');
        
        // Node operations
        this.registerShortcut('delete', () => this.deleteSelectedNodes(), 'Delete selected nodes');
        this.registerShortcut('backspace', () => this.deleteSelectedNodes(), 'Delete selected nodes');
        this.registerShortcut('ctrl+a', () => this.selectAllNodes(), 'Select all nodes');
        this.registerShortcut('ctrl+d', () => this.duplicateSelectedNodes(), 'Duplicate selected nodes');
        
        // Canvas operations
        this.registerShortcut('ctrl+plus', () => this.zoomIn(), 'Zoom in');
        this.registerShortcut('ctrl+minus', () => this.zoomOut(), 'Zoom out');
        this.registerShortcut('ctrl+0', () => this.resetZoom(), 'Reset zoom');
        this.registerShortcut('ctrl+f', () => this.focusSearch(), 'Focus node search');
        
        // Quick node creation
        this.registerShortcut('1', () => this.createNodeQuick('oscillator'), 'Create Oscillator');
        this.registerShortcut('2', () => this.createNodeQuick('filter'), 'Create Filter');
        this.registerShortcut('3', () => this.createNodeQuick('mixer'), 'Create Mixer');
        this.registerShortcut('4', () => this.createNodeQuick('reverb'), 'Create Reverb');
        this.registerShortcut('5', () => this.createNodeQuick('envelope'), 'Create Envelope');
        this.registerShortcut('6', () => this.createNodeQuick('lfo'), 'Create LFO');
        this.registerShortcut('7', () => this.createNodeQuick('output'), 'Create Output');
        
        // Help
        this.registerShortcut('f1', () => this.showHelp(), 'Show keyboard shortcuts');
        this.registerShortcut('?', () => this.showHelp(), 'Show keyboard shortcuts');
        
        // Escape operations
        this.registerShortcut('escape', () => this.handleEscape(), 'Cancel/Close');
    }
    
    registerShortcut(key, callback, description = '') {
        this.shortcuts.set(key.toLowerCase(), {
            callback,
            description,
            key
        });
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
    }
    
    handleKeyDown(e) {
        // Don't handle shortcuts when typing in inputs
        if (this.isInputFocused(e.target)) {
            return;
        }
        
        const shortcut = this.getShortcutString(e);
        const command = this.shortcuts.get(shortcut);
        
        if (command) {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                command.callback();
                console.log(`Executed shortcut: ${shortcut} (${command.description})`);
            } catch (error) {
                console.error(`Error executing shortcut ${shortcut}:`, error);
            }
        }
    }
    
    handleKeyUp(e) {
        // Handle any key-up specific logic here
    }
    
    getShortcutString(e) {
        const parts = [];
        
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        
        let key = e.key.toLowerCase();
        
        // Special key mappings
        const keyMap = {
            ' ': 'space',
            '+': 'plus',
            '-': 'minus',
            '=': 'plus', // For Ctrl+= (zoom in)
            '/': '?'     // For shift+/ (help)
        };
        
        key = keyMap[key] || key;
        parts.push(key);
        
        return parts.join('+');
    }
    
    isInputFocused(element) {
        const inputTypes = ['input', 'textarea', 'select'];
        return inputTypes.includes(element.tagName.toLowerCase()) ||
               element.contentEditable === 'true';
    }
    
    // Shortcut implementations
    newPatch() {
        if (confirm('Create new patch? Any unsaved changes will be lost.')) {
            this.app.graph.clear();
            this.app.canvas.draw(true, true);
            console.log('Created new patch');
        }
    }
    
    async togglePlayback() {
        if (this.app.audioEngine.isRunning) {
            this.app.audioEngine.stop();
            this.app.updateAudioStatus('stopped', 'Audio: Stopped');
        } else {
            try {
                this.app.updateAudioStatus('loading', 'Audio: Starting...');
                await this.app.audioEngine.start();
                this.app.updateAudioConnections();
                this.app.updateAudioStatus('playing', 'Audio: Playing');
            } catch (error) {
                this.app.updateAudioStatus('error', 'Audio: Error');
                console.error('Audio start failed:', error);
            }
        }
    }
    
    deleteSelectedNodes() {
        const selectedNodes = this.app.canvas.selected_nodes;
        if (selectedNodes && selectedNodes.length > 0) {
            selectedNodes.forEach(node => {
                this.app.graph.remove(node);
            });
            this.app.canvas.draw(true, true);
            console.log(`Deleted ${selectedNodes.length} nodes`);
        }
    }
    
    selectAllNodes() {
        const allNodes = this.app.graph._nodes;
        this.app.canvas.selectNodes(allNodes);
        this.app.canvas.draw(true, true);
        console.log(`Selected ${allNodes.length} nodes`);
    }
    
    duplicateSelectedNodes() {
        const selectedNodes = this.app.canvas.selected_nodes;
        if (selectedNodes && selectedNodes.length > 0) {
            const duplicates = [];
            
            selectedNodes.forEach(node => {
                const newNode = node.clone();
                newNode.pos[0] += 20; // Offset duplicates
                newNode.pos[1] += 20;
                this.app.graph.add(newNode);
                duplicates.push(newNode);
            });
            
            this.app.canvas.selectNodes(duplicates);
            this.app.canvas.draw(true, true);
            console.log(`Duplicated ${selectedNodes.length} nodes`);
        }
    }
    
    zoomIn() {
        if (this.app.canvas.ds) {
            this.app.canvas.ds.scale *= 1.2;
            this.app.canvas.setDirty(true, true);
        }
    }
    
    zoomOut() {
        if (this.app.canvas.ds) {
            this.app.canvas.ds.scale *= 0.8;
            this.app.canvas.setDirty(true, true);
        }
    }
    
    resetZoom() {
        if (this.app.canvas.ds) {
            this.app.canvas.ds.scale = 1.0;
            this.app.canvas.ds.offset = [0, 0];
            this.app.canvas.setDirty(true, true);
        }
    }
    
    focusSearch() {
        const searchInput = document.getElementById('node-search');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    createNodeQuick(nodeType) {
        // Create node at center of current view
        const canvasRect = this.app.canvas.canvas.getBoundingClientRect();
        const centerX = canvasRect.width / 2;
        const centerY = canvasRect.height / 2;
        
        // Convert to canvas coordinates
        let canvasPos = [centerX, centerY];
        if (this.app.canvas.ds) {
            canvasPos[0] = (centerX - this.app.canvas.ds.offset[0]) / this.app.canvas.ds.scale;
            canvasPos[1] = (centerY - this.app.canvas.ds.offset[1]) / this.app.canvas.ds.scale;
        }
        
        // Snap to grid
        const gridSize = 20;
        const snappedX = Math.round(canvasPos[0] / gridSize) * gridSize;
        const snappedY = Math.round(canvasPos[1] / gridSize) * gridSize;
        
        const node = this.app.createNode(nodeType, snappedX, snappedY);
        if (node) {
            this.app.canvas.selectNodes([node]);
            console.log(`Created ${nodeType} node via keyboard shortcut`);
        }
    }
    
    handleEscape() {
        // Clear selection
        this.app.canvas.selectNodes([]);
        
        // Close any open modals
        const modals = document.querySelectorAll('.modal:not(.hidden)');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
        
        // Clear search
        const searchInput = document.getElementById('node-search');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
        }
        
        this.app.canvas.draw(true, true);
    }
    
    showHelp() {
        this.createHelpModal();
    }
    
    createHelpModal() {
        // Remove existing help modal
        const existingModal = document.getElementById('help-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'help-modal';
        modal.className = 'modal';
        
        const shortcuts = Array.from(this.shortcuts.entries())
            .filter(([key, cmd]) => cmd.description)
            .sort(([a], [b]) => a.localeCompare(b));
        
        const shortcutList = shortcuts.map(([key, cmd]) => {
            const displayKey = key.replace(/ctrl/g, '⌘').replace(/shift/g, '⇧').replace(/alt/g, '⌥');
            return `
                <div class="shortcut-item">
                    <code class="shortcut-key">${displayKey}</code>
                    <span class="shortcut-desc">${cmd.description}</span>
                </div>
            `;
        }).join('');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-grid">
                        ${shortcutList}
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
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
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Get all registered shortcuts for documentation
    getAllShortcuts() {
        return Array.from(this.shortcuts.entries()).map(([key, cmd]) => ({
            key,
            description: cmd.description
        }));
    }
    
    // Undo/Redo operations
    undo() {
        if (this.app.undoRedoManager.undo()) {
            this.app.canvas.setDirty(true, true);
            this.app.updateUndoRedoButtons();
            console.log('Undo successful');
        } else {
            console.log('Nothing to undo');
        }
    }
    
    redo() {
        if (this.app.undoRedoManager.redo()) {
            this.app.canvas.setDirty(true, true);
            this.app.updateUndoRedoButtons();
            console.log('Redo successful');
        } else {
            console.log('Nothing to redo');
        }
    }
}