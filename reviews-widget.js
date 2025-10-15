
/*! FREE Google Reviews Widget (Drop‑in) – via Google Places
 *  How to use:
 *  1) Put <div id="google-reviews"></div> where you want the widget.
 *  2) Link the CSS + JS files in your HTML:
 *     <link rel="stylesheet" href="/assets/reviews-widget.css">
 *     <script src="/assets/reviews-widget.js"></script>
 *  3) Open this file and replace YOUR_API_KEY with your Google API key.
 *     (Place ID is already set for Keymaster LLC Gulfport MS)
 */

// reviews-widget.js
// הגדרות
// ====== reviews-widget.js (גרסת Place החדשה) ======
// ===== reviews-widget.js – SAB-friendly =====
const BUSINESS_QUERY = "Keymaster LLC locksmith Gulfport MS"; // שם + אזור שירות
const PLACE_ID = ""; // אם יש לך placeId קבוע, שים כאן. אחרת נשיג דינמית.
const MAX_SHOW = 10;

async function initReviews() {
  try {
    // טוען את ספריית places בסינטקס החדש
    const { Place } = await google.maps.importLibrary("places");

    // משיגים placeId: או קבוע, או חיפוש טקסט (SAB)
    const placeId = PLACE_ID || await resolvePlaceId();

    if (!placeId) return showFallback();

    const lang = document.documentElement.getAttribute('lang') || 'en';
    const place = new Place({ id: placeId, requestedLanguage: lang });

    await place.fetchFields({
      fields: ["id","displayName","googleMapsUri","rating","userRatingCount","reviews"]
    });

    const all = Array.isArray(place.reviews) ? place.reviews : [];
    if (!all.length) return showFallback();

    const onlyFive = all
      .filter(r => Number(r.rating) === 5)
      .sort((a,b) => Date.parse(b.publishTime||0) - Date.parse(a.publishTime||0))
      .slice(0, MAX_SHOW);

    if (!onlyFive.length) return showFallback();

    renderReviews(onlyFive, place.googleMapsUri, place.displayName);
    window.renderReviewsWidget = () => renderReviews(onlyFive, place.googleMapsUri, place.displayName);
  } catch (err) {
    console.error("Reviews widget error:", err);
    showFallback();
  }
}

// --- SAB helper: מוצא Place ID לפי שם + אזור ---
async function resolvePlaceId() {
  const key = getMapsApiKeyFromLoader();
  if (!key) return null;

  const url = `https://places
