import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';


import CreateTab from '../../components/ai/CreateTab';
import UploadCoverTab from '../../components/ai/UploadCoverTab';
import WorkspaceTab from '../../components/ai/WorkspaceTab';
import PersonasTab from '../../components/ai/PersonasTab';
import SoundsTab from '../../components/ai/SoundsTab';
import AILyricsModal from '../../components/ai/AILyricsModal';
import ExtractPersonaModal from '../../components/ai/ExtractPersonaModal';

type TabType = 'Create' | 'Cover' | 'Sounds' | 'Personas';
const TABS: TabType[] = ['Create', 'Cover', 'Sounds', 'Personas'];

export default function AIStudioScreen() {
  const { COLORS } = useThemeStore();
  const styles = getStyles(COLORS);
  const router = useRouter();
  const { tool } = useLocalSearchParams<{ tool: TabType }>();
  const { profile } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('Create');
  
  useEffect(() => {
    if (tool && TABS.includes(tool)) {
      setActiveTab(tool);
    }
  }, [tool]);
  
  // Modals state
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [extractAudioId, setExtractAudioId] = useState<string | null>(null);
  const [extractTaskId, setExtractTaskId] = useState<string | null>(null);
  
  // For passing back generated lyrics to CreateTab
  const [lyricsCallback, setLyricsCallback] = useState<((lyrics: string) => void) | null>(null);

  const openLyricsModal = (onComplete: (lyrics: string) => void) => {
    setLyricsCallback(() => onComplete);
    setShowLyricsModal(true);
  };

  const handleLyricsComplete = (lyrics: string) => {
    if (lyricsCallback) {
      lyricsCallback(lyrics);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      {/* Cinematic Header */}
      <View style={styles.customHeader}>
        <View>
          <Text style={styles.studioLabel}>PRO STUDIO</Text>
          <Text style={styles.headerTitle}>
            {activeTab === 'Create' ? 'AI Composer' : activeTab === 'Personas' ? 'Voice Models' : activeTab === 'Cover' ? 'Artwork Engine' : activeTab === 'Sounds' ? 'SFX Generator' : 'AI Studio'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.creditBadge, (profile?.credits || 0) <= 2 ? { backgroundColor: COLORS.gold } : {}]} 
          onPress={() => router.push('/buy-credits')}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['rgba(212,175,55,0.2)', 'rgba(212,175,55,0.05)']} style={StyleSheet.absoluteFill} />
          <Ionicons name="diamond" size={14} color={(profile?.credits || 0) <= 2 ? COLORS.black : COLORS.gold} />
          <Text style={[styles.creditText, (profile?.credits || 0) <= 2 && { color: COLORS.black }]}>
            {profile?.credits || 0} Credits
          </Text>
          <Ionicons name="add-circle" size={16} color={(profile?.credits || 0) <= 2 ? COLORS.black : COLORS.gold} />
        </TouchableOpacity>
      </View>
      
      {/* Floating Glassmorphism Navigation */}
      <View style={styles.tabContainer}>
        <BlurView intensity={40} tint="dark" style={styles.glassTabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {TABS.map(tab => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity 
                  key={tab} 
                  style={[styles.tab, isActive && styles.activeTab]} 
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  {isActive && (
                    <LinearGradient 
                      colors={['rgba(212, 175, 55, 0.4)', 'rgba(212, 175, 55, 0.1)']} 
                      start={{x: 0, y: 0}} end={{x: 0, y: 1}}
                      style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                    />
                  )}
                  <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </BlurView>
      </View>

      <View style={styles.content}>
        {activeTab === 'Create' && (
          <CreateTab 
            onGenerateSuccess={() => router.push('/library')} 
            openLyricsModal={openLyricsModal} 
          />
        )}
        {activeTab === 'Cover' && (
          <UploadCoverTab 
            onGenerateSuccess={() => router.push('/library')} 
            openLyricsModal={openLyricsModal}
          />
        )}
        {activeTab === 'Sounds' && (
          <SoundsTab 
            onGenerateSuccess={() => router.push('/library')} 
          />
        )}
        {activeTab === 'Personas' && (
          <PersonasTab />
        )}
      </View>
      
      <AILyricsModal 
        visible={showLyricsModal} 
        onClose={() => setShowLyricsModal(false)} 
        onComplete={handleLyricsComplete} 
      />

      <ExtractPersonaModal 
        audioId={extractAudioId} 
        taskId={extractTaskId}
        onClose={() => { setExtractAudioId(null); setExtractTaskId(null); }} 
      />
    </SafeAreaView>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  customHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  studioLabel: { color: COLORS.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  creditBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', overflow: 'hidden' },
  creditText: { color: COLORS.gold, fontSize: 13, fontWeight: '800' },
  
  tabContainer: { paddingHorizontal: 16, marginBottom: 12, zIndex: 10 },
  glassTabs: { borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.4)' },
  tabScroll: { paddingHorizontal: 6, paddingVertical: 6, gap: 4 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 },
  activeTab: { backgroundColor: 'transparent' },
  tabText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14, letterSpacing: 0.5 },
  activeTabText: { color: COLORS.gold, fontWeight: '800', textShadowColor: 'rgba(212,175,55,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  
  content: { flex: 1 },
});
