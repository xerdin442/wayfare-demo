import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');

    if (!lat || !lon) return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });

    const key = process.env.LOCATION_IQ_API_KEY;
    if (!key) return NextResponse.json({ error: 'Missing LocationIQ API key' }, { status: 500 });

    const params = new URLSearchParams({
      key,
      lat,
      lon,
      format: "json"
    });

    const res = await fetch(`https://api.locationiq.com/v1/reverse?${params.toString()}`);
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
