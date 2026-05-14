// Run with: node scripts/seed-portfolio.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const supabase = createClient(
  'https://dkatgjtvhitknghvaxxn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXRnanR2aGl0a25naHZheHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTYxNDMsImV4cCI6MjA5MzQ5MjE0M30.fsxUDg76sYGOFBVhekoj0LszaQ2YNvqkAmDIMTZ6keU'
);

async function main() {
  const samplesDir = resolve(root, 'public', 'samples');
  const files = readdirSync(samplesDir).filter(f => /\.(jpg|png|webp)$/i.test(f));
  
  console.log(`Found ${files.length} sample images...`);
  
  for (const file of files) {
    const filePath = resolve(samplesDir, file);
    const buffer = readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from('portfolio')
      .upload(file, buffer, { upsert: true });
    
    if (error) {
      console.error(`❌ ${file}: ${error.message}`);
    } else {
      console.log(`✅ ${file}`);
    }
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
