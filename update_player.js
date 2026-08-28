const fs = require('fs');
const path = require('path');

const playerPath = path.join(__dirname, 'app', 'player.tsx');
let content = fs.readFileSync(playerPath, 'utf8');

function norm(s) {
  return s.replace(/\r\n/g, '\n');
}

// Normalize newlines so template literals match exactly
content = norm(content);

// 1. Add EQ State
const stateTarget = `const [showQueueModal, setShowQueueModal] = useState(false);`;
const stateReplacement = `const [showQueueModal, setShowQueueModal] = useState(false);
  const [eqBands, setEqBands] = useState([0.5, 0.5, 0.5, 0.5, 0.5]); // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz`;
content = content.replace(norm(stateTarget), norm(stateReplacement));

// 2. Wrap root in ScrollView
const rootTarget = `  return (
    <View style={[styles.container, { paddingTop: insets.top + 28 }]}>
      {/* Canvas Video Background */}`;
const rootReplacement = `  return (
    <View style={styles.container}>
      {/* Canvas Video Background */}
      <View style={StyleSheet.absoluteFillObject}>`;
content = content.replace(norm(rootTarget), norm(rootReplacement));

// 3. Fix the LinearGradient and start ScrollView
const gradientTarget = `      <LinearGradient colors={['rgba(26,26,26,0.7)', COLORS.black]} style={StyleSheet.absoluteFillObject} />`;
const gradientReplacement = `      <LinearGradient colors={['rgba(26,26,26,0.7)', COLORS.black]} style={StyleSheet.absoluteFillObject} />
      </View>
      <ScrollView style={StyleSheet.absoluteFillObject} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ minHeight: Dimensions.get('window').height, paddingTop: insets.top + 28, paddingBottom: insets.bottom + 80, justifyContent: 'space-between' }}>`;
content = content.replace(norm(gradientTarget), norm(gradientReplacement));

// 4. Add Bottom Content & Close ScrollView
const endTarget = `      {/* Sleep Timer Modal */}`;
const endReplacement = `      </View>

        {/* --- BOTTOM CONTENT --- */}
        <View style={{ padding: 24, paddingBottom: 100, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          {/* Lyrics Section */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Lyrics</Text>
            <View style={{ backgroundColor: COLORS.cardAlt, padding: 20, borderRadius: 16 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 16, lineHeight: 24, fontWeight: '500' }}>
                {currentTrack.lyrics || currentTrack.lyrics_swahili || currentTrack.lyrics_english || "Lyrics aren't available for this song yet. Check back later!"}
              </Text>
            </View>
          </View>

          {/* Up Next Section */}
          <View>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Up Next</Text>
            {queue.slice(0, 10).map((item, idx) => (
              <TouchableOpacity
                key={item.id + '-' + idx}
                activeOpacity={0.7}
                onPress={() => {
                  const { playTrack, queue: q } = usePlayerStore.getState();
                  playTrack(item, q);
                }}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginBottom: 12,
                  backgroundColor: currentTrack?.id === item.id ? 'rgba(212,175,55,0.1)' : 'transparent',
                  padding: 8,
                  borderRadius: 12,
                  marginHorizontal: -8
                }}
              >
                <Image source={{ uri: item.cover_url }} style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: currentTrack?.id === item.id ? COLORS.gold : COLORS.textPrimary, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>{item.title}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 14 }} numberOfLines={1}>{item.artist_name}</Text>
                </View>
                {currentTrack?.id === item.id && (
                  <Ionicons name="volume-medium" size={18} color={COLORS.gold} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sleep Timer Modal */}`;
content = content.replace(norm(endTarget), norm(endReplacement));


// 5. Replace Audio Effects Modal with Equalizer UI
const fxTargetStart = `{/* Audio Effects Modal */}`;
const fxTargetEnd = `</Modal>`;
// Extract the fx block
const parts = content.split(norm(fxTargetStart));
if (parts.length > 1) {
  const innerParts = parts[1].split(norm(fxTargetEnd));
  
  const fxReplacement = `{/* Audio Effects Modal */}
      <Modal visible={showFxModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View>
                <Text style={styles.modalTitle}>Audio Effects</Text>
                <Text style={styles.modalSub}>Speed & Equalizer</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFxModal(false)} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Pitch & Speed */}
              <View style={{ marginBottom: 30, backgroundColor: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Playback Speed</Text>
                  <Text style={{ color: COLORS.gold, fontWeight: '700' }}>{playbackRate.toFixed(2)}x</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0.5}
                  maximumValue={2.0}
                  step={0.1}
                  value={playbackRate}
                  onValueChange={setPlaybackRate}
                  minimumTrackTintColor={COLORS.gold}
                  maximumTrackTintColor={COLORS.divider}
                  thumbTintColor={COLORS.gold}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -10 }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Slow</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Fast</Text>
                </View>
                
                {playbackRate !== 1.0 && (
                  <TouchableOpacity onPress={() => setPlaybackRate(1.0)} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                    <Text style={{ color: COLORS.gold, fontSize: 13, fontWeight: '600' }}>Reset Speed</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Graphic Equalizer */}
              <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Music Equalizer</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>Custom</Text>
                </View>
                
                {/* Sliders */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 150, paddingHorizontal: 10 }}>
                  {['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'].map((label, idx) => (
                    <View key={idx} style={{ alignItems: 'center' }}>
                      <View style={{ height: 120, width: 40, justifyContent: 'center', alignItems: 'center' }}>
                        {/* Vertical Slider implementation using transform */}
                        <Slider
                          style={{ width: 120, height: 40, transform: [{ rotate: '-90deg' }] }}
                          minimumValue={0}
                          maximumValue={1}
                          step={0.05}
                          value={eqBands[idx]}
                          onValueChange={(val) => {
                            const newBands = [...eqBands];
                            newBands[idx] = val;
                            setEqBands(newBands);
                          }}
                          minimumTrackTintColor={COLORS.gold}
                          maximumTrackTintColor={COLORS.divider}
                          thumbTintColor={COLORS.gold}
                        />
                      </View>
                      <Text style={{ color: COLORS.textTertiary, fontSize: 10, marginTop: 8, fontWeight: '600' }}>{label}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Presets */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                  <TouchableOpacity onPress={() => setEqBands([0.8, 0.6, 0.4, 0.6, 0.7])} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' }}>
                    <Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: '600' }}>Bass Boost</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEqBands([0.3, 0.4, 0.8, 0.7, 0.5])} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' }}>Vocal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEqBands([0.5, 0.5, 0.5, 0.5, 0.5])} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' }}>Flat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
`;
  
  content = parts[0] + norm(fxReplacement) + innerParts.slice(1).join(norm(fxTargetEnd));
}

fs.writeFileSync(playerPath, content);
console.log('Successfully updated player.tsx');
