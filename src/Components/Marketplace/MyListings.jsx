import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// ⭐ SAME FALLBACK IMAGES (Category Based)
const fallbackImages = {
  seeds:
    "https://www.oecd.org/adobe/dynamicmedia/deliver/dm-aid--1add17d0-a5f4-4161-a696-6dfcfe14a205/seeds-web-image-oecd.jpg?preferwebp=true&quality=80",

  tools:
    "https://thumbs.dreamstime.com/b/display-board-featuring-vintage-farming-tools-including-shovels-pitchforks-machete-arranged-outdoors-slow-living-traditional-374927867.jpg",

  fertilizer:
    "https://thumbs.dreamstime.com/b/fertilizer-bags-stacked-neatly-lush-crop-field-open-sky-area-text-overlay-high-quality-photo-321667543.jpg",

  animals:
    "https://www.outdooraccess-scotland.scot/sites/default/files/styles/hero_banner_half_width/public/2018-09/Whitmuir-D8598.jpg?h=265e640d&itok=glRvq-8S",

  vehicles:
    "https://media.istockphoto.com/id/492774776/photo/farmer-with-tractor-seeding-crops-at-field.jpg?s=612x612&w=0&k=20&c=s54a8e5m8lj-hg660QrK2bV8ZIc8bYB8dr9Ch7IRBvY=",

  other:
    "https://www.liebigsagrochem.com/static/media/all-product.2fd1c15854e259340c68.jpg",
};

export default function MyListings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingBidId, setAcceptingBidId] = useState(null);

  // AUTH CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // LOAD SELLER PRODUCTS
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "marketplaceProducts"),
      where("sellerId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Seller products error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // ACCEPT BID
  const handleAcceptBid = async (product, bid) => {
    if (!window.confirm(`₹${bid.amount} ची बोली स्वीकारायची आहे का?`)) return;

    setAcceptingBidId(bid.bidId);

    try {
      const updatedBids = product.bids.map((b) =>
        b.bidId === bid.bidId
          ? { ...b, status: "accepted" }
          : { ...b, status: "rejected" }
      );

      await updateDoc(doc(db, "marketplaceProducts", product.id), {
        bids: updatedBids,
        acceptedBid: {
          bidId: bid.bidId,
          buyerId: bid.buyerId,
          amount: bid.amount,
          acceptedAt: Date.now(),
        },
        buyerPaidCommission: false,
      });

      alert("बोली स्वीकारली !");
    } catch (err) {
      console.error(err);
      alert("बोली स्वीकारण्यात त्रुटी: " + err.message);
    } finally {
      setAcceptingBidId(null);
    }
  };

  // REJECT BID
  const handleRejectBid = async (product, bid) => {
    if (!window.confirm(`₹${bid.amount} ची बोली नाकारायची आहे का?`)) return;

    try {
      const updatedBids = product.bids.map((b) =>
        b.bidId === bid.bidId ? { ...b, status: "rejected" } : b
      );

      await updateDoc(doc(db, "marketplaceProducts", product.id), {
        bids: updatedBids,
      });

      alert("बोली नाकारली !");
    } catch (err) {
      console.error(err);
      alert("बोली नाकारण्यात त्रुटी: " + err.message);
    }
  };

  if (!currentUser)
    return <p className="p-6 text-center text-gray-600">कृपया लॉगिन करा…</p>;

  if (loading)
    return <p className="p-6 text-center text-green-600">आपली उत्पादने लोड होत आहेत…</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
   <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-green-700 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          मार्केटप्लेसवर परत जा
        </Link>
        <h2 className="text-x font-bold text-green-700 mb-6 text-center">
          🌿 माझी मार्केटप्लेस उत्पादने
        </h2>

        {products.length === 0 && (
          <div className="text-center text-gray-600 bg-white p-6 rounded-xl shadow">
            आपण अजून कोणतेही उत्पादन लिस्ट केलेले नाही.
            <Link to="/sell" className="text-green-600 underline ml-2">
              आता लिस्ट करा
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {products.map((product) => {
            // ⭐ GET PRODUCT IMAGE (Fallback Included)
            let imgSrc = "";

            if (product.images?.length > 0) {
              imgSrc = product.images[0];
            } else if (product.img) {
              imgSrc = product.img;
            } else {
              const cat = product.category?.toLowerCase() || "other";
              imgSrc = fallbackImages[cat] || fallbackImages["other"];
            }

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow border border-green-200 p-5"
              >
                {/* PRODUCT HEADER */}
                <div className="flex gap-3 mb-4">
                  <img
                    src={imgSrc}
                    className="w-28 h-20 object-cover rounded-lg border"
                    alt=""
                  />

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-800">{product.title}</h3>
                    <p className="text-sm text-gray-500">किंमत: ₹{product.price}</p>
                    <p className="text-sm text-gray-500">📍 {product.location}</p>

                    {product.acceptedBid && (
                      <p className="text-sm text-green-700 font-semibold mt-1">
                        स्वीकारलेली बोली: ₹{product.acceptedBid.amount}
                      </p>
                    )}

                    {product.buyerPaidCommission && (
                      <p className="text-sm text-blue-700 font-semibold">
                        खरेदीदाराने कमिशन भरले ✔
                      </p>
                    )}
                  </div>
                </div>

                {/* BIDS SECTION */}
                <h4 className="text-md font-semibold text-green-700 mb-2">
                  आलेल्या बोली ({product.bids?.length || 0})
                </h4>

                {(!product.bids || product.bids.length === 0) && (
                  <p className="text-gray-500">अजून कोणतीही बोली नाही.</p>
                )}

                <div className="space-y-3">
                  {product.bids?.map((bid) => (
                    <div
                      key={bid.bidId}
                      className="bg-green-50 rounded-lg p-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold">₹{bid.amount}</p>
                        <p className="text-xs text-gray-500">{bid.buyerName}</p>
                      </div>

                      {/* STATUS */}
                      {bid.status === "accepted" ? (
                        <span className="text-green-700 font-semibold">स्वीकारली</span>
                      ) : bid.status === "rejected" ? (
                        <span className="text-red-600 font-semibold">नाकारली</span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptBid(product, bid)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg"
                            disabled={acceptingBidId === bid.bidId}
                          >
                            {acceptingBidId === bid.bidId ? "स्वीकारत आहे…" : "स्वीकारा"}
                          </button>

                          <button
                            onClick={() => handleRejectBid(product, bid)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg"
                          >
                            नाका
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* VIEW PRODUCT PAGE */}
                <Link
                  to={`/marketplace/${product.id}`}
                  className="block text-center mt-4 text-green-700 underline"
                >
                  उत्पादन पाहा →
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
