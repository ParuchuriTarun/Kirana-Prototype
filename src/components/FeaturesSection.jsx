import React from 'react';
import { Truck, ShieldCheck, Headphones, Star } from 'lucide-react';

const ICON_MAP = {
  Truck: Truck,
  ShieldCheck: ShieldCheck,
  Headphones: Headphones,
  Star: Star,
};

export default function FeaturesSection({ features }) {
  return (
    <section className="py-10 sm:py-14 border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center sm:text-left mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-950 font-sans">
            Why Shop With Us
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Built for peace of mind with everyday neighborhood reliability
          </p>
        </div>

        {/* 4 Feature Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {features.map((item) => {
            const Icon = ICON_MAP[item.icon] || Star;
            return (
              <div 
                key={item.id}
                className="flex flex-col items-center text-center p-4 rounded-2xl hover:bg-gray-50/80 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                {/* Icon matching wireframe clean stroke style */}
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center mb-3 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:rotate-2">
                  <Icon className="w-6 h-6 stroke-[1.75]" />
                </div>

                <h3 className="font-bold text-gray-900 text-base">
                  {item.title}
                </h3>
                
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-[160px]">
                  {item.subtitle}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
