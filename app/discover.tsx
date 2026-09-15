import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';
import { Track } from '../constants';
import { useThemeStore } from '../store/themeStore';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '../store/playerStore';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

export default function DiscoverScreen() {
  const router = useRouter();
  const { COLORS } = useThemeStore();
  const insets = useSafeAreaInsets();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const { pausePlayer } = usePlayerStore(); // Pause global player when swiping

  useEffect(() => {
    fetchDiscoverTracks();
    return () => {
      stopAudio();
    };
  }, []);

  useEffect(() => {
    if (tracks.length > 0) {
      playAudio(tracks[currentIndex].audio_url);
    }
  }, [currentIndex, tracks]);

  const fetchDiscoverTracks = async () => {
    setLoading(true);
    // Fetch random public tracks. Limit to 20 for performance.
    const { data, error } = await supabase
      .from('tracks')
      .select('*, profile:profiles(*)')
      .eq('is_public', true)
      .limit(20);

    if (error) {
      console.error('Error fetching discover tracks:', error);
    } else if (data) {
      // Simple shuffle
      const shuffled = data.sort(() => 0.5 - Math.random());
      setTracks(shuffled);
    }
    setLoading(false);
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const playAudio = async (url: string) => {
    await stopAudio();
    pausePlayer(); // Pause the main global player
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
    } catch (e) {
      console.log('Error playing preview:', e);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.black, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.black }]}>
      <FlatList
        data={tracks}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <View style={[styles.slide, { height: WINDOW_HEIGHT }]}>
            <Image 
              source={item.cover_url ? { uri: item.cover_url } : require('../assets/default-cover.png')} 
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.9)']}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={[styles.contentOverlay, { paddingBottom: insets.bottom + 80 }]}>
              <View style={styles.infoArea}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.artist}>@{item.profile?.username || 'unknown'}</Text>
                {item.genre && (
                  <View style={styles.genreBadge}>
                    <Text style={styles.genreText}>{item.genre}</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionsArea}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="heart-outline" size={32} color="#fff" />
                  <Text style={styles.actionText}>{item.like_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="chatbubble-ellipses-outline" size={32} color="#fff" />
                  <Text style={styles.actionText}>{item.comment_count || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="share-social-outline" size={32} color="#fff" />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => {
                    const { playTrack, currentTrack } = usePlayerStore.getState();
                    if (currentTrack?.id !== item.id) {
                      playTrack(item, [item]);
                    }
                    router.push('/player');
                  }}
                >
                  <View style={styles.vinylSpin}>
                    <Ionicons name="play" size={20} color="#000" style={{ marginLeft: 2 }} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Header Overlay */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => { stopAudio(); router.push('/search'); }}>
          <Ionicons name="search" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { width: WINDOW_WIDTH, justifyContent: 'flex-end' },
  headerOverlay: { position: 'absolute', top: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 10 },
  iconBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  contentOverlay: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16 },
  infoArea: { flex: 1, paddingRight: 16 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 4 },
  artist: { color: '#ddd', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  genreBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  genreText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actionsArea: { alignItems: 'center', paddingBottom: 10 },
  actionBtn: { alignItems: 'center', marginBottom: 20 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 4 },
  vinylSpin: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', marginTop: 10, borderWidth: 2, borderColor: '#fff' },
});
