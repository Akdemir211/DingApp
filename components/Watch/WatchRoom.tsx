// ... (önceki importlar aynı)

export const WatchRoom: React.FC<WatchRoomProps> = ({ roomId, room, onClose }) => {
  // ... (önceki state ve ref tanımlamaları aynı)
  const [users, setUsers] = useState<{[key: string]: {name: string, photoUrl: string | null}}>({});

  useEffect(() => {
    loadUsers();
    subscribeToPhotos();
    // ... (diğer effect içeriği)
  }, [roomId]);

  const loadUsers = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name');
      
      if (userError) throw userError;

      const { data: photoData, error: photoError } = await supabase
        .from('profile_photos')
        .select('user_id, photo_url');

      if (photoError) throw photoError;

      const userMap = (userData || []).reduce((acc: {[key: string]: {name: string, photoUrl: string | null}}, user) => {
        const photo = photoData?.find(p => p.user_id === user.id);
        acc[user.id] = { 
          name: user.name || 'Anonim Kullanıcı',
          photoUrl: photo?.photo_url || null
        };
        return acc;
      }, {});

      setUsers(userMap);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const subscribeToPhotos = () => {
    const subscription = supabase
      .channel('profile_photos_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_photos'
      }, () => {
        loadUsers();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  // ... (diğer fonksiyonlar aynı)

  return (
    // ... (header ve video player bölümü aynı)
    <ScrollView
      ref={scrollViewRef}
      style={styles.messagesContainer}
      contentContainerStyle={styles.messagesContent}
    >
      {messages.map((message, index) => {
        const isOwnMessage = message.user_id === user?.id;
        const showAvatar = !isOwnMessage && (!messages[index - 1] || messages[index - 1].user_id !== message.user_id);
        const userInfo = users[message.user_id];
        
        return (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              isOwnMessage ? styles.ownMessageWrapper : null
            ]}
          >
            {!isOwnMessage && showAvatar && (
              <Image 
                source={{ 
                  uri: userInfo?.photoUrl || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' 
                }} 
                style={styles.avatar} 
              />
            )}
            <View style={[
              styles.messageContainer,
              isOwnMessage ? styles.ownMessage : styles.otherMessage
            ]}>
              {!isOwnMessage && showAvatar && (
                <Text style={styles.messageSender}>{userInfo?.name}</Text>
              )}
              <Text style={styles.messageText}>{message.content}</Text>
              <Text style={styles.messageTime}>
                {formatTime(message.created_at)}
              </Text>
            </View>
          </View>
        );
      })}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
    // ... (input container aynı)
  );
};

const styles = StyleSheet.create({
  // ... (mevcut stiller aynı)
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.xs,
  },
  // ... (diğer stiller)
});