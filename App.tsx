import React, { useState, useCallback, ChangeEvent } from 'react';
import { editImageWithPrompt } from './services/geminiService';

// --- Helper Functions ---
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

// --- UI Helper Components (defined outside the main component) ---

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const MagicWandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.475 2.118A2.25 2.25 0 0 1 .8 19.545a2.25 2.25 0 0 1 2.25-2.25 1.5 1.5 0 0 0 1.5-1.5.375.375 0 0 1 .606-.289.606.606 0 0 1 .289.606 1.5 1.5 0 0 0 1.5 1.5 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218a.75.75 0 0 1-1.06.025a.75.75 0 0 1-.025-1.06m3.894-3.418a3 3 0 0 0-5.78-1.128 2.25 2.25 0 0 0-2.475-2.118 2.25 2.25 0 0 0-.8 4.455a3 3 0 0 0 5.78 1.128 2.25 2.25 0 0 0 2.475 2.118 2.25 2.25 0 0 0 .8-4.455m-3.894-3.418a3 3 0 0 0 5.78 1.128 2.25 2.25 0 0 1 2.475 2.118 2.25 2.25 0 0 1 .8 4.455 3 3 0 0 0-5.78-1.128 2.25 2.25 0 0 1-2.475-2.118 2.25 2.25 0 0 1-.8-4.455" />
  </svg>
);

interface ImageFile {
  file: File;
  base64: string;
}

interface ImagePanelProps {
  title: string;
  imageSrc?: string | null;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const ImagePanel: React.FC<ImagePanelProps> = ({ title, imageSrc, isLoading, children }) => (
  <div className="bg-gray-800/50 rounded-2xl p-4 flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-600">
    <h2 className="text-lg font-semibold text-gray-300 mb-4">{title}</h2>
    <div className="relative w-full aspect-square flex items-center justify-center rounded-lg overflow-hidden bg-gray-900">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center text-gray-400">
            <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4">Generating your image...</p>
        </div>
      ) : imageSrc ? (
        <img src={imageSrc} alt={title} className="w-full h-full object-contain" />
      ) : (
        children
      )}
    </div>
  </div>
);


// --- Main Application Component ---
export default function App() {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("From the uploaded image, please accurately isolate all human subjects and place them onto a uniform, neutral background. The output should be a new image featuring only the clear, high-resolution cutouts of the people.");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await fileToBase64(file);
        setOriginalImage({ file, base64 });
        setEditedImage(null);
        setError(null);
      } catch (err) {
        setError("Failed to read the image file.");
      }
    } else {
        setError("Please select a valid image file.");
    }
  }, []);
  
  const handleGenerateClick = useCallback(async () => {
    if (!originalImage) {
      setError("Please upload an image first.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter an editing prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const resultBase64 = await editImageWithPrompt(
        originalImage.base64,
        originalImage.file.type,
        prompt
      );
      setEditedImage(`data:${originalImage.file.type};base64,${resultBase64}`);
    } catch (err) {
      setError(err as string);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
          Gemini Image Editor
        </h1>
        <p className="text-gray-400 mt-2">Upload an image, describe your edits, and let AI do the magic.</p>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row gap-8">
        {/* Left Panel: Controls */}
        <div className="lg:w-1/3 flex flex-col gap-6">
            <ImagePanel title="Original Image">
                <label htmlFor="file-upload" className="cursor-pointer text-center text-gray-400 hover:text-indigo-400 transition-colors">
                    <UploadIcon className="w-16 h-16 mx-auto" />
                    <span>Click to upload an image</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                </label>
            </ImagePanel>

          <div className="bg-gray-800/50 rounded-2xl p-4 border-2 border-transparent">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Editing Prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Add a retro filter, make the background black and white..."
              rows={4}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-gray-200"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleGenerateClick}
            disabled={isLoading || !originalImage}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/30"
          >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                </>
            ) : (
                <>
                    <MagicWandIcon className="w-5 h-5" />
                    Generate
                </>
            )}
          </button>
          
          {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">{error}</div>}

        </div>

        {/* Right Panel: Results */}
        <div className="lg:w-2/3 flex">
            <ImagePanel title="Edited Image" imageSrc={editedImage} isLoading={isLoading}>
                 <div className="text-center text-gray-500">
                    <MagicWandIcon className="w-16 h-16 mx-auto" />
                    <p>Your AI-edited image will appear here.</p>
                </div>
            </ImagePanel>
        </div>
      </main>
    </div>
  );
}
