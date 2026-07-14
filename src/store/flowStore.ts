import {
  Connection,
  Edge,
  EdgeChange,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { create } from 'zustand';
import { NodeData, NodeType, RFState } from './types';
import { createDefaultHandles, getNodeOutput, getPythonArgs, toPythonFunctionName } from './nodeUtils';
import { updateDownstreamNodes, createNewNode, collectPythonRunOrder, buildExecutableCode, applyExpansion, reconcileImageNodes } from './nodeOperations';
import { initialNodes, initialEdges } from './initialData';
import { runPython } from '../runtime/pythonRuntime';

export type { NodeType } from './types';

export const useStore = create<RFState>((set, get) => {
  // Create the store
  const store = {
    nodes: initialNodes,
    edges: initialEdges,
    selectedNode: null,
    pendingExpand: null,
    preExpandLayout: {},

    onNodesChange: (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, get().nodes);
      const pending = get().pendingExpand;

      // while a node expands, rebuild the layout from the pre-expand snapshot so growth is
      // idempotent: the pivot's top-left stays put while its downstream slides right and the
      // nodes it now overlaps slide down.
      const resized = pending !== null && changes.some(c => c.type === 'dimensions' && c.id === pending.id);
      if (pending !== null && resized) {
        const snapshot = get().preExpandLayout[pending.id];
        const node = updated.find(n => n.id === pending.id);
        if (snapshot && node) {
          const dW = Math.max(0, (node.width ?? pending.baseWidth) - pending.baseWidth);
          const dH = Math.max(0, (node.height ?? pending.baseHeight) - pending.baseHeight);
          const reset = updated.map(n =>
            snapshot[n.id] ? { ...n, position: { x: snapshot[n.id].x, y: snapshot[n.id].y } } : n
          );
          set({ nodes: applyExpansion(reset, get().edges, pending.id, dW, dH) });
          return;
        }
      }
      set({ nodes: updated });
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
        nodes: reconcileImageNodes(updatedNodes, newEdges),
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

        const processedText = getNodeOutput(sourceNode);

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
          nodes: reconcileImageNodes(updatedNodes, newEdges),
        });
      }
    },

    updateNodeData: (nodeId: string, text: string) => {
      const nodes = get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, text } } : node
      );

      // an uploaded image (or a cleared one) flips the node between loader and receiver
      const updatedNodes = reconcileImageNodes(updateDownstreamNodes(nodes, get().edges, nodeId), get().edges);
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

    toggleCollapse: (nodeId: string) => {
      const node = get().nodes.find(n => n.id === nodeId);
      if (!node) return;

      const willCollapse = !node.data.isCollapsed;

      // flip the flag and close the side panels
      let nodes = get().nodes.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, isCollapsed: willCollapse, showInputs: false, showOutput: false } }
          : n
      );

      if (willCollapse) {
        // put every node back where it was before this node expanded
        const snapshot = get().preExpandLayout[nodeId];
        if (snapshot) {
          nodes = nodes.map(n =>
            snapshot[n.id] ? { ...n, position: { x: snapshot[n.id].x, y: snapshot[n.id].y } } : n
          );
          const rest = { ...get().preExpandLayout };
          delete rest[nodeId];
          set({ nodes, preExpandLayout: rest, pendingExpand: null });
          return;
        }
        set({ nodes });
        return;
      }

      // expanding: snapshot every position so collapse can restore it, remember the collapsed
      // size, and let the resize handler push neighbours once the new size is measured
      const snapshot: Record<string, { x: number; y: number }> = {};
      get().nodes.forEach(n => {
        snapshot[n.id] = { x: n.position.x, y: n.position.y };
      });
      set({
        nodes,
        preExpandLayout: { ...get().preExpandLayout, [nodeId]: snapshot },
        pendingExpand: { id: nodeId, baseWidth: node.width ?? 440, baseHeight: node.height ?? 120 },
      });
      setTimeout(() => {
        const pending = get().pendingExpand;
        if (pending && pending.id === nodeId) set({ pendingExpand: null });
      }, 500);
    },

    addNode: (type: NodeType) => {
      const lastNode = get().nodes[get().nodes.length - 1];
      const newNode = createNewNode(type, lastNode, get().updateNodeData);
      
      // Add the node first
      set(state => ({ nodes: [...state.nodes, newNode] }));
      
      // Then trigger an update to propagate data
      setTimeout(() => {
        const sourceNodes = get().nodes.filter(node => 
          get().edges.some(edge => edge.source === node.id && edge.target === newNode.id)
        );
        
        sourceNodes.forEach(sourceNode => {
          get().updateNodeData(sourceNode.id, sourceNode.data.text);
        });
      }, 0);
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

    runPythonNode: async (nodeId: string) => {
      const target = get().nodes.find(n => n.id === nodeId);
      if (!target || target.data.type !== 'python') return;

      // run this node's python ancestors first, then the node — never anything downstream
      const runOrder = collectPythonRunOrder(get().nodes, get().edges, nodeId);

      for (const id of runOrder) {
        const node = get().nodes.find(n => n.id === id);
        if (!node) continue;

        // flag the node as running
        set({
          nodes: get().nodes.map(n =>
            n.id === id ? { ...n, data: { ...n.data, isRunning: true, runError: undefined } } : n
          ),
        });

        // run the node's function (named after the node) with upstream inputs as arguments,
        // prepending ancestor definitions so upstream dataclasses are available here
        const functionName = toPythonFunctionName(node.data.title);
        const args = getPythonArgs(node.data);
        const code = buildExecutableCode(get().nodes, get().edges, id);
        const result = await runPython(code, functionName, args);

        // store the output and propagate the value so the next node sees fresh inputs
        const applied = get().nodes.map(n =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  isRunning: false,
                  computedOutput: result.output,
                  runError: result.ok ? undefined : result.error,
                },
              }
            : n
        );
        set({ nodes: updateDownstreamNodes(applied, get().edges, id) });
      }
    },
  };

  // Update the onChange handlers with the actual store reference
  const nodesWithHandlers = store.nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onChange: (text: string) => store.updateNodeData(node.id, text),
    },
  }));

  // Trigger initial data flow after setup: source and image nodes seed their downstream
  setTimeout(() => {
    const rootNodes = store.nodes.filter(
      node => node.data.type === 'source' || node.data.type === 'image'
    );
    rootNodes.forEach(node => {
      store.updateNodeData(node.id, node.data.text);
    });
  }, 0);

  // Return the store with the updated nodes
  return {
    ...store,
    nodes: nodesWithHandlers,
  };
});