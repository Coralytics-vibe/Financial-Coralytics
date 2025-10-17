"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, FileText, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DocumentMetadata } from '@/types'; // Import DocumentMetadata from types

interface DocumentUploadProps {
  associatedId: string; // ID of the cost or profit this document is linked to
  documentType: 'invoice' | 'receipt' | 'payment_proof' | 'general';
  onUploadSuccess?: (document: DocumentMetadata) => void;
  onDeleteSuccess?: (documentId: string) => void;
  existingDocuments?: DocumentMetadata[];
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  associatedId,
  documentType,
  onUploadSuccess,
  onDeleteSuccess,
  existingDocuments = [],
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentMetadata | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showError("Por favor, selecione um arquivo para upload.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError("Você precisa estar logado para fazer upload de documentos.");
        setUploading(false);
        return;
      }

      const fileExtension = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `${user.id}/${fileName}`; // Store in user-specific folder

      const { data: _uploadData, error: uploadError } = await supabase.storage // Renamed uploadData to _uploadData
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          // Explicitly cast options to include onUploadProgress
          // This is a common workaround if the FileOptions type doesn't include it directly
          // The actual type for event is { loaded: number; total: number }
          onUploadProgress: (event: { loaded: number; total: number }) => {
            if (event.total > 0) {
              setUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
          },
        } as any); // Cast to any to allow onUploadProgress

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error("Não foi possível obter a URL pública do arquivo.");
      }

      // Save document metadata to the database
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          associated_id: associatedId,
          document_type: documentType, // Ensure this matches the literal type
          file_name: file.name,
          file_url: publicUrlData.publicUrl,
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select()
        .single();

      if (docError) {
        throw docError;
      }

      showSuccess("Documento enviado com sucesso!");
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
      }
      if (onUploadSuccess) {
        onUploadSuccess(docData);
      }

    } catch (error: any) {
      console.error("Erro ao fazer upload do documento:", error);
      showError(`Erro ao fazer upload: ${error.message || 'Tente novamente.'}`);
    } finally {
      setUploading(false);
    }
  };

  const openDeleteConfirmDialog = (doc: DocumentMetadata) => {
    setDocToDelete(doc);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError("Você precisa estar logado para excluir documentos.");
        return;
      }

      // Extract file path from public URL
      const urlParts = docToDelete.file_url.split('/public/documents/');
      const filePathInStorage = urlParts.length > 1 ? urlParts[1] : null;

      if (!filePathInStorage) {
        throw new Error("Não foi possível determinar o caminho do arquivo no storage.");
      }

      // Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePathInStorage]);

      if (storageError) {
        throw storageError;
      }

      // Delete from public.documents table
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docToDelete.id)
        .eq('user_id', user.id); // Ensure user can only delete their own records

      if (dbError) {
        throw dbError;
      }

      showSuccess("Documento excluído com sucesso!");
      if (onDeleteSuccess) {
        onDeleteSuccess(docToDelete.id);
      }
    } catch (error: any) {
      console.error("Erro ao excluir documento:", error);
      showError(`Erro ao excluir: ${error.message || 'Tente novamente.'}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setDocToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="document-upload" className="block text-sm font-medium text-foreground mb-2">
          Anexar Documento ({documentType.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())})
        </Label>
        <div className="flex items-center space-x-2">
          <Input
            id="document-upload"
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="flex-1"
            disabled={uploading}
          />
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Enviando...' : 'Upload'}
            <UploadCloud className="ml-2 h-4 w-4" />
          </Button>
        </div>
        {uploading && (
          <Progress value={uploadProgress} className="mt-2" />
        )}
      </div>

      {existingDocuments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Documentos Anexados:</h4>
          <ul className="space-y-1">
            {existingDocuments.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  {doc.file_name}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteConfirmDialog(doc)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{docToDelete?.file_name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentUpload;