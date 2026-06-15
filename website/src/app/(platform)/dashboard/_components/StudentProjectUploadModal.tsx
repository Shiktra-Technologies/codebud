"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, UploadCloud, AlertCircle, Loader2 } from "lucide-react";
import { submitProject, MentorshipProject } from "@/lib/services/mentorshipService";

interface StudentProjectUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: MentorshipProject | null;
    onSuccess: () => void;
}

export default function StudentProjectUploadModal({ isOpen, onClose, project, onSuccess }: StudentProjectUploadModalProps) {
    const [githubUrl, setGithubUrl] = useState("");
    const [liveDemoUrl, setLiveDemoUrl] = useState("");
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen || !project) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            if (selected.size > 50 * 1024 * 1024) {
                setError("File exceeds 50MB limit");
                return;
            }
            if (!selected.name.endsWith('.zip')) {
                setError("Only .zip files are allowed for projects");
                return;
            }
            setFile(selected);
            setError("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("github_url", githubUrl);
            formData.append("live_demo_url", liveDemoUrl);
            formData.append("notes", notes);
            if (file) {
                formData.append("file", file);
            }

            const res = await submitProject(project._id, formData);

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                setError(res.message || "Failed to submit project");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-xl bg-surface-1 border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                        <h2 className="text-lg font-bold text-white">Submit Project</h2>
                        <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white">{project.title}</h3>
                            <p className="text-sm text-white/50 mt-1">{project.description}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">GitHub Repository URL</label>
                                <input
                                    type="url"
                                    value={githubUrl}
                                    onChange={(e) => setGithubUrl(e.target.value)}
                                    className="w-full bg-surface-2 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-yellow-400/50 transition-colors"
                                    placeholder="https://github.com/username/repo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Live Demo URL (Optional)</label>
                                <input
                                    type="url"
                                    value={liveDemoUrl}
                                    onChange={(e) => setLiveDemoUrl(e.target.value)}
                                    className="w-full bg-surface-2 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-yellow-400/50 transition-colors"
                                    placeholder="https://my-project.vercel.app"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Project Files (.ZIP)</label>
                                <div 
                                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${file ? 'border-yellow-400/50 bg-yellow-400/5' : 'border-white/[0.06] hover:border-white/20 bg-surface-2'}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ cursor: "pointer" }}
                                >
                                    <input 
                                        type="file" 
                                        accept=".zip" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        className="hidden" 
                                    />
                                    <UploadCloud className={`w-8 h-8 mx-auto mb-3 ${file ? 'text-yellow-400' : 'text-white/20'}`} />
                                    {file ? (
                                        <p className="text-sm font-medium text-yellow-400">{file.name}</p>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-white/60 mb-1">Click to upload project bundle</p>
                                            <p className="text-[10px] text-white/30">Max size: 50MB. Only .zip allowed.</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Notes for Mentor</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-surface-2 border border-white/[0.06] rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-yellow-400/50 transition-colors h-24 resize-none"
                                    placeholder="Any context or challenges you faced..."
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || (!githubUrl && !file)}
                                    className="px-5 py-2.5 rounded-lg text-sm font-bold bg-yellow-400 text-black hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    Submit Project
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
