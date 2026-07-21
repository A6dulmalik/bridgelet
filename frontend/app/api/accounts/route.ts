import { NextRequest, NextResponse } from 'next/server';

const SDK_URL = process.env.BRIDGELET_SDK_URL ?? '';
const SDK_TOKEN = process.env.BRIDGELET_SDK_TOKEN ?? '';

export async function POST(req: NextRequest) {
  const body = await req.text();

  const res = await fetch(`${SDK_URL}/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SDK_TOKEN}`,
    },
    body,
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search;

  const res = await fetch(`${SDK_URL}/accounts${qs}`, {
    headers: { Authorization: `Bearer ${SDK_TOKEN}` },
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
