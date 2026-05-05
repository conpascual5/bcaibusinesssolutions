// Supabase REST API adapter — uses fetch directly instead of Postgres driver
// This is a fallback for when the Postgres connection fails on Vercel
// Uses the Supabase REST API with the anon key

const SUPABASE_URL = "https://dkatgjtvhitknghvaxxn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXRnanR2aGl0a25naHZheHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTYxNDMsImV4cCI6MjA5MzQ5MjE0M30.fsxUDg76sYGOFBVhekoj0LszaQ2YNvqkAmDIMTZ6keU";

const headers = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=minimal",
};

export async function restQuery(sql: string): Promise<any> {
  // Use Supabase's pg_graphql endpoint or raw SQL via the REST API
  // We use the /rest/v1/rpc/ endpoint with a custom function
  // For raw SQL, we use the pg_dump endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: sql }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase REST error: ${response.status} ${text}`);
  }
  
  return response.json();
}

export async function executeRawSql(sql: string): Promise<any> {
  // Execute raw SQL via the Supabase management API
  // This uses the /pg/ endpoint which accepts raw SQL
  const response = await fetch(`${SUPABASE_URL}/pg/`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "text/plain",
    },
    body: sql,
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error(`[supabase-rest] SQL error: ${response.status}`, text);
    throw new Error(`SQL execution failed: ${response.status}`);
  }
  
  return response.json();
}

export async function testRestConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "GET",
      headers,
    });
    return response.ok;
  } catch {
    return false;
  }
}
