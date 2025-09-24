"use client";

import { useState } from "react";
import { AudioUploader } from "@/components/AudioUploader";
import { AudioSplitter } from "@/components/AudioSplitter";

export default function Home() {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [splitDuration, setSplitDuration] = useState<number>(15);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="text-center mb-8 mt-24">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                    SliceAudio
                </h1>
                <p className="text-lg text-foreground/60">
                    Upload your audio file and split it into custom-sized segments
                </p>
            </div>

            <div className="space-y-8 mt-32">
                <AudioUploader
                    onFileSelect={setAudioFile}
                    selectedFile={audioFile}
                />

                {audioFile && (
                    <AudioSplitter
                        audioFile={audioFile}
                        splitDuration={splitDuration}
                        onDurationChange={setSplitDuration}
                    />
                )}
            </div>
        </div>
    );
}