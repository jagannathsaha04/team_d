'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  error?: string | null;
}

export function UploadDropzone({ onFileSelected, error: externalError }: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setLocalError('Please upload a valid CSV file.');
      setFileDetails(null);
      return;
    }

    setLocalError(null);
    const sizeInKB = (file.size / 1024).toFixed(1);
    setFileDetails({ name: file.name, size: `${sizeInKB} KB` });

    onFileSelected(file);
  };

  const error = localError || externalError;

  return (
    <div className="w-full max-w-xl">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all duration-300 group
          ${isDragActive 
            ? 'border-indigo-500 bg-indigo-500/5 shadow-indigo-500/10 shadow-lg' 
            : 'border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 hover:border-zinc-400 dark:hover:border-zinc-700'
          }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".csv"
          className="hidden"
        />

        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

        <div className={`p-4 rounded-xl mb-4 transition-all duration-300 
          ${isDragActive ? 'bg-indigo-500 text-white scale-110' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:scale-105'}
        `}>
          <Upload className="h-6 w-6" />
        </div>

        <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100 mb-1">
          Drag & drop your CSV file here
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6 max-w-xs">
          Upload bank statement. Required columns: <span className="font-medium text-zinc-700 dark:text-zinc-300">Date</span> and <span className="font-medium text-zinc-700 dark:text-zinc-300">Amount</span>.
        </p>

        <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-500/20">
          Browse Files
        </span>

        <AnimatePresence>
          {fileDetails && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm w-full justify-center"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Loaded: <strong>{fileDetails.name}</strong> ({fileDetails.size})</span>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 mt-6 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm w-full justify-center"
            >
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
