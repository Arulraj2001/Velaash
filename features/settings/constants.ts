import type { ReturnsPolicySetting } from "./types";

export const DEFAULT_RETURNS_SHORT_SUMMARY =
  "Doorstep replacements and size exchanges are accepted within 7 days of delivery for unworn items with original tags intact. Uncut unboxing video is mandatory. Rare monetary refunds apply strictly when replacement stock is unavailable, upon contacting support.";

export const DEFAULT_RETURNS_FULL_HTML = `<h3>1. 7-Day Doorstep Replacement Window</h3>
<p>All replacement, size exchange, or defect claims must be initiated within strictly <strong>7 calendar days</strong> from the official delivery date confirmed by our courier partner.</p>

<h3>2. Mandatory Unboxing &amp; Product Video Requirement</h3>
<p>To ensure authenticity and fair evaluation, a <strong>clear, uncut, continuous video recording</strong> of the parcel opening and product inspection is <strong>strictly mandatory</strong> for all replacement, defect, or damage claims.</p>
<ul>
  <li>The unopened outer package showing the courier shipping label and tracking number clearly.</li>
  <li>The entire unboxing process in one single, continuous, unedited take.</li>
  <li>The product being taken out, showing all brand tags, barcode labels, and packaging intact.</li>
  <li>A clear, close-up view of the reported defect, size mismatch, or incorrect item.</li>
</ul>

<h3>3. Product Condition &amp; Eligibility</h3>
<ul>
  <li><strong>Unworn &amp; Unwashed:</strong> The merchandise must be completely unused, unwashed, and free from any signs of wear.</li>
  <li><strong>Tags &amp; Labels Intact:</strong> Original brand tags, security tags, and barcode labels must remain securely attached.</li>
  <li><strong>Original Packaging:</strong> The merchandise must be returned inside its original protective packaging.</li>
  <li><strong>Disqualification:</strong> Products with perfume scents, deodorant stains, makeup marks, or removed tags fail inspection and are not eligible for replacement.</li>
</ul>

<h3>4. Replacement-First Policy &amp; Rare Refund Clause</h3>
<p>In accordance with our store policy, all verified claims are fulfilled via <strong>doorstep replacement or size exchange</strong>:</p>
<ul>
  <li><strong>Size Exchanges &amp; Defect Replacements:</strong> A fresh replacement piece in your requested size or product model will be dispatched promptly at zero extra shipping cost.</li>
  <li><strong>Rare Monetary Refunds:</strong> Cash refunds are reserved strictly for exceptional cases where the requested replacement size/item is permanently out of stock in our inventory. To request a refund evaluation, customers must contact our customer support team directly on WhatsApp with their Order ID and unboxing video.</li>
</ul>`;

export const DEFAULT_RETURNS_POLICY: ReturnsPolicySetting = {
  return_window_days: 7,
  policy_description:
    "We provide 7-day doorstep replacements and size exchanges for unworn items with tags intact and uncut unboxing video. Monetary refunds are processed on an exceptional basis only when replacement stock is permanently unavailable, upon contacting our support concierge.",
  short_summary: DEFAULT_RETURNS_SHORT_SUMMARY,
  full_policy_html: DEFAULT_RETURNS_FULL_HTML,
};
