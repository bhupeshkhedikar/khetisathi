import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from  "./firebaseConfig";

export default function EquipmentDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("perDay"); // perDay/perHour/perAcre
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const refDoc = doc(db, "equipments", id);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) {
        setItem(null);
        setLoading(false);
        return;
      }
      const data = { id: snap.id, ...snap.data() };
      setItem(data);
      // default unit fallback
      if (data.pricing?.perDay) setSelectedUnit("perDay");
      else if (data.pricing?.perHour) setSelectedUnit("perHour");
      else if (data.pricing?.perAcre) setSelectedUnit("perAcre");
      setLoading(false);
    }
    fetch();
  }, [id]);

  if (loading) return <div className="py-10 text-center">Loading...</div>;
  if (!item) return <div className="py-10 text-center">Item not found</div>;

  // estimated price calc (simple)
  const calcEstimated = () => {
    let basePrice = 0;
    if (selectedUnit === "perDay") basePrice = item.pricing?.perDay || 0;
    if (selectedUnit === "perHour") basePrice = item.pricing?.perHour || 0;
    if (selectedUnit === "perAcre") basePrice = item.pricing?.perAcre || 0;

    // consider variant price override
    const variant = item.variants?.[selectedVariantIndex];
    if (variant && variant.price) basePrice = variant.price;

    // attachments sum
    const attachmentsSum = item.attachments?.filter(a=>selectedAttachments.includes(a.title)).reduce((s,a)=>s + (a.price||0), 0) || 0;

    // compute days if dates chosen
    let multiplier = 1;
    if (startDate && endDate) {
      const sd = new Date(startDate);
      const ed = new Date(endDate);
      const days = Math.max(1, Math.ceil((ed - sd) / (1000 * 60 * 60 * 24)));
      multiplier = days;
    }

    return basePrice * multiplier + attachmentsSum;
  }

  const handleToggleAttachment = (title) => {
    setSelectedAttachments(prev => prev.includes(title) ? prev.filter(t=>t!==title) : [...prev, title]);
  };

  const handleRent = async () => {
    const user = auth.currentUser;
    if (!user) {
      return navigate("/login");
    }
    // create booking (simple)
    const booking = {
      equipmentId: item.id,
      equipmentTitle: item.title,
      userId: user.uid,
      ownerId: item.ownerId,
      unit: selectedUnit,
      variant: item.variants?.[selectedVariantIndex]?.title || null,
      attachments: selectedAttachments,
      startDate: startDate || null,
      endDate: endDate || null,
      estimatedPrice: calcEstimated(),
      status: "pending",
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "bookings"), booking);
    alert("Booking created. Owner will contact you.");
    navigate("/profile");
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid md:grid-cols-3 gap-6">
        {/* left: gallery */}
        <div className="md:col-span-2 bg-white p-4 rounded-xl shadow">
          <div className="h-72 bg-gray-100 rounded overflow-hidden">
            <img src={(item.images && item.images[0]) || "/placeholder.png"} alt={item.title} className="w-full h-full object-cover" />
          </div>

          {/* thumbnails */}
          <div className="mt-3 flex gap-2">
            {item.images?.map((u, idx) => (
              <img key={idx} src={u} alt="thumb" className="w-20 h-16 object-cover rounded cursor-pointer" onClick={()=>{/* optional swap main */}} />
            ))}
          </div>

          <div className="mt-5">
            <h1 className="text-2xl font-extrabold">{item.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{item.category} • {item.location?.text}</p>

            <div className="mt-4 space-y-3">
              <div className="bg-green-50 p-3 rounded-md border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-600">Pricing</div>
                    <div className="font-bold text-xl text-green-700">
                      {item.pricing?.perDay ? `₹${item.pricing.perDay}/day` : item.pricing?.perHour ? `₹${item.pricing.perHour}/hr` : (item.pricing?.perAcre ? `₹${item.pricing.perAcre}/acre` : "Price on request")}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Owner's hours: {item.availableFrom} - {item.availableTo}</div>
                </div>
              </div>

              {/* variants */}
              {item.variants?.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Available Options</div>
                  <div className="flex gap-2 flex-wrap">
                    {item.variants.map((v, idx) => (
                      <button key={idx} onClick={()=>setSelectedVariantIndex(idx)}
                        className={`px-3 py-2 rounded border ${selectedVariantIndex===idx ? "bg-green-700 text-white" : "bg-white text-gray-700"}`}>
                        {v.title} {v.price ? `• ₹${v.price}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* attachments */}
              {item.attachments?.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Available Attachments</div>
                  <div className="flex gap-2 flex-wrap">
                    {item.attachments.map((a, idx) => (
                      <label key={idx} className="flex items-center gap-2 px-3 py-2 border rounded bg-white">
                        <input type="checkbox" checked={selectedAttachments.includes(a.title)} onChange={()=>handleToggleAttachment(a.title)} />
                        <div className="text-sm">
                          <div className="font-medium">{a.title}</div>
                          <div className="text-xs text-gray-500">₹{a.price}/{a.unit}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* booking options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-semibold">Select Pricing Unit</div>
                  <select value={selectedUnit} onChange={e=>setSelectedUnit(e.target.value)} className="border rounded p-2 mt-2 w-full">
                    {item.pricing?.perDay && <option value="perDay">Per Day</option>}
                    {item.pricing?.perHour && <option value="perHour">Per Hour</option>}
                    {item.pricing?.perAcre && <option value="perAcre">Per Acre</option>}
                  </select>
                </div>

                <div>
                  <div className="text-sm font-semibold">Select Dates</div>
                  <div className="flex gap-2 mt-2">
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border rounded p-2 w-full" />
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border rounded p-2 w-full" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div>
                  <div className="text-sm text-gray-500">Estimated Price</div>
                  <div className="text-2xl font-bold text-green-700">₹{calcEstimated()}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleRent} className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded font-semibold shadow">Rent This Equipment</button>
                  <button onClick={()=>{/* contact owner or share */}} className="border px-3 py-2 rounded">Contact</button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold">Description</h3>
              <p className="text-sm text-gray-700 mt-2">{item.description}</p>
            </div>
          </div>
        </div>

        {/* right column: owner card & stats */}
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">{(item.ownerName||"O").charAt(0)}</div>
            <div>
              <div className="font-semibold">{item.ownerName}</div>
              <div className="text-xs text-gray-500">Owner</div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="text-sm text-gray-500">Location</div>
            <div className="font-medium">{item.location?.text || "-"}</div>

            <div className="text-sm text-gray-500 mt-2">Availability</div>
            <div className="font-medium">{item.availableFrom} - {item.availableTo}</div>

            <div className="text-sm text-gray-500 mt-2">Ratings</div>
            <div className="font-medium">⭐ {item.rating || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
