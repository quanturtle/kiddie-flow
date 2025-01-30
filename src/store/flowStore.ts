import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { create } from 'zustand';
import { NodeData, NodeType, SourceInputType } from './types';
import { createDefaultHandles, processNodeText } from './nodeUtils';
import { updateDownstreamNodes, createNewNode } from './nodeOperations';

type RFState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNode: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (nodeId: string, text: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  updateNodeConfig: (nodeId: string, config: Partial<NodeData>) => void;
  addNode: (type: NodeType) => void;
  updateInputValue: (nodeId: string, inputId: string, value: string) => void;
  updateHandleLabel: (nodeId: string, handleId: string, newLabel: string, isInput: boolean) => void;
  updateSourceType: (nodeId: string, sourceType: SourceInputType) => void;
  updateSourceMedia: (nodeId: string, url: string) => void;
  removeLastInput: (nodeId: string) => void;
};

export const useStore = create<RFState>((set, get) => ({
  nodes: [
    {
      id: '1',
      type: 'flowNode',
      position: { x: 250, y: 100 },
      data: {
        title: 'First Node',
        description: 'A simple text transformation node',
        showDescription: true,
        text: 'Node 1',
        createdAt: new Date().toISOString(),
        onChange: (text: string) => get().updateNodeData('1', text),
        type: 'text',
        inputs: 1,
        outputs: 1,
        inputValues: {},
        inputHandles: createDefaultHandles(1, 'input'),
        outputHandles: createDefaultHandles(1, 'output'),
        showInputs: false,
        showOutput: false,
        isCollapsed: false,
      },
    },
  ],
  edges: [],
  selectedNode: null,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const oldEdges = get().edges;
    const newEdges = applyEdgeChanges(changes, oldEdges);
    
    const removedEdges = oldEdges.filter(oldEdge => 
      !newEdges.find(newEdge => newEdge.id === oldEdge.id)
    );

    const updatedNodes = get().nodes.map(node => {
      const nodeRemovedEdges = removedEdges.filter(edge => edge.target === node.id);
      if (nodeRemovedEdges.length > 0) {
        const newInputValues = { ...node.data.inputValues };
        nodeRemovedEdges.forEach(edge => {
          if (edge.targetHandle) {
            delete newInputValues[edge.targetHandle];
          }
        });

        return {
          ...node,
          data: {
            ...node.data,
            inputValues: newInputValues,
            text: node.data.type === 'result' || node.data.type === 'preview'
              ? Object.values(newInputValues).join('\n\n')
              : node.data.text,
          },
        };
      }
      return node;
    });

    set({
      edges: newEdges,
      nodes: updatedNodes,
    });
  },

  onConnect: (connection: Connection) => {
    const sourceNode = get().nodes.find(node => node.id === connection.source);
    const targetNode = get().nodes.find(node => node.id === connection.target);
    
    if (sourceNode && targetNode && connection.targetHandle) {
      const existingConnection = get().edges.find(edge => 
        edge.target === connection.target && 
        edge.targetHandle === connection.targetHandle
      );

      if (existingConnection) return;

      const processedText = processNodeText(
        sourceNode.data.text,
        sourceNode.data.inputValues,
        sourceNode.data.inputHandles
      );

      const newEdges = addEdge(connection, get().edges);
      const updatedNodes = updateDownstreamNodes(
        get().nodes.map(node => {
          if (node.id === targetNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                inputValues: {
                  ...node.data.inputValues,
                  [connection.targetHandle]: processedText,
                },
                text: node.data.type === 'result' || node.data.type === 'preview'
                  ? Object.values(node.data.inputValues).join('\n\n')
                  : node.data.text,
              },
            };
          }
          return node;
        }),
        newEdges,
        sourceNode.id
      );

      set({
        edges: newEdges,
        nodes: updatedNodes,
      });
    }
  },

  updateNodeData: (nodeId: string, text: string) => {
    const nodes = get().nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, text } } : node
    );

    const updatedNodes = updateDownstreamNodes(nodes, get().edges, nodeId);
    set({ nodes: updatedNodes });
  },

  setSelectedNode: (nodeId: string | null) => {
    set({ selectedNode: nodeId });
  },

  updateNodeConfig: (nodeId: string, config: Partial<NodeData>) => {
    const currentNode = get().nodes.find(node => node.id === nodeId);
    if (!currentNode) return;

    if (currentNode.data.type === 'source' && config.inputs !== undefined) return;

    if (config.inputs !== undefined && config.inputs !== currentNode.data.inputs) {
      const newInputHandles = createDefaultHandles(config.inputs, 'input');
      const oldInputValues = { ...currentNode.data.inputValues };
      const newInputValues: Record<string, string> = {};

      newInputHandles.forEach((handle, index) => {
        const oldHandle = currentNode.data.inputHandles[index];
        if (oldHandle && oldInputValues[oldHandle.id]) {
          newInputValues[handle.id] = oldInputValues[oldHandle.id];
        }
      });

      const updatedEdges = get().edges
        .map(edge => {
          if (edge.target === nodeId) {
            const oldHandleIndex = currentNode.data.inputHandles.findIndex(h => h.id === edge.targetHandle);
            if (oldHandleIndex !== -1 && oldHandleIndex < newInputHandles.length) {
              return {
                ...edge,
                targetHandle: newInputHandles[oldHandleIndex].id,
              };
            }
            return null;
          }
          return edge;
        })
        .filter(Boolean) as Edge[];

      const nodes = get().nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...config,
              inputHandles: newInputHandles,
              inputValues: newInputValues,
              text: node.data.type === 'result' || node.data.type === 'preview'
                ? Object.values(newInputValues).join('\n\n')
                : node.data.text,
            },
          };
        }
        return node;
      });

      const updatedNodes = updateDownstreamNodes(nodes, updatedEdges, nodeId);

      set({
        edges: updatedEdges,
        nodes: updatedNodes,
      });
    } else {
      set({
        nodes: get().nodes.map(node => {
          if (node.id === nodeId) {
            const newNode = { ...node, data: { ...node.data, ...config } };
            if (config.outputs !== undefined && config.outputs !== node.data.outputs) {
              newNode.data.outputHandles = createDefaultHandles(config.outputs, 'output');
            }
            return newNode;
          }
          return node;
        }),
      });
    }
  },

  addNode: (type: NodeType) => {
    const lastNode = get().nodes[get().nodes.length - 1];
    const newNode = createNewNode(type, lastNode, get().updateNodeData);
    set({ nodes: [...get().nodes, newNode] });
  },

  updateInputValue: (nodeId: string, inputId: string, value: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const newInputValues = {
          ...node.data.inputValues,
          [inputId]: value,
        };

        return {
          ...node,
          data: {
            ...node.data,
            inputValues: newInputValues,
            text: node.data.type === 'result' || node.data.type === 'preview'
              ? Object.values(newInputValues).join('\n\n')
              : node.data.text,
          },
        };
      }
      return node;
    });

    const updatedNodes = updateDownstreamNodes(nodes, get().edges, nodeId);
    set({ nodes: updatedNodes });
  },

  updateHandleLabel: (nodeId: string, handleId: string, newLabel: string, isInput: boolean) => {
    const updatedNodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const handleType = isInput ? 'inputHandles' : 'outputHandles';
        const handles = node.data[handleType].map(handle =>
          handle.id === handleId ? { ...handle, label: newLabel } : handle
        );
        
        return {
          ...node,
          data: {
            ...node.data,
            [handleType]: handles,
          },
        };
      }
      return node;
    });

    if (!isInput) {
      const edges = get().edges.filter(edge => 
        edge.source === nodeId && edge.sourceHandle === handleId
      );

      edges.forEach(edge => {
        const targetNode = updatedNodes.find(n => n.id === edge.target);
        if (targetNode && edge.targetHandle) {
          const targetHandleIndex = targetNode.data.inputHandles.findIndex(
            h => h.id === edge.targetHandle
          );
          if (targetHandleIndex !== -1) {
            const targetNodeIndex = updatedNodes.findIndex(n => n.id === edge.target);
            if (targetNodeIndex !== -1) {
              const newInputHandles = [...targetNode.data.inputHandles];
              newInputHandles[targetHandleIndex] = {
                ...newInputHandles[targetHandleIndex],
                label: newLabel,
              };
              updatedNodes[targetNodeIndex] = {
                ...targetNode,
                data: {
                  ...targetNode.data,
                  inputHandles: newInputHandles,
                },
              };
            }
          }
        }
      });
    }

    const finalNodes = updateDownstreamNodes(updatedNodes, get().edges, nodeId);
    set({ nodes: finalNodes });
  },

  updateSourceType: (nodeId: string, sourceType: SourceInputType) => {
    const nodes = get().nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            sourceType,
            text: '',
            imageUrl: undefined,
            audioUrl: undefined,
          },
        };
      }
      return node;
    });

    const updatedNodes = updateDownstreamNodes(nodes, get().edges, nodeId);
    set({ nodes: updatedNodes });
  },

  updateSourceMedia: (nodeId: string, url: string) => {
    const nodes = get().nodes.map(node => {
      if (node.id === nodeId) {
        const mediaType = node.data.sourceType;
        return {
          ...node,
          data: {
            ...node.data,
            ...(mediaType === 'image' ? { imageUrl: url } : { audioUrl: url }),
            text: url,
          },
        };
      }
      return node;
    });

    const updatedNodes = updateDownstreamNodes(nodes, get().edges, nodeId);
    set({ nodes: updatedNodes });
  },

  removeLastInput: (nodeId: string) => {
    const currentNode = get().nodes.find(node => node.id === nodeId);
    if (!currentNode || currentNode.data.inputs <= 1) return;

    const newInputCount = currentNode.data.inputs - 1;
    const newInputHandles = createDefaultHandles(newInputCount, 'input');
    
    const lastHandleId = currentNode.data.inputHandles[currentNode.data.inputHandles.length - 1].id;
    const updatedEdges = get().edges.filter(edge => 
      !(edge.target === nodeId && edge.targetHandle === lastHandleId)
    );

    const newInputValues: Record<string, string> = {};
    Object.entries(currentNode.data.inputValues).forEach(([key, value]) => {
      if (newInputHandles.some(h => h.id === key)) {
        newInputValues[key] = value;
      }
    });

    const nodes = get().nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            inputs: newInputCount,
            inputHandles: newInputHandles,
            inputValues: newInputValues,
            text: node.data.type === 'result' || node.data.type === 'preview'
              ? Object.values(newInputValues).join('\n\n')
              : node.data.text,
          },
        };
      }
      return node;
    });

    const updatedNodes = updateDownstreamNodes(nodes, updatedEdges, nodeId);

    set({
      edges: updatedEdges,
      nodes: updatedNodes,
    });
  },
}));