import React, { useState, useRef } from 'react';
import { Camera, Mic, Square, X } from 'lucide-react';
import { Button } from './Button';

interface MediaUploaderProps {
  onImageUpload?: (file: File) => void;
  onVoiceRecording?: (blob: Blob) => void;
  maxImages?: number;
  className?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onImageUpload,
  onVoiceRecording,
  maxImages = 5,
  className = '',
}) => {
  const [images, setImages] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, maxImages);
    setImages(newImages);
    
    files.forEach(file => {
      if (onImageUpload) onImageUpload(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        if (onVoiceRecording) {
          onVoiceRecording(audioBlob);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Images (Optional)</label>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            disabled={images.length >= maxImages}
          >
            <Camera className="w-4 h-4 mr-2" />
            {images.length > 0 ? `Add More (${images.length}/${maxImages})` : 'Add Photos'}
          </Button>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Voice Recording Section */}
      <div>
        <label className="block text-sm font-medium mb-2">Voice Note (Optional)</label>
        <div className="space-y-2">
          {!audioURL ? (
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button
                  type="button"
                  onClick={startRecording}
                  variant="secondary"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Record Voice Note
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                  <span className="text-sm font-mono text-red-600 animate-pulse">
                    {formatTime(recordingTime)}
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
              <audio src={audioURL} controls className="flex-1" />
              <button
                type="button"
                onClick={deleteRecording}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaUploader;
