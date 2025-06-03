import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
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
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled) {
          // Fetch the image as a blob
          const response = await fetch(result.assets[0].uri);
          const blob = await response.blob();
          
          // Upload the photo
          const photoUrl = await uploadProfilePhoto(user.id, blob);
          
          // Notify parent component
          if (onPhotoUpdated) {
            onPhotoUpdated(photoUrl);
          }
        }
      } catch (error) {
        console.error('Error updating profile photo:', error);
      }
    } else if (onPress) {
      onPress();
    }
  };
  
  const Component = (editable || onPress) ? TouchableOpacity : View;
  
  return (
    <Component 
      style={[styles.container, { width: size, height: size }, style]}
      onPress={handlePress}
    >
      <Image 
        source={{ uri: uri || defaultPhoto }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
      />
    </Component>
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