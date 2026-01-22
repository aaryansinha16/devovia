"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { IconPlayerPlay } from "@tabler/icons-react";

export const StartNode = memo(({ selected }: NodeProps) => {
  return (
    <div
      className={`
        w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 
        flex items-center justify-center shadow-lg
        ${selected ? "ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900" : ""}
      `}
    >
      <IconPlayerPlay size={28} className="text-white ml-1" />

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-white !border-2 !border-green-500"
      />
    </div>
  );
});

StartNode.displayName = "StartNode";
