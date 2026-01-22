"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import { Button } from "@repo/ui";
import { updateUserAvatar } from "../lib/profile-api";

interface AvatarUploadProps {
  currentAvatar: string | null;
  username: string;
   
  onAvatarUpdate: (url: string) => void;
}

export default function AvatarUpload({
  currentAvatar,
  username,
  onAvatarUpdate,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default avatar if none is provided
  const avatarUrl =
    currentAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, or GIF)");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }

    // Save the selected file
    setSelectedFile(file);

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Upload the avatar
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image to upload");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const response = await updateUserAvatar({
        file: selectedFile,
      });

      // Update the avatar URL in the parent component
      if (response.user.avatar) {
        onAvatarUpdate(response.user.avatar);
      }

      // Clear the file input and preview
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  // Cancel the upload
  const handleCancel = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Avatar display */}
      <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden border-4 border-background">
        <Image
          src={previewUrl || avatarUrl}
          alt={`${username}'s avatar`}
          fill
          className="object-cover"
          sizes="128px"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="w-full mb-4 p-3 text-sm bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      {/* Upload controls */}
      <div className="w-full">
        {!previewUrl ? (
          <div className="flex flex-col">
            <input
              type="file"
              id="avatar"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/gif"
              className="sr-only"
            />
            <label
              htmlFor="avatar"
              className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-primary/50 rounded-md cursor-pointer hover:bg-primary/5 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Choose Avatar Image
            </label>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Avatar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
