
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
const PLACE_ID = "ChIJ5RQB6G4WnIgRRJWBbkRNYcI"; // Keymaster LLC Gulfport MS
const MAX_SHOW = 10;

// Init callback עבור ה-Maps loader (?callback=initReviews)
function initReviews() {
  const service = new google.maps.places.PlacesService(document.createElement('div'));
  service.getDetails(
    { placeId: PLACE_ID, fields: ['reviews','url','name'] },
    (place, status) => {
      const ok = status === google.maps.places.PlacesServiceStatus.OK;
      const has = ok && place && Array.isArray(place.reviews) && place.reviews.length;
      if (!has) return showFallback();

      const onlyFive = place.reviews
        .filter(r => Number(r.rating) === 5)
        .sort((a,b) => (b.time || 0) - (a.time || 0))
        .slice(0, MAX_SHOW);

      if (!onlyFive.length) return showFallback();

      renderReviews(onlyFive, place.url, place.name);
      // לחשוף לפונקציית שינוי שפה קיימת אצלך
      window.renderReviewsWidget = () => renderReviews(onlyFive, place.url, place.name);
    }
  );
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

  const titleText = (lang === 'es') ? 'Reseñas (5★)' : (lang === 'he') ? 'ביקורות (5★)' : 'Reviews (5★)';
  const poweredText = (lang === 'es') ? 'Fuente: Google' : (lang === 'he') ? 'מקור: Google' : 'Source: Google';
  const viewOnGoogleText = (lang === 'es') ? 'Ver en Google' : (lang === 'he') ? 'צפה בגוגל' : 'View on Google';

  const header = `
    <div class="header">
      <div class="title">${titleText}</div>
      <div class="rating">
        <span class="stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
        <span class="count">${reviews.length}</span>
      </div>
    </div>
  `;

  const cards = reviews.map(r => {
    const author = r.author_name || 'Google user';
    const profilePhoto = r.profile_photo_url || '';
    const when = r.relative_time_description || '';
    const text = (r.text || '').trim();
    const link = placeUrl ? `<a class="btn outline" href="${placeUrl}" target="_blank" rel="noopener">${viewOnGoogleText}</a>` : '';

    return `
      <article class="card">
        <div class="author">
          <div class="avatar">${profilePhoto ? `<img src="${profilePhoto}" alt="${escapeHtml(author)}">` : ''}</div>
          <div>
            <div class="name">${escapeHtml(author)}</div>
            <div class="time">${escapeHtml(when)}</div>
          </div>
          <div style="margin-left:auto" aria-label="5 out of 5">★★★★★</div>
        </div>
        <div class="text">${escapeHtml(text)}</div>
        <div class="actions">
          <span class="powered">${poweredText}</span>
          ${link}
        </div>
      </article>
    `;
  }).join('');

  wrap.innerHTML = header + `<div class="reviews">${cards || '<p>—</p>'}</div>`;
}

// היגיינת HTML בסיסית
function escapeHtml(s) {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}
