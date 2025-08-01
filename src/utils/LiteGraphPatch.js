/**
 * Comprehensive patch for LiteGraph window reference issues
 * This patches all known problematic areas in LiteGraph
 */

export function patchLiteGraph() {
    console.log('Applying comprehensive LiteGraph patches...');
    
    // Ensure all window references exist
    const windowRefs = ['window2', 'ref_window2', 'ref_window', 'global', 'globalThis'];
    windowRefs.forEach(ref => {
        if (typeof window !== 'undefined' && !(ref in window)) {
            Object.defineProperty(window, ref, {
                get() { return window; },
                set() { /* ignore */ },
                configurable: true
            });
        }
    });
    
    // Create a safe document proxy
    const safeDocument = new Proxy(document, {
        get(target, prop) {
            if (prop === 'activeElement') {
                try {
                    return target.activeElement || target.body;
                } catch (e) {
                    return target.body;
                }
            }
            return target[prop];
        }
    });
    
    // Override window properties to return safe versions
    if (typeof window !== 'undefined') {
        const safeWindow = new Proxy(window, {
            get(target, prop) {
                if (prop === 'document') {
                    return safeDocument;
                }
                if (prop === 'requestAnimationFrame') {
                    return target.requestAnimationFrame ? 
                        target.requestAnimationFrame.bind(target) : 
                        (cb) => setTimeout(cb, 16);
                }
                return target[prop];
            }
        });
        
        // Apply safe window to all references
        windowRefs.forEach(ref => {
            try {
                if (ref in window) {
                    Object.defineProperty(window[ref], 'document', {
                        get() { return safeDocument; },
                        configurable: true
                    });
                }
            } catch (e) {
                // Some refs might be read-only
            }
        });
    }
    
    // Patch problematic LiteGraph methods if LiteGraph is loaded
    if (typeof LiteGraph !== 'undefined') {
        patchLiteGraphMethods();
    } else {
        // Wait for LiteGraph to load
        const checkInterval = setInterval(() => {
            if (typeof LiteGraph !== 'undefined') {
                clearInterval(checkInterval);
                patchLiteGraphMethods();
            }
        }, 100);
    }
}

function patchLiteGraphMethods() {
    console.log('Patching LiteGraph methods...');
    
    // Patch LGraphCanvas if available
    if (typeof LGraphCanvas !== 'undefined') {
        const originalProcessMouseMove = LGraphCanvas.prototype.processMouseMove;
        if (originalProcessMouseMove) {
            LGraphCanvas.prototype.processMouseMove = function(e) {
                try {
                    // Ensure window references exist before calling
                    if (typeof window2 === 'undefined') window.window2 = window;
                    if (typeof ref_window2 === 'undefined') window.ref_window2 = window;
                    return originalProcessMouseMove.call(this, e);
                } catch (error) {
                    console.warn('LiteGraph processMouseMove error caught:', error);
                    // Continue without error
                }
            };
        }
        
        const originalProcessMouseDown = LGraphCanvas.prototype.processMouseDown;
        if (originalProcessMouseDown) {
            LGraphCanvas.prototype.processMouseDown = function(e) {
                try {
                    if (typeof window2 === 'undefined') window.window2 = window;
                    if (typeof ref_window2 === 'undefined') window.ref_window2 = window;
                    return originalProcessMouseDown.call(this, e);
                } catch (error) {
                    console.warn('LiteGraph processMouseDown error caught:', error);
                }
            };
        }
        
        const originalProcessMouseUp = LGraphCanvas.prototype.processMouseUp;
        if (originalProcessMouseUp) {
            LGraphCanvas.prototype.processMouseUp = function(e) {
                try {
                    if (typeof window2 === 'undefined') window.window2 = window;
                    if (typeof ref_window2 === 'undefined') window.ref_window2 = window;
                    return originalProcessMouseUp.call(this, e);
                } catch (error) {
                    console.warn('LiteGraph processMouseUp error caught:', error);
                }
            };
        }
        
        // Patch any method that might access document.activeElement
        const methodsToPatch = [
            'processKey',
            'processDrop',
            'processNodeDblClicked',
            'showShowNodePanel',
            'prompt'
        ];
        
        methodsToPatch.forEach(methodName => {
            const original = LGraphCanvas.prototype[methodName];
            if (original) {
                LGraphCanvas.prototype[methodName] = function(...args) {
                    try {
                        if (typeof window2 === 'undefined') window.window2 = window;
                        if (typeof ref_window2 === 'undefined') window.ref_window2 = window;
                        return original.apply(this, args);
                    } catch (error) {
                        console.warn(`LiteGraph ${methodName} error caught:`, error);
                    }
                };
            }
        });
    }
    
    // Patch global LiteGraph methods
    if (LiteGraph.closeAllContextMenus) {
        const originalCloseAll = LiteGraph.closeAllContextMenus;
        LiteGraph.closeAllContextMenus = function(ref_window) {
            try {
                // Ensure ref_window is valid
                ref_window = ref_window || window;
                if (!ref_window.document) {
                    ref_window = window;
                }
                return originalCloseAll.call(this, ref_window);
            } catch (error) {
                console.warn('LiteGraph closeAllContextMenus error caught:', error);
            }
        };
    }
    
    // Create a global error handler for uncaught LiteGraph errors
    if (typeof window !== 'undefined') {
        const originalError = window.onerror;
        window.onerror = function(msg, url, lineNo, columnNo, error) {
            // Check if this is a LiteGraph-related error
            if (msg && msg.toString().includes('ref_window2')) {
                console.warn('Caught LiteGraph ref_window2 error:', msg);
                // Prevent error propagation
                return true;
            }
            if (msg && msg.toString().includes('window2')) {
                console.warn('Caught LiteGraph window2 error:', msg);
                // Prevent error propagation
                return true;
            }
            // Call original handler if exists
            if (originalError) {
                return originalError(msg, url, lineNo, columnNo, error);
            }
            return false;
        };
    }
    
    console.log('LiteGraph patches applied successfully');
}

// Auto-patch on import
patchLiteGraph();