export class SimpleGrid {
    constructor(canvas) {
        this.canvas = canvas;
        this.GRID_SIZE = 20;
        this.GRID_MAJOR_SIZE = 100;
        
        this.setupGrid();
    }
    
    setupGrid() {
        // Override the onDrawBackground method
        this.canvas.onDrawBackground = (ctx, visible_area) => {
            this.drawGrid(ctx, visible_area);
        };
        
        // Disable Litegraph's background completely
        this.canvas.background_image = false;
        this.canvas.clear_background = false;
        this.canvas.clear_background_color = 'transparent';
        
        // Force redraw
        this.canvas.setDirty(true, true);
    }
    
    drawGrid(ctx, visible_area) {
        if (!ctx || !visible_area) return;
        
        const [left, top, width, height] = visible_area;
        const right = left + width;
        const bottom = top + height;
        
        // Draw gradient background
        ctx.save();
        const canvasHeight = this.canvas.canvas.height / this.canvas.scale;
        const grad = ctx.createLinearGradient(0, top, 0, bottom);
        grad.addColorStop(0, '#f8f9fa');
        grad.addColorStop(0.5, '#e9ecef');
        grad.addColorStop(1, '#dee2e6');
        ctx.fillStyle = grad;
        ctx.fillRect(left, top, width, height);
        
        // Draw minor grid
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // Vertical lines
        let x = Math.floor(left / this.GRID_SIZE) * this.GRID_SIZE;
        while (x < right) {
            if (x % this.GRID_MAJOR_SIZE !== 0) {
                ctx.moveTo(x, top);
                ctx.lineTo(x, bottom);
            }
            x += this.GRID_SIZE;
        }
        
        // Horizontal lines
        let y = Math.floor(top / this.GRID_SIZE) * this.GRID_SIZE;
        while (y < bottom) {
            if (y % this.GRID_MAJOR_SIZE !== 0) {
                ctx.moveTo(left, y);
                ctx.lineTo(right, y);
            }
            y += this.GRID_SIZE;
        }
        
        ctx.stroke();
        
        // Draw major grid
        ctx.strokeStyle = 'rgba(80, 80, 80, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // Major vertical lines
        x = Math.floor(left / this.GRID_MAJOR_SIZE) * this.GRID_MAJOR_SIZE;
        while (x < right) {
            ctx.moveTo(x, top);
            ctx.lineTo(x, bottom);
            x += this.GRID_MAJOR_SIZE;
        }
        
        // Major horizontal lines
        y = Math.floor(top / this.GRID_MAJOR_SIZE) * this.GRID_MAJOR_SIZE;
        while (y < bottom) {
            ctx.moveTo(left, y);
            ctx.lineTo(right, y);
            y += this.GRID_MAJOR_SIZE;
        }
        
        ctx.stroke();
        ctx.restore();
    }
}