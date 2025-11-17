import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig.js";
import {
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function MarketplaceAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all marketplace products
  useEffect(() => {
    const q = query(collection(db, "marketplaceProducts"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Admin products error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ANALYTICS (including commission metrics)
  const analytics = useMemo(() => {
    let productsWithBids = 0;
    let totalBids = 0;
    let acceptedBidProducts = 0;
    let commissionPaidProducts = 0;
    let totalCommission = 0;

    products.forEach((p) => {
      const bids = p.bids || [];

      if (bids.length > 0) {
        productsWithBids++;
        totalBids += bids.length;
      }

      if (p.acceptedBid) acceptedBidProducts++;

      if (p.buyerPaidCommission) {
        commissionPaidProducts++;
        totalCommission += Number(p.commissionPaidAmount || 0);
      }
    });

    return {
      totalProducts: products.length,
      productsWithBids,
      totalBids,
      acceptedBidProducts,
      commissionPaidProducts,
      totalCommission,
    };
  }, [products]);

  // Update status
  const handleUpdate = async (id, updates) => {
    try {
      await updateDoc(doc(db, "marketplaceProducts", id), updates);
    } catch (err) {
      console.error(err);
      alert("Failed");
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, "marketplaceProducts", id));
      alert("Deleted");
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-green-700">🛠 Marketplace Admin</h2>
          <Link className="text-green-700 underline" to="/marketplace">
            Open Marketplace →
          </Link>
        </div>

        {/* ANALYTICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <div className="text-xs text-gray-500">Total Products</div>
            <div className="text-2xl font-bold text-green-700">
              {analytics.totalProducts}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow text-center">
            <div className="text-xs text-gray-500">Products w/ Bids</div>
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.productsWithBids}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow text-center">
            <div className="text-xs text-gray-500">Total Bids</div>
            <div className="text-2xl font-bold text-gray-700">
              {analytics.totalBids}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow text-center">
            <div className="text-xs text-gray-500">Accepted Bids</div>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.acceptedBidProducts}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow text-center">
            <div className="text-xs text-gray-500">Commission Paid</div>
            <div className="text-2xl font-bold text-green-600">
              {analytics.commissionPaidProducts}
            </div>
          </div>

          {/* ⭐ TOTAL COMMISSION COLLECTED */}
          <div className="bg-green-100 p-4 rounded-xl shadow text-center">
            <div className="text-xs text-gray-600">Total Commission Collected</div>
            <div className="text-2xl font-bold text-green-900">
              ₹{analytics.totalCommission}
            </div>
          </div>
        </div>

        {/* PRODUCTS LIST */}
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => {
              const hasBids = (p.bids || []).length > 0;
              const accepted = p.acceptedBid;
              const commissionPaid = p.buyerPaidCommission;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl shadow p-4 border border-green-100"
                >
                  {/* PRODUCT HEADER */}
                  <div className="flex gap-3">
                    <img
                      src={p.images?.[0] || "https://via.placeholder.com/120"}
                      className="w-28 h-20 object-cover rounded-lg"
                    />

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-green-800">{p.title}</h3>
                      <p className="text-sm text-gray-600">Seller: {p.sellerName}</p>
                      <p className="text-sm text-gray-600">Location: {p.location}</p>
                      <p className="font-bold text-green-700 mt-1">₹{p.price}</p>
                    </div>
                  </div>

                  {/* STATUS TAGS */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {hasBids && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                        🟡 Has Bids ({p.bids.length})
                      </span>
                    )}

                    {accepted && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        🟢 Accepted Bid: ₹{accepted.amount}
                      </span>
                    )}

                    {commissionPaid && (
                      <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1">
                        🔵 Commission Paid
                        <BanknotesIcon className="w-4 h-4" />
                        ₹{p.commissionPaidAmount}
                      </span>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="mt-3 flex gap-2">
                    {p.status !== "approved" && (
                      <button
                        onClick={() => handleUpdate(p.id, { status: "approved" })}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
                      >
                        <CheckCircleIcon className="w-4 h-4" /> Approve
                      </button>
                    )}

                    {p.status !== "rejected" && (
                      <button
                        onClick={() => handleUpdate(p.id, { status: "rejected" })}
                        className="bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
                      >
                        <XCircleIcon className="w-4 h-4" /> Reject
                      </button>
                    )}

                    <button
                      onClick={() => handleUpdate(p.id, { status: "sold" })}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg"
                    >
                      Sold
                    </button>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg flex items-center"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* STATUS */}
                  <p className="mt-2 text-xs text-gray-500">
                    Status: <span className="font-semibold">{p.status}</span>
                  </p>

                  {/* VIEW PRODUCT */}
                  <Link
                    to={`/marketplace/${p.id}`}
                    className="block mt-3 text-green-700 underline"
                  >
                    View Product →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
