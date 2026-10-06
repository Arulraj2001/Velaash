import type { ReturnsPolicySetting } from "./types";

export const DEFAULT_RETURNS_SHORT_SUMMARY =
  "Returns and exchanges are accepted within 7 days of delivery for unworn items with original tags intact. A clear, continuous, and uncut unboxing video is mandatory for all claims.";

export const DEFAULT_RETURNS_FULL_HTML = `<h3>1. 7-Day Return Window</h3>
<p>All return, exchange, or replacement requests must be initiated within strictly <strong>7 calendar days</strong> from the official delivery date confirmed by our courier partner.</p>

<h3>2. Mandatory Unboxing &amp; Product Video Requirement</h3>
<p>To ensure authenticity and fair evaluation, a <strong>clear, uncut, continuous video recording</strong> of the parcel opening and product inspection is <strong>strictly mandatory</strong> for all return, replacement, defect, or damage claims.</p>
<ul>
  <li>The unopened outer package showing the courier shipping label and tracking number clearly.</li>
  <li>The entire unboxing process in one single, continuous, unedited take.</li>
  <li>The product being taken out, showing all brand tags, barcode labels, and packaging intact.</li>
  <li>A clear, close-up view of the reported defect or incorrect item.</li>
</ul>

<h3>3. Product Condition &amp; Eligibility</h3>
<ul>
  <li><strong>Unworn &amp; Unwashed:</strong> The merchandise must be completely unused, unwashed, and free from any signs of wear.</li>
  <li><strong>Tags &amp; Labels Intact:</strong> Original brand tags, security tags, and barcode labels must remain securely attached.</li>
  <li><strong>Original Packaging:</strong> The merchandise must be returned inside its original protective packaging.</li>
  <li><strong>Disqualification:</strong> Products with perfume scents, deodorant stains, makeup marks, or removed tags fail inspection and will be returned without a refund.</li>
</ul>

<h3>4. Replacement &amp; Refund Policy</h3>
<p>Upon satisfactory evaluation of both the unboxing video and the physical condition of the received item at our warehouse, Velaash will decide whether to provide a replacement or a refund:</p>
<ul>
  <li><strong>Replacement:</strong> If the product is defective or damaged in transit, a fresh replacement piece will be dispatched promptly at no additional shipping fee (subject to stock availability).</li>
  <li><strong>Refund:</strong> If a replacement is unavailable, a refund will be issued to the original payment source (Razorpay / UPI / Card) or direct bank transfer for COD within 5 to 7 business days of inspection approval.</li>
</ul>`;

export const DEFAULT_RETURNS_POLICY: ReturnsPolicySetting = {
  return_window_days: 7,
  policy_description:
    "We accept return and replacement requests within strictly 7 calendar days of delivery. A clear, continuous, and uncut unboxing video of the parcel opening and product condition is strictly mandatory for all claims. Upon evaluating both the video and the physical condition of the received item at our warehouse, Velaash will decide whether to provide a replacement or a refund.",
  short_summary: DEFAULT_RETURNS_SHORT_SUMMARY,
  full_policy_html: DEFAULT_RETURNS_FULL_HTML,
};
