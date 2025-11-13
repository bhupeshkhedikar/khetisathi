import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from  "./firebaseConfig"
import { useNavigate } from "react-router-dom";

export default function AdminEquipment() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  const fetchAll = async () => {
    const snap = await getDocs(collection(db, "equipments"));
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this equipment?")) return;
    await deleteDoc(doc(db, "equipments", id));
    fetchAll();
  };

  const toggleActive = async (id, v) => {
    await updateDoc(doc(db, "equipments", id), { isActive: !v });
    fetchAll();
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-extrabold mb-4">Admin - Equipments</h2>
      <div className="grid gap-3">
        {items.map(it => (
          <div key={it.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{it.title}</div>
              <div className="text-xs text-gray-500">{it.category} • {it.location?.text}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>navigate(`/equipment/${it.id}`)} className="px-3 py-1 border rounded">View</button>
              <button onClick={()=>toggleActive(it.id, it.isActive)} className="px-3 py-1 bg-green-700 text-white rounded">{it.isActive ? "Disable" : "Enable"}</button>
              <button onClick={()=>handleDelete(it.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
