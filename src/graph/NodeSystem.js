/**
 * Core node graph system for AmyNode
 * Based on Daiku's architecture but tailored for AMY synthesis
 */

// Signal types for AMY audio synthesis
export const SignalTypes = {
    AUDIO: {
        name: 'Audio',
        color: '#4CAF50',
        defaultValue: 0.0,
        validator: (value) => typeof value === 'number' && value >= -1.0 && value <= 1.0
    },
    CONTROL: {
        name: 'Control',
        color: '#2196F3',
        defaultValue: 0.0,
        validator: (value) => typeof value === 'number'
    },
    FREQUENCY: {
        name: 'Frequency',
        color: '#9C27B0',
        defaultValue: 440.0,
        validator: (value) => typeof value === 'number' && value >= 0
    },
    GATE: {
        name: 'Gate',
        color: '#FF9800',
        defaultValue: false,
        validator: (value) => typeof value === 'boolean'
    },
    TRIGGER: {
        name: 'Trigger',
        color: '#F44336',
        defaultValue: false,
        validator: (value) => typeof value === 'boolean'
    }
};

// Type compatibility matrix
const TYPE_COMPATIBILITY = {
    AUDIO: ['AUDIO', 'CONTROL'],
    CONTROL: ['AUDIO', 'CONTROL', 'FREQUENCY'],
    FREQUENCY: ['CONTROL', 'FREQUENCY'],
    GATE: ['GATE', 'TRIGGER'],
    TRIGGER: ['GATE', 'TRIGGER']
};

export class NodePort {
    constructor(id, name, type, isInput, defaultValue = null, min = null, max = null, step = null) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.isInput = isInput;
        this.defaultValue = defaultValue !== null ? defaultValue : SignalTypes[type].defaultValue;
        this.value = this.defaultValue;
        this.min = min;
        this.max = max;
        this.step = step;
        this.connections = [];
        this.node = null; // Set by parent node
    }
    
    canConnectTo(otherPort) {
        // Can't connect to same type (input to input, output to output)
        if (this.isInput === otherPort.isInput) return false;
        
        // Can't connect to same node
        if (this.node === otherPort.node) return false;
        
        // Check type compatibility
        const sourceType = this.isInput ? otherPort.type : this.type;
        const targetType = this.isInput ? this.type : otherPort.type;
        
        return TYPE_COMPATIBILITY[sourceType]?.includes(targetType) || false;
    }
    
    connect(otherPort) {
        if (!this.canConnectTo(otherPort)) {
            throw new Error(`Cannot connect ${this.type} to ${otherPort.type}`);
        }
        
        // Remove existing connections for input ports (single connection)
        if (this.isInput && this.connections.length > 0) {
            this.disconnect(this.connections[0]);
        }
        if (otherPort.isInput && otherPort.connections.length > 0) {
            otherPort.disconnect(otherPort.connections[0]);
        }
        
        // Create bidirectional connection
        this.connections.push(otherPort);
        otherPort.connections.push(this);
        
        return true;
    }
    
    disconnect(otherPort) {
        const index = this.connections.indexOf(otherPort);
        if (index !== -1) {
            this.connections.splice(index, 1);
            
            const otherIndex = otherPort.connections.indexOf(this);
            if (otherIndex !== -1) {
                otherPort.connections.splice(otherIndex, 1);
            }
        }
    }
    
    disconnectAll() {
        while (this.connections.length > 0) {
            this.disconnect(this.connections[0]);
        }
    }
    
    getValue() {
        if (this.isInput && this.connections.length > 0) {
            return this.connections[0].getValue();
        }
        return this.value;
    }
    
    setValue(value) {
        if (SignalTypes[this.type].validator(value)) {
            this.value = value;
        }
    }
    
    serialize() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            isInput: this.isInput,
            defaultValue: this.defaultValue,
            value: this.value,
            min: this.min,
            max: this.max,
            step: this.step
        };
    }
}

export class AmyNode {
    constructor(type, id = null) {
        this.type = type;
        this.id = id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.title = type;
        this.position = { x: 0, y: 0 };
        this.size = { width: 180, height: 100 };
        this.inputs = [];
        this.outputs = [];
        this.parameters = {};
        this.selected = false;
        this.graph = null; // Set by parent graph
    }
    
    addInput(name, type, defaultValue = null, min = null, max = null, step = null) {
        const port = new NodePort(`in_${this.inputs.length}`, name, type, true, defaultValue, min, max, step);
        port.node = this;
        this.inputs.push(port);
        return port;
    }
    
    addOutput(name, type, defaultValue = null) {
        const port = new NodePort(`out_${this.outputs.length}`, name, type, false, defaultValue);
        port.node = this;
        this.outputs.push(port);
        return port;
    }
    
    addParameter(name, defaultValue, min = null, max = null, step = null, type = 'number', options = null) {
        this.parameters[name] = {
            value: defaultValue,
            defaultValue,
            min,
            max,
            step,
            type,
            options,
            label: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')
        };
    }
    
    getParameter(name) {
        return this.parameters[name]?.value ?? null;
    }
    
    setParameter(name, value) {
        if (this.parameters[name]) {
            this.parameters[name].value = value;
            this.onParameterChanged?.(name, value);
        }
    }
    
    onParameterChanged(name, value) {
        // Override in subclasses
    }
    
    process() {
        // Override in subclasses to implement node-specific processing
    }
    
    generateCode() {
        // Override in subclasses to generate AMY code
        return '';
    }
    
    serialize() {
        return {
            id: this.id,
            type: this.type,
            title: this.title,
            position: { ...this.position },
            parameters: Object.entries(this.parameters).reduce((acc, [key, param]) => {
                acc[key] = param.value;
                return acc;
            }, {}),
            inputs: this.inputs.map(port => port.serialize()),
            outputs: this.outputs.map(port => port.serialize())
        };
    }
    
    deserialize(data) {
        this.id = data.id;
        this.title = data.title || this.type;
        this.position = { ...data.position };
        
        // Restore parameters
        Object.entries(data.parameters || {}).forEach(([key, value]) => {
            if (this.parameters[key]) {
                this.parameters[key].value = value;
            }
        });
    }
}

export class Connection {
    constructor(outputPort, inputPort) {
        this.id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.outputPort = outputPort;
        this.inputPort = inputPort;
        this.outputNode = outputPort.node;
        this.inputNode = inputPort.node;
    }
    
    serialize() {
        return {
            id: this.id,
            outputNodeId: this.outputNode.id,
            outputPortId: this.outputPort.id,
            inputNodeId: this.inputNode.id,
            inputPortId: this.inputPort.id
        };
    }
}

export class NodeGraph {
    constructor() {
        this.nodes = new Map();
        this.connections = [];
        this.listeners = new Map();
    }
    
    addNode(node, position = null) {
        if (position) {
            node.position = { ...position };
        }
        
        node.graph = this;
        this.nodes.set(node.id, node);
        
        this.emit('nodeAdded', { node });
        return node;
    }
    
    removeNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return false;
        
        // Disconnect all ports
        [...node.inputs, ...node.outputs].forEach(port => port.disconnectAll());
        
        // Remove connections
        this.connections = this.connections.filter(conn => 
            conn.outputNode.id !== nodeId && conn.inputNode.id !== nodeId
        );
        
        this.nodes.delete(nodeId);
        this.emit('nodeRemoved', { node });
        
        return true;
    }
    
    connectNodes(outputNodeId, outputPortId, inputNodeId, inputPortId) {
        const outputNode = this.nodes.get(outputNodeId);
        const inputNode = this.nodes.get(inputNodeId);
        
        if (!outputNode || !inputNode) {
            throw new Error('Invalid node IDs');
        }
        
        const outputPort = outputNode.outputs.find(p => p.id === outputPortId);
        const inputPort = inputNode.inputs.find(p => p.id === inputPortId);
        
        if (!outputPort || !inputPort) {
            throw new Error('Invalid port IDs');
        }
        
        outputPort.connect(inputPort);
        
        const connection = new Connection(outputPort, inputPort);
        this.connections.push(connection);
        
        this.emit('connectionAdded', { connection });
        return connection;
    }
    
    removeConnection(connectionId) {
        const index = this.connections.findIndex(c => c.id === connectionId);
        if (index === -1) return false;
        
        const connection = this.connections[index];
        connection.outputPort.disconnect(connection.inputPort);
        
        this.connections.splice(index, 1);
        this.emit('connectionRemoved', { connection });
        
        return true;
    }
    
    getProcessingOrder() {
        // Topological sort for correct processing order
        const visited = new Set();
        const stack = [];
        
        const visit = (node) => {
            if (visited.has(node.id)) return;
            visited.add(node.id);
            
            // Visit all nodes that output to this node
            node.inputs.forEach(input => {
                input.connections.forEach(output => {
                    if (output.node) {
                        visit(output.node);
                    }
                });
            });
            
            stack.push(node);
        };
        
        // Start with output nodes (no outputs)
        this.nodes.forEach(node => {
            if (node.outputs.length === 0) {
                visit(node);
            }
        });
        
        // Visit remaining nodes
        this.nodes.forEach(node => {
            visit(node);
        });
        
        return stack;
    }
    
    process() {
        const order = this.getProcessingOrder();
        order.forEach(node => node.process());
    }
    
    clear() {
        this.connections = [];
        this.nodes.clear();
        this.emit('graphCleared');
    }
    
    getNodes() {
        return Array.from(this.nodes.values());
    }
    
    serialize() {
        return {
            nodes: Array.from(this.nodes.values()).map(node => node.serialize()),
            connections: this.connections.map(conn => conn.serialize())
        };
    }
    
    deserialize(data) {
        this.clear();
        
        // Create nodes first
        const nodeMap = new Map();
        data.nodes.forEach(nodeData => {
            // This would need a factory to create the correct node type
            // For now, we'll assume the node type is stored
            const node = this.createNodeFromType(nodeData.type);
            if (node) {
                node.deserialize(nodeData);
                this.addNode(node);
                nodeMap.set(nodeData.id, node);
            }
        });
        
        // Then create connections
        data.connections.forEach(connData => {
            try {
                this.connectNodes(
                    connData.outputNodeId,
                    connData.outputPortId,
                    connData.inputNodeId,
                    connData.inputPortId
                );
            } catch (error) {
                console.warn('Failed to restore connection:', error);
            }
        });
    }
    
    createNodeFromType(type) {
        // This should be implemented by the application
        // to create the appropriate node subclass
        throw new Error('createNodeFromType must be implemented');
    }
    
    // Event system
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }
}