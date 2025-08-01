export class GridRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.GRID_SIZE = 20;
        this.GRID_MAJOR_SIZE = 100;
        
        // Grid colors
        this.theme = {
            gridMinor: 'rgba(100, 100, 100, 0.2)',
            gridMajor: 'rgba(80, 80, 80, 0.4)'
        };
        
        // Override Litegraph's background rendering
        this.setupGrid();
    }
    
    setupGrid() {
        // Override the drawBackgroundCanvas method
        const originalDrawBackground = this.canvas.drawBackgroundCanvas ? 
            this.canvas.drawBackgroundCanvas.bind(this.canvas) : 
            this.canvas.draw.bind(this.canvas);
        
        // Override background rendering
        this.canvas.drawBackgroundCanvas = (ctx) => {
            // Get visible area
            const visibleArea = this.canvas.visible_area || [
                -this.canvas.offset[0],
                -this.canvas.offset[1],
                this.canvas.canvas.width / this.canvas.scale + -this.canvas.offset[0],
                this.canvas.canvas.height / this.canvas.scale + -this.canvas.offset[1]
            ];
            
            // Draw custom grid
            this.drawGrid(ctx, visibleArea);
        };
        
        // Disable Litegraph's default grid and background
        this.canvas.render_canvas_border = false;
        this.canvas.background_image = false;
        this.canvas.clear_background = false;
        this.canvas.render_shadows = false;
        this.canvas.render_connections_shadows = false;
        
        // Override the default background color
        if (this.canvas.bgcanvas) {
            const bgctx = this.canvas.bgcanvas.getContext('2d');
            bgctx.fillStyle = 'transparent';
        }
    }
    
    drawGrid(ctx, visibleArea) {
        if (!visibleArea) return;
        
        const [startX, startY, endX, endY] = visibleArea;
        const scale = this.canvas.scale;
        
        ctx.save();
        
        // Minor grid lines
        ctx.strokeStyle = this.theme.gridMinor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // Calculate grid start positions
        const gridStartX = Math.floor(startX / this.GRID_SIZE) * this.GRID_SIZE;
        const gridStartY = Math.floor(startY / this.GRID_SIZE) * this.GRID_SIZE;
        
        // Draw vertical lines
        for (let x = gridStartX; x <= endX; x += this.GRID_SIZE) {
            if (x % this.GRID_MAJOR_SIZE !== 0) {
                ctx.moveTo(x, startY);
                ctx.lineTo(x, endY);
            }
        }
        
        // Draw horizontal lines
        for (let y = gridStartY; y <= endY; y += this.GRID_SIZE) {
            if (y % this.GRID_MAJOR_SIZE !== 0) {
                ctx.moveTo(startX, y);
                ctx.lineTo(endX, y);
            }
        }
        
        ctx.stroke();
        
        // Major grid lines
        ctx.strokeStyle = this.theme.gridMajor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const majorStartX = Math.floor(startX / this.GRID_MAJOR_SIZE) * this.GRID_MAJOR_SIZE;
        const majorStartY = Math.floor(startY / this.GRID_MAJOR_SIZE) * this.GRID_MAJOR_SIZE;
        
        // Draw major vertical lines
        for (let x = majorStartX; x <= endX; x += this.GRID_MAJOR_SIZE) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        
        // Draw major horizontal lines
        for (let y = majorStartY; y <= endY; y += this.GRID_MAJOR_SIZE) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        
        ctx.stroke();
        ctx.restore();
    }
    
    updateTheme(isDark) {
        if (isDark) {
            this.theme.gridMinor = 'rgba(255, 255, 255, 0.1)';
            this.theme.gridMajor = 'rgba(255, 255, 255, 0.2)';
        } else {
            this.theme.gridMinor = 'rgba(100, 100, 100, 0.2)';
            this.theme.gridMajor = 'rgba(80, 80, 80, 0.4)';
        }
    }
}