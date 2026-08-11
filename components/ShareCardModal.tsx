import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Track } from '../constants';
import { useThemeStore } from '../store/themeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  track: Track | null;
  quote?: string;
}

const FONT_STYLES = [
  { label: 'Bold',   fontFamily: 'Outfit_900Black',    fontStyle: 'normal' as const },
  { label: 'Light',  fontFamily: 'Outfit_400Regular',  fontStyle: 'normal' as const },
  { label: 'Semi',   fontFamily: 'Outfit_600SemiBold', fontStyle: 'normal' as const },
  { label: 'Italic', fontFamily: 'Outfit_700Bold',     fontStyle: 'italic' as const },
  { label: 'Script', fontFamily: 'serif',              fontStyle: 'normal' as const },
  { label: 'Mono',   fontFamily: 'monospace',          fontStyle: 'normal' as const },
];

export default function ShareCardModal({ visible, onClose, track, quote: initialQuote }: Props) {
  const { COLORS } = useThemeStore();
  const styles = getStyles(COLORS);
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);
  const [selectedFontIndex, setSelectedFontIndex] = useState(0);

  const handleShare = async () => {
    if (!viewShotRef.current?.capture) return;
    try {
      setSharing(true);
      const uri = await viewShotRef.current.capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: `Share ${track?.title}`,
          mimeType: 'image/png',
        });
      }
    } catch (e) {
      console.error('Error sharing card:', e);
    } finally {
      setSharing(false);
      onClose();
    }
  };

  if (!track) return null;

  const quote = initialQuote || "Maybe you should wish it more\nMaybe the world is yours";
  const activeFont = FONT_STYLES[selectedFontIndex];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalBg, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Quote</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* ── Font Style Picker ── */}
        <View style={styles.fontPickerSection}>
          <Text style={styles.fontPickerLabel}>Font Style</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fontPickerRow}
          >
            {FONT_STYLES.map((f, idx) => {
              const isSelected = idx === selectedFontIndex;
              return (
                <TouchableOpacity
                  key={f.label}
                  onPress={() => setSelectedFontIndex(idx)}
                  style={[styles.fontPill, isSelected && styles.fontPillActive]}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.fontPillText,
                    isSelected && styles.fontPillTextActive,
                    { fontFamily: f.fontFamily, fontStyle: f.fontStyle },
                  ]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Share Card ── */}
        <View style={styles.cardContainer}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <View style={styles.shareCard}>
              <LinearGradient colors={['#C1451F', '#B33C17']} style={StyleSheet.absoluteFillObject} />

              {/* Track info */}
              <View style={styles.cardHeader}>
                <Image source={{ uri: track.cover_url }} style={styles.trackCover} />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                  <Text style={styles.artistName} numberOfLines={1}>{track.artist_name}</Text>
                </View>
              </View>

              {/* Lyric quote — selected font applied here inside the capture area */}
              <View style={styles.quoteWrap}>
                <Text style={[styles.quoteText, {
                  fontFamily: activeFont.fontFamily,
                  fontStyle: activeFont.fontStyle,
                }]} numberOfLines={6}>
                  {quote}
                </Text>
              </View>

              {/* Watermark */}
              <View style={styles.watermarkBox}>
                <Image source={require('../assets/images/bongo_logo.png')} style={{ width: 26, height: 26, marginRight: 8, borderRadius: 6 }} />
                <Text style={styles.watermarkText}>Bongo Stream</Text>
              </View>
            </View>
          </ViewShot>
        </View>

        {/* ── Share Button ── */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
            {sharing ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <>
                <Ionicons name="share-social" size={22} color={COLORS.black} style={{ marginRight: 8 }} />
                <Text style={styles.shareBtnText}>Share to Story</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  // Full-screen dark overlay, column layout — no absolute positioning = no empty space
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeBtn: { padding: 8, width: 44, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // ── Font Picker ──
  fontPickerSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  fontPickerLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  fontPickerRow: {
    gap: 8,
    paddingHorizontal: 4,
  },
  fontPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  fontPillActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  fontPillText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  fontPillTextActive: {
    color: '#000',
    fontWeight: '800',
  },

  // ── Card ──
  cardContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  shareCard: {
    width: width * 0.85,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackCover: { width: 48, height: 48, borderRadius: 6 },
  trackInfo: { flex: 1 },
  trackTitle: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#fff',
    fontSize: 15,
    marginBottom: 2,
  },
  artistName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  quoteWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  quoteText: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  watermarkBox: { flexDirection: 'row', alignItems: 'center' },
  watermarkText: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#fff',
    fontSize: 16,
    letterSpacing: -0.5,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: width * 0.85,
    justifyContent: 'center',
  },
  shareBtnText: {
    color: COLORS.black,
    fontSize: 17,
    fontWeight: '800',
  },
});
