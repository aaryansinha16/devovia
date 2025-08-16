// Adapted from shadcn/ui toast primitive
import * as React from "react";
import { useEffect, useState } from "react";

export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  type?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
};

// Define toast options for API
export type ToastActionElement = React.ReactElement;

export type ToastOptions = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  type?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
};

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

export type ToasterToast = ToastProps & {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  type?: "default" | "success" | "error" | "warning" | "info";
  open?: boolean;
};

// Create a unique id for each toast
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// Toast state management
type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
      id: string;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      id: string;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      id: string;
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      id: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.id ? { ...t, ...action.toast } : t,
        ),
      };

    case "DISMISS_TOAST": {
      const { id } = action;

      // First dismiss the toast
      if (id) {
        addToRemoveQueue(id);
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === id || id === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }

    case "REMOVE_TOAST":
      if (action.id === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
  }
};

const listeners: Array<(_state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

export function useToast() {
  const [state, setState] = useState<State>({ toasts: [] });

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast: (props: ToastOptions) => {
      const id = genId();

      const update = (props: ToastOptions) =>
        dispatch({
          type: "UPDATE_TOAST",
          id,
          toast: { ...props },
        });

      const dismiss = () =>
        dispatch({
          type: "DISMISS_TOAST",
          id,
        });

      dispatch({
        type: "ADD_TOAST",
        toast: {
          ...props,
          id,
          duration: props.duration || 5000,
          open: true,
        },
      });

      return {
        id,
        dismiss,
        update,
      };
    },
    dismiss: (id: string) =>
      dispatch({
        type: "DISMISS_TOAST",
        id,
      }),
  };
}
