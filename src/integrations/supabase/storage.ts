import { supabase } from './client';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'documents';

export const uploadDocument = async (userId: string, file: File): Promise<string | null> => {
  if (!userId) {
    console.error("User ID is required for document upload.");
    return null;
  }

  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}/${uuidv4()}.${fileExtension}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading document:', error);
    return null;
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

export const deleteDocument = async (documentUrl: string): Promise<boolean> => {
  if (!documentUrl) {
    console.warn("No document URL provided for deletion.");
    return false;
  }

  // Extract the path from the public URL
  // Example: https://bfpmaxvucppbtrgyxbqt.supabase.co/storage/v1/object/public/documents/userId/uuid-filename.ext
  const pathSegments = documentUrl.split('/public/documents/');
  if (pathSegments.length < 2) {
    console.error("Invalid document URL format for deletion:", documentUrl);
    return false;
  }
  const filePath = pathSegments[1];

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting document:', error);
    return false;
  }

  return true;
};