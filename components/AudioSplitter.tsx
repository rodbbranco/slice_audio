"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Download, Scissors, Clock, Loader2, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import JSZip from "jszip";
import {Button} from "@/components/ui/button";

interface AudioSplitterProps {
  audioFile: File;
  splitDuration: number;
  onDurationChange: (duration: number) => void;
}

interface SplitSegment {
  name: string;
  url: string;
  size: number;
  duration: number;
}

export function AudioSplitter({ audioFile, splitDuration, onDurationChange }: AudioSplitterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [segments, setSegments] = useState<SplitSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef<FFmpeg>();

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= 120) {
      onDurationChange(value);
    }
  };

  const loadFFmpeg = async () => {
    if (ffmpegLoaded || ffmpegRef.current) return;
    
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });
      
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setFfmpegLoaded(true);
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
      setError('Failed to load FFmpeg. Please refresh and try again.');
    }
  };

  // Initialize FFmpeg on component mount
  useEffect(() => {
    loadFFmpeg();
  }, []);

  const splitAudio = async () => {
    if (!ffmpegRef.current) {
      setError('FFmpeg not loaded. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setSegments([]);

    try {
      const ffmpeg = ffmpegRef.current;
      
      // Load FFmpeg if not already loaded
      if (!ffmpegLoaded) {
        setProgress(5);
        await loadFFmpeg();
        setProgress(10);
      }

      // Convert file to buffer and write to FFmpeg filesystem
      const fileBuffer = await audioFile.arrayBuffer();
      const inputFileName = `input.${audioFile.name.split('.').pop()}`;
      const outputPattern = 'output_%03d.mp3';
      
      await ffmpeg.writeFile(inputFileName, new Uint8Array(fileBuffer));
      setProgress(20);

      // Split audio using FFmpeg
      const segmentTime = splitDuration * 60; // Convert minutes to seconds
      
      await ffmpeg.exec([
        '-i', inputFileName,
        '-f', 'segment',
        '-segment_time', segmentTime.toString(),
        '-c', 'copy',
        '-reset_timestamps', '1',
        outputPattern
      ]);

      setProgress(80);

      // Read output files
      const files = await ffmpeg.listDir('/');
      const outputFiles = files.filter((file: any) => 
        file.name.startsWith('output_') && file.name.endsWith('.mp3')
      ).sort((a: any, b: any) => a.name.localeCompare(b.name));

      const newSegments: SplitSegment[] = [];

      for (let i = 0; i < outputFiles.length; i++) {
        const fileName = outputFiles[i].name;
        const data = await ffmpeg.readFile(fileName);
        
        // Create blob URL for download
        const blob = new Blob([data], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        // Generate a user-friendly filename
        const originalName = audioFile.name.replace(/\.[^/.]+$/, '');
        const segmentName = `${originalName}_part_${(i + 1).toString().padStart(3, '0')}.mp3`;
        
        newSegments.push({
          name: segmentName,
          url: url,
          size: blob.size,
          duration: splitDuration * 60 // Approximate duration in seconds
        });
        
        // Clean up FFmpeg filesystem
        await ffmpeg.deleteFile(fileName);
      }
      
      // Clean up input file
      await ffmpeg.deleteFile(inputFileName);
      
      setSegments(newSegments);
      setProgress(100);
      
    } catch (err) {
      console.error('Audio splitting error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while splitting the audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSegment = (segment: SplitSegment) => {
    const link = document.createElement('a');
    link.href = segment.url;
    link.download = segment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = async () => {
    if (segments.length === 0) return;
    
    setIsCreatingZip(true);
    setError(null);

    try {
      const zip = new JSZip();
      
      // Add each segment to the ZIP
      for (const segment of segments) {
        try {
          // Fetch the blob data from the object URL
          const response = await fetch(segment.url);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          zip.file(segment.name, arrayBuffer);
        } catch (err) {
          console.error(`Error adding ${segment.name} to ZIP:`, err);
        }
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename based on original audio file
      const originalName = audioFile.name.replace(/\.[^/.]+$/, "");
      link.download = `${originalName}_splits_${splitDuration}min.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      URL.revokeObjectURL(url);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ZIP file');
      console.error('ZIP creation error:', err);
    } finally {
      setIsCreatingZip(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-6">
      <div className="border border-border rounded-lg p-6 bg-card">
        <h2 className="text-2xl font-semibold text-background mb-4">
          Split Configuration
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-background mb-2">
              Split Duration (minutes)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="120"
                value={splitDuration}
                onChange={handleDurationChange}
                className="flex-1 h-2 bg-background/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex items-center space-x-2 min-w-[120px]">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-medium text-background">
                  {splitDuration} min
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Audio will be split into {splitDuration}-minute segments
              </p>
            </div>
            
            <Button
              onClick={splitAudio}
              disabled={isProcessing}
              className={cn(
                "px-6 py-2 rounded-lg font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed",
                "flex items-center space-x-2"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>Split Audio</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="border border-border rounded-lg p-6 bg-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Processing Audio</h3>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-destructive/20 bg-destructive/10 rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {segments.length > 0 && (
        <div className="border border-border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-background">
              Audio Segments ({segments.length})
            </h3>
            <button
              onClick={downloadAll}
              disabled={isCreatingZip}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2",
                "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              )}
            >
              {isCreatingZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating ZIP...</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>Download All as ZIP</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {segments.map((segment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-background"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{segment.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(segment.size)} • {formatDuration(segment.duration)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => downloadSegment(segment)}
                  className="p-2 rounded-lg group transition-colors cursor-pointer text-emerald-400"
                  title="Download segment"
                >
                  <Download className="w-4 h-4 text-white hover:text-inherit" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}