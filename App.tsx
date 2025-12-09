import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './components/Layout';
import PlantCard from './components/PlantCard';
import { GardenData, Plant, Location, WeatherData, LightLevel } from './types';
import { 
  getGardenData, saveGardenData, createPlant, updatePlant, 
  deletePlant, createLocation, updateLocation, deleteLocation 
} from './services/storageService';
import { getCurrentWeather } from './services/weatherService';
import { identifyPlant, identifyPlantByName, getDailyTip, diagnosePlant, estimateSunlight } from './services/geminiService';
import { 
  Plus, Search, Grid, List, CloudSun, Wind, Droplet, 
  Leaf, Thermometer, Camera, Sparkles, X, Trash2, Check,
  Activity, MapPin, Share2, Clipboard, Sun, ChevronLeft, Pencil,
  Clock, Info
} from 'lucide-react';
import { DEFAULT_LOCATIONS } from './constants';

const App: React.FC = () => {
  // State
  const [garden, setGarden] = useState<GardenData | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'locations' | 'settings'>('home');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPlants, setSelectedPlants] = useState<Set<string>>(new Set());
  
  // Modals / Views
  const [showPlantForm, setShowPlantForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | undefined>(undefined);
  
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | undefined>(undefined);

  const [showPlantDetail, setShowPlantDetail] = useState<Plant | null>(null);
  
  // AI State
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  
  // Daily Tip
  const [dailyTip, setDailyTip] = useState<string>('');

  // Initial Load
  useEffect(() => {
    const data = getGardenData();
    setGarden(data);

    // Weather & Geo
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const w = await getCurrentWeather(pos.coords.latitude, pos.coords.longitude);
        setWeather(w);
        
        // Get AI Tip once weather is loaded
        const locNames = data.locations.map(l => l.name).join(', ');
        const cachedTip = localStorage.getItem(`daily_tip_${new Date().toDateString()}`);
        if (cachedTip) {
          setDailyTip(cachedTip);
        } else {
          getDailyTip(w, locNames).then(tip => {
            if(tip) {
                setDailyTip(tip);
                localStorage.setItem(`daily_tip_${new Date().toDateString()}`, tip);
            }
          });
        }
      });
    }
  }, []);

  const handleWater = (plant: Plant) => {
    const updatedPlant = { ...plant, lastWatered: Date.now() };
    updatePlant(updatedPlant);
    setGarden(getGardenData()); // Refresh
  };

  const handleBatchWater = () => {
    if (!garden) return;
    const updatedPlants = garden.plants.map(p => {
      if (selectedPlants.has(p.id)) {
        return { ...p, lastWatered: Date.now() };
      }
      return p;
    });
    const updatedGarden = { ...garden, plants: updatedPlants };
    saveGardenData(updatedGarden);
    setGarden(updatedGarden);
    setSelectionMode(false);
    setSelectedPlants(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedPlants);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPlants(newSet);
  };

  // ---- Components Definitions ----

  const WeatherBanner = () => (
    <div className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white p-6 rounded-b-[2rem] shadow-lg mb-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Good Morning!</h1>
          <p className="opacity-90 text-sm">Let's check your garden.</p>
        </div>
        <div className="text-right">
           <div className="text-3xl font-bold">{weather ? `${weather.temp}°` : '--'}</div>
           <div className="text-xs opacity-80 flex items-center justify-end gap-1">
             <CloudSun size={14} /> {weather ? 'Partly Cloudy' : 'Loading...'}
           </div>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="flex justify-between bg-white/20 backdrop-blur-sm rounded-xl p-3 text-sm">
        <div className="flex items-center gap-2">
            <Droplet size={16} /> 
            <span>{weather ? `${weather.humidity}%` : '--'}</span>
        </div>
        <div className="flex items-center gap-2">
            <Wind size={16} />
            <span>{weather ? `${weather.windSpeed}km/h` : '--'}</span>
        </div>
        <div className="flex items-center gap-2">
            <Leaf size={16} />
            <span>{garden?.plants.length || 0} Plants</span>
        </div>
      </div>

      {dailyTip && (
        <div className="mt-4 text-xs italic bg-white/10 p-2 rounded-lg border border-white/20">
          ✨ AI Tip: {dailyTip}
        </div>
      )}
    </div>
  );

  const PlantFormModal = () => {
    const isEditing = !!editingPlant;
    const [name, setName] = useState(editingPlant?.name || '');
    const [waterFreq, setWaterFreq] = useState(editingPlant?.waterFreqDays || 7);
    const [photo, setPhoto] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(editingPlant?.photoUrl || null);
    const [locId, setLocId] = useState(editingPlant?.locationId || garden?.locations[0]?.id || '');
    const [notes, setNotes] = useState(editingPlant?.notes || '');
    const [lightNeed, setLightNeed] = useState<LightLevel>(editingPlant?.lightNeed || LightLevel.INDIRECT_LIGHT);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setPreviewUrl(base64);
          setPhoto(base64.split(',')[1]); // Keep just base64 data for AI
        };
        reader.readAsDataURL(file);
      }
    };

    const runAIIdentify = async (source: 'photo' | 'name') => {
        setIsProcessingAI(true);
        try {
            if (source === 'photo') {
                if (!photo) {
                     alert("Please upload a photo first.");
                     setIsProcessingAI(false);
                     return;
                }
                const data = await identifyPlant(photo);
                if (data.name) setName(data.name);
                if (data.waterFreqDays) setWaterFreq(data.waterFreqDays);
                if (data.lightNeed) setLightNeed(data.lightNeed as LightLevel);
                const combinedNotes = `Scientific: ${data.scientificName}\nLight: ${data.lightNeed}\n${notes}`;
                setNotes(combinedNotes);
            } else {
                if (!name) {
                     alert("Please enter a plant name.");
                     setIsProcessingAI(false);
                     return;
                }
                const data = await identifyPlantByName(name);
                if (data.waterFreqDays) setWaterFreq(data.waterFreqDays);
                if (data.lightNeed) setLightNeed(data.lightNeed as LightLevel);
                const combinedNotes = `Scientific: ${data.scientificName}\n${data.description || ''}\n${notes}`;
                setNotes(combinedNotes);
            }
        } catch (e) {
            alert("AI Identification failed. Please try again.");
        } finally {
            setIsProcessingAI(false);
        }
    };

    const handleSave = () => {
        if (!name) return;
        const plantData = {
            name,
            nickname: name,
            waterFreqDays: waterFreq,
            lastWatered: editingPlant ? editingPlant.lastWatered : Date.now(),
            locationId: locId,
            lightNeed: lightNeed,
            photoUrl: previewUrl || undefined,
            notes
        };

        if (isEditing && editingPlant) {
            updatePlant({ ...editingPlant, ...plantData });
        } else {
            createPlant(plantData);
        }
        
        setGarden(getGardenData());
        setShowPlantForm(false);
        setEditingPlant(undefined);
    };

    return (
      <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="bg-white p-4 shadow-sm flex items-center gap-3 border-b">
            <button onClick={() => { setShowPlantForm(false); setEditingPlant(undefined); }} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <h2 className="text-xl font-bold text-gray-800 flex-1 text-center pr-8">
                {isEditing ? 'Edit Plant' : 'Add New Plant'}
            </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
             {/* Photo Input */}
             <div>
                 <div 
                    className="h-48 w-full bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group"
                    onClick={() => fileInputRef.current?.click()}
                 >
                    {previewUrl ? (
                        <img src={previewUrl} className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <Camera className="text-gray-400 mb-2" size={32} />
                            <span className="text-xs text-gray-400 font-medium">Tap to take photo</span>
                        </>
                    )}
                    <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center text-white text-sm font-bold">Change</div>
                 </div>
                 <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                 
                 {/* AI Photo Button */}
                 {previewUrl && (
                    <button 
                        onClick={() => runAIIdentify('photo')} 
                        disabled={isProcessingAI}
                        className="w-full mt-2 py-2 bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-wider rounded-lg border border-purple-100 flex items-center justify-center gap-2 hover:bg-purple-100 transition"
                    >
                        {isProcessingAI ? 'Analyzing...' : <><Sparkles size={14}/> Auto-Detect from Photo</>}
                    </button>
                 )}
             </div>

             <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Plant Name</label>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 p-3 bg-white rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Monstera"
                    />
                    <button 
                        onClick={() => runAIIdentify('name')}
                        disabled={isProcessingAI || !name}
                        className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 hover:bg-purple-100 active:scale-95 transition-all"
                        title="Auto-fill details from name"
                    >
                        {isProcessingAI ? <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"/> : <Sparkles size={20} />}
                    </button>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Water Every (Days)</label>
                    <input 
                        type="number"
                        className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none" 
                        value={waterFreq}
                        onChange={e => setWaterFreq(parseInt(e.target.value))}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Location</label>
                    <select 
                        className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none"
                        value={locId}
                        onChange={e => setLocId(e.target.value)}
                    >
                        {garden?.locations.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </div>
             </div>

             <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Light Needs</label>
                 <select
                     className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none"
                     value={lightNeed}
                     onChange={e => setLightNeed(e.target.value as LightLevel)}
                 >
                     {Object.values(LightLevel).map((level) => (
                         <option key={level} value={level}>{level}</option>
                     ))}
                 </select>
             </div>

             <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Notes</label>
                <textarea 
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none text-sm" 
                    rows={4}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Care tips, scientific name, etc."
                />
             </div>
        </div>

        <div className="p-4 border-t bg-white">
            <button onClick={handleSave} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200">
                {isEditing ? 'Save Changes' : 'Add Plant'}
            </button>
        </div>
      </div>
    );
  };

  const LocationFormModal = () => {
    const isEditing = !!editingLocation;
    const [name, setName] = useState(editingLocation?.name || '');
    const [type, setType] = useState<'Indoor'|'Outdoor'>(editingLocation?.type || 'Indoor');
    const [aspect, setAspect] = useState(editingLocation?.aspect || 'N');
    const [desc, setDesc] = useState(editingLocation?.description || '');
    
    // Parse initial schedule
    const parse = (str: string) => {
        const [start, end] = str.split('-');
        return { start, end };
    };

    const defaultSchedule = { start: '09:00', end: '15:00' };

    const [schedule, setSchedule] = useState({
        spring: editingLocation ? parse(editingLocation.lightSchedule.spring) : defaultSchedule,
        summer: editingLocation ? parse(editingLocation.lightSchedule.summer) : { start: '08:00', end: '16:00' },
        autumn: editingLocation ? parse(editingLocation.lightSchedule.autumn) : defaultSchedule,
        winter: editingLocation ? parse(editingLocation.lightSchedule.winter) : { start: '10:00', end: '14:00' },
    });

    const updateSchedule = (season: keyof typeof schedule, field: 'start'|'end', value: string) => {
        setSchedule(prev => ({
            ...prev,
            [season]: { ...prev[season], [field]: value }
        }));
    };

    const getDurationDisplay = (start: string, end: string) => {
        const s = parseInt(start.split(':')[0]) + (parseInt(start.split(':')[1]) || 0)/60;
        const e = parseInt(end.split(':')[0]) + (parseInt(end.split(':')[1]) || 0)/60;
        const diff = e - s;
        return diff > 0 ? `${diff.toFixed(1)}h` : '0h';
    };

    const handleSave = () => {
        if(!name) return;
        const lightSchedule = {
            spring: `${schedule.spring.start}-${schedule.spring.end}`,
            summer: `${schedule.summer.start}-${schedule.summer.end}`,
            autumn: `${schedule.autumn.start}-${schedule.autumn.end}`,
            winter: `${schedule.winter.start}-${schedule.winter.end}`,
        };

        const newLoc = {
            name, type, aspect, description: desc,
            lightSchedule
        };

        if(isEditing && editingLocation) {
            updateLocation({ ...editingLocation, ...newLoc });
        } else {
            createLocation(newLoc);
        }
        setGarden(getGardenData());
        setShowLocationForm(false);
        setEditingLocation(undefined);
    };

    const handleDelete = () => {
        if(editingLocation && confirm("Delete this location? Plants here may become unassigned.")) {
            deleteLocation(editingLocation.id);
            setGarden(getGardenData());
            setShowLocationForm(false);
            setEditingLocation(undefined);
        }
    }

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
             <div className="bg-white p-4 shadow-sm flex items-center gap-3 border-b">
                <button onClick={() => { setShowLocationForm(false); setEditingLocation(undefined); }} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <h2 className="text-xl font-bold text-gray-800 flex-1 text-center pr-8">
                    {isEditing ? 'Edit Zone' : 'Add New Zone'}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Zone Name</label>
                    <input className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none" 
                        value={name} onChange={e => setName(e.target.value)} placeholder="e.g. North Balcony" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Type</label>
                        <select className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none"
                            value={type} onChange={(e: any) => setType(e.target.value)}>
                            <option value="Indoor">Indoor</option>
                            <option value="Outdoor">Outdoor</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Aspect</label>
                        <select className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none"
                            value={aspect} onChange={(e: any) => setAspect(e.target.value)}>
                            <option value="N">North</option>
                            <option value="S">South</option>
                            <option value="E">East</option>
                            <option value="W">West</option>
                            <option value="None">None</option>
                        </select>
                     </div>
                </div>

                {/* Seasonal Schedule Inputs */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                     <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                         <Sun size={14} /> Seasonal Direct Light (Start - End)
                     </h3>
                     {['spring', 'summer', 'autumn', 'winter'].map((season) => {
                         const s = season as keyof typeof schedule;
                         return (
                            <div key={season} className="flex items-center gap-2 mb-3 last:mb-0">
                                <span className="w-16 text-xs font-bold uppercase text-gray-500">{season}</span>
                                <input 
                                    type="time" 
                                    value={schedule[s].start} 
                                    onChange={e => updateSchedule(s, 'start', e.target.value)}
                                    className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-24 outline-none"
                                />
                                <span className="text-gray-400">-</span>
                                <input 
                                    type="time" 
                                    value={schedule[s].end} 
                                    onChange={e => updateSchedule(s, 'end', e.target.value)}
                                    className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-24 outline-none"
                                />
                                <span className="text-xs font-mono font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded ml-auto w-12 text-center">
                                    {getDurationDisplay(schedule[s].start, schedule[s].end)}
                                </span>
                            </div>
                         );
                     })}
                     <div className="mt-2 text-[10px] text-gray-400 text-center">
                         Hours calculated automatically.
                     </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                    <textarea className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none" rows={3}
                        value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
            </div>
            
            <div className="p-4 border-t bg-white space-y-3">
                <button onClick={handleSave} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200">
                    Save Zone
                </button>
                {isEditing && (
                    <button onClick={handleDelete} className="w-full py-3 text-red-500 font-bold rounded-xl hover:bg-red-50">
                        Delete Zone
                    </button>
                )}
            </div>
        </div>
    );
  };

  const PlantDetailModal = () => {
    if (!showPlantDetail) return null;
    const [isDoctoring, setIsDoctoring] = useState(false);
    const [doctorResult, setDoctorResult] = useState<any>(null);

    const runDoctor = async () => {
        if (!showPlantDetail.photoUrl) return;
        setIsDoctoring(true);
        try {
            const base64 = showPlantDetail.photoUrl.split(',')[1];
            const result = await diagnosePlant(base64, "Check overall health.");
            setDoctorResult(result);
        } catch (e) {
            alert("Doctor is offline right now.");
        } finally {
            setIsDoctoring(false);
        }
    };

    const handleDelete = () => {
        if(confirm("Are you sure?")) {
            deletePlant(showPlantDetail.id);
            setGarden(getGardenData());
            setShowPlantDetail(null);
        }
    }

    const handleEdit = () => {
        setEditingPlant(showPlantDetail);
        setShowPlantForm(true);
        setShowPlantDetail(null);
    }

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-200">
             {/* Header */}
             <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                 <button 
                    onClick={() => setShowPlantDetail(null)}
                    className="bg-black/20 p-2 rounded-full text-white backdrop-blur-md hover:bg-black/30 transition"
                >
                    <ChevronLeft size={24} />
                </button>
                <button 
                    onClick={handleEdit}
                    className="bg-black/20 p-2 rounded-full text-white backdrop-blur-md hover:bg-black/30 transition"
                >
                    <Pencil size={20} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto">
                <div className="h-[40vh] w-full relative">
                    <img 
                        src={showPlantDetail.photoUrl || 'https://picsum.photos/400/300'} 
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent flex items-end p-6">
                        <div className="mb-2">
                            <h2 className="text-3xl font-bold text-gray-900">{showPlantDetail.nickname}</h2>
                            <p className="text-gray-600 font-serif italic">{showPlantDetail.scientificName}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 space-y-6 bg-slate-50 min-h-[50vh]">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                             <div className="flex items-center gap-2 mb-2 text-blue-500">
                                 <Droplet size={20} /> <span className="text-xs font-bold uppercase text-gray-400">Water</span>
                             </div>
                             <div className="font-bold text-gray-800 text-lg">{showPlantDetail.waterFreqDays} Days</div>
                             <div className="text-xs text-gray-400">Frequency</div>
                        </div>
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                             <div className="flex items-center gap-2 mb-2 text-yellow-500">
                                 <Sun size={20} /> <span className="text-xs font-bold uppercase text-gray-400">Light</span>
                             </div>
                             <div className="font-bold text-gray-800 text-lg truncate">{showPlantDetail.lightNeed}</div>
                             <div className="text-xs text-gray-400">Preference</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                         <button 
                            onClick={() => {
                                handleWater(showPlantDetail);
                                setShowPlantDetail(null);
                            }}
                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                         >
                             <Droplet size={20} fill="currentColor" /> Mark Watered
                         </button>
                         <button 
                            onClick={runDoctor}
                            className="flex-1 py-4 bg-purple-100 text-purple-700 rounded-2xl font-bold flex items-center justify-center gap-2"
                         >
                             <Activity size={20} /> AI Doctor
                         </button>
                    </div>

                    {/* AI Doctor Result */}
                    {isDoctoring && <div className="text-center py-4 text-purple-600 animate-pulse">Analyzing plant health...</div>}
                    {doctorResult && (
                        <div className="bg-purple-50 border border-purple-100 p-5 rounded-2xl space-y-2 animate-in fade-in">
                            <h4 className="font-bold text-purple-900 text-lg">{doctorResult.diagnosis}</h4>
                            <p className="text-sm text-purple-800 leading-relaxed">{doctorResult.explanation}</p>
                            <div className="text-sm bg-white/80 p-3 rounded-xl mt-3 text-purple-900">
                                <span className="font-bold">Rx:</span> {doctorResult.treatment}
                            </div>
                        </div>
                    )}

                    {/* Location Info */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <MapPin size={18} className="text-gray-400" /> Location
                        </h4>
                        <div className="text-gray-600">
                             {garden?.locations.find(l => l.id === showPlantDetail.locationId)?.name || 'Unassigned'}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-2">Notes</h4>
                        <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">
                            {showPlantDetail.notes || "No notes added."}
                        </p>
                    </div>

                    <button onClick={handleDelete} className="w-full text-red-400 py-4 text-sm font-medium flex items-center justify-center gap-2 hover:text-red-600 transition">
                        <Trash2 size={16} /> Delete Plant
                    </button>
                    
                    {/* Padding for bottom nav */}
                    <div className="h-10"></div>
                </div>
             </div>
        </div>
    );
  };

  const LocationsView = () => {
    // Helper to calculate hours for display
    const getHours = (range: string) => {
        const [start, end] = range.split('-');
        const s = parseInt(start.split(':')[0]) + (parseInt(start.split(':')[1]) || 0)/60;
        const e = parseInt(end.split(':')[0]) + (parseInt(end.split(':')[1]) || 0)/60;
        const diff = e - s;
        return diff > 0 ? diff.toFixed(1) : '0';
    };

    return (
        <div className="p-4 pt-24 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Environments</h2>
            {garden?.locations.map(loc => (
                <div key={loc.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group relative overflow-hidden">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{loc.name}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">{loc.type}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex gap-2">
                             <span>Aspect: {loc.aspect}</span>
                             <span>•</span>
                             <span>{garden.plants.filter(p => p.locationId === loc.id).length} Plants</span>
                        </div>
                        {/* Sunlight Schedule Viz */}
                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {['spring', 'summer', 'autumn', 'winter'].map((s) => (
                                <div key={s} className="flex flex-col items-center">
                                    <span className="text-[10px] uppercase text-gray-400 mb-0.5">{s.substring(0,3)}</span>
                                    <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                                        {getHours(loc.lightSchedule[s as keyof typeof loc.lightSchedule])}h
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setEditingLocation(loc);
                            setShowLocationForm(true);
                        }}
                        className="p-3 ml-2 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors self-start"
                    >
                        <Pencil size={20} />
                    </button>
                </div>
            ))}
            <button 
                onClick={() => setShowLocationForm(true)}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition"
            >
                <Plus size={20} /> Add New Zone
            </button>
        </div>
    );
  };

  const SettingsView = () => (
      <div className="p-4 pt-24 space-y-6">
          <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
               <div className="relative z-10">
                   <h2 className="text-lg font-bold mb-1">Garden ID</h2>
                   <div className="text-3xl font-mono tracking-widest">{garden?.id}</div>
                   <p className="text-xs opacity-80 mt-2">Share this code to allow others to import your garden config.</p>
               </div>
               <Share2 className="absolute -bottom-4 -right-4 text-emerald-500 opacity-50" size={96} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-bold text-gray-800 mb-4">Cloud Sync</h3>
              <div className="flex gap-2">
                  <input placeholder="Enter Garden ID" className="flex-1 bg-gray-50 p-3 rounded-lg text-sm outline-none" />
                  <button className="bg-gray-800 text-white px-4 rounded-lg text-sm font-bold">Import</button>
              </div>
          </div>

          <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                  <Info size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">PlantCare AI v1.1</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Powered by Gemini 2.5</p>
          </div>
      </div>
  );

  // Filter Plants Logic
  const filteredPlants = garden?.plants.filter(p => {
    const matchesLoc = selectedLocation === 'all' || p.locationId === selectedLocation;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.nickname && p.nickname.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLoc && matchesSearch;
  }) || [];

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'home' && (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Weather */}
            <WeatherBanner />

            {/* Controls */}
            <div className="px-4 sticky top-0 z-40 py-2 bg-slate-50/95 backdrop-blur-sm">
                <div className="flex gap-2 mb-3">
                    <div className="flex-1 bg-white p-2 rounded-xl flex items-center shadow-sm border border-gray-100">
                        <Search size={18} className="text-gray-400 ml-1" />
                        <input 
                            className="w-full ml-2 outline-none text-sm text-gray-700 placeholder-gray-400" 
                            placeholder="Search your plants..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 text-gray-500">
                        {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
                    </button>
                    <button 
                        onClick={() => {
                            setSelectionMode(!selectionMode);
                            setSelectedPlants(new Set());
                        }} 
                        className={`p-2.5 rounded-xl shadow-sm border border-gray-100 transition-colors ${selectionMode ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-gray-500'}`}
                    >
                        <Clipboard size={20} />
                    </button>
                </div>

                {/* Location Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    <button 
                        onClick={() => setSelectedLocation('all')}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedLocation === 'all' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
                    >
                        All Plants
                    </button>
                    {garden?.locations.map(loc => (
                        <button 
                            key={loc.id}
                            onClick={() => setSelectedLocation(loc.id)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedLocation === loc.id ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
                        >
                            {loc.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Plant List */}
            <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-3'}`}>
                {filteredPlants.map(plant => (
                    <PlantCard 
                        key={plant.id} 
                        plant={plant} 
                        onWater={() => handleWater(plant)}
                        onClick={() => {
                            if (selectionMode) toggleSelection(plant.id);
                            else setShowPlantDetail(plant);
                        }}
                        selected={selectedPlants.has(plant.id)}
                        selectable={selectionMode}
                    />
                ))}
            </div>
            
            {/* Empty State */}
            {filteredPlants.length === 0 && (
                <div className="text-center py-12 opacity-50">
                    <Leaf size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No plants found here.</p>
                </div>
            )}

            {/* FAB or Batch Action */}
            {selectionMode && selectedPlants.size > 0 ? (
                <button 
                    onClick={handleBatchWater}
                    className="fixed bottom-24 right-4 left-4 bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 z-50 animate-in slide-in-from-bottom-4"
                >
                    <Droplet size={20} /> Water {selectedPlants.size} Plants
                </button>
            ) : (
                <button 
                    onClick={() => setShowPlantForm(true)}
                    className="fixed bottom-24 right-4 bg-emerald-600 text-white p-4 rounded-full shadow-xl shadow-emerald-200 z-50 hover:scale-105 transition-transform"
                >
                    <Plus size={28} />
                </button>
            )}
        </div>
      )}

      {activeTab === 'locations' && <LocationsView />}
      {activeTab === 'settings' && <SettingsView />}

      {/* Modals */}
      {showPlantForm && <PlantFormModal />}
      {showLocationForm && <LocationFormModal />}
      {showPlantDetail && <PlantDetailModal />}

    </Layout>
  );
};

export default App;