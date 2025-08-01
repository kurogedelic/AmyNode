import { LiteGraph } from 'litegraph.js';

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.GRID_SIZE = 20;
        this.GRID_MAJOR_SIZE = 100;
        
        this.setupRendering();
    }
    
    setupRendering() {
        // Store original methods
        const originalDrawBackgroundCanvas = this.canvas.drawBackgroundCanvas?.bind(this.canvas);
        const originalDraw = this.canvas.draw.bind(this.canvas);
        
        // Create a persistent background canvas for the grid
        this.createPersistentBackground();
        
        // Override the draw method to ensure grid is always drawn
        this.canvas.draw = (forceCanvas, forceFG) => {
            // Always draw grid first
            this.drawPersistentGrid();
            
            // Then call original draw
            originalDraw(forceCanvas, forceFG);
        };
        
        // Disable Litegraph's default background
        this.canvas.background_image = false;
        this.canvas.clear_background = false;
        this.canvas.render_canvas_border = false;
        
        // Set up resize handling
        window.addEventListener('resize', () => {
            this.createPersistentBackground();
            this.drawPersistentGrid();
        });
    }
    
    createPersistentBackground() {
        // Create or resize the background canvas
        if (!this.bgCanvas) {
            this.bgCanvas = document.createElement('canvas');
            this.bgCanvas.style.position = 'absolute';
            this.bgCanvas.style.top = '0';
            this.bgCanvas.style.left = '0';
            this.bgCanvas.style.width = '100%';
            this.bgCanvas.style.height = '100%';
            this.bgCanvas.style.pointerEvents = 'none';
            this.bgCanvas.style.zIndex = '-1';
            
            // Insert before the main canvas
            this.canvas.canvas.parentNode.insertBefore(this.bgCanvas, this.canvas.canvas);
        }
        
        // Match size
        const rect = this.canvas.canvas.getBoundingClientRect();
        this.bgCanvas.width = rect.width;
        this.bgCanvas.height = rect.height;
        
        this.bgCtx = this.bgCanvas.getContext('2d');
    }
    
    drawPersistentGrid() {
        if (!this.bgCtx) return;
        
        const ctx = this.bgCtx;
        const canvas = this.bgCanvas;
        
        // Clear and draw gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#f8f9fa');
        grad.addColorStop(0.5, '#e9ecef');
        grad.addColorStop(1, '#dee2e6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Get canvas transform
        const offset = this.canvas.offset || [0, 0];
        const scale = this.canvas.scale || 1;
        
        ctx.save();
        ctx.translate(offset[0], offset[1]);
        ctx.scale(scale, scale);
        
        // Calculate visible area in graph coordinates
        const startX = -offset[0] / scale - 100;
        const startY = -offset[1] / scale - 100;
        const endX = startX + (canvas.width / scale) + 200;
        const endY = startY + (canvas.height / scale) + 200;
        
        // Draw minor grid
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 1 / scale;
        ctx.beginPath();
        
        const gridStartX = Math.floor(startX / this.GRID_SIZE) * this.GRID_SIZE;
        const gridStartY = Math.floor(startY / this.GRID_SIZE) * this.GRID_SIZE;
        
        for (let x = gridStartX; x <= endX; x += this.GRID_SIZE) {
            if (x % this.GRID_MAJOR_SIZE !== 0) {
                ctx.moveTo(x, startY);
                ctx.lineTo(x, endY);
            }
        }
        
        for (let y = gridStartY; y <= endY; y += this.GRID_SIZE) {
            if (y % this.GRID_MAJOR_SIZE !== 0) {
                ctx.moveTo(startX, y);
                ctx.lineTo(endX, y);
            }
        }
        ctx.stroke();
        
        // Draw major grid
        ctx.strokeStyle = 'rgba(80, 80, 80, 0.4)';
        ctx.lineWidth = 1 / scale;
        ctx.beginPath();
        
        const majorStartX = Math.floor(startX / this.GRID_MAJOR_SIZE) * this.GRID_MAJOR_SIZE;
        const majorStartY = Math.floor(startY / this.GRID_MAJOR_SIZE) * this.GRID_MAJOR_SIZE;
        
        for (let x = majorStartX; x <= endX; x += this.GRID_MAJOR_SIZE) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        
        for (let y = majorStartY; y <= endY; y += this.GRID_MAJOR_SIZE) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Update grid when canvas transforms change
    updateTransform() {
        this.drawPersistentGrid();
    }
}