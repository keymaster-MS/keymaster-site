
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
// ===== reviews-widget.js – Place API (חדש) + SAB friendly =====
const BUSINESS_QUERY = "Keymaster LLC locksmith Gulfport MS"; // שם + אזור שירות
const PLACE_ID = ""; // אם יש לך placeId קבוע, שים כאן. אחרת נשיג דינמית.
const MAX_SHOW = 10;

// לחשוף גלובלית כדי שה-callback=initReviews יעבוד
window.initReviews = async function initReviews() {
  try {
    const { Place } = await google.maps.importLibrary("places");

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

    // לאפשר רנדר מחדש כשמשנים שפה באתר
    window.renderReviewsWidget = () =>
      renderReviews(onlyFive, place.googleMapsUri, place.displayName);

  } catch (err) {
    console.error("Reviews widget error:", err);
    showFallback();
  }
};

// --- SAB helper: מוצא Place ID לפי שם + אזור ---
async function resolvePlaceId() {
  const key = getMapsApiKeyFromLoader();
  if (!key) return null;

  const url = `https://places.googleapis.com/v1/places:searchText?key=${encodeURIComponent(key)}`;
  const body = {
    textQuery: BUSINESS_QUERY,
    maxResultCount: 1
  };

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-FieldMask": "places.id,places.displayName,places.googleMapsUri"
    },
    body: JSON.stringify(body)
  });

  if (!r.ok) return null;
  const data = await r.json();
  const p = data.places?.[0];
  return p?.id || null;
}

// שואב את ה-API key מהתגית של maps כדי לא לשים אותו פעמיים
function getMapsApiKeyFromLoader(){
  const s = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (!s) return null;
  try {
    const u = new URL(s.src);
    return u.searchParams.get("key");
  } catch {
    return null;
  }
}

function showFallback(){
  const fb = document.getElementById('embedsocial-fallback');
  if (fb) fb.style.display = 'block';
}

function renderReviews(reviews, placeUrl, placeName) {
  const wrap = document.getElementById('google-reviews');
  if (!wrap) return;

  const lang = document.documentElement.getAttribute('lang') || 'en';
  const isRTL = (lang === 'he' || lang === 'ar');
  wrap.dir = isRTL ? 'rtl' : 'ltr';
  wrap.style.textAlign = isRTL ? 'right' : 'left';

  const t = (en, he, es) => (lang === 'he' ? he : lang === 'es' ? es : en);

  const header = `
    <div class="header">
      <div class="title">${t('Reviews (5★)','ביקורות (5★)','Reseñas (5★)')}</div>
      <div class="rating">
        <span class="stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
        <span class="count">${reviews.length}</span>
      </div>
    </div>
  `;

  const cards = reviews.map(r => {
    const author = r.authorAttribution?.displayName || 'Google user';
    const photo = r.authorAttribution?.photoUri || '';
    const when = r.relativePublishTimeDescription || (r.publishTime ? new Date(r.publishTime).toLocaleDateString() : '');
    const text = (r.text?.text || r.originalText?.text || '').trim();
    const link = placeUrl ? `<a class="btn outline" href="${placeUrl}" target="_blank" rel="noopener">${t('View on Google','צפה בגוגל','Ver en Google')}</a>` : '';

    return `
      <article class="card">
        <div class="author">
          <div class="avatar">${photo ? `<img src="${photo}" alt="${escapeHtml(author)}">` : ''}</div>
          <div>
            <div class="name">${escapeHtml(author)}</div>
            <div class="time">${escapeHtml(when)}</div>
          </div>
          <div style="margin-left:auto" aria-label="5 out of 5">★★★★★</div>
        </div>
        <div class="text">${escapeHtml(text)}</div>
        <div class="actions">
          <span class="powered">${t('Source: Google','מקור: Google','Fuente: Google')}</span>
          ${link}
        </div>
      </article>
    `;
  }).join('');

  wrap.innerHTML = header + `<div class="reviews">${cards || '<p>—</p>'}</div>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}
