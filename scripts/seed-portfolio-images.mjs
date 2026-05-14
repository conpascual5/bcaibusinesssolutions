// Run with: node scripts/seed-portfolio-images.mjs
// Uploads sample images from public/samples/ to the Supabase portfolio bucket
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SUPABASE_URL = 'https://dkatgjtvhitknghvaxxn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXRnanR2aGl0a25naHZheHhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkxNjE0MywiZXhwIjoyMDkzNDkyMTQzfQ.6tQq0vQq0vQq0vQq0vQq0vQq0vQq0vQq0vQq0vQq0vQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const samplesDir = resolve(root, 'public', 'samples');
  
  try {
    const files = readdirSync(samplesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
    
    if (files.length === 0) {
      console.log('No sample images found in public/samples/');
      return;
    }
    
    console.log(`Found ${files.length} sample images to upload...`);
    
    for (const file of files) {
      const filePath = resolve(samplesDir, file);
      const fileBuffer = readFileSync(filePath);
      
      const { data, error } = await supabase.storage
        .from('portfolio')
        .upload(file, fileBuffer, {
          contentType: `image/${file.split('.').pop()}`,
          upsert: true,
        });
      
      if (error) {
        console.error(`Failed to upload ${file}:`, error.message);
      } else {
        console.log(`✅ Uploaded: ${file}`);
      }
    }
    
    console.log('\nDone! Refresh the landing page to see the images.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
