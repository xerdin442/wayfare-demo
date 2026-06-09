import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    const viewbox = url.searchParams.get('viewbox');
    const limit = url.searchParams.get('limit') || '2';

    if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    const key = process.env.LOCATION_IQ_API_KEY;
    if (!key) return NextResponse.json({ error: 'Missing LocationIQ API key' }, { status: 500 });

    const params = new URLSearchParams({
      key,
      q,
      limit,
      dedupe: '1',
      bounded: '1',
      tag: '!highway:*',
    });

    if (viewbox) params.set('viewbox', viewbox);

    const res = await fetch(`https://api.locationiq.com/v1/autocomplete?${params.toString()}`);
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
