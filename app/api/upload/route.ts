import { NextResponse } from 'next/server';
import { r2 } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

// Force dynamic to prevent static caching of this route
export const dynamic = 'force-dynamic';

// --- CONFIGURATION ---
const STANDARD_SIZE = 1000; 

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. Convert the uploaded file to a Buffer
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    
    // 2. Process the image using 'sharp'
    const processedBuffer = await sharp(inputBuffer)
      .resize({
        width: STANDARD_SIZE,
        height: STANDARD_SIZE,
        fit: sharp.fit.contain,
        background: { r: 255, g: 255, b: 255, alpha: 1 } 
      })
      .toFormat('webp', { quality: 85 }) 
      .toBuffer();

    // 3. Generate a unique file name
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.webp`;
    
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
        throw new Error("R2_BUCKET_NAME is not defined in environment variables");
    }

    // 4. Upload to Cloudflare R2
    await r2.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: processedBuffer,
      ContentType: 'image/webp',
    }));

    // 5. Construct the public URL (FIXED)
    let domain = process.env.NEXT_PUBLIC_R2_DOMAIN?.replace(/\/$/, '') || '';
    
    if (!domain) {
        throw new Error("NEXT_PUBLIC_R2_DOMAIN is not defined");
    }

    // --- FIX: Ensure domain starts with https:// ---
    if (!domain.startsWith("http")) {
        domain = `https://${domain}`;
    }

    const publicUrl = `${domain}/${uniqueFileName}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl 
    });

  } catch (error: any) {
    console.error('Image Processing/Upload Error:', error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}