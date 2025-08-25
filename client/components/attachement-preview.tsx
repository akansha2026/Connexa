import { AttachmentPreview } from "@/lib/index.types";
import { FileText, X } from "lucide-react";
import Image from "next/image";

export const AttachmentPreviewComponent = ({
  attachments,
  onRemove,
}: {
  attachments: AttachmentPreview[];
  onRemove: (id: string) => void;
}) => {
  if (attachments.length === 0) return null;

  return (
    <div className="border-b border-border p-2">
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="relative group bg-muted rounded-lg p-2 flex items-center gap-2 max-w-[200px]"
          >
            {attachment.type === 'image' && attachment.preview && (
              <Image
                src={attachment.preview}
                alt="Preview"
                className="w-8 h-8 object-cover rounded"
              />
            )}
            {attachment.type === 'document' && (
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{attachment.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(attachment.file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => onRemove(attachment.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive rounded"
            >
              <X className="w-3 h-3 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};