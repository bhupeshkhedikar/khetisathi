import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";
import { db, storage, auth } from "./firebaseConfig";
import { v4 as uuidv4 } from "uuid";

export default function UploadEquipment() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Tractor");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [availableFrom, setAvailableFrom] = useState("08:00");
  const [availableTo, setAvailableTo] = useState("18:00");

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const [perDay, setPerDay] = useState("");
  const [perHour, setPerHour] = useState("");
  const [perAcre, setPerAcre] = useState("");
  const [pricingUnits, setPricingUnits] = useState({
    day: true,
    hour: false,
    acre: false
  });

  const [variants, setVariants] = useState([
    { id: uuidv4(), title: "", price: "" }
  ]);

  const [attachments, setAttachments] = useState([
    { id: uuidv4(), title: "", price: "", unit: "hr" }
  ]);

  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [mapLoaded, setMapLoaded] = useState(false);
  const locationInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "Tractor",
    "Harvester",
    "JCB",
    "Bullockcart",
    "Water Pump",
    "Rotavator",
    "Other"
  ];

  // Load Google Maps Autocomplete
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google && window.google.maps && !mapLoaded) {
        initAutocomplete();
        setMapLoaded(true);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const initAutocomplete = () => {
    if (!locationInputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      locationInputRef.current,
      {
        types: ["geocode"],
        componentRestrictions: { country: "in" }
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      setLocationText(place.formatted_address || place.name);
      setCoords({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });
    });
  };

  // Image Change
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 6);
    setImages(files);
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
  };

  // Variant handlers
  const addVariant = () =>
    setVariants((v) => [...v, { id: uuidv4(), title: "", price: "" }]);

  const removeVariant = (id) =>
    setVariants((v) => v.filter((x) => x.id !== id));

  const updateVariant = (id, key, val) =>
    setVariants((v) =>
      v.map((x) => (x.id === id ? { ...x, [key]: val } : x))
    );

  // Attachments handlers
  const addAttachment = () =>
    setAttachments((a) => [...a, { id: uuidv4(), title: "", price: "", unit: "hr" }]);

  const removeAttachment = (id) =>
    setAttachments((a) => a.filter((x) => x.id !== id));

  const updateAttachment = (id, key, val) =>
    setAttachments((a) =>
      a.map((x) => (x.id === id ? { ...x, [key]: val } : x))
    );

  // Upload images
  const uploadAll = async (docId) => {
    if (images.length === 0) return [];

    const urls = [];
    for (const file of images) {
      const storageRef = ref(
        storage,
        `equipments/${docId}/${file.name}-${Date.now()}`
      );

      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          reject,
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            urls.push(downloadURL);
            resolve();
          }
        );
      });
    }

    return urls;
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Please log in first.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "equipments"), {
        title,
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        category,
        description,
        location: {
          text: locationText,
          lat: coords.lat,
          lng: coords.lng
        },
        pricing: {
          perDay: perDay || null,
          perHour: perHour || null,
          perAcre: perAcre || null
        },
        pricingUnits: [
          pricingUnits.day ? "perDay" : null,
          pricingUnits.hour ? "perHour" : null,
          pricingUnits.acre ? "perAcre" : null
        ].filter(Boolean),
        variants,
        attachments,
        availableFrom,
        availableTo,
        createdAt: serverTimestamp(),
        isActive: true,
        images: []
      });

      const urls = await uploadAll(docRef.id);

      await updateDoc(doc(db, "equipments", docRef.id), {
        images: urls
      });

      navigate("/equipment-list");
    } catch (err) {
      console.error(err);
      setError("Upload failed: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-3 md:p-4">
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border">

        <h2 className="text-xl md:text-2xl font-extrabold text-green-700 mb-4">
          Upload Equipment
        </h2>

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* IMAGES */}
          <div>
            <label className="font-medium">Photos (Optional)</label>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} />
            <div className="flex overflow-x-auto gap-3 mt-2 pb-2">
              {previewUrls.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  className="w-28 h-20 rounded-lg object-cover shadow"
                  alt=""
                />
              ))}
            </div>
          </div>

          {/* TITLE + CATEGORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-medium">Title</label>
              <input
                className="border w-full rounded-lg p-2 mt-1"
                placeholder="Tractor Akash"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="font-medium">Category</label>
              <select
                className="border w-full rounded-lg p-2 mt-1"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* LOCATION */}
          <div>
            <label className="font-medium">Location</label>
            <input
              ref={locationInputRef}
              type="text"
              placeholder="Search Location..."
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="border w-full rounded-lg p-2 mt-1"
            />
            {coords.lat && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {coords.lat}, {coords.lng}
              </p>
            )}
          </div>

          {/* PRICING */}
          <div className="bg-green-50 p-4 rounded-lg border">
            <p className="font-semibold text-green-700 mb-2">
              Pricing Options
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Day */}
              <div className="flex flex-col">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pricingUnits.day}
                    onChange={() =>
                      setPricingUnits((p) => ({ ...p, day: !p.day }))
                    }
                  />
                  <span>Per Day</span>
                </label>
                {pricingUnits.day && (
                  <input
                    type="number"
                    placeholder="₹/day"
                    value={perDay}
                    onChange={(e) => setPerDay(e.target.value)}
                    className="border rounded mt-1 p-2"
                  />
                )}
              </div>

              {/* Hour */}
              <div className="flex flex-col">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pricingUnits.hour}
                    onChange={() =>
                      setPricingUnits((p) => ({ ...p, hour: !p.hour }))
                    }
                  />
                  <span>Per Hour</span>
                </label>
                {pricingUnits.hour && (
                  <input
                    type="number"
                    placeholder="₹/hr"
                    value={perHour}
                    onChange={(e) => setPerHour(e.target.value)}
                    className="border rounded mt-1 p-2"
                  />
                )}
              </div>

              {/* Acre */}
              <div className="flex flex-col">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pricingUnits.acre}
                    onChange={() =>
                      setPricingUnits((p) => ({ ...p, acre: !p.acre }))
                    }
                  />
                  <span>Per Acre</span>
                </label>
                {pricingUnits.acre && (
                  <input
                    type="number"
                    placeholder="₹/acre"
                    value={perAcre}
                    onChange={(e) => setPerAcre(e.target.value)}
                    className="border rounded mt-1 p-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* VARIANTS */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="font-semibold">Variants / Options</p>
              <button
                type="button"
                onClick={addVariant}
                className="bg-green-700 text-white text-sm px-3 py-1 rounded"
              >
                + Add
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <input
                    className="border rounded p-2"
                    placeholder="Option title"
                    value={v.title}
                    onChange={(e) =>
                      updateVariant(v.id, "title", e.target.value)
                    }
                  />
                  <input
                    className="border rounded p-2"
                    placeholder="₹ price"
                    value={v.price}
                    onChange={(e) =>
                      updateVariant(v.id, "price", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ATTACHMENTS */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="font-semibold">Attachments</p>
              <button
                type="button"
                onClick={addAttachment}
                className="bg-green-700 text-white text-sm px-3 py-1 rounded"
              >
                + Add
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3"
                >
                  <input
                    className="border rounded p-2"
                    placeholder="Attachment title"
                    value={a.title}
                    onChange={(e) =>
                      updateAttachment(a.id, "title", e.target.value)
                    }
                  />
                  <input
                    className="border rounded p-2"
                    placeholder="₹ price"
                    value={a.price}
                    onChange={(e) =>
                      updateAttachment(a.id, "price", e.target.value)
                    }
                  />
                  <select
                    className="border rounded p-2"
                    value={a.unit}
                    onChange={(e) =>
                      updateAttachment(a.id, "unit", e.target.value)
                    }
                  >
                    <option value="hr">/hr</option>
                    <option value="day">/day</option>
                    <option value="acre">/acre</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AVAILABILITY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium">Available From</label>
              <input
                type="time"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="border rounded w-full p-2 mt-1"
              />
            </div>

            <div>
              <label className="font-medium">Available To</label>
              <input
                type="time"
                value={availableTo}
                onChange={(e) => setAvailableTo(e.target.value)}
                className="border rounded w-full p-2 mt-1"
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="font-medium">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border w-full rounded-lg p-2 mt-1"
              placeholder="Describe your equipment…"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              disabled={loading}
              className="bg-green-700 text-white px-5 py-2 rounded-lg shadow font-semibold"
              type="submit"
            >
              {loading ? "Uploading…" : "Publish Equipment"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/equipment-list")}
              className="text-gray-600"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
