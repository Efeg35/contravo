import React, { useState, useRef } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  type?: 'user' | 'role' | 'group';
}

interface MultiUserAutocompleteProps {
  value: User[];
  onChange: (users: User[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiUserAutocomplete: React.FC<MultiUserAutocompleteProps> = ({ value, onChange, placeholder = 'Select by user, group, or role name', className = '' }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  // Predefined roles and groups like Ironclad
  const predefinedRoles = [
    { id: 'workflow-owner', name: 'Workflow Owner', email: '', type: 'role' as const }
  ];

  const predefinedGroups = [
    { id: 'administrators', name: 'Administrators', email: '', type: 'group' as const },
    { id: 'everyone', name: 'Everyone', email: '', type: 'group' as const },
    { id: 'legal', name: 'Legal', email: '', type: 'group' as const },
    { id: 'finance', name: 'Finance', email: '', type: 'group' as const },
    { id: 'procurement', name: 'Procurement', email: '', type: 'group' as const },
    { id: 'management', name: 'Management', email: '', type: 'group' as const }
  ];

  const fetchUsers = async (q: string) => {
    setLoading(true);
    try {
      console.log('🔍 Searching for:', q);
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&includeGroups=true`);
      console.log('📡 Response status:', res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('📦 API Data:', data);
      
      // API'den gelen kullanıcıları ve grupları ayır
      const apiUsers = (data.users || []).filter((u: any) => u.type === 'user');
      const apiGroups = (data.users || []).filter((u: any) => u.type === 'group');
      
      // Filter predefined roles and groups by search term
      const filteredRoles = q.trim() ? predefinedRoles.filter(role => 
        role.name.toLowerCase().includes(q.toLowerCase())
      ) : predefinedRoles;
      
      const filteredPredefinedGroups = q.trim() ? predefinedGroups.filter(group => 
        group.name.toLowerCase().includes(q.toLowerCase())
      ) : predefinedGroups;
      
      // Gerçek gruplar + predefined gruplar, dublike olanları kaldır
      const allGroups = [...filteredPredefinedGroups];
      apiGroups.forEach((apiGroup: any) => {
        if (!allGroups.find(g => g.id === apiGroup.id)) {
          allGroups.push(apiGroup);
        }
      });
      
      const allResults = [...filteredRoles, ...allGroups, ...apiUsers];
      console.log('🎯 Final results:', allResults);
      setResults(allResults);
    } catch (e) {
      console.error('Search error:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    fetchUsers(e.target.value || '');
    setOpen(true);
  };

  const handleSelect = (user: User) => {
    if (!value.find(u => u.id === user.id)) {
      onChange([...value, user]);
    }
    setSearch('');
    setOpen(false);
    setResults([]);
  };

  const handleRemove = (id: string) => {
    onChange(value.filter(u => u.id !== id));
  };

  return (
    <div className={`w-full relative ${className}`}>
      <div className="flex flex-wrap gap-2 mb-1">
        {value.map(user => (
          <span key={user.id} className={`inline-flex items-center rounded px-2 py-1 text-xs ${
            user.type === 'role' ? 'bg-purple-100 text-purple-800' :
            user.type === 'group' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {user.name || user.email}
            <button onClick={() => handleRemove(user.id)} className="ml-1 hover:text-red-500 text-xs">×</button>
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        className="border rounded px-2 py-1 text-sm w-full"
        placeholder={placeholder}
        value={search}
        onChange={handleInput}
        onFocus={() => {
          fetchUsers(search || '');
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 bg-white border rounded shadow-lg mt-1 w-full max-h-60 overflow-auto">
          {loading ? (
            <div className="p-2 text-xs text-gray-500">Loading...</div>
                      ) : results.length === 0 ? (
            <div className="p-2 text-xs text-gray-400">Kullanıcı bulunamadı</div>
          ) : (
            <>
              {/* Roles Section */}
              {results.filter(r => r.type === 'role').length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-50 border-b">ROLES</div>
                  {results.filter(r => r.type === 'role').map(role => (
                    <div
                      key={role.id}
                      className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm flex items-center"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(role);
                      }}
                    >
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      <span className="font-medium">{role.name}</span>
                    </div>
                  ))}
                </>
              )}
              
              {/* Groups Section */}
              {results.filter(r => r.type === 'group').length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-50 border-b">GROUPS</div>
                  {results.filter(r => r.type === 'group').map(group => (
                    <div
                      key={group.id}
                      className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm flex items-center"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(group);
                      }}
                    >
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      <span className="font-medium">{group.name}</span>
                    </div>
                  ))}
                </>
              )}
              
              {/* Users Section */}
              {results.filter(r => r.type === 'user').length > 0 && (
                <>
                  {(results.filter(r => r.type === 'role').length > 0 || results.filter(r => r.type === 'group').length > 0) && 
                    <div className="px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-50 border-b">USERS</div>
                  }
                  {results.filter(r => r.type === 'user').map(user => (
                    <div
                      key={user.id}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm flex items-center"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(user);
                      }}
                    >
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      <div>
                        <span className="font-medium">{user.name}</span>
                        <span className="ml-2 text-xs text-gray-500">{user.email}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}; 