// ProductDetails.jsx (Marathi Version - Updated with Auto Slider + Gallery)

import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig.js";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { onAuthStateChanged } from "firebase/auth";

// Fallback images
const fallbackImages = {
  seeds:
    "https://www.oecd.org/adobe/dynamicmedia/deliver/dm-aid--1add17d0-a5f4-4161-a696-6dfcfe14a205/seeds-web-image-oecd.jpg",
  tools:
    "https://thumbs.dreamstime.com/b/display-board-featuring-vintage-farming-tools-including-shovels-pitchforks-machete-arranged-outdoors-slow-living-traditional-374927867.jpg",
  fertilizer:
    "https://thumbs.dreamstime.com/b/fertilizer-bags-stacked-neatly-lush-crop-field-open-sky-area-text-overlay-high-quality-photo-321667543.jpg",
  animals:
    "https://www.outdooraccess-scotland.scot/sites/default/files/styles/hero_banner_half_width/public/2018-09/Whitmuir-D8598.jpg",
  vehicles:
    "https://media.istockphoto.com/id/492774776/photo/farmer-with-tractor-seeding-crops-at-field.jpg",
  other:
    "https://www.liebigsagrochem.com/static/media/all-product.2fd1c15854e259340c68.jpg",
};

export default function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Image Slider States
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef(null);

  // Bid States
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [placingBid, setPlacingBid] = useState(false);
  const [acceptingBidId, setAcceptingBidId] = useState(null);
  const [payingCommission, setPayingCommission] = useState(false);

  const COMMISSION_PERCENT = 5;

  // User auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Load product realtime
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "marketplaceProducts", id),
      (snap) => {
        if (snap.exists()) setProduct({ id: snap.id, ...snap.data() });
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  // Auto slider every 3 sec
  useEffect(() => {
    if (!product) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) =>
        prev + 1 < images.length ? prev + 1 : 0
      );
    }, 3000);

    return () => clearInterval(interval);
  });

  if (loading) return <div className="p-6 text-center">लोड होत आहे…</div>;
  if (!product) return <div className="p-6 text-center text-red-600">उत्पादन सापडले नाही.</div>;

  // Image list with fallback
  const images =
    product?.images?.length > 0
      ? product.images
      : [fallbackImages[product.category] || fallbackImages["other"]];

  const isSeller = currentUser?.uid === product.sellerId;

  const acceptedBid = product.acceptedBid || null;
  const isAcceptedBuyer = acceptedBid?.buyerId === currentUser?.uid;

  const computeCommission = (amt) =>
    Math.max(1, Math.round((amt * COMMISSION_PERCENT) / 100));

  // Place Bid
  const handlePlaceBid = async () => {
    if (!bidAmount) return alert("कृपया योग्य रक्कम भरा");

    setPlacingBid(true);
    try {
      const bid = {
        bidId: crypto.randomUUID(),
        buyerId: currentUser.uid,
        buyerName: currentUser.displayName || "शेतकरी",
        amount: Number(bidAmount),
        status: "pending",
        createdAt: Date.now(),
      };

      await updateDoc(doc(db, "marketplaceProducts", id), {
        bids: arrayUnion(bid),
      });

      alert("बोली सबमिट झाली!");
      setBidAmount("");
      setShowBidModal(false);
    } catch (err) {
      alert(err.message);
    }
    setPlacingBid(false);
  };

  // Accept Bid (Seller)
  const handleAcceptBid = async (b) => {
    if (!window.confirm(`₹${b.amount} स्वीकारायचे आहे का?`)) return;

    setAcceptingBidId(b.bidId);
    const updated = product.bids.map((x) =>
      x.bidId === b.bidId
        ? { ...x, status: "accepted" }
        : { ...x, status: "rejected" }
    );

    await updateDoc(doc(db, "marketplaceProducts", id), {
      bids: updated,
      acceptedBid: {
        bidId: b.bidId,
        buyerId: b.buyerId,
        amount: b.amount,
        acceptedAt: serverTimestamp(),
      },
      buyerPaidCommission: false,
    });

    setAcceptingBidId(null);
  };

  // Pay Commission
  const handlePayCommission = async () => {
    const commission = computeCommission(acceptedBid.amount);

    if (!window.confirm(`आपण ₹${commission} कमिशन भरणार आहात?`)) return;

    setPayingCommission(true);

    await updateDoc(doc(db, "marketplaceProducts", id), {
      buyerPaidCommission: true,
      commissionPaidAmount: commission,
      commissionPaidAt: serverTimestamp(),
    });

    alert("कमिशन भरले! संपर्क दाखवला जाईल.");
    setPayingCommission(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4">
      <div className="max-w-3xl mx-auto">

        {/* Back Button */}
        <Link to="/marketplace" className="flex items-center gap-2 text-green-700 mb-4">
          <ArrowLeftIcon className="w-5 h-5" /> परत जा
        </Link>

        {/* Product Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* ⭐ AUTO SLIDER SECTION ⭐ */}
          <div className="h-64 bg-gray-200 relative" ref={sliderRef}>
            <img
              src={images[activeIndex]}
              alt="product"
              className="w-full h-full object-cover transition-all duration-500"
            />

            {/* Small indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    activeIndex === i ? "bg-white" : "bg-white/40"
                  }`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          </div>

          {/* ⭐ ALL IMAGES GALLERY ⭐ */}
          <div className="flex gap-2 overflow-x-auto p-2 bg-gray-100">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                onClick={() => setActiveIndex(i)}
                className={`w-20 h-20 rounded-lg object-cover border ${
                  activeIndex === i ? "border-green-600" : "border-gray-300"
                }`}
              />
            ))}
          </div>

          {/* PRODUCT CONTENT */}
          <div className="p-4">
            <h2 className="text-xl font-bold text-green-800">{product.title}</h2>

            <div className="flex justify-between mt-2">
              <div className="text-xl font-bold text-green-700">₹{product.price}</div>
              <div className="text-gray-500">📍 {product.location}</div>
            </div>

            <p className="mt-3 text-sm text-gray-700">{product.description}</p>

            {/* BUYER ACTION BUTTONS */}
            <div className="mt-4">

              {!isSeller && !isAcceptedBuyer && (
                <button
                  onClick={() => setShowBidModal(true)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg"
                >
                  बोली लावा
                </button>
              )}

              {isAcceptedBuyer && !product.buyerPaidCommission && (
                <button
                  onClick={handlePayCommission}
                  className="w-full bg-yellow-600 text-white py-3 rounded-lg"
                >
                  कमिशन भरा
                </button>
              )}

              {isAcceptedBuyer && product.buyerPaidCommission && (
                <div className="mt-4 bg-green-100 p-4 rounded-xl">
                  <h3 className="text-green-800 font-bold text-lg">विक्रेता संपर्क</h3>
                  <p className="mt-1">📞 {product.sellerPhone}</p>
                  <p>👤 {product.sellerName}</p>
                  <p>📍 {product.location}</p>
                </div>
              )}
            </div>

            {/* SELLER VIEW - BIDS */}
            {isSeller && (
              <div className="mt-6">
                <h3 className="text-lg text-green-800 font-bold">आलेल्या बोली</h3>

                {!product.bids?.length && (
                  <p className="text-gray-500 mt-1">अजून कोणतीही बोली नाही.</p>
                )}

                {(product.bids || []).map((b) => (
                  <div
                    key={b.bidId}
                    className="bg-green-50 p-3 rounded-lg mt-2 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">₹{b.amount}</p>
                      <p className="text-xs text-gray-500">{b.buyerName}</p>
                    </div>

                    {b.status === "pending" && !product.acceptedBid && (
                      <button
                        onClick={() => handleAcceptBid(b)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg"
                      >
                        स्वीकारा
                      </button>
                    )}

                    {b.status === "accepted" && (
                      <p className="text-green-700 font-bold">स्वीकारली</p>
                    )}
                    {b.status === "rejected" && (
                      <p className="text-red-600 font-bold">नाकारली</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BID MODAL */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-80 rounded-xl p-5 shadow-lg">
            <h3 className="text-lg font-bold text-green-700">बोली भरा</h3>

            <input
              type="number"
              className="w-full p-3 border rounded-lg mt-3"
              placeholder="रक्कम (₹)"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />

            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-green-600 text-white py-2 rounded-lg"
                onClick={handlePlaceBid}
              >
                सबमिट
              </button>
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setShowBidModal(false)}
              >
                रद्द करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
