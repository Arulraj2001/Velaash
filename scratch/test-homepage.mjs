async function verify() {
  const res = await fetch("http://localhost:3000");
  const html = await res.text();
  console.log("--- HOMEPAGE VERIFICATION ---");
  console.log("HTTP Status:", res.status);

  const checks = [
    { label: "Hero Headline (Everyday essentials for every home)", pass: html.includes("Everyday essentials for every home") },
    { label: "ABSENCE of Old Headline (Modern Everyday Luxury)", pass: !html.includes("Modern Everyday Luxury") },
    { label: "New Meta Description in HTML", pass: html.includes("Shop clothing for men and women, plus traditional pooja and brass essentials, at Velaash.") },
    { label: "Tamil SEO Keywords in HTML", pass: html.includes("ஆடை") && html.includes("கடை") },
    { label: "Hero CTA to /shop", pass: html.includes('href="/shop"') && html.includes("Explore Collection") },
    { label: "Category Tiles Section", pass: html.includes("Explore by Category") },
    { label: "Featured Arrivals Section", pass: html.includes("Featured Arrivals") },
    { label: "Trust Strip (Pan-India Delivery)", pass: html.includes("Pan-India Delivery") },
    { label: "Trust Strip (Easy Returns)", pass: html.includes("Easy Returns") },
    { label: "Trust Strip (Secure Payments)", pass: html.includes("Secure Payments") },
    { label: "Trust Strip (WhatsApp Support)", pass: html.includes("WhatsApp Support") },
    { label: "Newsletter Section (Join the Velaash Circle)", pass: html.includes("Join the Velaash Circle") },
    { label: "Organization JSON-LD schema", pass: html.includes('"@type":"Organization"') && html.includes("VELAASH TRADER'S") },
    { label: "Neutral Announcement Bar", pass: html.includes("Welcome to Velaash — New Arrivals Every Week") },
    { label: "ABSENCE of Old Announcement (COMPLIMENTARY EXPRESS DELIVERY)", pass: !html.includes("COMPLIMENTARY EXPRESS DELIVERY") },
    { label: "ABSENCE of VELAASH10", pass: !html.includes("VELAASH10") },
    { label: "ABSENCE of Design System Verification page", pass: !html.includes("Boutique Color Tokens") && !html.includes("UI Component Showcase") },
    { label: "ABSENCE of Boutique subtitle in logo", pass: !html.includes("Boutique</span>") },
  ];

  let allPassed = true;
  for (const c of checks) {
    console.log((c.pass ? "✓ PASS: " : "✗ FAIL: ") + c.label);
    if (!c.pass) allPassed = false;
  }

  if (!allPassed) {
    process.exit(1);
  }
  console.log("\nALL VERIFICATION CHECKS PASSED!");
}

verify().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
