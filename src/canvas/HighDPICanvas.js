// High DPI Canvas Support for LiteGraph.js
// Fixes blurry rendering on Retina/High DPI displays

export class HighDPICanvas {
    constructor(lgCanvas) {
        this.lgCanvas = lgCanvas;
        this.dpr = window.devicePixelRatio || 1;
        this.originalRenderMethod = null;
        
        // Apply high DPI fixes
        this.initialize();
    }
    
    initialize() {
        try {
            // Set initial high DPI state first
            this.applyHighDPISettings();
            
            // Override LiteGraph's render method
            this.patchRenderMethod();
            
            // Fix mouse coordinates for high DPI
            this.patchMouseHandling();
        } catch (error) {
            console.warn('HighDPICanvas initialization error:', error);
            // Continue without patches if there's an error
        }
    }
    
    applyHighDPISettings() {
        const canvas = this.lgCanvas.canvas;
        if (!canvas || !canvas.getContext) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // MDNの例に従う：表示サイズを取得（CSSピクセル）
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // 表示サイズを設定（CSS におけるピクセル数）
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        // メモリー上における実際のサイズを設定（ピクセル密度の分だけ倍増）
        const scale = window.devicePixelRatio; // Retina でこの値を 1 にするとぼやけた canvas になります
        canvas.width = Math.floor(width * scale);
        canvas.height = Math.floor(height * scale);
        
        // CSS 上のピクセル数を前提としているシステムに合わせる
        ctx.scale(scale, scale);
        
        // Retinaディスプレイ用の最適化
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Store DPI info in LiteGraph
        this.lgCanvas.high_dpi_scale = scale;
        this.lgCanvas.use_high_dpi = true;
        this.dpr = scale;
        
        // Update LiteGraph's internal scale tracking
        if (this.lgCanvas.ds) {
            this.lgCanvas.ds.extra_scale = scale;
        }
    }
    
    patchRenderMethod() {
        const self = this;
        
        // Debug: Check what methods are available
        // console.log('LGraphCanvas methods:', Object.getOwnPropertyNames(this.lgCanvas));
        
        // Check if draw method exists before binding
        if (this.lgCanvas && typeof this.lgCanvas.draw === 'function') {
            const originalDraw = this.lgCanvas.draw.bind(this.lgCanvas);
            
            this.lgCanvas.draw = function(force_redraw, force_background) {
                const ctx = this.canvas.getContext('2d');
                const scale = window.devicePixelRatio || 1;
                
                // Save context state
                ctx.save();
                
                // 毎回描画前にスケールを再設定（MDNの例に従う）
                ctx.setTransform(scale, 0, 0, scale, 0, 0);
                
                // Call original draw method
                originalDraw(force_redraw, force_background);
                
                // Restore context state
                ctx.restore();
            };
        }
        
        // Fix requestAnimationFrame reference if renderFrame exists
        if (this.lgCanvas && typeof this.lgCanvas.renderFrame === 'function') {
            const originalRenderFrame = this.lgCanvas.renderFrame.bind(this.lgCanvas);
            
            this.lgCanvas.renderFrame = function() {
                // Ensure we use the correct window object
                const win = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
                
                if (win.requestAnimationFrame) {
                    win.requestAnimationFrame(() => {
                        originalRenderFrame.call(this);
                    });
                } else {
                    // Fallback for environments without requestAnimationFrame
                    setTimeout(() => {
                        originalRenderFrame.call(this);
                    }, 16); // ~60fps
                }
            };
        }
    }
    
    patchMouseHandling() {
        const self = this;
        
        // Override mouse coordinate conversion if method exists
        if (this.lgCanvas.getCanvasWindow) {
            const originalGetCanvasWindow = this.lgCanvas.getCanvasWindow.bind(this.lgCanvas);
            
            this.lgCanvas.getCanvasWindow = function() {
                const rect = originalGetCanvasWindow();
                // Adjust for DPI scaling
                return [
                    rect[0] * self.dpr,
                    rect[1] * self.dpr,
                    rect[2] * self.dpr,
                    rect[3] * self.dpr
                ];
            };
        }
        
        // Fix convertEventToCanvasOffset for high DPI if method exists
        if (this.lgCanvas.convertEventToCanvasOffset) {
            const originalConvertOffset = this.lgCanvas.convertEventToCanvasOffset.bind(this.lgCanvas);
            this.lgCanvas.convertEventToCanvasOffset = function(e) {
                const pos = originalConvertOffset(e);
                // No need to scale here as LiteGraph handles this internally
                return pos;
            };
        }
    }
    
    // Call this when window resizes
    onResize() {
        this.applyHighDPISettings();
        this.lgCanvas.setDirty(true, true);
    }
    
    // Get current DPI scale
    getDPIScale() {
        return this.dpr;
    }
}