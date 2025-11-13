import React, { useEffect, useState, useRef } from "react";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "./firebaseConfig"; // adjust path
import { useNavigate } from "react-router-dom";

/**
 EquipmentList.jsx
 - Grid with cards (responsive)
 - Filters, Search, Sort
 - Sponsored / Boosted (gold badge)
 - Distance calculation (Haversine)
 - Quick action floating icons: wishlist, whatsapp, call
 - Availability status (based on availableFrom/To)
 - Image carousel (simple)
 - Ratings fetched from "reviews" collection (avg)
 - Owner minicard modal
 - Fullscreen Map view with markers + bottom sheet list
 - Empty state UI + skeleton loading
 - Boosted items are shown at top (boostUntil > now)
*/

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lat2) return Infinity;
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function EquipmentList() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [unitFilter, setUnitFilter] = useState("any"); // perDay/perHour/perAcre/any
  const [availabilityFilter, setAvailabilityFilter] = useState("any"); // any/today/tomorrow/custom
  const [sortBy, setSortBy] = useState("newest"); // priceLow, priceHigh, nearest, newest

  const [userCoords, setUserCoords] = useState({ lat: null, lng: null });
  const [viewMode, setViewMode] = useState("grid"); // grid | map
  const [mapOpen, setMapOpen] = useState(false);

  const [selectedOwner, setSelectedOwner] = useState(null); // owner mini card
  const [selectedItemForMap, setSelectedItemForMap] = useState(null);

  const navigate = useNavigate();

  // wishlist in localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const s = localStorage.getItem("kheti_wishlist") || "[]";
      return new Set(JSON.parse(s));
    } catch {
      return new Set();
    }
  });

  // UI helpers
  const categories = [
    "All",
    "Tractor",
    "Harvester",
    "JCB",
    "Bullockcart",
    "Water Pump",
    "Rotavator",
    "Other"
  ];

  // fetch items & ratings
  useEffect(() => {
    let cancelled = false;
    const fetchItems = async () => {
      setLoading(true);
      try {
        // basic fetch (we'll filter/sort client-side for flexibility)
        const q = query(collection(db, "equipments"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (cancelled) return;

        // fetch ratings for each equipment (optional)
        // we'll try to fetch average rating if reviews collection exists
        // Note: this could be optimized with cloud functions / aggregated fields
        const withRating = await Promise.all(
          arr.map(async (it) => {
            try {
              const revQ = query(collection(db, "reviews"), where("equipmentId", "==", it.id));
              const revSnap = await getDocs(revQ);
              const revDocs = revSnap.docs.map((r) => r.data());
              const avg = revDocs.length
                ? Math.round((revDocs.reduce((s, r) => s + (r.rating || 0), 0) / revDocs.length) * 10) / 10
                : null;
              return { ...it, rating: avg, reviewsCount: revDocs.length };
            } catch {
              return { ...it, rating: it.rating || null, reviewsCount: it.reviewsCount || 0 };
            }
          })
        );

        // apply boost flag boolean (boostUntil timestamp compare)
        const now = Date.now();
        const annotated = withRating.map((it) => ({
          ...it,
          isBoosted: it.boostUntil ? it.boostUntil.toMillis?.() ? it.boostUntil.toMillis() > now : new Date(it.boostUntil).getTime() > now : false
        }));

        setItems(annotated);
        setLoading(false);
      } catch (err) {
        console.error("Fetching equipments failed", err);
        setLoading(false);
      }
    };

    fetchItems();
    return () => { cancelled = true; };
  }, []);

  // get user geolocation (optional) — used for nearest filter & display
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        // user denied or unavailable
        // we keep coords null — distance will be hidden or large
        console.warn("Geolocation error", err);
      },
      { enableHighAccuracy: false, maximumAge: 60 * 1000 }
    );
  }, []);

  // helper: availability from availableFrom/availableTo (string hh:mm)
  const isAvailableNow = (it) => {
    try {
      if (!it.availableFrom || !it.availableTo) return true;
      const now = new Date();
      const [fh, fm] = (it.availableFrom || "00:00").split(":").map(Number);
      const [th, tm] = (it.availableTo || "23:59").split(":").map(Number);
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), fh, fm);
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), th, tm);
      return now >= from && now <= to;
    } catch {
      return true;
    }
  };

  // compute distance fields and apply filters & sorting client-side
  useEffect(() => {
    // compute derived fields
    const enriched = items.map((it) => {
      const lat = it.location?.lat;
      const lng = it.location?.lng;
      const distanceKm = userCoords.lat && lat ? haversineDistanceKm(userCoords.lat, userCoords.lng, lat, lng) : null;
      // compute bestPrice for filtering/sorting
      const pricing = it.pricing || {};
      const prices = [];
      if (pricing.perDay) prices.push(pricing.perDay);
      if (pricing.perHour) prices.push(pricing.perHour);
      if (pricing.perAcre) prices.push(pricing.perAcre);
      const bestPrice = prices.length ? Math.min(...prices) : null;
      return { ...it, distanceKm, bestPrice };
    });

    // apply search filter
    let out = enriched.filter((it) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        (it.title || "").toLowerCase().includes(s) ||
        (it.ownerName || "").toLowerCase().includes(s) ||
        (it.category || "").toLowerCase().includes(s) ||
        (it.location?.text || "").toLowerCase().includes(s)
      );
    });

    // category filter
    if (categoryFilter && categoryFilter !== "All") {
      out = out.filter((it) => it.category === categoryFilter);
    }

    // unit filter
    if (unitFilter && unitFilter !== "any") {
      out = out.filter((it) => (it.pricing && (
        (unitFilter === "perDay" && it.pricing.perDay) ||
        (unitFilter === "perHour" && it.pricing.perHour) ||
        (unitFilter === "perAcre" && it.pricing.perAcre)
      )));
    }

    // price range (bestPrice)
    if (priceFrom) {
      out = out.filter((it) => it.bestPrice !== null && it.bestPrice >= Number(priceFrom));
    }
    if (priceTo) {
      out = out.filter((it) => it.bestPrice !== null && it.bestPrice <= Number(priceTo));
    }

    // availability filter (simple)
    if (availabilityFilter === "today") {
      out = out.filter((it) => isAvailableNow(it));
    }
    // tomorrow/custom omitted for brevity — can be added with date picker

    // sort
    if (sortBy === "priceLow") {
      out = out.sort((a, b) => (a.bestPrice || Infinity) - (b.bestPrice || Infinity));
    } else if (sortBy === "priceHigh") {
      out = out.sort((a, b) => (b.bestPrice || 0) - (a.bestPrice || 0));
    } else if (sortBy === "nearest") {
      out = out.sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));
    } else if (sortBy === "newest") {
      out = out.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    }

    // bring boosted items to top
    const boosted = out.filter((it) => it.isBoosted);
    const rest = out.filter((it) => !it.isBoosted);
    out = [...boosted, ...rest];

    setFiltered(out);
  }, [items, search, categoryFilter, priceFrom, priceTo, unitFilter, availabilityFilter, sortBy, userCoords]);

  // wishlist helpers
  const toggleWishlist = (id) => {
    const s = new Set(wishlist);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setWishlist(s);
    localStorage.setItem("kheti_wishlist", JSON.stringify(Array.from(s)));
  };

  // open owner minicard (just data)
  const openOwnerCard = (it) => {
    setSelectedOwner({
      ownerName: it.ownerName,
      ownerId: it.ownerId,
      phone: it.ownerPhone || null,
      itemList: [] // optionally fetch owner's other items
    });
  };

  // open map view fullscreen
  const openMapView = () => {
    setMapOpen(true);
    setViewMode("map");
    // map init handled in modal below
  };

  // small carousel component inline
  const CardCarousel = ({ images }) => {
    const [idx, setIdx] = useState(0);
    useEffect(() => setIdx(0), [images]);
    if (!images || images.length === 0) return <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No image</div>;
    return (
      <div className="relative w-full h-full">
        <img src={images[idx]} alt="" className="w-full h-full object-cover transition" />
        {images.length > 1 && (
          <>
            <button onClick={() => setIdx((p) => (p - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow">‹</button>
            <button onClick={() => setIdx((p) => (p + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow">›</button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i===idx ? "bg-white" : "bg-white/50"}`} />)}
            </div>
          </>
        )}
      </div>
    );
  };

  // Map modal markup & logic
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapOpen) return;
    let mounted = true;
    const init = async () => {
      if (!window.google || !mapRef.current) return;
      const center = userCoords.lat ? { lat: userCoords.lat, lng: userCoords.lng } : { lat: 20.5937, lng: 78.9629 };
      // create map
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: userCoords.lat ? 10 : 5
      });
      // add markers
      // clear existing
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      filtered.forEach((it) => {
        const lat = it.location?.lat;
        const lng = it.location?.lng;
        if (!lat || !lng) return;
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstance.current,
          title: it.title
        });
        marker.addListener("click", () => {
          // center and open info
          mapInstance.current.panTo({ lat, lng });
          setSelectedItemForMap(it);
        });
        markersRef.current.push(marker);
      });
      // optionally show user location marker
      if (userCoords.lat) {
        new window.google.maps.Marker({
          position: { lat: userCoords.lat, lng: userCoords.lng },
          map: mapInstance.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#16a34a",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#fff"
          }
        });
      }
    };
    init();
    return () => { mounted = false; markersRef.current.forEach(m => m.setMap(null)); markersRef.current = []; mapInstance.current = null; };
  // eslint-disable-next-line
  }, [mapOpen, filtered, userCoords]);

  // UI: skeleton card used while loading
  const SkeletonCard = () => (
    <div className="animate-pulse bg-white rounded-xl p-3 shadow">
      <div className="h-40 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-extrabold">Available Equipment</h2>
          <p className="text-sm text-gray-500">Find machines near you — tractors, harvesters, pumps and more.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/upload-equipment")} className="hidden md:inline-flex items-center gap-2 bg-green-700 text-white px-3 py-1 rounded">Upload</button>
          <button onClick={() => setViewMode(viewMode === "grid" ? "map" : "grid")} className="px-2 py-1 border rounded">
            {viewMode === "grid" ? "Map View" : "List View"}
          </button>
        </div>
      </div>

      {/* FILTER BAR (sticky top) */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-sm p-3 rounded mb-4 border shadow-sm flex gap-3 items-center overflow-x-auto">
        <input
          placeholder="Search by name, owner, village..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-64"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border rounded px-3 py-2">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={unitFilter} onChange={(e)=>setUnitFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="any">Any unit</option>
          <option value="perDay">Per day</option>
          <option value="perHour">Per hour</option>
          <option value="perAcre">Per acre</option>
        </select>

        <input placeholder="Min price" value={priceFrom} onChange={(e)=>setPriceFrom(e.target.value)} className="border rounded px-2 py-2 w-28" />
        <input placeholder="Max price" value={priceTo} onChange={(e)=>setPriceTo(e.target.value)} className="border rounded px-2 py-2 w-28" />

        <select value={availabilityFilter} onChange={(e)=>setAvailabilityFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="any">Any availability</option>
          <option value="today">Available now</option>
        </select>

        <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="border rounded px-3 py-2">
          <option value="newest">Newest</option>
          <option value="priceLow">Price Low → High</option>
          <option value="priceHigh">Price High → Low</option>
          <option value="nearest">Nearest</option>
        </select>

        <button onClick={() => { setSearch(""); setCategoryFilter("All"); setPriceFrom(""); setPriceTo(""); setUnitFilter("any"); setSortBy("newest"); }} className="px-3 py-2 border rounded">Reset</button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <img src="/empty-state-illustration.png" alt="empty" className="mx-auto w-48 mb-6" />
          <h3 className="text-xl font-semibold">No equipment found</h3>
          <p className="text-gray-500 mt-2">Be the first to upload equipment in your area.</p>
          <div className="mt-4">
            <button onClick={()=>navigate("/upload-equipment")} className="bg-green-700 text-white px-4 py-2 rounded">Upload Equipment</button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((it) => {
            const bestPrice = it.bestPrice;
            const distText = it.distanceKm ? `${it.distanceKm.toFixed(1)} km` : null;
            const availableNow = isAvailableNow(it);
            return (
              <div key={it.id} className="bg-white rounded-xl shadow p-0 border overflow-hidden relative group">
                {/* Image area with floating actions */}
                <div className="relative h-40">
                  <CardCarousel images={it.images && it.images.length ? it.images : ["/placeholder.png"]} />
                  {/* top-left badge */}
                  <div className="absolute top-2 left-2">
                    {it.isBoosted && <div className="bg-yellow-400 text-xs text-black px-2 py-1 rounded font-semibold">★ Sponsored</div>}
                    {!it.isBoosted && <div className="bg-white/90 text-xs text-green-700 px-2 py-1 rounded font-semibold">{it.category}</div>}
                  </div>

                  {/* floating icons */}
                  <div className="absolute right-2 top-2 flex flex-col gap-2">
                    <button onClick={() => toggleWishlist(it.id)} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlist.has(it.id) ? "#f43f5e" : "none"} stroke="#111" strokeWidth="1.5"><path d="M12 21s-7-4.35-9.06-7.37A5.5 5.5 0 0 1 6 5.5 6 6 0 0 1 12 8a6 6 0 0 1 6-2.5 5.5 5.5 0 0 1 3.06 8.13C19 16.65 12 21 12 21z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <a href={`https://wa.me/${it.ownerPhone || ""}`} target="_blank" rel="noreferrer" className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M21 11.5A9.38 9.38 0 0 1 12.5 21 9 9 0 0 1 3 12.5 9.38 9.38 0 0 1 12.5 3 9 9 0 0 1 21 11.5z" /></svg>
                    </a>
                    <a href={`tel:${it.ownerPhone || ""}`} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5"><path d="M22 16.92V21a1 1 0 0 1-1.09 1A19 19 0 0 1 3 5.09 1 1 0 0 1 4 4h4.09a1 1 0 0 1 1 .75c.12.79.33 1.57.62 2.32a1 1 0 0 1-.24 1.02L8.7 10.7a16 16 0 0 0 5.58 5.58l1.61-1.77a1 1 0 0 1 1.02-.24c.75.29 1.53.5 2.31.62a1 1 0 0 1 .75 1V21" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                  </div>
                </div>

                {/* card body */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm">{it.title}</h3>
                      <p className="text-xs text-gray-500">{it.location?.text || ""}</p>
                    </div>
                    <div className="text-right">
                      {bestPrice ? <div className="text-green-700 font-bold">₹{bestPrice}</div> : <div className="text-gray-400 text-xs">Price on request</div>}
                      {distText && <div className="text-xs text-gray-500">{distText}</div>}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">⭐ {it.rating || "—"}</div>
                      <div className="text-xs text-gray-400">({it.reviewsCount || 0})</div>
                    </div>
                    <div>
                      <div className={`text-xs px-2 py-0.5 rounded ${availableNow ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {availableNow ? "Available" : "Not available"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button onClick={() => navigate(`/equipment/${it.id}`)} className="w-full bg-green-700 text-white py-2 rounded hover:scale-102 transition">Book Now</button>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => openOwnerCard(it)} className="flex-1 border rounded py-2 text-sm">Owner</button>
                      <button onClick={() => { setSelectedItemForMap(it); setMapOpen(true); setViewMode("map"); }} className="flex-1 border rounded py-2 text-sm">View on map</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // MAP VIEW: fullscreen overlay
        <div>
          <div className="h-[70vh] rounded overflow-hidden mb-4 border" ref={mapRef}></div>

          {/* bottom sheet style list */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map((it) => {
              const distText = it.distanceKm ? `${it.distanceKm.toFixed(1)} km` : null;
              return (
                <div key={it.id} className="bg-white rounded p-3 shadow border flex gap-3 items-center">
                  <img src={(it.images && it.images[0]) || "/placeholder.png"} alt="" className="w-20 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{it.title}</div>
                    <div className="text-xs text-gray-500">{distText || it.location?.text}</div>
                    <div className="text-green-700 font-bold mt-1">{it.bestPrice ? `₹${it.bestPrice}` : "Price on request"}</div>
                  </div>
                  <div>
                    <button onClick={() => navigate(`/equipment/${it.id}`)} className="bg-green-700 text-white px-3 py-1 rounded">Book</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Owner modal */}
      {selectedOwner && (
        <div className="fixed inset-0 z-60 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{selectedOwner.ownerName}</div>
                <div className="text-xs text-gray-500">Owner</div>
              </div>
              <div>
                <button onClick={() => setSelectedOwner(null)} className="px-3 py-1 border rounded">Close</button>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-sm">Contact: {selectedOwner.phone || "Not available"}</div>
              <div className="mt-2">
                <button className="bg-green-700 text-white px-3 py-1 rounded mr-2" onClick={() => { if (selectedOwner.phone) window.open(`tel:${selectedOwner.phone}`); }}>Call</button>
                <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => { if (selectedOwner.phone) window.open(`https://wa.me/${selectedOwner.phone}`); }}>WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected item quick card when clicked on map */}
      {selectedItemForMap && mapOpen && (
        <div className="fixed left-4 bottom-4 z-70 bg-white rounded-lg shadow p-3 w-full md:max-w-md">
          <div className="flex items-center gap-3">
            <img src={(selectedItemForMap.images && selectedItemForMap.images[0]) || "/placeholder.png"} alt="" className="w-20 h-14 object-cover rounded" />
            <div className="flex-1">
              <div className="font-semibold">{selectedItemForMap.title}</div>
              <div className="text-xs text-gray-500">{selectedItemForMap.location?.text}</div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => navigate(`/equipment/${selectedItemForMap.id}`)} className="bg-green-700 text-white px-3 py-1 rounded">Book</button>
                <button onClick={() => { setSelectedItemForMap(null); }} className="px-3 py-1 border rounded">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
