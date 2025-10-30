"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, UploadCloud, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  onFileChange: (file: File | null) => void;
  currentDocumentUrl?: string;
  onRemoveCurrentDocument?: () => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  onFileChange,
  currentDocumentUrl,
  onRemoveCurrentDocument,
  disabled = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    onFileChange(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // NEW LOGIC: If there was an existing document, and we're removing the *newly selected* file,
    // it implies the user wants to clear the document field entirely.
    // So, we should also trigger the removal of the *existing* document.
    if (currentDocumentUrl && onRemoveCurrentDocument) {
      onRemoveCurrentDocument();
    }
  };

  const handleRemoveExistingDocument = () => {
    if (onRemoveCurrentDocument) {
      onRemoveCurrentDocument();
    }
  };

  const displayFileName = selectedFile ? selectedFile.name : (currentDocumentUrl ? currentDocumentUrl.split('/').pop()?.split('?')[0] : "");

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2">
        <Input
          id="document-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={cn(
            "flex-1 justify-start",
            (selectedFile || currentDocumentUrl) && "border-primary text-primary"
          )}
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          {selectedFile ? "Arquivo selecionado" : currentDocumentUrl ? "Documento existente" : "Escolher arquivo"}
        </Button>
        {(selectedFile || currentDocumentUrl) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={selectedFile ? handleRemoveFile : handleRemoveExistingDocument}
            disabled={disabled}
          >
            <X className="h-4 w-4 text-destructive" />
            <span className="sr-only">Remover arquivo</span>
          </Button>
        )}
      </div>
      {displayFileName && (
        <div className="flex items-center text-sm text-muted-foreground">
          <FileText className="mr-2 h-4 w-4" />
          <span>{displayFileName}</span>
          {currentDocumentUrl && !selectedFile && (
            <a
              href={currentDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-500 hover:underline"
            >
              (Ver)
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;