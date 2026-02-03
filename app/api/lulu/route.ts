import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const directUrl = searchParams.get('url');

  if (!query && !directUrl) {
    return NextResponse.json({ error: 'Missing query or url param' }, { status: 400 });
  }

  // Determine target URL
  let targetUrl = '';
  if (directUrl) {
    targetUrl = directUrl;
  } else {
    // Lulu Search URL structure
    targetUrl = `https://gcc.luluhypermarket.com/en-qa/search/?text=${encodeURIComponent(query!)}`;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });

    if (!response.ok) {
        return NextResponse.json({ products: [], error: `Lulu returned status: ${response.status}` });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products: any[] = [];

    // --- STRATEGY 1: Extract from JSON-LD (Structured Data) ---
    // This is the cleanest data source if available
    $('script[type="application/ld+json"]').each((_, script) => {
        try {
            const content = $(script).html();
            if (!content) return;
            const json = JSON.parse(content);

            // Handle Single Product Page
            if (json['@type'] === 'Product') {
                products.push(normalizeProduct(json));
            }
            
            // Handle Search Results List
            if (json['@type'] === 'ItemList' && Array.isArray(json.itemListElement)) {
                json.itemListElement.forEach((item: any) => {
                    const p = item.item || item;
                    if (p && p.name) {
                        products.push(normalizeProduct(p));
                    }
                });
            }
        } catch (e) { /* ignore parse errors */ }
    });

    // --- STRATEGY 2: Visual Scraping (Fallback) ---
    if (products.length === 0) {
        // Search Results Grid
        $('.product-item, .product-box, div.product-list-item, div.search-product-box').each((_, element) => {
            const el = $(element);
            const name = el.find('.product-name, .name, h3').text().trim();
            const priceText = el.find('.price, .current-price, .product-price').text().trim();
            const img = el.find('img').attr('src') || el.find('img').attr('data-src');

            if (name) {
                products.push({
                    name,
                    price: parsePrice(priceText),
                    original_price: parsePrice(priceText),
                    stock: 10,
                    image_url: fixUrl(img || ''),
                    description: 'Imported from Lulu Search',
                    source: 'Lulu HTML'
                });
            }
        });

        // Single Product Page Main Details
        if (products.length === 0 && directUrl) {
            const name = $('h1.product-name, h1.title').text().trim();
            const priceText = $('.product-price, .price, .amount').first().text().trim();
            const img = $('.product-gallery img, .main-image img').attr('src');
            
            if (name) {
                products.push({
                    name,
                    price: parsePrice(priceText),
                    original_price: parsePrice(priceText),
                    stock: 10,
                    image_url: fixUrl(img || ''),
                    description: 'Imported from Lulu Direct Page',
                    source: 'Lulu Direct'
                });
            }
        }
    }

    return NextResponse.json({ products });

  } catch (error: any) {
    console.error('Lulu API Error:', error);
    return NextResponse.json({ products: [], error: error.message });
  }
}

// Helper: Clean up currency strings "QAR 10.50" -> 10.50
function parsePrice(text: string): number {
    if (!text) return 0;
    return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
}

// Helper: Ensure full URL "https://..."
function fixUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `https://gcc.luluhypermarket.com${url}`;
    return url;
}

// Helper: Normalize JSON-LD data to our Product format
function normalizeProduct(json: any): any {
    const price = parseFloat(json.offers?.price || 0);
    return {
        name: json.name,
        price: price,
        original_price: price,
        stock: json.offers?.availability?.includes('InStock') ? 20 : 0,
        image_url: fixUrl(json.image?.[0] || json.image || ''),
        description: json.description || `Imported: ${json.sku || ''}`,
        source: 'Lulu JSON'
    };
}