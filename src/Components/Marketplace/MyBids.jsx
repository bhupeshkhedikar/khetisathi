// MyBids.jsx (Marathi Version + Fallback Images)
import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, updateDoc, doc } from "firebase/firestore";
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

export default function MyBids() {
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingCommissionId, setPayingCommissionId] = useState(null);

  // कमिशन सेटअप
  const COMMISSION_PERCENT = 5;
  const FIXED_COMMISSION = null;

  const computeCommission = (amount) => {
    if (FIXED_COMMISSION !== null) return FIXED_COMMISSION;
    return Math.max(1, Math.round((amount * COMMISSION_PERCENT) / 100));
  };

  // लॉगिन तपासा
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // माझ्या बिड्स असलेली प्रोडक्ट्स लोड करा
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, "marketplaceProducts"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // फक्त जिथे मी बोली लावली आहे
        const myBidProducts = allProducts.filter((p) =>
          (p.bids || []).some((b) => b.buyerId === currentUser.uid)
        );

        setProducts(myBidProducts);
        setLoading(false);
      },
      (err) => {
        console.error("Buyer bids load error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // कमिशन भरताना
  const handlePayCommission = async (product) => {
    if (!currentUser) return alert("कृपया प्रथम लॉगिन करा.");

    const accepted = product.acceptedBid;
    const commission = computeCommission(accepted.amount);

    if (!window.confirm(`विक्रेत्याचा संपर्क पाहण्यासाठी ₹${commission} कमिशन भरण्याची खात्री आहे का?`))
      return;

    setPayingCommissionId(product.id);

    try {
      alert("डेमो: पेमेंट यशस्वी झाले!");

      await updateDoc(doc(db, "marketplaceProducts", product.id), {
        buyerPaidCommission: true,
        commissionPaidAmount: commission,
        commissionPaidAt: Date.now(),
      });

      alert("विक्रेत्याचा संपर्क अनलॉक झाला!");
    } catch (err) {
      console.error(err);
      alert("कमिशन भरताना त्रुटी: " + err.message);
    } finally {
      setPayingCommissionId(null);
    }
  };

  if (!currentUser)
    return <p className="p-6 text-center text-gray-600">आपल्या बोली पाहण्यासाठी लॉगिन करा…</p>;

  if (loading)
    return <p className="p-6 text-center text-green-600">आपल्या बोली लोड होत आहेत…</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
  <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-green-700 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          मार्केटप्लेसवर परत जा
        </Link>
        <h2 className="text-x font-bold text-green-700 mb-6 text-center">
          🌱 माझ्या बोली (खरेदीदार डॅशबोर्ड)
        </h2>

        {products.length === 0 && (
          <div className="text-center text-gray-600 bg-white p-6 rounded-xl shadow">
            आपण अजून कोणतीही बोली लावलेली नाही.
            <Link to="/marketplace" className="text-green-600 underline ml-2">
              मार्केटप्लेसवर जा →
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {products.map((product) => {
            const myBid = (product.bids || []).find(
              (b) => b.buyerId === currentUser.uid
            );

            const isAccepted =
              product.acceptedBid &&
              product.acceptedBid.buyerId === currentUser.uid;

            // ⭐ फॉलबॅक इमेज लॉजिक
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
                {/* Product Header */}
                <div className="flex gap-3">
                  <img
                    src={imgSrc}
                    className="w-28 h-20 object-cover rounded-lg border"
                    alt=""
                  />

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-800">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-500">विक्रेता: {product.sellerName}</p>
                    <p className="text-sm text-gray-500">किंमत: ₹{product.price}</p>
                  </div>
                </div>

                {/* My Bid */}
                <div className="mt-4 bg-green-50 p-3 rounded-lg">
                  <p className="font-semibold">आपली बोली: ₹{myBid.amount}</p>
                  <p className="text-xs text-gray-500">
                    {myBid.status === "pending"
                      ? "प्रलंबित"
                      : myBid.status === "accepted"
                      ? "स्वीकारली"
                      : "नाकारली"}
                  </p>
                </div>

                {/* If accepted but commission not paid */}
                {isAccepted && !product.buyerPaidCommission && (
                  <div className="bg-yellow-50 p-3 rounded-lg mt-4 text-sm">
                    🎉 आपली बोली स्वीकारली गेली आहे!
                    <br />
                    विक्रेत्याचा संपर्क पाहण्यासाठी कमिशन भरा.
                  </div>
                )}

                {/* Commission Button */}
                {isAccepted && !product.buyerPaidCommission && (
                  <button
                    onClick={() => handlePayCommission(product)}
                    disabled={payingCommissionId === product.id}
                    className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg"
                  >
                    {payingCommissionId === product.id
                      ? "प्रक्रिया सुरू…"
                      : `कमिशन भरा (₹${computeCommission(
                          product.acceptedBid.amount
                        )})`}
                  </button>
                )}

                {/* Seller Contact After Payment */}
                {isAccepted && product.buyerPaidCommission && (
                  <div className="bg-green-100 p-4 rounded-xl mt-4">
                    <h3 className="text-lg font-bold text-green-800">विक्रेता संपर्क</h3>

                    <p className="mt-2">📞 {product.sellerPhone || "उपलब्ध नाही"}</p>
                    <p>👨‍🌾 {product.sellerName}</p>
                    <p>📍 {product.location}</p>

                    <div className="mt-4">
                      <a
                        href={`tel:${product.sellerPhone}`}
                        className="block bg-green-600 text-white text-center py-2 rounded-lg"
                      >
                        विक्रेत्याला कॉल करा
                      </a>
                    </div>
                  </div>
                )}

                {/* View Product Link */}
                <Link
                  to={`/marketplace/${product.id}`}
                  className="block mt-4 text-green-600 underline text-center"
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
