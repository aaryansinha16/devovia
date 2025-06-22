"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Wait for component to mount to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = () => {
    router.push('/auth/login');
    onClose();
  };

  const handleSignup = () => {
    router.push('/auth/register');
    onClose();
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Please log in or sign up to continue with this action.
        </p>
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={handleLogin}
            className="w-full"
            variant="primary"
          >
            Log In
          </Button>
          <Button 
            onClick={handleSignup}
            className="w-full"
            variant="outlineAlt"
          >
            Sign Up
          </Button>
          <Button 
            onClick={onClose}
            className="w-full"
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
