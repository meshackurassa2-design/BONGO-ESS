const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://bwrpkxhpfrkgaqvukcvl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnBreGhwZnJrZ2FxdnVrY3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzEwMzksImV4cCI6MjA2MjcwNzAzOX0.nMiJmzblTVpGGqBrtQB5e1LOAFHEpCLrLEoaFCaA6NQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Get some existing tracks
  const { data, error } = await supabase.from('tracks').select('id, genre').limit(10);
  if (error) {
    console.error('Error fetching tracks:', error);
    return;
  }
  
  if (data && data.length >= 2) {
    // Update first one to Afrobeats
    await supabase.from('tracks').update({ genre: 'Afrobeats' }).eq('id', data[0].id);
    console.log(`Updated track ${data[0].id} to Afrobeats`);
    
    // Update second one to Taarab
    await supabase.from('tracks').update({ genre: 'Taarab' }).eq('id', data[1].id);
    console.log(`Updated track ${data[1].id} to Taarab`);
    
    // Update third one to Singeli if it exists
    if (data[2]) {
      await supabase.from('tracks').update({ genre: 'Singeli' }).eq('id', data[2].id);
      console.log(`Updated track ${data[2].id} to Singeli`);
    }
  } else {
    console.log('Not enough tracks found to update.');
  }
}

run();
