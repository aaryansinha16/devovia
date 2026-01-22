"use client";

import React, { useCallback, useState, useMemo, useEffect, DragEvent } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  MarkerType,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { IconMaximize, IconMinimize } from "@tabler/icons-react";

import { StepNode } from "./nodes/StepNode";
import { StartNode } from "./nodes/StartNode";
import { EndNode } from "./nodes/EndNode";
import { StepPalette } from "./StepPalette";
import { StepConfigPanel } from "./StepConfigPanel";
import type { RunbookStep } from "../../../lib/services/runbooks-service";

const nodeTypes = {
  stepNode: StepNode,
  startNode: StartNode,
  endNode: EndNode,
};

interface RunbookFlowEditorProps {
  initialSteps?: RunbookStep[];
  // eslint-disable-next-line no-unused-vars
  onChange?: (steps: RunbookStep[]) => void;
  readOnly?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function RunbookFlowEditor({
  initialSteps = [],
  onChange,
  readOnly = false,
  isFullscreen = false,
  onToggleFullscreen,
}: RunbookFlowEditorProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [steps, setSteps] = useState<RunbookStep[]>(initialSteps);

  // Sync internal steps state when initialSteps prop changes (for editor switching)
  useEffect(() => {
    setSteps(initialSteps);
  }, [initialSteps]);

  // Convert steps to nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [
      {
        id: "start",
        type: "startNode",
        position: { x: 250, y: 0 },
        data: { label: "Start" },
        draggable: !readOnly,
      },
    ];

    const edges: Edge[] = [];
    let yPos = 100;

    steps.forEach((step, index) => {
      const nodeId = step.id || `step-${index}`;
      nodes.push({
        id: nodeId,
        type: "stepNode",
        position: { x: 200, y: yPos },
        data: { step, index },
        draggable: !readOnly,
      });

      // Connect to previous node
      const prevNodeId = index === 0 ? "start" : steps[index - 1]?.id || `step-${index - 1}`;
      edges.push({
        id: `e-${prevNodeId}-${nodeId}`,
        source: prevNodeId,
        target: nodeId,
        type: "smoothstep",
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#64748b", strokeWidth: 2 },
      });

      yPos += 120;
    });

    // Add end node
    nodes.push({
      id: "end",
      type: "endNode",
      position: { x: 250, y: yPos },
      data: { label: "End" },
      draggable: !readOnly,
    });

    // Connect last step to end
    const lastNodeId = steps.length > 0 ? steps[steps.length - 1]?.id || `step-${steps.length - 1}` : "start";
    edges.push({
      id: `e-${lastNodeId}-end`,
      source: lastNodeId,
      target: "end",
      type: "default",
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#64748b", strokeWidth: 2 },
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [steps, readOnly]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "default",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#64748b", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges, readOnly]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === "stepNode") {
      setSelectedNode(node);
    } else {
      setSelectedNode(null);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      // Get the position where the item was dropped
      const reactFlowBounds = (event.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      const newStep: RunbookStep = {
        id: `step-${Date.now()}`,
        name: `${type} Step`,
        type: type as RunbookStep["type"],
        config: getDefaultConfig(type),
        retryConfig: { maxAttempts: 0, delayMs: 0 },
      };

      const newSteps = [...steps, newStep];
      setSteps(newSteps);
      onChange?.(newSteps);

      // Add the node at the dropped position
      const newNode: Node = {
        id: newStep.id,
        type: "stepNode",
        position,
        data: { step: newStep, index: steps.length },
        draggable: !readOnly,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [steps, setSteps, setNodes, onChange, readOnly]
  );

  const addStep = useCallback(
    (type: string) => {
      const newStep: RunbookStep = {
        id: `step-${Date.now()}`,
        name: `${type} Step`,
        type: type as RunbookStep["type"],
        config: getDefaultConfig(type),
        onFailure: "STOP",
      };

      const newSteps = [...steps, newStep];
      setSteps(newSteps);
      onChange?.(newSteps);

      // Add new node
      const yPos = 100 + steps.length * 120;
      const newNode: Node = {
        id: newStep.id,
        type: "stepNode",
        position: { x: 200, y: yPos },
        data: { step: newStep, index: steps.length },
        draggable: !readOnly,
      };

      setNodes((nds) => {
        // Remove end node, add new step, re-add end node
        const withoutEnd = nds.filter((n) => n.id !== "end");
        const endNode = nds.find((n) => n.id === "end");
        if (endNode) {
          endNode.position.y = yPos + 120;
        }
        return [...withoutEnd, newNode, endNode!];
      });

      // Update edges
      setEdges((eds) => {
        const withoutEndEdge = eds.filter((e) => e.target !== "end");
        const prevNodeId = steps.length > 0 ? steps[steps.length - 1]?.id : "start";

        return [
          ...withoutEndEdge,
          {
            id: `e-${prevNodeId}-${newStep.id}`,
            source: prevNodeId!,
            target: newStep.id,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#64748b", strokeWidth: 2 },
          },
          {
            id: `e-${newStep.id}-end`,
            source: newStep.id,
            target: "end",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#64748b", strokeWidth: 2 },
          },
        ];
      });
    },
    [steps, setNodes, setEdges, onChange, readOnly]
  );

  const updateStep = useCallback(
    (stepId: string, updates: Partial<RunbookStep>) => {
      const newSteps = steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s));
      setSteps(newSteps);
      onChange?.(newSteps);

      // Update node data
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === stepId) {
            return {
              ...n,
              data: { ...n.data, step: { ...n.data.step, ...updates } },
            };
          }
          return n;
        })
      );
    },
    [steps, setNodes, onChange]
  );

  const deleteStep = useCallback(
    (stepId: string) => {
      const stepIndex = steps.findIndex((s) => s.id === stepId);
      if (stepIndex === -1) return;

      const newSteps = steps.filter((s) => s.id !== stepId);
      setSteps(newSteps);
      onChange?.(newSteps);
      setSelectedNode(null);

      // Remove node and reconnect edges
      setNodes((nds) => nds.filter((n) => n.id !== stepId));
      setEdges((eds) => {
        const incomingEdge = eds.find((e) => e.target === stepId);
        const outgoingEdge = eds.find((e) => e.source === stepId);

        const filteredEdges = eds.filter((e) => e.source !== stepId && e.target !== stepId);

        if (incomingEdge && outgoingEdge) {
          filteredEdges.push({
            id: `e-${incomingEdge.source}-${outgoingEdge.target}`,
            source: incomingEdge.source,
            target: outgoingEdge.target,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#64748b", strokeWidth: 2 },
          });
        }

        return filteredEdges;
      });
    },
    [steps, setNodes, setEdges, onChange]
  );

  return (
    <ReactFlowProvider>
      <div className={`flex bg-slate-50 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-700 ${isFullscreen ? 'h-screen w-screen rounded-none' : 'h-[600px] rounded-2xl'}`}>
      {/* Step Palette */}
      {!readOnly && (
        <StepPalette onAddStep={addStep} />
      )}

      {/* Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          edgesFocusable={!readOnly}
          edgesUpdatable={!readOnly}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          panOnScroll={false}
          fitView
          defaultViewport={{ x: 0, y: 0, zoom: 0.35 }}
          minZoom={0.1}
          maxZoom={2}
          snapToGrid
          snapGrid={[20, 20]}
          deleteKeyCode="Delete"
          className="bg-slate-50 dark:bg-slate-900"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#94a3b8" />
          <Controls className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          <MiniMap
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            nodeColor={(node) => {
              if (node.type === "startNode") return "#22c55e";
              if (node.type === "endNode") return "#ef4444";
              return "#0ea5e9";
            }}
          />
          <Panel position="top-right" className="flex items-center gap-2">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
              {steps.length} step{steps.length !== 1 ? "s" : ""}
            </div>
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
              </button>
            )}
          </Panel>
        </ReactFlow>
      </div>

      {/* Config Panel */}
      {selectedNode && selectedNode.data?.step && (
        <StepConfigPanel
          step={selectedNode.data.step}
          onUpdate={(updates) => updateStep(selectedNode.id, updates)}
          onDelete={() => deleteStep(selectedNode.id)}
          onClose={() => setSelectedNode(null)}
        />
      )}
      </div>
    </ReactFlowProvider>
  );
}

function getDefaultConfig(type: string): object {
  switch (type) {
    case "HTTP":
      return { method: "GET", url: "", headers: {}, body: null, expectedStatusCodes: [200] };
    case "SQL":
      return { query: "", connectionString: "" };
    case "WAIT":
      return { duration: 5 };
    case "MANUAL":
      return { approvers: [], instructions: "" };
    case "CONDITIONAL":
      return { condition: "", onTrue: [], onFalse: [] };
    case "AI":
      return { prompt: "", model: "gpt-4" };
    case "PARALLEL":
      return { steps: [], maxConcurrency: 5 };
    default:
      return {};
  }
}
