import React from 'react';
import { Plant } from '../types';
import { Droplet, Sun, AlertCircle } from 'lucide-react';

interface PlantCardProps {
  plant: Plant;
  onWater: (e: React.MouseEvent) => void;
  onClick: () => void;
  selected?: boolean;
  selectable?: boolean;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant, onWater, onClick, selected, selectable }) => {
  const daysSinceWatered = Math.floor((Date.now() - plant.lastWatered) / (1000 * 60 * 60 * 24));
  const daysLeft = plant.waterFreqDays - daysSinceWatered;
  
  // Progress calculation
  const progress = Math.min(100, (daysSinceWatered / plant.waterFreqDays) * 100);
  
  let healthColor = 'bg-emerald-500';
  let barColor = 'bg-emerald-500';
  
  if (progress > 120) {
    healthColor = 'bg-red-500';
    barColor = 'bg-red-500';
  } else if (progress > 80) {
    healthColor = 'bg-orange-400';
    barColor = 'bg-orange-400';
  }

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white shadow-sm border transition-all ${selected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-100'} active:scale-95 duration-200 cursor-pointer`}
    >
      {/* Selection Checkbox Overlay */}
      {selectable && (
        <div className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-emerald-500 border-emerald-500' : 'bg-white/80 border-gray-400'}`}>
           {selected && <div className="w-3 h-3 bg-white rounded-full" />}
        </div>
      )}

      {/* Image */}
      <div className="h-32 w-full bg-gray-100 relative">
        {plant.photoUrl ? (
          <img src={plant.photoUrl} alt={plant.name} className="w-full h-full object-cover" />
        ) : (
           <div className="w-full h-full flex items-center justify-center text-gray-300">
             <Sun size={32} />
           </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200">
            <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(100, progress)}%` }}></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
            <div>
                <h3 className="font-bold text-gray-800 truncate leading-tight">{plant.nickname || plant.name}</h3>
                <p className="text-xs text-gray-500 truncate italic">{plant.scientificName || plant.name}</p>
            </div>
            {daysLeft <= 0 && <AlertCircle size={16} className="text-red-500 flex-shrink-0" />}
        </div>

        <div className="flex justify-between items-center mt-3">
            <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                {daysLeft > 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`}
            </div>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onWater(e);
                }}
                className={`p-2 rounded-full ${daysLeft <= 0 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-500'} hover:bg-blue-100 transition-colors`}
            >
                <Droplet size={18} fill={daysLeft <= 0 ? "currentColor" : "none"} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default PlantCard;