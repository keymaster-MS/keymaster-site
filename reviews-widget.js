
/*! FREE Google Reviews Widget (Drop‑in) – via Google Places
 *  How to use:
 *  1) Put <div id="google-reviews"></div> where you want the widget.
 *  2) Link the CSS + JS files in your HTML:
 *     <link rel="stylesheet" href="/assets/reviews-widget.css">
 *     <script src="/assets/reviews-widget.js"></script>
 *  3) Open this file and replace YOUR_API_KEY with your Google API key.
 *     (Place ID is already set for Keymaster LLC Gulfport MS)
 */

(function(window, document){
  // --- CONFIG ---
  const PLACE_ID = "EiYyMjQwIDMybmQgQXZlLCBHdWxmcG9ydCwgTVMgMzk1MDEsIFVTQSIxEi8KFAoSCSNLlAp7PZyIEaP7tnX7hdhLEMARKhQKEgmjlSNnZD2ciBEd2MjUGe_UrA"; // Keymaster LLC Gulfport MS
  const API_KEY  = "AIzaSyCq97SzmTKtPbYSO1PaxCwCzre_mLBa0gA";                 // <-- REPLACE THIS ONLY
  const LIMIT    = 6;                               // show up to 6 (Google returns max 5)
  const DEFAULT_LABELS = {
    en: { powered: "Powered by Google", view: "View on Google", write: "Write a review", loading: "Loading reviews…", failed: "Unable to load reviews." },
    es: { powered: "Con la tecnología de Google", view: "Ver en Google", write: "Escribir reseña", loading: "Cargando reseñas…", failed: "No se pueden cargar las reseñas." }
  };

  // --- Helpers ---
  function starHTML(value){
    const v = Number(value||0); const full=Math.floor(v), frac=v-full; let html='';
    for (let i=0;i<5;i++){
      if (i<full) html+='<i style="opacity:1"></i>';
      else if (i===full && frac>0) html+=`<i style="opacity:${(0.35+0.65*frac).toFixed(2)}"></i>`;
      else html+='<i style="opacity:.25"></i>';
    }
    return '<span class="stars" aria-hidden="true">'+html+'</span>';
  }
  function esc(s){ return (s||'').replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
  function getLabels(){
    const lang = (document.documentElement.lang||'en').slice(0,2).toLowerCase();
    return DEFAULT_LABELS[lang] || DEFAULT_LABELS.en;
  }

  function loadAfterConsent(fn){
    // If a CMP (IAB TCF) exists, wait for consent. Otherwise just run onload.
    if (typeof __tcfapi === "function"){
      window.addEventListener("load", function(){
        __tcfapi("addEventListener", 2, function (tcData, ok) {
          if (!ok) return;
          if (tcData.eventStatus === "tcloaded" || tcData.eventStatus === "useractioncomplete") fn();
        });
      });
    } else {
      if (document.readyState === "complete") fn();
      else window.addEventListener("load", fn);
    }
  }

  function injectMaps(apiKey, cb){
    if (window.__maps_loaded) return cb && cb();
    const s = document.createElement("script");
    s.src = "https://maps.googleapis.com/maps/api/js?key="+encodeURIComponent(apiKey)+"&libraries=places";
    s.async = true; s.defer = true;
    s.onload = function(){ window.__maps_loaded = true; cb && cb(); };
    s.onerror = function(){ console.error("Google Maps JS failed to load"); };
    document.head.appendChild(s);
  }

  function render(mountEl, labels, data, placeId){
    if (!mountEl) return;
    if (!data){ mountEl.innerHTML = '<div class="grw"><p>'+esc(labels.loading)+'</p></div>'; return; }
    const writeUrl = "https://search.google.com/local/writereview?placeid=" + encodeURIComponent(placeId);
    mountEl.innerHTML = `
      <div class="grw">
        <div class="header">
          <div>
            <div class="title">${esc(data.name || "Google Reviews")}</div>
            <div class="rating" aria-label="Rating ${Number(data.rating||0)} out of 5">
              ${starHTML(Number(data.rating||0))} <span>${Number(data.rating||0).toFixed(1)}</span> <span class="count">(${Number(data.total||0)})</span>
            </div>
          </div>
          <div class="powered">${labels.powered}</div>
        </div>
        <div class="reviews">
          ${(data.reviews||[]).map(rv=>`
            <article class="card" aria-label="Review by ${esc(rv.author_name)}">
              <div class="author">
                <span class="avatar">${rv.profile_photo_url?`<img src="${esc(rv.profile_photo_url)}" alt="">`:''}</span>
                <div>
                  <div class="name">${esc(rv.author_name||"Google User")}</div>
                  <div class="time">${esc(rv.relative_time||"")}</div>
                </div>
              </div>
              <div class="rating" aria-hidden="true">${starHTML(Number(rv.rating||0))}</div>
              <div class="text">${esc(rv.text||"")}</div>
              <div class="actions">
                ${rv.author_url?`<a class="btn outline" href="${esc(rv.author_url)}" target="_blank" rel="nofollow noopener">${labels.view}</a>`:'<span></span>'}
                <a class="btn" href="${writeUrl}" target="_blank" rel="nofollow noopener">${labels.write}</a>
              </div>
            </article>
          `).join('')}
        </div>
      </div>`;
  }

  function fetchPlaceDetails(placeId, cb){
    try {
      const svc = new google.maps.places.PlacesService(document.createElement("div"));
      svc.getDetails({ placeId, fields: ["name","url","rating","user_ratings_total","reviews"] }, (place, status) => {
        console.log("GRW getDetails status:", status);
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place){ cb(null, status); return; }
        const payload = {
          name: place.name,
          url: place.url,
          rating: place.rating,
          total: place.user_ratings_total,
          reviews: (place.reviews||[]).map(rv=>({
            author_name: rv.author_name,
            author_url: rv.author_url,
            profile_photo_url: rv.profile_photo_url,
            rating: rv.rating,
            relative_time: rv.relative_time_description,
            text: rv.text
          }))
        };
        cb(payload, "OK");
      });
    } catch (e){ console.error("Maps Places error", e); cb(null, "EXCEPTION"); }
  }

  function init(){
    const mountEl = document.querySelector("#google-reviews") || document.querySelector("[data-reviews-widget]");
    if (!mountEl) return; // nothing to do
    const labels = getLabels();
    render(mountEl, labels, null, PLACE_ID); // initial loading state

    loadAfterConsent(function(){
      injectMaps(API_KEY, function(){
        fetchPlaceDetails(PLACE_ID, function(data, status){
          if (!data){
            mountEl && (mountEl.innerHTML = '<div class="grw"><p>'+esc(labels.failed)+' '+esc(status||"")+'</p></div>');
            return;
          }
          if (Array.isArray(data.reviews)) data.reviews = data.reviews.slice(0, LIMIT||5);
          render(mountEl, labels, data, PLACE_ID);
        });
      });
    });
  }

  if (document.readyState === "complete" || document.readyState === "interactive") setTimeout(init, 0);
  else document.addEventListener("DOMContentLoaded", init);

  // Expose for manual mounting if needed in future:
  window.ReviewsWidget = { _init: init };
})(window, document);
