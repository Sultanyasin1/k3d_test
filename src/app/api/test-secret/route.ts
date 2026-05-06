import { NextResponse } from 'next/server';

export async function GET() {
  // Läs in variabler från Kubernetes Secret (runtime)
  const username = process.env.username;                // matchar key i Secret
  const dbPassword = process.env.DATABASE_PASSWORD;
  const apiPrivateKey = process.env.API_PRIVATE_KEY;

  // Returnera dem som JSON – endast för testning!
  // I produktion ska du ALDRIG exponera hemligheter så här.
  return NextResponse.json({
    message: 'Hemligheter lästa från Kubernetes Secret:',
    username: username || 'SAKNAS',
    dbPassword: dbPassword || 'SAKNAS',
    apiPrivateKey: apiPrivateKey ? '***FINNS***' : 'SAKNAS',  // visa inte hela nyckeln
  });
}