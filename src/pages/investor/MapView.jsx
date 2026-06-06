import React, { useState, useEffect } from 'react';

const MapView = () => {
  // State untuk menyimpan data dari API backend
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk mengambil data dari Backend API (Misal: Node.js + Express)
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Ganti URL ini dengan endpoint API nyata Anda
        const response = await fetch('http://localhost:5000/api/properties'); 
        
        if (response.ok) {
          const data = await response.json();
          setProperties(data);
        } else {
          // Fallback ke mock data jika API belum siap
          setProperties(mockProperties); 
        }
      } catch (error) {
        console.error("Gagal mengambil data properti:", error);
        setProperties(mockProperties); // Fallback mock data
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <div className="bg-background text-on-surface overflow-hidden flex h-screen font-manrope">
      {/* --- Sidebar Navigation (Statik untuk layout dasar) --- */}
      <aside className="w-64 fixed left-0 top-0 z-50 h-full bg-surface-container-lowest border-r border-surface-variant flex flex-col p-4 space-y-2 text-sm font-semibold">
        <div className="px-4 py-6">
          <span className="text-lg font-black text-zinc-900 font-headline">CampusProp</span>
        </div>
        
        {/* User Profile */}
        <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-surface-container-low rounded-xl">
          <div className="w-10 h-10 rounded-full bg-primary-container overflow-hidden">
            <img alt="User Profile" src="https://ui-avatars.com/api/?name=Alex+Rivera&background=ff6b00&color=fff" />
          </div>
          <div>
            <p className="text-on-surface font-bold">Alex Rivera</p>
            <p className="text-xs text-secondary font-medium">Verified Student</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1">
          <a href="#" className="flex items-center gap-3 text-zinc-500 hover:bg-zinc-100 transition-all px-4 py-3 rounded-lg">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 text-orange-700 bg-surface-container-low rounded-lg px-4 py-3 shadow-sm relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full"></div>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            <span>Marketplace</span>
          </a>
          <a href="#" className="flex items-center gap-3 text-zinc-500 hover:bg-zinc-100 transition-all px-4 py-3 rounded-lg">
            <span className="material-symbols-outlined">domain</span>
            <span>Portfolio</span>
          </a>
        </nav>

        <button className="mt-4 bg-primary text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-sm">add</span>
          List Property
        </button>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="ml-64 flex-1 relative flex flex-col h-full">
        {/* Top Navigation */}
        <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-xl shadow-sm flex justify-between items-center px-6 py-4 font-headline">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-on-surface">Property Marketplace</h1>
            <div className="flex bg-surface-container-low p-1 rounded-lg ml-4">
              <button className="px-4 py-1.5 rounded-md bg-white shadow-sm text-sm font-bold text-primary">Map View</button>
              <button className="px-4 py-1.5 rounded-md text-sm font-medium text-secondary hover:text-on-surface transition-colors">List View</button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">search</span>
              <input type="text" placeholder="Search by area or campus..." className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-container w-64" />
            </div>
          </div>
        </header>

        {/* --- Map Container --- */}
        <div className="flex-1 relative overflow-hidden bg-surface-container-low">
          {/* Simulated Map Background */}
          <div className="absolute inset-0 z-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Chicago&zoom=13&size=1000x1000&style=feature:all|element:labels|visibility:off&style=feature:water|color:0xd4d4d4&style=feature:landscape|color:0xe5e5e5&style=feature:road|color:0xffffff')] bg-cover bg-center opacity-80 grayscale"></div>

          {/* DYNAMIC MAP PINS */}
          {properties.map((prop) => (
            <div 
              key={prop.id} 
              className="absolute z-10 cursor-pointer group"
              style={{ top: `${prop.mapY}%`, left: `${prop.mapX}%` }}
              onClick={() => setSelectedProperty(prop)}
            >
              <div className={`px-3 py-1.5 rounded-full font-bold shadow-md flex items-center gap-1 border-2 transition-colors ${selectedProperty?.id === prop.id ? 'bg-primary text-on-primary border-white animate-pulse shadow-lg' : 'bg-surface-container-lowest text-primary border-primary-container hover:bg-primary-container hover:text-on-primary'}`}>
                <span className="text-xs">$</span>{prop.shortPrice}
              </div>
              {selectedProperty?.id === prop.id && (
                <div className="w-0.5 h-3 bg-primary mx-auto"></div>
              )}
            </div>
          ))}

          {/* DYNAMIC PROPERTY DETAIL OVERLAY CARD */}
          {selectedProperty && (
            <div className="absolute top-[38%] left-[45%] z-40 w-80 bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 border border-surface-variant/50">
              <div className="relative h-32">
                <img src={selectedProperty.imageUrl} alt={selectedProperty.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 flex gap-2">
                  {selectedProperty.highRoi && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">High ROI</span>}
                  {selectedProperty.isPremium && <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Premium</span>}
                </div>
                {/* Tombol Close Card */}
                <button onClick={() => setSelectedProperty(null)} className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight font-headline">{selectedProperty.name}</h3>
                  <span className="material-symbols-outlined text-primary">favorite</span>
                </div>
                <div className="flex gap-4 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-secondary uppercase font-bold tracking-tighter">Est. ROI</span>
                    <span className="text-sm font-black text-on-surface">{selectedProperty.roi}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-secondary uppercase font-bold tracking-tighter">Distance</span>
                    <span className="text-sm font-black text-on-surface">{selectedProperty.distance}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-secondary uppercase font-bold tracking-tighter">Units</span>
                    <span className="text-sm font-black text-on-surface">{selectedProperty.units}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-secondary">Funding</span>
                    <span className="text-primary">{selectedProperty.fundingProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-500" style={{ width: `${selectedProperty.fundingProgress}%` }}></div>
                  </div>
                </div>
                <button className="w-full bg-primary py-3 rounded-xl text-on-primary font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                  Invest Now — ${selectedProperty.price.toLocaleString()}
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC NEARBY PROPERTIES SIDEBAR */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/95 backdrop-blur-xl border-l border-surface-variant z-30 flex flex-col">
            <div className="p-6 border-b border-surface-variant flex justify-between items-center">
              <h2 className="font-bold text-lg font-headline">Nearby Properties</h2>
              <span className="text-xs font-bold text-secondary">{properties.length} Found</span>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
              {loading ? (
                <p className="text-center text-secondary text-sm">Loading properties...</p>
              ) : (
                properties.map((prop) => (
                  <div key={prop.id} className="group cursor-pointer" onClick={() => setSelectedProperty(prop)}>
                    <div className="relative rounded-2xl overflow-hidden mb-3">
                      <img src={prop.imageUrl} alt={prop.name} className="w-full h-32 object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute bottom-2 right-2 bg-on-surface/80 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-bold">
                        ${prop.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="px-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-sm">{prop.name}</h4>
                        <div className="flex items-center gap-1 text-[10px] font-black text-green-600">
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {prop.rating}
                        </div>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <span className="bg-surface-container text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">{prop.beds || prop.units} {prop.beds ? 'Beds' : 'Units'}</span>
                        <span className="bg-surface-container text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">{prop.roi}% ROI</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- MOCK DATA (Digunakan jika backend belum jalan) ---
const mockProperties = [
  {
    id: 1,
    name: "North Campus Studios",
    price: 342000,
    shortPrice: "342k",
    roi: 9.2,
    distance: "3 min",
    units: 12,
    fundingProgress: 68,
    mapX: 42,
    mapY: 35,
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&q=80",
    isPremium: true,
    highRoi: true,
    rating: 4.8
  },
  {
    id: 2,
    name: "Ivy Hall Residences",
    price: 1250000,
    shortPrice: "1.2m",
    roi: 8.5,
    distance: "5 min",
    units: 24,
    beds: 12,
    fundingProgress: 45,
    mapX: 55,
    mapY: 20,
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=80",
    isPremium: true,
    highRoi: false,
    rating: 4.9
  },
  {
    id: 3,
    name: "Westside Loft Complex",
    price: 450000,
    shortPrice: "450k",
    roi: 7.8,
    distance: "10 min",
    units: 4,
    fundingProgress: 92,
    mapX: 28,
    mapY: 60,
    imageUrl: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&q=80",
    isPremium: false,
    highRoi: false,
    rating: 4.7
  }
];

export default MapView;