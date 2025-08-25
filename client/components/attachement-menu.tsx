import { Camera, FileText, Image } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

export const AttachmentMenu = ({ 
  onFileSelect, 
  isOpen, 
  onClose 
}: {
  onFileSelect: (files: FileList) => void;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    toast.info("Camera feature coming soon!");
    onClose();
  };

  const handleDocumentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    onFileSelect(files);
    onClose(); // Close the menu after a file has been selected
    
    // Optional: Reset the input value to allow the same file to be selected again
    e.target.value = "";
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[200px]">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
        onChange={handleFileChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      <div className="space-y-1">
        <button
          onClick={handleDocumentClick}
          className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors"
        >
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm text-foreground">Document</span>
        </button>

        <button
          onClick={handleImageClick}
          className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors"
        >
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
            <Image className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm text-foreground">Photo</span>
        </button>

        <button
          onClick={handleCameraClick}
          className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors"
        >
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
            <Camera className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm text-foreground">Camera</span>
        </button>
      </div>
    </div>
  );
};