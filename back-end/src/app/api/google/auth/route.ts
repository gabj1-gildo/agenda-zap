import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { env } from '@/config/env';

export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const tenantId = reqUrl.searchParams.get('tenantId');
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Forces consent screen to always issue a refresh token
    state: tenantId || 'default'
  });

  return NextResponse.redirect(url);
}
