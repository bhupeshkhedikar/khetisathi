import React, { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, storage } from "./firebaseConfig.js";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const categories = [
  { id: "seeds", label: "बियाणे" },
  { id: "tools", label: "साधने" },
  { id: "fertilizer", label: "खते" },
  { id: "animals", label: "जनावरे" },
  { id: "vehicles", label: "वाहने" },
  { id: "other", label: "इतर" },
];

export default function SellForm({ currentUser }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("seeds");
  const [location, setLocation] = useState("");
  const [sellerPhone, setSellerPhone] = useState(currentUser?.phoneNumber || "");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !price) return alert("कृपया शीर्षक आणि किंमत भरा.");
    if (!sellerPhone || sellerPhone.length < 10)
      return alert("कृपया वैध 10 अंकी मोबाइल नंबर भरा.");

    setUploading(true);

    try {
      const docRef = await addDoc(collection(db, "marketplaceProducts"), {
        title,
        description,
        price: Number(price),
        category,
        location,
        sellerId: currentUser?.uid || null,
        sellerName: currentUser?.displayName || currentUser?.email || "शेतकरी",
        sellerPhone: sellerPhone, // ➤ NEW FIELD ADDED
        status: "pending",
        createdAt: serverTimestamp(),
        images: [],
      });

      const uploadedUrls = [];

      if (images.length > 0) {
        for (const file of images) {
          const storageRef = ref(storage, `marketplaceImages/${docRef.id}/${file.name}`);
          const uploadTask = uploadBytesResumable(storageRef, file);

          await new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              () => {},
              (err) => reject(err),
              async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                uploadedUrls.push(url);
                resolve();
              }
            );
          });
        }

        const { updateDoc, doc } = await import("firebase/firestore");
        await updateDoc(doc(db, "marketplaceProducts", docRef.id), {
          images: uploadedUrls,
        });
      }

      alert("उत्पादन सबमिट झाले — मंजूरीची प्रतीक्षा करा.");
      navigate("/marketplace");
    } catch (err) {
      console.error("Sell submit error:", err);
      alert("सबमिट करण्यात अडचण आली: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4">
          <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-green-700 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          मार्केटप्लेसवर परत जा
        </Link>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 shadow">
        <h2 className="text-x 
        font-bold text-green-700 mb-4">
          खेतीसाथी वर आपले उत्पादन विक्री करा
        </h2>

        {/* Navigation Buttons */}
        {/* <div className="flex gap-2 mb-4">
          <Link
            to="/marketplace"
            className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg shadow"
          >
            मार्केटप्लेस
          </Link>

          <Link
            to="/my-listings"
            className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg shadow"
          >
            माझी उत्पादने
          </Link>
          <Link
            to="/my-bids"
            className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg shadow"
          >
            माझ्या बोली 
          </Link>
        </div> */}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <input
            className="w-full p-3 border rounded-lg"
            placeholder="उत्पादनाचे शीर्षक लिहा"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full p-3 border rounded-lg"
            placeholder="उत्पादनाचे वर्णन लिहा"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              step="1"
              placeholder="किंमत (₹)"
              className="p-3 border rounded-lg"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <select
              className="p-3 border rounded-lg"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* LOCATION */}
          <input
            className="w-full p-3 border rounded-lg"
            placeholder="गाव / शहर"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          {/* SELLER PHONE (NEW FIELD) */}
          <input
            className="w-full p-3 border rounded-lg"
            placeholder="मोबाइल नंबर (10 अंक)"
            maxLength={10}
            value={sellerPhone}
            onChange={(e) => setSellerPhone(e.target.value)}
          />

          {/* IMAGES */}
          <div>
            <label className="text-sm text-gray-600">फोटो अपलोड करा (जास्तीत जास्त 5)</label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="w-full mt-2"
            />

            <div className="mt-2 flex gap-2 flex-wrap">
              {images.map((f, i) => (
                <div
                  key={i}
                  className="w-20 h-20 rounded-lg overflow-hidden border border-green-100"
                >
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold"
            >
              {uploading ? "अपलोड होत आहे..." : "मंजूरीसाठी सबमिट करा"}
            </button>

            <button
              type="button"
              onClick={() => {
                setTitle("");
                setDescription("");
                setImages([]);
                setSellerPhone("");
              }}
              className="px-4 py-3 rounded-lg border"
            >
              रिसेट
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
