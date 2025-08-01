export class UndoRedoManager {
    constructor(maxHistorySize = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = maxHistorySize;
        this.isApplying = false;
    }
    
    // Execute a command and add it to history
    execute(command) {
        if (this.isApplying) return;
        
        try {
            // Execute the command
            command.execute();
            
            // Remove any redo history after current index
            this.history = this.history.slice(0, this.currentIndex + 1);
            
            // Add new command to history
            this.history.push(command);
            this.currentIndex++;
            
            // Limit history size
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
                this.currentIndex--;
            }
            
            console.log(`Executed command: ${command.type}`);
            return true;
        } catch (error) {
            console.error('Failed to execute command:', error);
            return false;
        }
    }
    
    // Undo the last command
    undo() {
        if (!this.canUndo()) return false;
        
        try {
            this.isApplying = true;
            const command = this.history[this.currentIndex];
            command.undo();
            this.currentIndex--;
            
            console.log(`Undid command: ${command.type}`);
            return true;
        } catch (error) {
            console.error('Failed to undo command:', error);
            return false;
        } finally {
            this.isApplying = false;
        }
    }
    
    // Redo the next command
    redo() {
        if (!this.canRedo()) return false;
        
        try {
            this.isApplying = true;
            this.currentIndex++;
            const command = this.history[this.currentIndex];
            command.execute();
            
            console.log(`Redid command: ${command.type}`);
            return true;
        } catch (error) {
            console.error('Failed to redo command:', error);
            this.currentIndex--;
            return false;
        } finally {
            this.isApplying = false;
        }
    }
    
    // Check if undo is possible
    canUndo() {
        return this.currentIndex >= 0;
    }
    
    // Check if redo is possible
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }
    
    // Clear all history
    clear() {
        this.history = [];
        this.currentIndex = -1;
        console.log('Cleared undo/redo history');
    }
    
    // Get current state info
    getState() {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            historyLength: this.history.length,
            currentIndex: this.currentIndex
        };
    }
}

// Base command class
export class Command {
    constructor(type, description) {
        this.type = type;
        this.description = description;
        this.timestamp = Date.now();
    }
    
    execute() {
        throw new Error('Command execute() must be implemented');
    }
    
    undo() {
        throw new Error('Command undo() must be implemented');
    }
}

// Add node command
export class AddNodeCommand extends Command {
    constructor(graph, nodeType, position, nodeData = null) {
        super('add_node', `Add ${nodeType} node`);
        this.graph = graph;
        this.nodeType = nodeType;
        this.position = position;
        this.nodeData = nodeData;
        this.nodeId = null;
        this.node = null;
    }
    
    execute() {
        // Create new node
        this.node = LiteGraph.createNode(this.nodeType);
        if (this.node) {
            this.node.pos = [this.position.x, this.position.y];
            
            // Restore node data if provided (for redo)
            if (this.nodeData) {
                this.node.configure(this.nodeData);
            }
            
            this.graph.add(this.node);
            this.nodeId = this.node.id;
        }
    }
    
    undo() {
        if (this.node) {
            // Save node data for potential redo
            this.nodeData = this.node.serialize();
            this.graph.remove(this.node);
            this.node = null;
        }
    }
}

// Remove node command
export class RemoveNodeCommand extends Command {
    constructor(graph, node) {
        super('remove_node', `Remove ${node.type} node`);
        this.graph = graph;
        this.node = node;
        this.nodeData = null;
        this.connections = [];
    }
    
    execute() {
        // Save node data and connections
        this.nodeData = this.node.serialize();
        this.connections = this.saveConnections();
        
        // Remove the node
        this.graph.remove(this.node);
    }
    
    undo() {
        // Recreate the node
        const newNode = LiteGraph.createNode(this.node.type);
        if (newNode) {
            newNode.configure(this.nodeData);
            this.graph.add(newNode);
            this.node = newNode;
            
            // Restore connections
            this.restoreConnections();
        }
    }
    
    saveConnections() {
        const connections = [];
        
        // Save input connections
        if (this.node.inputs) {
            this.node.inputs.forEach((input, inputIndex) => {
                if (input.link != null) {
                    const link = this.graph.links[input.link];
                    if (link) {
                        connections.push({
                            type: 'input',
                            inputIndex: inputIndex,
                            sourceNodeId: link.origin_id,
                            sourceSlot: link.origin_slot
                        });
                    }
                }
            });
        }
        
        // Save output connections
        if (this.node.outputs) {
            this.node.outputs.forEach((output, outputIndex) => {
                if (output.links) {
                    output.links.forEach(linkId => {
                        const link = this.graph.links[linkId];
                        if (link) {
                            connections.push({
                                type: 'output',
                                outputIndex: outputIndex,
                                targetNodeId: link.target_id,
                                targetSlot: link.target_slot
                            });
                        }
                    });
                }
            });
        }
        
        return connections;
    }
    
    restoreConnections() {
        // Restore connections after a short delay to ensure all nodes are ready
        setTimeout(() => {
            this.connections.forEach(conn => {
                if (conn.type === 'output') {
                    const targetNode = this.graph.getNodeById(conn.targetNodeId);
                    if (targetNode) {
                        this.node.connect(conn.outputIndex, targetNode, conn.targetSlot);
                    }
                }
            });
        }, 10);
    }
}

// Move node command
export class MoveNodeCommand extends Command {
    constructor(node, oldPosition, newPosition) {
        super('move_node', `Move ${node.type} node`);
        this.node = node;
        this.oldPosition = { x: oldPosition[0], y: oldPosition[1] };
        this.newPosition = { x: newPosition[0], y: newPosition[1] };
    }
    
    execute() {
        this.node.pos = [this.newPosition.x, this.newPosition.y];
    }
    
    undo() {
        this.node.pos = [this.oldPosition.x, this.oldPosition.y];
    }
}

// Connect nodes command
export class ConnectNodesCommand extends Command {
    constructor(sourceNode, sourceSlot, targetNode, targetSlot) {
        super('connect_nodes', `Connect ${sourceNode.type} to ${targetNode.type}`);
        this.sourceNode = sourceNode;
        this.sourceSlot = sourceSlot;
        this.targetNode = targetNode;
        this.targetSlot = targetSlot;
        this.linkId = null;
    }
    
    execute() {
        this.linkId = this.sourceNode.connect(this.sourceSlot, this.targetNode, this.targetSlot);
    }
    
    undo() {
        if (this.linkId != null) {
            this.sourceNode.disconnectOutput(this.sourceSlot, this.targetNode);
        }
    }
}

// Compound command for multiple operations
export class CompoundCommand extends Command {
    constructor(commands, description) {
        super('compound', description);
        this.commands = commands;
    }
    
    execute() {
        this.commands.forEach(command => command.execute());
    }
    
    undo() {
        // Undo in reverse order
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }
}