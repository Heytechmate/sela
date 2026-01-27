import { NextResponse } from 'next/server';
import { r2 } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

// Force dynamic to prevent static caching of this route
export const dynamic = 'force-dynamic';

// --- CONFIGURATION ---
// Define the standard size for all product images. 
// A 1000x1000 square is a good standard for e-commerce.
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
    // - resize: Create a square canvas of STANDARD_SIZE x STANDARD_SIZE.
    // - fit: 'contain': The entire image will fit within the box, preserving its aspect ratio.
    // - background: { r: 255, g: 255, b: 255 }: Fill any empty space with solid white.
    // - toFormat('webp'): Convert to the efficient WebP format.
    const processedBuffer = await sharp(inputBuffer)
      .resize({
        width: STANDARD_SIZE,
        height: STANDARD_SIZE,
        fit: sharp.fit.contain,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // Solid white background
      })
      .toFormat('webp', { quality: 85 }) // Standard good quality
      .toBuffer();

    // 3. Generate a unique file name with the .webp extension
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.webp`;
    
    // 4. Ensure R2 configuration exists
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
        throw new Error("R2_BUCKET_NAME is not defined in environment variables");
    }

    // 5. Upload the PROCESSED buffer to Cloudflare R2
    await r2.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: processedBuffer,
      ContentType: 'image/webp', // Content type is now always WebP
    }));

    // 6. Construct the public URL
    const domain = process.env.NEXT_PUBLIC_R2_DOMAIN?.replace(/\/$/, '');
    if (!domain) {
        throw new Error("NEXT_PUBLIC_R2_DOMAIN is not defined");
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