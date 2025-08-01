import { LiteGraph } from 'litegraph.js';

export class NodeStyler {
    constructor() {
        this.setupNodeStyles();
    }
    
    setupNodeStyles() {
        // Dark theme colors - optimized for High DPI
        const dpr = window.devicePixelRatio || 1;
        const baseFontSize = 13; // Slightly larger for better readability
        
        LiteGraph.NODE_DEFAULT_COLOR = "#ffffff";
        LiteGraph.NODE_DEFAULT_BGCOLOR = "#2d2d2d";
        LiteGraph.NODE_DEFAULT_BOXCOLOR = "#404040";
        LiteGraph.NODE_DEFAULT_SHAPE = "round";
        LiteGraph.NODE_TITLE_HEIGHT = 28;
        LiteGraph.NODE_TITLE_TEXT_Y = 19;
        LiteGraph.NODE_SLOT_HEIGHT = 20;
        LiteGraph.NODE_WIDGET_HEIGHT = 24;
        LiteGraph.NODE_WIDTH = 180;
        LiteGraph.NODE_MIN_WIDTH = 140;
        LiteGraph.NODE_COLLAPSED_RADIUS = 8;
        LiteGraph.NODE_COLLAPSED_WIDTH = 80;
        LiteGraph.NODE_TEXT_SIZE = baseFontSize;
        LiteGraph.NODE_TEXT_COLOR = "#ffffff";
        LiteGraph.NODE_SUBTEXT_SIZE = baseFontSize - 2;
        LiteGraph.NODE_SELECTED_TITLE_COLOR = "#ff6600";
        
        // Set clear fonts - use integer font sizes for crisp rendering
        const titleSize = Math.round(baseFontSize);
        const textSize = Math.round(baseFontSize);
        const subtextSize = Math.round(baseFontSize - 2);
        
        LiteGraph.NODE_TITLE_FONT = `600 ${titleSize}px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif`;
        LiteGraph.NODE_TEXT_FONT = `400 ${textSize}px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif`;
        LiteGraph.NODE_SUBTEXT_FONT = `400 ${subtextSize}px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif`;
        
        // Connection colors
        LiteGraph.LINK_COLOR = "#4CAF50";
        LiteGraph.EVENT_LINK_COLOR = "#2196F3";
        
        // Override node rendering
        this.overrideNodeRendering();
    }
    
    overrideNodeRendering() {
        // Modern category-based node colors - header only
        const categoryColors = {
            generator: {
                title_bg: "#4CAF50",
                title_selected: "#66BB6A", 
                body_bg: "#2d2d2d",  // 統一されたボディ色
                body_selected: "#353535",
                border: "#404040",
                text: "#ffffff",
                accent: "#81C784"
            },
            modulation: {
                title_bg: "#9C27B0",
                title_selected: "#BA68C8",
                body_bg: "#2d2d2d",  // 統一されたボディ色
                body_selected: "#353535",
                border: "#404040",
                text: "#ffffff",
                accent: "#CE93D8"
            },
            processor: {
                title_bg: "#2196F3",
                title_selected: "#64B5F6",
                body_bg: "#2d2d2d",  // 統一されたボディ色
                body_selected: "#353535", 
                border: "#404040",
                text: "#ffffff",
                accent: "#90CAF9"
            },
            input: {
                title_bg: "#FF9800",
                title_selected: "#FFB74D",
                body_bg: "#2d2d2d",  // 統一されたボディ色
                body_selected: "#353535",
                border: "#404040", 
                text: "#ffffff",
                accent: "#FFCC02"
            },
            output: {
                title_bg: "#E91E63",
                title_selected: "#F48FB1",
                body_bg: "#2d2d2d",  // 統一されたボディ色
                body_selected: "#353535",
                border: "#404040",
                text: "#ffffff",
                accent: "#F8BBD0"
            },
            utility: {
                title_bg: "#607D8B",
                title_selected: "#90A4AE",
                body_bg: "#2d2d2d",  // 統一されたボディ色
                body_selected: "#353535",
                border: "#404040",
                text: "#ffffff", 
                accent: "#B0BEC5"
            }
        };

        // Helper function for rounded rectangles
        const drawRoundedRect = function(ctx, x, y, width, height, radius, topOnly = false) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            
            if (topOnly) {
                ctx.lineTo(x + width, y + height);
                ctx.lineTo(x, y + height);
            } else {
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            }
            
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        };

        // Custom node rendering
        const originalDrawNode = LiteGraph.LGraphCanvas.prototype.drawNode;
        
        // Helper function to get node category
        const getNodeCategory = function(node) {
            if (!node?.type) return 'utility';
            
            const type = node.type.toLowerCase();
            if (type.includes('oscillator') || type.includes('lfo') || type.includes('sampleplayer') || type.includes('drums')) return 'generator';
            if (type.includes('filter') || type.includes('mixer') || type.includes('reverb') || 
                type.includes('chorus') || type.includes('echo')) return 'processor';
            if (type.includes('envelope') || type.includes('modmatrix') || type.includes('sequencer') || type.includes('clock')) return 'modulation';
            if (type.includes('adc') || type.includes('gpio') || type.includes('keyboard')) return 'input';
            if (type.includes('output')) return 'output';
            return 'utility';
        };
        
        // Helper function to get category icon (現在は使用していない)
        const getCategoryIcon = function(category) {
            const icons = {
                generator: "⚡",
                processor: "⚙",
                modulation: "〜",
                input: "🔌",
                output: "🔊",
                utility: "🔧"
            };
            return icons[category] || "●";
        };
        
        // Override the drawNodeShape to customize appearance
        LiteGraph.LGraphCanvas.prototype.drawNodeShape = function(node, ctx, size, fgcolor, bgcolor, selected, mouse_over) {
            const category = getNodeCategory(node);
            const colors = categoryColors[category] || categoryColors.utility;
            const title_height = LiteGraph.NODE_TITLE_HEIGHT;
            const radius = 8;
            
            // Save context for shadow
            ctx.save();
            
            // Draw shadow if not selected
            if (!selected) {
                ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            
            // Draw main body with shadow
            ctx.fillStyle = selected ? colors.body_selected : colors.body_bg;
            drawRoundedRect(ctx, 0, 0, size[0], size[1], radius);
            ctx.fill();
            
            // Remove shadow for the rest
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw colored header
            ctx.fillStyle = selected ? colors.title_selected : colors.title_bg;
            drawRoundedRect(ctx, 0, 0, size[0], title_height, radius, true);
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = selected ? colors.title_bg : colors.border;
            ctx.lineWidth = selected ? 2 : 1;
            drawRoundedRect(ctx, 0, 0, size[0], size[1], radius);
            ctx.stroke();
            
            // Restore context
            ctx.restore();
        };
        
        // Enhanced socket rendering
        const originalDrawNodeSocket = LiteGraph.LGraphCanvas.prototype.drawNodeSocket;
        LiteGraph.LGraphCanvas.prototype.drawNodeSocket = function(ctx, node, slot, type, x, y, selected, connected) {
            const socketColors = {
                audio: "#4CAF50",
                number: "#FF9800", 
                envelope: "#9C27B0",
                modulation: "#E91E63",
                trigger: "#F44336"
            };
            
            const socketType = type || "audio";
            const color = socketColors[socketType] || socketColors.audio;
            const radius = connected ? 6 : 4;
            
            ctx.save();
            
            // Draw outer ring
            ctx.beginPath();
            ctx.arc(x, y, radius + 1, 0, Math.PI * 2);
            ctx.fillStyle = "#1a1a1a";
            ctx.fill();
            
            // Draw socket
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = connected ? color : "#3a3a3a";
            ctx.fill();
            
            // Draw inner highlight
            if (connected) {
                ctx.beginPath();
                ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(x, y, radius - 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            }
            
            // Draw border
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = connected ? "#ffffff" : color;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
        };
        
        
        // Use LiteGraph's default IO rendering for now to avoid errors
        const drawNodeIOSlots = function(ctx, node, colors) {
            // Let LiteGraph handle IO slot rendering
            return;
        };
        
        // Enhanced connection rendering
        const originalDrawConnection = LiteGraph.LGraphCanvas.prototype.drawConnection;
        LiteGraph.LGraphCanvas.prototype.drawConnection = function(ctx, a, b, a_color, b_color, thickness, skip_border, flow) {
            ctx.save();
            
            // Enhanced styling
            const color = a_color || "#4CAF50";
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(thickness || 3, 3);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            
            // Add subtle glow
            ctx.shadowColor = color;
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw smooth bezier curve
            ctx.beginPath();
            ctx.moveTo(a[0], a[1]);
            
            const dist = Math.abs(a[0] - b[0]);
            const cp_offset = Math.min(dist * 0.6, 150);
            
            ctx.bezierCurveTo(
                a[0] + cp_offset, a[1],
                b[0] - cp_offset, b[1], 
                b[0], b[1]
            );
            
            ctx.stroke();
            
            // Draw inner bright line
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
        };
        
        // Ensure dark theme consistency
        LiteGraph.NODE_DEFAULT_BGCOLOR = "#2d2d2d";
        LiteGraph.NODE_DEFAULT_COLOR = "#ffffff";
        LiteGraph.NODE_DEFAULT_BOXCOLOR = "#404040";
        LiteGraph.NODE_SELECTED_TITLE_COLOR = "#ff6600";
        LiteGraph.NODE_TEXT_COLOR = "#ffffff";
        
        // Connection colors  
        LiteGraph.LINK_COLOR = "#4CAF50";
        LiteGraph.EVENT_LINK_COLOR = "#2196F3";
    }
}