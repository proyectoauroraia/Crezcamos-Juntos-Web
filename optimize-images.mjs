import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ASSETS_DIR = './assets';
const BACKUP_DIR = './assets/originals';
const OPTIMIZED_DIR = './assets/optimized';

// Configuration per image - output names are lowercase
const images = [
  { file: 'hero-image.jpg', outputName: 'hero-image', maxWidth: 1200, quality: 80 },
  { file: '2.JPG',          outputName: '2',           maxWidth: 900,  quality: 80 },
  { file: '3.jpg',          outputName: '3',           maxWidth: 900,  quality: 80 },
];

async function optimize() {
  // Create directories
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(OPTIMIZED_DIR)) fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });

  console.log('🖼️  Optimización de imágenes con Sharp\n');
  console.log('='.repeat(60));

  for (const img of images) {
    const inputPath = path.join(ASSETS_DIR, img.file);
    const backupPath = path.join(BACKUP_DIR, img.file);

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  No encontrado: ${img.file}, saltando...`);
      continue;
    }

    const originalSize = fs.statSync(inputPath).size;

    // Backup original
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputPath, backupPath);
    }
    console.log(`\n📁 ${img.file} (Original: ${(originalSize / 1024).toFixed(0)} KB)`);
    console.log(`   ✅ Respaldo en: ${backupPath}`);

    const metadata = await sharp(inputPath).metadata();
    console.log(`   📐 Dimensiones originales: ${metadata.width}x${metadata.height}`);

    // 1. Generate optimized JPG into the optimized folder first
    const tempJpg = path.join(OPTIMIZED_DIR, `${img.outputName}.jpg`);
    await sharp(inputPath)
      .resize(img.maxWidth, null, { withoutEnlargement: true, fit: 'inside' })
      .jpeg({ quality: img.quality, mozjpeg: true })
      .toFile(tempJpg);

    // 2. Generate WebP version directly in assets
    const webpPath = path.join(ASSETS_DIR, `${img.outputName}.webp`);
    await sharp(inputPath)
      .resize(img.maxWidth, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: img.quality })
      .toFile(webpPath);

    // 3. Replace the original file with the optimized JPG
    // Delete the original first then copy
    fs.unlinkSync(inputPath);
    const finalJpg = path.join(ASSETS_DIR, `${img.outputName}.jpg`);
    fs.copyFileSync(tempJpg, finalJpg);

    // Report
    const newJpgSize = fs.statSync(finalJpg).size;
    const newWebpSize = fs.statSync(webpPath).size;
    const newMeta = await sharp(finalJpg).metadata();

    console.log(`   📐 Nuevas dimensiones: ${newMeta.width}x${newMeta.height}`);
    console.log(`   📦 JPG optimizado: ${(newJpgSize / 1024).toFixed(0)} KB (${((1 - newJpgSize / originalSize) * 100).toFixed(0)}% reducción)`);
    console.log(`   📦 WebP: ${(newWebpSize / 1024).toFixed(0)} KB (${((1 - newWebpSize / originalSize) * 100).toFixed(0)}% reducción)`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN TOTAL');
  console.log('='.repeat(60));

  let totalOriginal = 0;
  let totalWebp = 0;
  let totalJpg = 0;

  for (const img of images) {
    const backupPath = path.join(BACKUP_DIR, img.file);
    const webpPath = path.join(ASSETS_DIR, `${img.outputName}.webp`);
    const jpgPath = path.join(ASSETS_DIR, `${img.outputName}.jpg`);

    if (fs.existsSync(backupPath)) {
      totalOriginal += fs.statSync(backupPath).size;
    }
    if (fs.existsSync(webpPath)) {
      totalWebp += fs.statSync(webpPath).size;
    }
    if (fs.existsSync(jpgPath)) {
      totalJpg += fs.statSync(jpgPath).size;
    }
  }

  console.log(`\n   Original total:     ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   JPG optimizado:     ${(totalJpg / 1024 / 1024).toFixed(2)} MB (${((1 - totalJpg / totalOriginal) * 100).toFixed(0)}% reducción)`);
  console.log(`   WebP total:         ${(totalWebp / 1024 / 1024).toFixed(2)} MB (${((1 - totalWebp / totalOriginal) * 100).toFixed(0)}% reducción)`);
  console.log('\n✅ Originales respaldados en: assets/originals/');
  console.log('✅ WebP generados en: assets/*.webp');
  console.log('✅ JPGs optimizados reemplazaron a los originales');
}

optimize().catch(console.error);
