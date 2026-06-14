import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    const viewbox = url.searchParams.get('viewbox') as string;

    if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    const key = process.env.LOCATION_IQ_API_KEY;
    if (!key) return NextResponse.json({ error: 'Missing LocationIQ API key' }, { status: 500 });

    const params = new URLSearchParams({
      key,
      q,
      limit: "5",
      dedupe: '1',
      bounded: '1',
      viewbox,
      tag: '!highway:*',
    });

    const res = await fetch(`https://api.locationiq.com/v1/autocomplete?${params.toString()}`);
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
