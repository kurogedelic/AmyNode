export class PresetBrowser {
    constructor(app, nodePresets) {
        this.app = app;
        this.nodePresets = nodePresets;
        this.isOpen = false;
        this.selectedCategory = 'Basic';
    }
    
    show() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.createModal();
    }
    
    hide() {
        if (!this.isOpen) return;
        
        const modal = document.getElementById('preset-browser-modal');
        if (modal) {
            modal.remove();
        }
        this.isOpen = false;
    }
    
    createModal() {
        // Remove existing modal
        const existingModal = document.getElementById('preset-browser-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'preset-browser-modal';
        modal.className = 'modal';
        
        const presetsByCategory = this.nodePresets.getPresetsByCategory();
        const categories = Object.keys(presetsByCategory);
        
        modal.innerHTML = `
            <div class="modal-content preset-browser-content">
                <div class="modal-header">
                    <h2>Node Presets</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body preset-browser-body">
                    <div class="preset-sidebar">
                        <div class="preset-categories">
                            ${categories.map(category => `
                                <div class="preset-category ${category === this.selectedCategory ? 'active' : ''}" 
                                     data-category="${category}">
                                    ${category}
                                    <span class="preset-count">${presetsByCategory[category].length}</span>
                                </div>
                            `).join('')}
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
                            ${this.renderPresetGrid(presetsByCategory[this.selectedCategory] || [])}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.addStyles();
        document.body.appendChild(modal);
        this.bindEvents(modal, presetsByCategory);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hide();
            }
        });
    }
    
    renderPresetGrid(presets) {
        return presets.map(preset => `
            <div class="preset-item" data-preset-key="${preset.key}">
                <div class="preset-preview">
                    <div class="preset-nodes">
                        ${this.renderPresetPreview(preset)}
                    </div>
                </div>
                <div class="preset-info">
                    <h4 class="preset-name">${preset.name}</h4>
                    <p class="preset-description">${preset.description}</p>
                    <div class="preset-meta">
                        <span class="preset-node-count">${preset.nodes.length} nodes</span>
                        ${preset.category === 'User' ? '<button class="preset-delete-btn" title="Delete preset">🗑️</button>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderPresetPreview(preset) {
        // Simple visual representation of nodes
        return preset.nodes.slice(0, 4).map((node, index) => {
            const nodeType = node.type.split('/')[1];
            const icons = {
                'oscillator': '🎵',
                'filter': '🎛️',
                'mixer': '🎚️',
                'reverb': '🌊',
                'chorus': '🌀',
                'envelope': '📈',
                'lfo': '〰️',
                'output': '🔊'
            };
            return `<span class="preview-node" title="${nodeType}">${icons[nodeType] || '⚙️'}</span>`;
        }).join('');
    }
    
    bindEvents(modal, presetsByCategory) {
        // Category selection
        modal.querySelectorAll('.preset-category').forEach(categoryEl => {
            categoryEl.addEventListener('click', () => {
                // Update active category
                modal.querySelectorAll('.preset-category').forEach(el => el.classList.remove('active'));
                categoryEl.classList.add('active');
                
                const category = categoryEl.dataset.category;
                this.selectedCategory = category;
                
                // Update title and grid
                modal.querySelector('#category-title').textContent = category;
                const grid = modal.querySelector('#preset-grid');
                grid.innerHTML = this.renderPresetGrid(presetsByCategory[category] || []);
                
                // Re-bind preset click events
                this.bindPresetEvents(modal);
            });
        });
        
        // Search functionality
        const searchInput = modal.querySelector('#preset-search');
        searchInput.addEventListener('input', (e) => {
            this.filterPresets(modal, presetsByCategory, e.target.value);
        });
        
        // Save preset button
        modal.querySelector('#save-preset-btn').addEventListener('click', () => {
            this.showSavePresetDialog();
        });
        
        this.bindPresetEvents(modal);
    }
    
    bindPresetEvents(modal) {
        // Preset item clicks
        modal.querySelectorAll('.preset-item').forEach(item => {
            item.addEventListener('click', () => {
                const presetKey = item.dataset.presetKey;
                this.loadPreset(presetKey);
            });
        });
        
        // Delete buttons
        modal.querySelectorAll('.preset-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const presetKey = btn.closest('.preset-item').dataset.presetKey;
                this.deletePreset(presetKey);
            });
        });
    }
    
    filterPresets(modal, presetsByCategory, searchTerm) {
        const currentCategory = presetsByCategory[this.selectedCategory] || [];
        const filtered = currentCategory.filter(preset => 
            preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            preset.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const grid = modal.querySelector('#preset-grid');
        grid.innerHTML = this.renderPresetGrid(filtered);
        this.bindPresetEvents(modal);
    }
    
    loadPreset(presetKey) {
        const preset = this.nodePresets.getPreset(presetKey);
        if (!preset) {
            console.error('Preset not found:', presetKey);
            return;
        }
        
        try {
            // Clear current graph
            this.app.graph.clear();
            
            // Create nodes
            const nodeMap = new Map();
            preset.nodes.forEach((nodeData, index) => {
                // Extract type from full type string (e.g., 'amy/oscillator' -> 'oscillator')
                const nodeType = nodeData.type.includes('/') ? 
                    nodeData.type.split('/')[1] : nodeData.type;
                
                const node = this.app.createNode(nodeType, 
                    nodeData.position[0], 
                    nodeData.position[1]
                );
                
                if (node) {
                    // Set properties
                    if (nodeData.properties) {
                        Object.entries(nodeData.properties).forEach(([key, value]) => {
                            node.setParameter(key, value);
                        });
                    }
                    
                    nodeMap.set(index, node);
                }
            });
            
            // Create connections
            preset.connections.forEach(conn => {
                const sourceNode = nodeMap.get(conn.source);
                const targetNode = nodeMap.get(conn.target);
                
                if (sourceNode && targetNode) {
                    try {
                        // Find the actual ports
                        const outputPort = sourceNode.outputs[conn.sourceSlot];
                        const inputPort = targetNode.inputs[conn.targetSlot];
                        
                        if (outputPort && inputPort) {
                            this.app.graph.connectNodes(
                                sourceNode.id, outputPort.id,
                                targetNode.id, inputPort.id
                            );
                        }
                    } catch (error) {
                        console.warn('Failed to create connection:', error);
                    }
                }
            });
            
            // Update canvas
            this.app.nodeCanvas.render();
            
            // Center view on loaded graph
            this.app.nodeCanvas.offset.x = 0;
            this.app.nodeCanvas.offset.y = 0;
            this.app.nodeCanvas.scale = 1;
            
            // Clear undo history for clean start
            this.app.undoRedoManager.clear();
            this.app.updateUndoRedoButtons();
            
            // Update audio connections after loading preset
            setTimeout(() => {
                this.app.updateAudioConnections();
            }, 100);
            
            console.log(`Loaded preset: ${preset.name}`);
            this.hide();
            
        } catch (error) {
            console.error('Failed to load preset:', error);
            alert('Failed to load preset. Please try again.');
        }
    }
    
    showSavePresetDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.innerHTML = `
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
        `;
        
        document.body.appendChild(dialog);
        
        dialog.querySelector('#save-preset-confirm').addEventListener('click', () => {
            this.saveCurrentPreset(dialog);
        });
        
        // Focus name input
        dialog.querySelector('#preset-name').focus();
    }
    
    saveCurrentPreset(dialog) {
        const name = dialog.querySelector('#preset-name').value.trim();
        const description = dialog.querySelector('#preset-description').value.trim();
        const category = dialog.querySelector('#preset-category-select').value;
        
        if (!name) {
            alert('Please enter a preset name');
            return;
        }
        
        try {
            const { key, preset } = this.nodePresets.createPresetFromGraph(
                this.app.graph, name, description, category
            );
            
            this.nodePresets.addUserPreset(key, preset);
            console.log(`Saved preset: ${name}`);
            
            dialog.remove();
            this.hide();
            
            // Show success message
            alert(`Preset "${name}" saved successfully!`);
            
        } catch (error) {
            console.error('Failed to save preset:', error);
            alert('Failed to save preset. Please try again.');
        }
    }
    
    deletePreset(presetKey) {
        const preset = this.nodePresets.getPreset(presetKey);
        if (!preset) return;
        
        if (confirm(`Delete preset "${preset.name}"?`)) {
            if (this.nodePresets.removeUserPreset(presetKey)) {
                console.log(`Deleted preset: ${preset.name}`);
                
                // Refresh the modal
                this.hide();
                setTimeout(() => this.show(), 100);
            }
        }
    }
    
    addStyles() {
        if (document.getElementById('preset-browser-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'preset-browser-styles';
        style.textContent = `
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
        `;
        
        document.head.appendChild(style);
    }
}