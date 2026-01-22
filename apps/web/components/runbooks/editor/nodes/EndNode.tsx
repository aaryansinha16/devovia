"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { IconSquare } from "@tabler/icons-react";

export const EndNode = memo(({ selected }: NodeProps) => {
  return (
    <div
      className={`
        w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-rose-600 
        flex items-center justify-center shadow-lg
        ${selected ? "ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900" : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-white !border-2 !border-red-500"
      />

      <IconSquare size={24} className="text-white" />
    </div>
  );
});

EndNode.displayName = "EndNode";
