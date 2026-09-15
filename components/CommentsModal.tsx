import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  trackId: string;
}

export default function CommentsModal({ visible, onClose, trackId }: CommentsModalProps) {
  const { COLORS } = useThemeStore();
  const styles = getStyles(COLORS);
  const session = useAuthStore(s => s.session);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (visible && trackId) {
      fetchComments();
    }
  }, [visible, trackId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('track_comments')
      .select('*, profile:profiles!track_comments_user_id_fkey(display_name, avatar_url)')
      .eq('track_id', trackId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching comments:', error);
    } else if (data) {
      setComments(data);
    }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!newComment.trim()) return;
    if (!session) {
      Alert.alert('Login Required', 'You must be logged in to comment.');
      return;
    }

    setIsPosting(true);
    const { data, error } = await supabase
      .from('track_comments')
      .insert({
        track_id: trackId,
        user_id: session.user.id,
        content: newComment.trim()
      })
      .select('*, profile:profiles!track_comments_user_id_fkey(display_name, avatar_url)')
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else if (data) {
      setComments([data, ...comments]);
      setNewComment('');
    }
    setIsPosting(false);
  };

  const handleDelete = (commentId: string, userId: string) => {
    if (session?.user.id !== userId) return;
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('track_comments').delete().eq('id', commentId);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            setComments(comments.filter(c => c.id !== commentId));
          }
        }
      }
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 20 }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textTertiary} />
                  <Text style={styles.emptyText}>No comments yet. Be the first to share your thoughts!</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.commentCard}>
                  <Image 
                    source={item.profile?.avatar_url ? { uri: item.profile.avatar_url } : require('../assets/default-avatar.png')} 
                    style={styles.avatar} 
                  />
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeaderRow}>
                      <Text style={styles.commentName}>{item.profile?.display_name || 'User'}</Text>
                      {session?.user.id === item.user_id && (
                        <TouchableOpacity onPress={() => handleDelete(item.id, item.user_id)}>
                          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.commentText}>{item.content}</Text>
                  </View>
                </View>
              )}
            />
          )}

          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.textTertiary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity 
              style={[styles.postBtn, !newComment.trim() && { opacity: 0.5 }]} 
              onPress={handlePost}
              disabled={isPosting || !newComment.trim()}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color={COLORS.black} />
              ) : (
                <Ionicons name="send" size={20} color={COLORS.black} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  content: { backgroundColor: COLORS.background, height: '75%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  closeBtn: { padding: 4 },
  commentCard: { flexDirection: 'row', marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: COLORS.card },
  commentBody: { flex: 1, backgroundColor: COLORS.card, padding: 12, borderRadius: 16, borderTopLeftRadius: 4 },
  commentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentName: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  commentText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 22 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: COLORS.textSecondary, marginTop: 16, textAlign: 'center', fontSize: 15, paddingHorizontal: 40, lineHeight: 22 },
  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: COLORS.divider, backgroundColor: COLORS.card },
  input: { flex: 1, backgroundColor: COLORS.background, color: COLORS.textPrimary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, fontSize: 15, maxHeight: 100 },
  postBtn: { backgroundColor: COLORS.gold, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 12 }
});
