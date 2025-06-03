import { supabase } from '@/lib/supabase';

/**
 * Kullanıcının profil fotoğrafını getir
 * @param userId Kullanıcı ID'si
 * @returns Profil fotoğrafı URL'si veya varsayılan fotoğraf
 */
export const getProfilePhoto = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('profile_photos')
      .select('photo_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return (data as any)?.photo_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
  } catch (error) {
    console.error('Error fetching profile photo:', error);
    return 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
  }
};

/**
 * Profil fotoğrafı yükle
 * @param userId Kullanıcı ID'si
 * @param file Fotoğraf dosyası
 * @returns Yüklenen fotoğrafın URL'si
 */
export const uploadProfilePhoto = async (userId: string, file: Blob): Promise<string> => {
  try {
    // Dosya boyut kontrolü (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Dosya boyutu 5MB\'dan büyük olamaz');
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      throw new Error('Sadece resim dosyaları yüklenebilir');
    }

    // Dosya adı oluştur
    const fileExt = file.type.split('/')[1] || 'jpg';
    const fileName = `profile-${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    console.log('Uploading file:', filePath, 'Size:', file.size, 'Type:', file.type);

    // Önce eski fotoğrafı sil (varsa)
    try {
      const { data: existingPhoto } = await supabase
        .from('profile_photos')
        .select('photo_url')
        .eq('user_id', userId)
        .maybeSingle();

      if ((existingPhoto as any)?.photo_url) {
        // URL'den dosya yolunu çıkar
        const oldPath = (existingPhoto as any).photo_url.split('/').pop();
        if (oldPath && oldPath.includes('profile-')) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${oldPath}`]);
        }
      }
    } catch (deleteError) {
      console.log('Old photo deletion failed (not critical):', deleteError);
    }

    // Storage'a yükle
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Yükleme hatası: ${uploadError.message}`);
    }

    console.log('Upload successful:', uploadData);

    // Public URL al
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);

    // Veritabanına kaydet
    const { error: dbError } = await supabase
      .from('profile_photos')
      .upsert(
        {
          user_id: userId,
          photo_url: publicUrl,
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        }
      );

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Veritabanı hatası: ${dbError.message}`);
    }

    console.log('Profile photo updated successfully');
    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    
    // Kullanıcı dostu hata mesajları
    if (error.message?.includes('Invalid bucket')) {
      throw new Error('Depolama alanı bulunamadı. Lütfen daha sonra tekrar deneyin.');
    } else if (error.message?.includes('network')) {
      throw new Error('Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.');
    } else if (error.message?.includes('permission')) {
      throw new Error('Yetki hatası. Lütfen giriş yapıp tekrar deneyin.');
    }
    
    throw error;
  }
};

/**
 * Profil fotoğrafını sil
 * @param userId Kullanıcı ID'si
 */
export const deleteProfilePhoto = async (userId: string): Promise<void> => {
  try {
    // Veritabanından fotoğraf bilgisini al
    const { data: photoData } = await supabase
      .from('profile_photos')
      .select('photo_url')
      .eq('user_id', userId)
      .maybeSingle();

    if ((photoData as any)?.photo_url) {
      // Storage'dan sil
      const fileName = (photoData as any).photo_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('avatars')
          .remove([`avatars/${fileName}`]);
      }
    }

    // Veritabanından kaydı sil
    await supabase
      .from('profile_photos')
      .delete()
      .eq('user_id', userId);

  } catch (error) {
    console.error('Error deleting profile photo:', error);
    throw error;
  }
};