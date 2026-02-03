"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the types of cursor states available
export type CursorVariant = 'default' | 'button' | 'text' | 'card';

interface CursorContextType {
    cursorVariant: CursorVariant;
    setCursorVariant: (variant: CursorVariant) => void;
    textMessage: string | null;
    setTextMessage: (text: string | null) => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const CursorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cursorVariant, setCursorVariant] = useState<CursorVariant>('default');
    const [textMessage, setTextMessage] = useState<string | null>(null);

    return (
        <CursorContext.Provider value={{ cursorVariant, setCursorVariant, textMessage, setTextMessage }}>
            {children}
        </CursorContext.Provider>
    );
};

export const useCursor = () => {
    const context = useContext(CursorContext);
    if (!context) {
        throw new Error('useCursor must be used within a CursorProvider');
    }
    return context;
};

// A helper component to easily wrap elements that should trigger cursor changes
interface CursorTriggerProps {
    children: ReactNode;
    variant?: CursorVariant;
    text?: string;
    className?: string;
    onClick?: () => void;
}

export const CursorTrigger: React.FC<CursorTriggerProps> = ({
    children,
    variant = 'button',
    text,
    className = '',
    onClick
}) => {
    const { setCursorVariant, setTextMessage } = useCursor();

    const handleMouseEnter = () => {
        setCursorVariant(variant);
        if (text) setTextMessage(text);
    };

    const handleMouseLeave = () => {
        setCursorVariant('default');
        if (text) setTextMessage(null);
    };

    return (
        <div
            className={className}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
