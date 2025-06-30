import React, { useState } from 'react';

interface Props {
  onSave: (source: 'company' | 'counterparty', file: File) => void;
}

const PaperSourceSelector: React.FC<Props> = ({ onSave }) => {
  const [selected, setSelected] = useState<'company' | 'counterparty' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (source: 'company' | 'counterparty') => {
    setSelected(source);
    setFile(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setError('Sadece DOCX dosyası yükleyebilirsiniz.');
      setFile(null);
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleSave = () => {
    if (selected && file) {
      onSave(selected, file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 relative">
      <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <span className="inline-block align-middle">📄</span>
        Select paper source
      </h2>
      <div className="text-gray-500 mb-8 flex items-center justify-between">
        <span>Sözleşme dokümanının hangi taraftan yükleneceğini seçin ve DOCX dosyasını ekleyin.</span>
        <span className="text-xs text-gray-400">At least one must be selected</span>
      </div>
      <div className="flex flex-col gap-4">
        {/* My company's paper */}
        <div
          className={`relative border-2 rounded-xl bg-white transition-all cursor-pointer px-4 py-3 ${selected === 'company' ? 'border-blue-600 shadow-lg ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-400'}`}
          onClick={() => handleSelect('company')}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-600 text-lg">📄</span>
            <span className="font-semibold text-sm">My company's paper</span>
            {selected === 'company' && <span className="ml-auto text-green-500 text-base">✔</span>}
          </div>
          <p className="text-gray-500 text-xs mb-2">Şirketinizin hazırladığı sözleşme dokümanını yükleyin.</p>
          {selected === 'company' && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg py-5 bg-blue-50">
              <label htmlFor="company-upload" className="flex flex-col items-center cursor-pointer">
                <span className="text-blue-400 text-xl mb-1">⬆️</span>
                <span className="text-blue-700 font-medium mb-1 text-sm">Add files or drop files here</span>
                <span className="text-xs text-gray-400">DOCX only</span>
                <input
                  id="company-upload"
                  type="file"
                  accept=".docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && <div className="mt-2 text-green-600 text-xs">{file.name}</div>}
            </div>
          )}
        </div>
        {/* Counterparty's paper */}
        <div
          className={`relative border-2 rounded-xl bg-white transition-all cursor-pointer px-4 py-3 ${selected === 'counterparty' ? 'border-blue-600 shadow-lg ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-400'}`}
          onClick={() => handleSelect('counterparty')}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-600 text-lg">🤝</span>
            <span className="font-semibold text-sm">The counterparty's paper</span>
            {selected === 'counterparty' && <span className="ml-auto text-green-500 text-base">✔</span>}
          </div>
          <p className="text-gray-500 text-xs mb-2">Karşı tarafın hazırladığı sözleşme dokümanını yükleyin.</p>
          {selected === 'counterparty' && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg py-5 bg-blue-50">
              <label htmlFor="counterparty-upload" className="flex flex-col items-center cursor-pointer">
                <span className="text-blue-400 text-xl mb-1">⬆️</span>
                <span className="text-blue-700 font-medium mb-1 text-sm">Add files or drop files here</span>
                <span className="text-xs text-gray-400">DOCX only</span>
                <input
                  id="counterparty-upload"
                  type="file"
                  accept=".docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && <div className="mt-2 text-green-600 text-xs">{file.name}</div>}
            </div>
          )}
        </div>
      </div>
      {error && <div className="text-red-500 mt-4">{error}</div>}
      <div className="flex justify-end mt-6">
        <button
          className={`px-5 py-1.5 rounded bg-blue-600 text-white font-semibold shadow ${selected && file ? 'hover:bg-blue-700' : 'opacity-50 cursor-not-allowed'}`}
          disabled={!(selected && file)}
          onClick={handleSave}
        >
          Save paper source
        </button>
      </div>
    </div>
  );
};

export default PaperSourceSelector; 