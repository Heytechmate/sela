import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
  }

  try {
    // Target Carrefour Qatar's Internal Data API directly
    // This is much faster and cleaner than scraping HTML
    const apiUrl = `https://www.carrefourqatar.com/api/v4/relevance/products?keyword=${encodeURIComponent(query)}&lang=en&sort=relevance&currentPage=0&pageSize=20`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'storeid': 'mafqat', // Required by Carrefour API
        'lang': 'en'
      }
    });

    if (!response.ok) {
        throw new Error(`Carrefour API returned ${response.status}`);
    }

    const data = await response.json();
    const products: any[] = [];

    if (data && data.data && Array.isArray(data.data.products)) {
        data.data.products.forEach((item: any) => {
            // Extract the highest resolution image
            let imageUrl = '';
            if (item.images && item.images.length > 0) {
                // Find the biggest image (usually type 'LARGE' or the last one)
                const imgObj = item.images.find((i: any) => i.size === 'LARGE') || item.images[0];
                imageUrl = imgObj.url || '';
            }

            products.push({
                name: item.name,
                price: item.price,
                original_price: item.oldPrice || item.price,
                stock: item.inStock ? 50 : 0, // API returns boolean, so we estimate qty
                image_url: imageUrl,
                brand: item.brand || 'Carrefour',
                sku: item.sku,
                category: item.categories?.[0]?.name || 'Imported',
                description: `Imported from Carrefour Qatar. SKU: ${item.sku}`
            });
        });
    }

    return NextResponse.json({ products });

  } catch (error: any) {
    console.error('Carrefour API Error:', error);
    return NextResponse.json({ products: [], error: error.message }, { status: 500 });
  }
}