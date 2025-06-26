import React, { useEffect, useState } from 'react';
import LaunchFormRenderer from './LaunchFormRenderer';
import { PropertyEditorModal } from './PropertyEditorModal';
import { addFormFieldToTemplate, addSectionToLaunchForm } from '../../src/lib/actions/workflow-template-actions';
import { PropertiesAndConditions } from './PropertiesAndConditions';

export const LaunchFormDesigner: React.FC<{ templateId: string; refreshForm?: () => void }> = ({ templateId, refreshForm }) => {
  const [formFields, setFormFields] = useState<any[]>([]);
  const [layout, setLayout] = useState<any>(null);
  const [displayConditions, setDisplayConditions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [newField, setNewField] = useState<any>(null);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({ name: '', description: '' });
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState({ name: '', description: '', columns: [{ name: '', type: 'text', required: false }] });
  const [workflowSchema, setWorkflowSchema] = useState<any>(null);

  const doRefreshForm = () => {
    setLoading(true);
    fetch(`/api/workflow-templates/${templateId}`)
      .then(res => res.json())
      .then(data => {
        setFormFields(data.formFields || []);
        setLayout(data.launchFormLayout || null);
        const dc: Record<string, any> = {};
        (data.formFields || []).forEach((f: any) => {
          if (f.displayConditions && f.displayConditions.length > 0) {
            dc[f.id] = f.displayConditions[0];
          }
        });
        setDisplayConditions(dc);
        setWorkflowSchema(data.workflowSchema || null);
        setLoading(false);
      })
      .catch(() => {
        setFormFields([]);
        setLayout(null);
        setDisplayConditions({});
        setWorkflowSchema(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!templateId) return;
    doRefreshForm();
  }, [templateId]);

  const handleAddField = async (field: any) => {
    try {
      const response = await fetch(`/api/workflow-templates/${templateId}/form-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: field.name,
          type: String(field.type).toUpperCase(),
          required: !!field.required,
          description: field.description,
          options: field.options || []
        })
      });
      const result = await response.json();
      if (result && result.success) {
        setIsAddFieldModalOpen(false);
        setLoading(true);
        doRefreshForm();
      } else {
        alert(result.message || 'Alan eklenirken bir hata oluştu.');
      }
    } catch (e) {
      alert('Sunucuya ulaşılamadı veya beklenmeyen bir hata oluştu.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Başlatma Formu Tasarımcısı</h2>
      <p className="text-gray-600 mb-8 text-center">
        Forma alan eklemek için soldaki <b>"Attributes"</b> panelini kullanın.
      </p>
      <div className="border-2 border-dashed border-gray-300 rounded-lg min-h-[200px] bg-white p-4">
        {loading ? (
          <div className="text-center text-gray-400">Yükleniyor...</div>
        ) : (
          <>
            <LaunchFormRenderer formFields={formFields} layout={layout} displayConditions={displayConditions} />
            <div className="flex gap-4 justify-center mt-8">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow"
                onClick={() => { setIsAddFieldModalOpen(true); setNewField(null); }}
                type="button"
              >
                Add question to form
              </button>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded shadow"
                onClick={() => setIsAddSectionModalOpen(true)}
                type="button"
              >
                Add section to form
              </button>
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
                onClick={() => setIsAddTableModalOpen(true)}
                type="button"
              >
                Add table to form
              </button>
            </div>
            <PropertyEditorModal
              isOpen={isAddFieldModalOpen}
              onClose={() => setIsAddFieldModalOpen(false)}
              onSave={handleAddField}
              property={newField}
            />
            {/* Section Modal */}
            {isAddSectionModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                  <h3 className="text-lg font-bold mb-4">Add Section</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Section Name</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={sectionForm.name}
                      onChange={e => setSectionForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Counterparty Information"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Section Description <span className="text-xs text-gray-400">(optional)</span></label>
                    <textarea
                      className="w-full border rounded px-3 py-2"
                      value={sectionForm.description}
                      onChange={e => setSectionForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe this section..."
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                      onClick={() => setIsAddSectionModalOpen(false)}
                      type="button"
                    >Cancel</button>
                    <button
                      className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      onClick={async () => {
                        const result = await addSectionToLaunchForm({
                          templateId,
                          name: sectionForm.name,
                          description: sectionForm.description
                        });
                        if (result.success) {
                          setIsAddSectionModalOpen(false);
                          setSectionForm({ name: '', description: '' });
                          setTimeout(() => setFormFields([]), 100);
                        }
                      }}
                      type="button"
                      disabled={!sectionForm.name.trim()}
                    >Add Section</button>
                  </div>
                </div>
              </div>
            )}
            {/* Table Modal */}
            {isAddTableModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
                  <h3 className="text-lg font-bold mb-4">Add Table</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Table Name</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={tableForm.name}
                      onChange={e => setTableForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Payment Schedule"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Table Description <span className="text-xs text-gray-400">(optional)</span></label>
                    <textarea
                      className="w-full border rounded px-3 py-2"
                      value={tableForm.description}
                      onChange={e => setTableForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe this table..."
                      rows={2}
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Columns</label>
                    {tableForm.columns.map((col, idx) => (
                      <div key={idx} className="flex gap-2 mb-2 items-center">
                        <input
                          type="text"
                          className="border rounded px-2 py-1 flex-1"
                          value={col.name}
                          onChange={e => setTableForm(f => {
                            const cols = [...f.columns];
                            cols[idx].name = e.target.value;
                            return { ...f, columns: cols };
                          })}
                          placeholder={`Column ${idx + 1} name`}
                          required
                        />
                        <select
                          className="border rounded px-2 py-1"
                          value={col.type}
                          onChange={e => setTableForm(f => {
                            const cols = [...f.columns];
                            cols[idx].type = e.target.value;
                            return { ...f, columns: cols };
                          })}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={col.required}
                            onChange={e => setTableForm(f => {
                              const cols = [...f.columns];
                              cols[idx].required = e.target.checked;
                              return { ...f, columns: cols };
                            })}
                          />
                          Required
                        </label>
                        <button
                          className="text-red-500 hover:text-red-700 text-xs"
                          onClick={() => setTableForm(f => ({ ...f, columns: f.columns.filter((_, i) => i !== idx) }))}
                          type="button"
                          disabled={tableForm.columns.length === 1}
                        >Remove</button>
                      </div>
                    ))}
                    <button
                      className="mt-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs"
                      onClick={() => setTableForm(f => ({ ...f, columns: [...f.columns, { name: '', type: 'text', required: false }] }))}
                      type="button"
                    >+ Add Column</button>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                      onClick={() => setIsAddTableModalOpen(false)}
                      type="button"
                    >Cancel</button>
                    <button
                      className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
                      onClick={async () => {
                        const result = await addFormFieldToTemplate({
                          templateId,
                          name: tableForm.name,
                          type: 'TABLE',
                          required: false,
                          options: tableForm.columns
                        });
                        if (result.success) {
                          setIsAddTableModalOpen(false);
                          setTableForm({ name: '', description: '', columns: [{ name: '', type: 'text', required: false }] });
                          setTimeout(() => setFormFields([]), 100);
                        }
                      }}
                      type="button"
                      disabled={!tableForm.name.trim() || tableForm.columns.some(c => !c.name.trim())}
                    >Add Table</button>
                  </div>
                </div>
              </div>
            )}
            <PropertiesAndConditions
              schema={workflowSchema}
              onSchemaChange={setWorkflowSchema}
              templateId={templateId}
              refreshForm={doRefreshForm}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default LaunchFormDesigner; 