import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useThemeStore } from '../../store/themeStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminGenresScreen() {
  const { COLORS } = useThemeStore();
  const styles = getStyles(COLORS);
  const router = useRouter();

  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState('#E91E63');
  const [icon, setIcon] = useState('musical-note');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('genres').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setGenres(data || []);
    }
    setLoading(false);
  };

  const handleAddGenre = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    
    setIsSubmitting(true);
    const { error } = await supabase.from('genres').insert([{
      name: name.trim(),
      color: color.trim(),
      icon: icon.trim(),
      image_url: imageUrl.trim() || null
    }]);

    setIsSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Genre added successfully!');
      setName('');
      setImageUrl('');
      fetchGenres();
    }
  };

  const handleDeleteGenre = async (id: string, genreName: string) => {
    Alert.alert('Delete Genre', `Are you sure you want to delete ${genreName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('genres').delete().eq('id', id);
        if (error) Alert.alert('Error', error.message);
        else fetchGenres();
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Genres</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={genres}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Add New Genre</Text>
            
            <Text style={styles.label}>Genre Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Bongo Flava" placeholderTextColor={COLORS.textTertiary} value={name} onChangeText={setName} />
            
            <Text style={styles.label}>Brand Color (Hex)</Text>
            <TextInput style={styles.input} placeholder="e.g. #FF0000" placeholderTextColor={COLORS.textTertiary} value={color} onChangeText={setColor} />
            
            <Text style={styles.label}>Ionicons Icon Name</Text>
            <TextInput style={styles.input} placeholder="e.g. musical-note" placeholderTextColor={COLORS.textTertiary} value={icon} onChangeText={setIcon} autoCapitalize="none" />
            
            <Text style={styles.label}>Cover Image URL (Optional)</Text>
            <TextInput style={styles.input} placeholder="https://..." placeholderTextColor={COLORS.textTertiary} value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" />
            
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddGenre} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color={COLORS.black} /> : <Text style={styles.submitBtnText}>Add Genre</Text>}
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.genreCard}>
            <View style={[styles.colorIndicator, { backgroundColor: item.color || COLORS.textTertiary }]} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.genreName}>{item.name}</Text>
              <Text style={styles.genreMeta}>Icon: {item.icon}</Text>
            </View>
            <TouchableOpacity style={{ padding: 8 }} onPress={() => handleDeleteGenre(item.id, item.name)}>
              <Ionicons name="trash" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={loading ? <ActivityIndicator color={COLORS.gold} /> : <Text style={styles.emptyText}>No genres found.</Text>}
      />
    </View>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  formContainer: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, marginBottom: 24 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', color: COLORS.textPrimary, padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  submitBtn: { backgroundColor: COLORS.gold, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: COLORS.black, fontSize: 16, fontWeight: '800' },
  genreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginBottom: 12 },
  colorIndicator: { width: 40, height: 40, borderRadius: 20 },
  genreName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  genreMeta: { color: COLORS.textTertiary, fontSize: 12, marginTop: 4 },
  emptyText: { color: COLORS.textTertiary, textAlign: 'center', marginTop: 40 }
});
