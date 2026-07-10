import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle2, AlertCircle, X, Image as ImageIcon } from 'lucide-react';

export default function DragDropUpload({ onUpload, isUploading, allowedTypes = ['image/jpeg', 'image/png', 'image/tiff'] }) {
  const [dragActive, setDragActive] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const photoInputRef = useRef(null);
  const rawInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/tif'];
    const ext = file.name.split('.').pop().toLowerCase();
    const isExtensionValid = ['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext);
    
    if (!validTypes.includes(file.type) && !isExtensionValid) {
      setError('Only JPEG, PNG, or TIFF files are allowed for the main photograph.');
      return false;
    }
    setError('');
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateImageFile(file)) {
        setPhotoFile(file);
      }
    }
  };

  const handlePhotoSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateImageFile(file)) {
        setPhotoFile(file);
      }
    }
  };

  const handleRawSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setRawFile(e.target.files[0]);
    }
  };

  const triggerUpload = async () => {
    if (!photoFile) {
      setError('Please select a main photograph file first.');
      return;
    }

    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      await onUpload(photoFile, rawFile);
      setUploadProgress(100);
      setTimeout(() => {
        setPhotoFile(null);
        setRawFile(null);
        setUploadProgress(0);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploadProgress(0);
    } finally {
      clearInterval(interval);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setError('');
  };

  const clearRaw = () => {
    setRawFile(null);
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Photo Upload Zone */}
      {!photoFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => photoInputRef.current.click()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
            dragActive 
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/10' 
              : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
          }`}
        >
          <input
            ref={photoInputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.tiff,.tif"
            onChange={handlePhotoSelect}
          />
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl mb-4">
            <Upload size={24} />
          </div>
          <p className="font-display font-semibold text-slate-800 dark:text-slate-200 text-center mb-1">
            Drag & Drop your photograph here
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3">
            Supports JPEG, PNG, TIFF (Max size 50MB)
          </p>
          <button
            type="button"
            className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs py-1.5 px-4 rounded-lg shadow-sm transition-all"
          >
            Browse files
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <ImageIcon size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {photoFile.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatBytes(photoFile.size)} • Photograph
                </p>
              </div>
            </div>
            {!isUploading && (
              <button
                onClick={clearPhoto}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Optional RAW File Upload */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            {!rawFile ? (
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <File size={16} className="text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Upload RAW file for verification (Optional)
                  </span>
                </div>
                <input
                  ref={rawInputRef}
                  type="file"
                  className="hidden"
                  accept=".cr2,.nef,.arw,.dng,.raf,.orf"
                  onChange={handleRawSelect}
                />
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => rawInputRef.current.click()}
                    className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1 rounded font-medium transition-colors"
                  >
                    Select RAW
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 p-2.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <div>
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 block line-clamp-1">
                      {rawFile.name}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-500">
                      {formatBytes(rawFile.size)} • RAW File
                    </span>
                  </div>
                </div>
                {!isUploading && (
                  <button
                    onClick={clearRaw}
                    className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 rounded text-emerald-500"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Trigger */}
          {error && (
            <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {uploadProgress > 0 && (
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {!isUploading && uploadProgress === 0 && (
            <button
              onClick={triggerUpload}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 rounded-lg shadow-sm hover:shadow transition-all"
            >
              Upload Photo & Metadata
            </button>
          )}
        </div>
      )}
    </div>
  );
}
