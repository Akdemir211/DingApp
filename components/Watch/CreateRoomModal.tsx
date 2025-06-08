import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { X, Lock, Video } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface CreateWatchRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (room: any) => void;
}

export const CreateWatchRoomModal: React.FC<CreateWatchRoomModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎬 Creating room with data:', {
        name: name.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        isPrivate,
        password: isPrivate ? password : null,
        userId: user?.id
      });
      
      if (!name.trim()) {
        throw new Error('Oda adı gerekli');
      }

      if (!videoUrl.trim()) {
        throw new Error('Video URL gerekli');
      }

      if (!user) {
        throw new Error('Oturum açmanız gerekiyor');
      }

      console.log('🏠 Creating room...');
      const roomData = {
        name: name.trim(),
        description: description.trim() || null,
        video_url: videoUrl.trim(),
        is_private: isPrivate,
        password_hash: isPrivate ? password.trim() : null,
        created_by: user.id
      };

      const { data: room, error: roomError } = await supabase
        .from('watch_rooms')
        .insert(roomData)
        .select()
        .single();

      if (roomError) {
        console.error('❌ Room creation error:', roomError);
        if (roomError.code === '42P01') {
          throw new Error('Watch rooms tablosu bulunamadı. Veritabanı yapılandırmasını kontrol edin.');
        } else if (roomError.code === '23503') {
          throw new Error('Kullanıcı referansı hatası. Lütfen çıkış yapıp tekrar giriş yapın.');
        } else if (roomError.code === '23502') {
          throw new Error('Gerekli alanlar eksik. Lütfen tüm alanları doldurun.');
        }
        throw new Error(`Oda oluşturma hatası: ${roomError.message}`);
      }

      if (!room) {
        throw new Error('Oda oluşturuldu ancak veri döndürülmedi');
      }

      console.log('✅ Room created successfully:', (room as any).id);

      // Odayı oluşturan kişiyi otomatik olarak üye yap
      console.log('👥 Adding creator as member...');
      const { error: memberError } = await supabase
        .from('watch_room_members')
        .upsert({
          room_id: (room as any).id,
          user_id: user.id,
          joined_at: new Date().toISOString()
        }, {
          onConflict: 'room_id,user_id'
        });

      if (memberError) {
        console.error('❌ Member addition error:', memberError);
        // Bu hata kritik değil, sadece log'la
        console.warn('Creator could not be added as member:', memberError.message);
      } else {
        console.log('✅ Creator added as member successfully');
      }

      console.log('🎉 Room creation process completed');
      onSuccess(room);
      handleClose();
    } catch (err: any) {
      console.error('💥 Room creation failed:', err);
      setError(err.message || 'Bilinmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setVideoUrl('');
    setIsPrivate(false);
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Yeni İzleme Odası</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Input
            value={name}
            onChangeText={setName}
            placeholder="Oda adını girin"
            leftIcon={<Video size={20} color={Colors.darkGray[400]} />}
          />

          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Oda açıklamasını girin"
            multiline
          />

          <Input
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="İzlenecek videonun linkini girin"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.privateToggle}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <View style={[styles.checkbox, isPrivate && styles.checkboxChecked]}>
              <Lock size={16} color={isPrivate ? Colors.text.primary : Colors.text.secondary} />
            </View>
            <Text style={styles.privateText}>Şifreli Oda</Text>
          </TouchableOpacity>

          {isPrivate && (
            <Input
              label="Şifre"
              value={password}
              onChangeText={setPassword}
              placeholder="Oda şifresini girin"
              secureTextEntry
              leftIcon={<Lock size={20} color={Colors.darkGray[400]} />}
            />
          )}

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            title="Oda Oluştur"
            onPress={handleCreate}
            variant="primary"
            size="large"
            isLoading={loading}
            style={styles.createButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  privateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.darkGray[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  privateText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  createButton: {
    marginTop: Spacing.md,
  },
});