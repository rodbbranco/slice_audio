"use client";

import { useState } from "react";
import { AudioUploader } from "@/components/AudioUploader";
import { AudioSplitter } from "@/components/AudioSplitter";
import {LinkPreview} from "@/components/ui/link-preview";
import {PointerHighlight} from "@/components/ui/pointer-highlight";

export default function Home() {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [splitDuration, setSplitDuration] = useState<number>(15);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col h-dvh justify-between pb-10">
            <div className="flex flex-col items-center mb-8 mt-24">
                <h1 className="text-4xl font-bold text-foreground mb-4 flex gap-2">
                    <PointerHighlight
                        pointerClassName="text-emerald-400"
                        rectangleClassName="border-emerald-400/50"
                    >
                        <span>Slice</span>
                    </PointerHighlight>
                    Audio
                </h1>
                <p className="text-lg text-foreground/60 max-w-sm lg:max-w-full text-center">
                    Upload your audio file and split it into custom-sized segments
                </p>
            </div>

            <div className="space-y-8 mt-10">
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
            <div
                className="text-white/70 mt-10 mb-10">
                    {/*This website has been developed with the generous financial support of*/}
                    {/*<LinkPreview url="https://www.linkedin.com/in/francisco-jc-lopes/"*/}
                    {/*             isStatic*/}
                    {/*             className="font-bold text-white/90"*/}
                    {/*             imageSrc="/lopes.jpg"*/}
                    {/*> Francisco Lopes</LinkPreview>*/}
                    {/*, who contributed $100,000 towards the development of this platform.*/}

            </div>
        </div>
    );
}