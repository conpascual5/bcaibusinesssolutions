/**
 * Debug endpoint to test fal.ai API connectivity.
 * Call GET /api/fal-debug?apiKey=YOUR_KEY to see which endpoints work.
 */
export async function testFalEndpoints(apiKey: string) {
  const results: string[] = [];

  // Test 1: Basic connectivity to fal.ai
  try {
    const r = await fetch("https://fal.ai", { method: "HEAD", redirect: "follow" });
    results.push(`[OK] fal.ai reachable: HTTP ${r.status}`);
  } catch (e: any) {
    results.push(`[FAIL] fal.ai: ${e.message}`);
  }

  // Test 2: Queue base endpoint
  try {
    const r = await fetch("https://queue.fal.run/fal-ai/nano-banana-2/edit", {
      method: "HEAD",
      headers: { Authorization: `Key ${apiKey}` },
    });
    results.push(`[${r.status}] HEAD queue.fal.run/fal-ai/nano-banana-2/edit`);
  } catch (e: any) {
    results.push(`[FAIL] HEAD queue: ${e.message}`);
  }

  // Test 3: Submit a minimal job
  let requestId: string | null = null;
  try {
    const r = await fetch("https://queue.fal.run/fal-ai/nano-banana-2/edit", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "a red apple",
        image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/1200px-Red_Apple.jpg",
        aspect_ratio: "1:1",
        num_images: 1,
      }),
    });
    const text = await r.text();
    results.push(`[${r.status}] POST submit: ${text.substring(0, 200)}`);
    if (r.ok) {
      const data = JSON.parse(text);
      requestId = data.request_id ?? data.id ?? null;
    }
  } catch (e: any) {
    results.push(`[FAIL] POST submit: ${e.message}`);
  }

  // Test 4: Check various result URL patterns
  if (requestId) {
    results.push(`--- requestId: ${requestId} ---`);
    await sleep(3000);

    const urls = [
      `https://queue.fal.run/fal-ai/nano-banana-2/edit/requests/${requestId}`,
      `https://queue.fal.run/fal-ai/nano-banana-2/requests/${requestId}`,
      `https://queue.fal.run/fal-ai/nano-banana-2/edit/requests/${requestId}/status`,
      `https://queue.fal.run/fal-ai/nano-banana-2/requests/${requestId}/status`,
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, {
          headers: { Authorization: `Key ${apiKey}` },
        });
        const text = await r.text();
        results.push(`[${r.status}] ${url.replace("https://queue.fal.run", "")}: ${text.substring(0, 150)}`);
      } catch (e: any) {
        results.push(`[FAIL] ${url.replace("https://queue.fal.run", "")}: ${e.message}`);
      }
    }
  }

  return results;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
