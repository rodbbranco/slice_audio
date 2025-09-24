"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioUploaderProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export function AudioUploader({ onFileSelect, selectedFile }: AudioUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'audio/aac', 'audio/flac', 'audio/m4a'
    ];
    
    if (!allowedTypes.some(type => file.type === type || file.name.toLowerCase().includes(type.split('/')[1]))) {
      return 'Please select a valid audio file (MP3, WAV, OGG, AAC, FLAC, M4A)';
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return 'File size must be less than 500MB';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    onFileSelect(null);
    setError(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Upload Audio File
        </h2>
        <p className="text-muted-foreground">
          Select an audio file to split into segments
        </p>
      </div>

      {!selectedFile ? (
        <div>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.aac,.flac,.ogg"
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Drag and drop area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver
                ? "border-emerald-400 bg-primary/5"
                : "border-border hover:border-emerald-400"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                isDragOver ? "bg-emerald-400 text-primary-foreground" : "bg-white"
              )}>
                <Upload className={cn(
                    isDragOver ? "text-white" : "text-emerald-400",
                )}
                />
              </div>

              <div>
                <p className="text-lg font-medium text-foreground mb-2">
                  {isDragOver ? "Drop your audio file here" : "Drag and drop your audio file here"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports MP3, WAV, OGG, AAC, FLAC, M4A (max 500MB)
                </p>

                {/* Mobile-friendly button */}
                <button
                  onClick={handleClick}
                  className="px-6 py-3 bg-emerald-400 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                >
                  Choose File
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className="w-12 h-12 bg-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-background truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            
            <button
              onClick={removeFile}
              className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer flex-shrink-0"
              title="Remove file"
            >
              <X className="w-5 h-5 text-muted-foreground hover:text-background" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}