  // Läs in variabler från Kubernetes Secret (runtime)
  // matchar key i Secret
  // Returnera dem som JSON – endast för testning!
  // I produktion ska du ALDRIG exponera hemligheter så här.

  import { NextResponse } from 'next/server';

export async function GET() {
  const dbPass = process.env.DATABASE_PASSWORD;
  const apiToken = process.env.API_TOKEN;

  return NextResponse.json({
    dbPasswordExists: !!dbPass,
    apiTokenExists: !!apiToken,
  });
}
