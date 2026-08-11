import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Track } from '../constants';
import { useThemeStore } from '../store/themeStore';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  track: Track | null;
  quote?: string;
}

// Bug 7: Font style options for the lyric quote
const FONT_STYLES = [
  { label: 'Bold',   fontFamily: 'Outfit_900Black',     fontStyle: 'normal' as const },
  { label: 'Light',  fontFamily: 'Outfit_400Regular',   fontStyle: 'normal' as const },
  { label: 'Semi',   fontFamily: 'Outfit_600SemiBold',  fontStyle: 'normal' as const },
  { label: 'Italic', fontFamily: 'Outfit_700Bold',      fontStyle: 'italic' as const },
  { label: 'Script', fontFamily: 'serif',               fontStyle: 'normal' as const },
  { label: 'Mono',   fontFamily: 'monospace',           fontStyle: 'normal' as const },
];

export default function ShareCardModal({ visible, onClose, track, quote: initialQuote }: Props) {
  const { COLORS } = useThemeStore();
  const styles = getStyles(COLORS);
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
      <View style={styles.modalBg}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Quote</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Bug 7: Font Style Picker — above the card, not inside the captured ViewShot */}
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
                  style={[
                    styles.fontPill,
                    isSelected && styles.fontPillActive,
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.fontPillText,
                      isSelected && styles.fontPillTextActive,
                      { fontFamily: f.fontFamily, fontStyle: f.fontStyle },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Share Card (captured by ViewShot) */}
        <View style={styles.cardContainer}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <View style={styles.shareCard}>
              <LinearGradient
                colors={['#C1451F', '#B33C17']}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Track Info Header */}
              <View style={styles.cardHeader}>
                <Image source={{ uri: track.cover_url }} style={styles.trackCover} />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.artistName}>{track.artist_name}</Text>
                </View>
              </View>

              {/* Lyric Quote — uses the selected font family */}
              <View style={styles.quoteWrap}>
                <Text
                  style={[
                    styles.quoteText,
                    {
                      fontFamily: activeFont.fontFamily,
                      fontStyle: activeFont.fontStyle,
                    },
                  ]}
                  numberOfLines={6}
                >
                  {quote}
                </Text>
              </View>

              {/* Watermark */}
              <View style={styles.watermarkBox}>
                <Image source={require('../assets/images/bongo_logo.png')} style={{ width: 28, height: 28, marginRight: 8, borderRadius: 6 }} />
                <Text style={styles.watermarkText}>Bongo Stream</Text>
              </View>
            </View>
          </ViewShot>
        </View>

        {/* Share Button */}
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
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  header: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10 },
  closeBtn: { padding: 8, width: 44, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Bug 7: Font picker styles
  fontPickerSection: {
    paddingTop: 110,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  fontPickerLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  fontPickerRow: {
    gap: 10,
    paddingHorizontal: 4,
  },
  fontPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
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
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  fontPillTextActive: {
    color: '#000',
    fontWeight: '800',
  },

  cardContainer: {
    alignItems: 'center',
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
  trackCover: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  artistName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  quoteWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  quoteText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  watermarkBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watermarkText: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#fff',
    fontSize: 18,
    letterSpacing: -0.5,
  },

  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '800',
  },
});
