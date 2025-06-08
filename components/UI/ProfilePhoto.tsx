import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { Colors } from '@/constants/Theme';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { uploadProfilePhoto } from '@/lib/profileService';

interface ProfilePhotoProps {
  uri?: string | null;
  size?: number;
  style?: any;
  onPress?: () => void;
  editable?: boolean;
  onPhotoUpdated?: (url: string) => void;
}

export const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
  uri,
  size = 100,
  style,
  onPress,
  editable = false,
  onPhotoUpdated
}) => {
  const { user } = useAuth();
  const defaultPhoto = 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
  
  const handlePress = async () => {
    if (editable && user) {
      try {
        // İzin kontrolü
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri erişim izni gerekli');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          allowsMultipleSelection: false,
        });

        if (!result.canceled && result.assets[0]) {
          try {
            console.log('Selected image URI:', result.assets[0].uri);
            
            // Fetch the image as a blob with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const response = await fetch(result.assets[0].uri, {
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            console.log('Blob created, size:', blob.size, 'type:', blob.type);
            
            // Dosya boyutu kontrolü
            if (blob.size > 1 * 1024 * 1024) {
              Alert.alert(
                'Dosya Çok Büyük', 
                'Seçtiğiniz fotoğraf 1MB\'dan büyük. Lütfen daha küçük bir fotoğraf seçin veya fotoğrafı düzenleyerek boyutunu küçültün.',
                [{ text: 'Tamam' }]
              );
              return;
            }
            
            // Upload denemesi
            try {
              const photoUrl = await uploadProfilePhoto(user.id, blob);
              console.log('Upload successful:', photoUrl.substring(0, 50) + '...');
              
              if (onPhotoUpdated) {
                onPhotoUpdated(photoUrl);
              }
              
              Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi');
            } catch (uploadError: any) {
              console.error('Upload failed:', uploadError);
              
              Alert.alert(
                'Hata', 
                uploadError.message || 'Fotoğraf kaydedilemedi. Lütfen tekrar deneyin.',
                [{ text: 'Tamam' }]
              );
            }
          } catch (processError: any) {
            console.error('Image processing error:', processError);
            Alert.alert(
              'Hata', 
              'Fotoğraf işlenirken bir hata oluştu. Lütfen farklı bir fotoğraf seçin.',
              [{ text: 'Tamam' }]
            );
          }
        }
      } catch (error: any) {
        console.error('Error in handlePress:', error);
        Alert.alert(
          'Hata', 
          'Fotoğraf seçilirken bir hata oluştu. Lütfen tekrar deneyin.',
          [{ text: 'Tamam' }]
        );
      }
    } else if (onPress) {
      onPress();
    }
  };
  
  const isInteractive = editable || onPress;
  
  return (
    <>
      {isInteractive ? (
        <TouchableOpacity 
          style={[styles.container, { width: size, height: size }, style]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Image 
            source={{ uri: uri || defaultPhoto }}
            style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
            resizeMode="cover"
            onError={(error) => {
              console.log('Image load error:', error);
            }}
          />
        </TouchableOpacity>
      ) : (
        <View style={[styles.container, { width: size, height: size }, style]}>
          <Image 
            source={{ uri: uri || defaultPhoto }}
            style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
            resizeMode="cover"
            onError={(error) => {
              console.log('Image load error:', error);
            }}
          />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    borderWidth: 3,
    borderColor: Colors.primary[500],
  },
});