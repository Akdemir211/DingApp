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
 * Profil fotoğrafı yükle - Geçici çözüm: Base64 olarak veritabanında sakla
 * @param userId Kullanıcı ID'si
 * @param file Fotoğraf dosyası
 * @returns Yüklenen fotoğrafın URL'si
 */
export const uploadProfilePhoto = async (userId: string, file: Blob): Promise<string> => {
  try {
    // Dosya boyut kontrolü (1MB limit - çok düşük limit base64 için)
    if (file.size > 1 * 1024 * 1024) {
      throw new Error('Dosya boyutu 1MB\'dan büyük olamaz');
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      throw new Error('Sadece resim dosyaları yüklenebilir');
    }

    console.log('Converting to base64, size:', file.size, 'type:', file.type);

    // Blob'u base64'e çevir
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsDataURL(file);
    });

    console.log('Base64 conversion successful, length:', base64.length);

    // Veritabanına base64 olarak kaydet
    let dbError: any = null;
    
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Database save attempt ${attempt}/2`);
        
        const { error } = await supabase
          .from('profile_photos')
          .upsert(
            {
              user_id: userId,
              photo_url: base64, // Base64 string olarak sakla
              updated_at: new Date().toISOString()
            },
            { 
              onConflict: 'user_id',
              ignoreDuplicates: false 
            }
          );

        if (error) {
          dbError = error;
          console.error(`Database attempt ${attempt} failed:`, error);
          if (attempt === 2) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        dbError = null;
        break;
      } catch (error) {
        dbError = error;
        console.error(`Database attempt ${attempt} failed:`, error);
        if (attempt === 2) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Veritabanı hatası: ${dbError.message}`);
    }

    console.log('Profile photo saved to database successfully');
    return base64;
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    
    // Kullanıcı dostu hata mesajları
    if (error.message?.includes('boyut') || error.message?.includes('size') || error.message?.includes('1MB')) {
      throw new Error('Dosya boyutu çok büyük. Lütfen 1MB\'dan küçük bir fotoğraf seçin.');
    } else if (error.message?.includes('tip') || error.message?.includes('type')) {
      throw new Error('Lütfen sadece resim dosyası seçin.');
    } else if (error.message?.includes('okunamadı')) {
      throw new Error('Dosya okunamadı. Lütfen farklı bir fotoğraf seçin.');
    } else if (error.message?.includes('Veritabanı')) {
      throw new Error(error.message);
    }
    
    throw new Error('Fotoğraf kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
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