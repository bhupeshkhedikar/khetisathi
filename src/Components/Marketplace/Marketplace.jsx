import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig.js";
import { MagnifyingGlassIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import {
  MapPinIcon,
  CurrencyRupeeIcon,
  TagIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { RectangleStackIcon } from "@heroicons/react/24/outline";

// Marketplace categories
const categories = [
  { id: "", label: "सर्व" },
  { id: "seeds", label: "बियाणे" },
  { id: "tools", label: "साधने" },
  { id: "fertilizer", label: "खते" },
  { id: "animals", label: "प्राणी" },
  { id: "vehicles", label: "वाहने" },
  { id: "other", label: "इतर" },
];

// FALLBACK IMAGES
const fallbackImages = {
  seeds: "https://www.oecd.org/adobe/dynamicmedia/deliver/dm-aid--1add17d0-a5f4-4161-a696-6dfcfe14a205/seeds-web-image-oecd.jpg?preferwebp=true&quality=80",
  tools: "https://thumbs.dreamstime.com/b/display-board-featuring-vintage-farming-tools-including-shovels-pitchforks-machete-arranged-outdoors-slow-living-traditional-374927867.jpg",
  fertilizer: "https://thumbs.dreamstime.com/b/fertilizer-bags-stacked-neatly-lush-crop-field-open-sky-area-text-overlay-high-quality-photo-321667543.jpg",
  animals: "https://www.outdooraccess-scotland.scot/sites/default/files/styles/hero_banner_half_width/public/2018-09/Whitmuir-D8598.jpg?h=265e640d&itok=glRvq-8S",
  vehicles: "https://media.istockphoto.com/id/492774776/photo/farmer-with-tractor-seeding-crops-at-field.jpg?s=612x612&w=0&k=20&c=s54a8e5m8lj-hg660QrK2bV8ZIc8bYB8dr9Ch7IRBvY=",
  other: "https://www.liebigsagrochem.com/static/media/all-product.2fd1c15854e259340c68.jpg",
};

// ⭐ Auto Slide Banner Images
const bannerImages = [
  "https://www.farmery.in/uploads/category_images/38659-1578312688/11-03-2022-401109133-1646989209.jpg",
  "https://store.prabhatagri.com/wp-content/uploads/2023/06/E-commerce-Website-Banner-3-1.jpg",
  "https://www.theautomotiveindia.com/data/attachments/287/287189-f48324268baca0e9fcc33b8b81113453.jpg?hash=9IMkJousoO"
];


export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔥 Auto Slide Banner State
  const [bannerIndex, setBannerIndex] = useState(0);

  // 🔥 Auto Slide Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch products
  useEffect(() => {
    const q = query(
      collection(db, "marketplaceProducts"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(arr);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const getCategoryLabel = (id) => {
    const found = categories.find((c) => c.id === id);
    return found ? found.label : "इतर";
  };

  const filtered = products.filter((p) => {
    const matchCategory = category ? p.category === category : true;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.location || "").toLowerCase().includes(q);

    return matchCategory && matchSearch && p.status === "approved";
  });

  return (
    <div className="min-h-screen bg-gray-100 pb-20">

      {/* HEADER */}
      <div className="bg-green-700 px-4 py-3 shadow sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">खेतीसाथी मार्केट</h2>

          <Link
            to="/sell"
            className="flex items-center gap-2 bg-white text-green-700 px-3 py-2 rounded-full shadow font-semibold text-sm"
          >
            <PlusCircleIcon className="w-5 h-5" /> विक्री करा
          </Link>
        </div>

        {/* Search bar */}
        <div className="mt-3 flex items-center bg-white px-3 py-2 rounded-lg shadow-sm">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="शोधा: वस्तू, ठिकाण किंवा वर्णन..."
            className="ml-2 w-full outline-none text-sm"
          />
        </div>
      </div>

      {/* ⭐ TOP TABS */}
      <div className="px-3 mt-3 mb-2">
        <div className="flex bg-white p-1 rounded-full shadow-md border border-green-200">

          <Link
            to="/my-listings"
            className="w-1/2 flex items-center justify-center gap-1 py-2 rounded-full 
            text-[13px] font-semibold bg-green-600 text-white shadow-md"
          >
            <RectangleStackIcon className="w-4 h-4" />
            माझी उत्पादने
          </Link>

          <Link
            to="/my-bids"
            className="w-1/2 text-center py-2 rounded-full text-[13px] font-semibold transition-all
            bg-green-50 text-green-700"
          >
            माझ्या बोली
          </Link>
        </div>
      </div>

      {/* CATEGORY SCROLLER */}
      <div className="flex gap-2 overflow-x-auto bg-white px-3 py-3 border-b sticky top-[70px] z-10">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
              ${
                category === cat.id
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-700"
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 🔥 AUTO SLIDE BANNER */}
      <div className="p-3">
        <div className="rounded-xl overflow-hidden shadow-md relative">
          <img
            key={bannerIndex}
            src={bannerImages[bannerIndex]}
            alt="banner"
            className="w-full h-40 object-cover transition-all duration-700 ease-in-out"
          />

          {/* DOTS */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
            {bannerImages.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  bannerIndex === i ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

   {/* PRODUCT GRID */}
      <div className="px-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">लोड होत आहे...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-600 shadow">
            कोणतीही वस्तू सापडली नाही.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product) => {
              const totalBids = product.bids?.length || 0;

              const imageToShow =
                product.images?.length > 0
                  ? product.images[0]
                  : fallbackImages[product.category] || fallbackImages.other;

              return (
                <Link key={product.id} to={`/marketplace/${product.id}`}>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">

                    <div className="h-32 bg-gray-100 relative">
                      <img
                        src={imageToShow}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute top-1 left-1 bg-green-700 text-white px-2 py-0.5 rounded-full text-[9px] shadow flex items-center gap-1">
                        <TagIcon className="w-3 h-6" />
                       <p style={{fontSize:'10px'}}>{totalBids > 0 ? `${totalBids} बोली` : "बोली नाही"}</p> 
                      </div>
                    </div>

                    {/* ⭐ CATEGORY CHIP ⭐ */}
                    <div
                      className="mt-2 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold"
                      style={{
                        backgroundColor: "#f07528",
                        color: "white",
                        fontSize: "10px",
                      }}
                    >
                      {getCategoryLabel(product.category)}
                    </div>

                    <div className="p-2">
                      <h6 className="font-semibold text-green-800 leading-tight line-clamp-2">
                       <p style={{fontSize:'12px',textAlign:'center'}}>{product.title}</p> 
                      </h6>

                      <div className="flex items-center gap-1 mt-1">
                        <UserIcon className="w-3 h-3 text-gray-400" />
                        <p style={{ fontSize: "10px" }}>
                          {product.sellerName || "विक्रेता नाही"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <MapPinIcon className="w-3 h-3 text-gray-400" />
                        <p style={{ fontSize: "10px" }}>
                          {product.location || "ठिकाण उपलब्ध नाही"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 mt-1">
                        <CurrencyRupeeIcon className="w-4 h-4 text-green-700" />
                        <p className="text-green-700 font-bold text-[15px] leading-none">
                          {product.price}
                        </p>
                      </div>

                      <p className="text-[10px] text-gray-600 line-clamp-1 mt-1">
                          <p style={{ fontSize: "10px" }}> {product.description}</p>
                      </p>
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
