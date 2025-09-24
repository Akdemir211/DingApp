import { supabase } from '@/lib/supabase';

function getFileExtension(fileName: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  return match ? match[1].toLowerCase() : '';
}

function guessContentType(fileName: string, fallback?: string): string {
  const ext = getFileExtension(fileName);
  if (fallback && fallback !== 'application/octet-stream') return fallback;
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'pdf':
      return 'application/pdf';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

export async function uploadChatMediaAsync(params: {
  uri: string;
  fileName: string;
  userId: string;
  roomId: string;
}): Promise<string> {
  const { uri, fileName, userId, roomId } = params;

  // Fetch the local file as Blob/ArrayBuffer
  const response = await fetch(uri);
  const blob = await response.blob();
  const contentType = guessContentType(fileName, (blob as any).type);

  // Build storage path: chat-media/{roomId}/{userId}/{timestamp}_{fileName}
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${roomId}/${userId}/${Date.now()}_${safeName}`;

  const { error } = await supabase
    .storage
    .from('chat-media')
    .upload(path, blob, {
      contentType,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase
    .storage
    .from('chat-media')
    .getPublicUrl(path);

  return data.publicUrl;
} 