// AMY AudioWorklet Processor
// Handles real-time audio processing for AMY WASM

class AmyWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        this.amyModule = null;
        this.renderBuffer = null;
        this.bufferSize = 128; // AudioWorklet quantum size
        this.isInitialized = false;
        
        // Listen for messages from main thread
        this.port.onmessage = (event) => {
            if (event.data.type === 'init') {
                this.initializeAmy(event.data.wasmModule);
            } else if (event.data.type === 'message') {
                this.sendAmyMessage(event.data.message);
            }
        };
    }
    
    async initializeAmy(wasmModule) {
        try {
            this.amyModule = wasmModule;
            
            // Create render buffer
            const bufferPtr = this.amyModule._malloc(this.bufferSize * 4); // 32-bit float
            this.renderBuffer = new Float32Array(
                this.amyModule.HEAPF32.buffer,
                bufferPtr,
                this.bufferSize
            );
            
            // Initialize AMY
            this.amyModule._amy_start_web();
            this.isInitialized = true;
            
            this.port.postMessage({ type: 'initialized' });
        } catch (error) {
            this.port.postMessage({ type: 'error', error: error.message });
        }
    }
    
    sendAmyMessage(message) {
        if (!this.isInitialized || !this.amyModule) return;
        
        try {
            const messagePtr = this.amyModule._malloc(message.length + 1);
            this.amyModule.stringToUTF8(message, messagePtr, message.length + 1);
            this.amyModule._amy_add_message(messagePtr);
            this.amyModule._free(messagePtr);
        } catch (error) {
            this.port.postMessage({ type: 'error', error: error.message });
        }
    }
    
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        
        if (!this.isInitialized || !this.amyModule || !output.length) {
            return true;
        }
        
        try {
            // Render AMY audio
            this.amyModule._amy_render(this.bufferSize, 0);
            
            // Copy rendered audio to output channels
            for (let channel = 0; channel < output.length; channel++) {
                const outputChannel = output[channel];
                
                // AMY renders mono, so copy to all channels
                for (let i = 0; i < outputChannel.length; i++) {
                    outputChannel[i] = this.renderBuffer[i];
                }
            }
        } catch (error) {
            console.error('AMY render error:', error);
        }
        
        return true;
    }
}

registerProcessor('amy-worklet-processor', AmyWorkletProcessor);