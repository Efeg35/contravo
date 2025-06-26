import React from 'react';

export const LaunchFormDesigner: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Başlatma Formu Tasarımcısı</h2>
      <p className="text-gray-600 mb-8 text-center">
        Forma alan eklemek için soldaki <b>"Attributes"</b> panelini kullanın.
      </p>
      <div className="border-2 border-dashed border-gray-300 rounded-lg min-h-[200px] flex items-center justify-center bg-white">
        <span className="text-gray-400">Form alanları burada önizlenecek</span>
      </div>
    </div>
  );
};

export default LaunchFormDesigner; 