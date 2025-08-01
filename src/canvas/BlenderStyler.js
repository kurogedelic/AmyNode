import { LiteGraph } from 'litegraph.js';

export class BlenderStyler {
    constructor() {
        this.setupBlenderTheme();
        this.setupNodeDesign();
        this.overrideRendering();
    }
    
    setupBlenderTheme() {
        // Blender-inspired color palette
        const theme = {
            // Background colors
            bg_primary: '#1e1e1e',      // Dark background
            bg_secondary: '#2d2d2d',    // Node background
            bg_input: '#3a3a3a',        // Input fields
            bg_selected: '#5d5d5d',     // Selected state
            
            // Text colors  
            text_primary: '#ffffff',    // Main text
            text_secondary: '#b3b3b3',  // Secondary text
            text_disabled: '#666666',   // Disabled text
            
            // Accent colors
            accent_orange: '#ff6600',   // Blender orange
            accent_blue: '#4285f4',     // Input connections
            accent_yellow: '#ffcc00',   // Output connections
            
            // Socket colors by type
            socket_audio: '#4CAF50',    // Green for audio
            socket_control: '#2196F3',   // Blue for control
            socket_mod: '#9C27B0',      // Purple for modulation
            socket_number: '#FF9800'    // Orange for numbers
        };
        
        // Apply to LiteGraph
        LiteGraph.NODE_DEFAULT_BGCOLOR = theme.bg_secondary;
        LiteGraph.NODE_DEFAULT_COLOR = theme.text_primary;
        LiteGraph.NODE_DEFAULT_BOXCOLOR = '#444444';
        LiteGraph.NODE_SELECTED_TITLE_COLOR = theme.accent_orange;
        LiteGraph.NODE_TEXT_COLOR = theme.text_primary;
        LiteGraph.NODE_SUBTEXT_SIZE = 11;
        LiteGraph.NODE_TEXT_SIZE = 12;
        LiteGraph.NODE_TITLE_HEIGHT = 24;
        LiteGraph.NODE_TITLE_TEXT_Y = 16;
        LiteGraph.NODE_SLOT_HEIGHT = 16;
        LiteGraph.NODE_WIDGET_HEIGHT = 18;
        LiteGraph.NODE_MIN_WIDTH = 120;
        LiteGraph.CANVAS_GRID_SIZE = 20;
        
        // Connection colors
        LiteGraph.LINK_COLOR = theme.socket_audio;
        LiteGraph.EVENT_LINK_COLOR = theme.socket_control;
        
        this.theme = theme;
    }
    
    setupNodeDesign() {
        // Standard node sizes based on complexity
        this.nodeSizes = {
            simple: [140, 80],      // Basic nodes (ADC, GPIO)
            standard: [160, 100],   // Standard nodes (Oscillator, Filter)
            complex: [180, 120],    // Complex nodes (Envelope, Effects)
            matrix: [220, 180]      // Special nodes (Mod Matrix)
        };
        
        // Socket type definitions
        this.socketTypes = {
            audio: { color: '#4CAF50', radius: 6 },
            control: { color: '#2196F3', radius: 5 },
            modulation: { color: '#9C27B0', radius: 5 },
            number: { color: '#FF9800', radius: 4 },
            trigger: { color: '#F44336', radius: 4 }
        };
    }
    
    overrideRendering() {
        const theme = this.theme;
        const socketTypes = this.socketTypes;
        
        // Override node title rendering
        const originalDrawNodeTitle = LiteGraph.LGraphCanvas.prototype.drawNodeTitle;
        LiteGraph.LGraphCanvas.prototype.drawNodeTitle = function(node, ctx, title_color, selected_color, mouse_over) {
            const title_height = LiteGraph.NODE_TITLE_HEIGHT;
            const title_mode = node.constructor.title_mode;
            
            // Draw title background with gradient
            if (title_mode !== LiteGraph.NO_TITLE) {
                ctx.save();
                
                // Create gradient background
                const gradient = ctx.createLinearGradient(0, 0, 0, title_height);
                if (node.selected) {
                    gradient.addColorStop(0, theme.accent_orange + '40');
                    gradient.addColorStop(1, theme.accent_orange + '20');
                } else {
                    gradient.addColorStop(0, '#404040');
                    gradient.addColorStop(1, '#2d2d2d');
                }
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, node.size[0], title_height);
                
                // Draw title text with better font
                ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillStyle = node.selected ? theme.accent_orange : theme.text_primary;
                ctx.textAlign = 'left';
                ctx.fillText(node.title, 8, 15);
                
                // Draw category indicator
                const category = this.getNodeCategory(node);
                if (category) {
                    ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                    ctx.fillStyle = theme.text_secondary;
                    ctx.textAlign = 'right';
                    ctx.fillText(category.toUpperCase(), node.size[0] - 8, 15);
                }
                
                ctx.restore();
            }
        }.bind(this);
        
        // Override socket rendering
        const originalDrawConnection = LiteGraph.LGraphCanvas.prototype.drawConnection;
        LiteGraph.LGraphCanvas.prototype.drawConnection = function(ctx, a, b, a_color, b_color, thickness, skip_border, flow) {
            // Enhanced connection rendering with better colors and thickness
            const enhanced_thickness = Math.max(thickness || 2, 2);
            
            // Determine connection color based on socket types
            let connection_color = a_color || theme.socket_audio;
            
            ctx.save();
            ctx.strokeStyle = connection_color;
            ctx.lineWidth = enhanced_thickness;
            ctx.lineCap = 'round';
            
            // Draw connection with smooth curve
            ctx.beginPath();
            ctx.moveTo(a[0], a[1]);
            
            const dist = Math.abs(a[0] - b[0]);
            const cp1_x = a[0] + Math.min(dist * 0.5, 100);
            const cp2_x = b[0] - Math.min(dist * 0.5, 100);
            
            ctx.bezierCurveTo(cp1_x, a[1], cp2_x, b[1], b[0], b[1]);
            ctx.stroke();
            
            // Add flow animation for audio connections
            if (flow && connection_color === theme.socket_audio) {
                this.drawConnectionFlow(ctx, a, b, connection_color);
            }
            
            ctx.restore();
        }.bind(this);
        
        // Override node background rendering
        const originalDrawNode = LiteGraph.LGraphCanvas.prototype.drawNode;
        const styler = this;
        LiteGraph.LGraphCanvas.prototype.drawNode = function(node, ctx) {
            // Apply consistent sizing
            styler.applySizeRules(node);
            
            // Call original with enhancements
            const result = originalDrawNode.call(this, node, ctx);
            
            // Add custom decorations
            styler.drawNodeDecorations(node, ctx);
            
            return result;
        };
        
        // Override socket rendering for better visibility
        const originalDrawNodeSocket = LiteGraph.LGraphCanvas.prototype.drawNodeSocket;
        LiteGraph.LGraphCanvas.prototype.drawNodeSocket = function(ctx, node, slot, type, x, y, selected, connected) {
            const socket_type = styler.getSocketType(type);
            const radius = socket_type.radius;
            const color = socket_type.color;
            
            ctx.save();
            
            // Draw socket background
            ctx.beginPath();
            ctx.arc(x, y, radius + 1, 0, Math.PI * 2);
            ctx.fillStyle = connected ? color : theme.bg_input;
            ctx.fill();
            
            // Draw socket border
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = connected ? 2 : 1;
            ctx.stroke();
            
            // Draw inner dot for connected sockets
            if (connected) {
                ctx.beginPath();
                ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }
            
            ctx.restore();
        };
    }
    
    applySizeRules(node) {
        if (!node || node._size_applied) return;
        
        const nodeType = node.type || '';
        let targetSize;
        
        // Determine appropriate size based on node type
        if (nodeType.includes('modmatrix')) {
            targetSize = this.nodeSizes.matrix;
        } else if (nodeType.includes('envelope') || nodeType.includes('reverb') || nodeType.includes('chorus') || nodeType.includes('echo')) {
            targetSize = this.nodeSizes.complex;
        } else if (nodeType.includes('oscillator') || nodeType.includes('filter') || nodeType.includes('mixer')) {
            targetSize = this.nodeSizes.standard;
        } else {
            targetSize = this.nodeSizes.simple;
        }
        
        node.size = [...targetSize];
        node._size_applied = true;
    }
    
    drawNodeDecorations(node, ctx) {
        if (!node || node.flags?.collapsed) return;
        
        ctx.save();
        
        // Draw node type icon in corner
        const icon = this.getNodeIcon(node);
        if (icon) {
            ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillStyle = this.theme.text_secondary;
            ctx.textAlign = 'right';
            ctx.fillText(icon, node.size[0] - 6, node.size[1] - 6);
        }
        
        ctx.restore();
    }
    
    drawConnectionFlow(ctx, start, end, color) {
        // Animated flow dots along connection
        const time = Date.now() * 0.005;
        const distance = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
        const segments = Math.floor(distance / 20);
        
        for (let i = 0; i < segments; i++) {
            const t = (i / segments + time) % 1;
            const x = start[0] + (end[0] - start[0]) * t;
            const y = start[1] + (end[1] - start[1]) * t;
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = color + '80';
            ctx.fill();
        }
    }
    
    getNodeCategory(node) {
        if (!node?.type) return '';
        
        const type = node.type.toLowerCase();
        if (type.includes('oscillator') || type.includes('lfo')) return 'gen';
        if (type.includes('filter') || type.includes('mixer')) return 'proc';
        if (type.includes('reverb') || type.includes('chorus') || type.includes('echo')) return 'fx';
        if (type.includes('envelope') || type.includes('modmatrix')) return 'mod'; 
        if (type.includes('adc') || type.includes('gpio')) return 'io';
        return 'util';
    }
    
    getNodeIcon(node) {
        if (!node?.type) return '';
        
        const icons = {
            'oscillator': '〜',
            'lfo': '∞',
            'filter': '⟋',
            'mixer': '⊞',
            'reverb': '⟐',
            'chorus': '≋',
            'echo': '⟲',
            'envelope': '⟰',
            'modmatrix': '⊞',
            'adc': '◐',
            'gpio': '⊡'
        };
        
        const type = node.type.split('/')[1] || '';
        return icons[type] || '';
    }
    
    getSocketType(type_name) {
        if (!type_name) return this.socketTypes.control;
        
        const type = type_name.toLowerCase();
        if (type.includes('audio')) return this.socketTypes.audio;
        if (type.includes('modulation')) return this.socketTypes.modulation;
        if (type.includes('number')) return this.socketTypes.number;
        if (type.includes('trigger')) return this.socketTypes.trigger;
        
        return this.socketTypes.control;
    }
}