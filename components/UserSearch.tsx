'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface UserSearchProps {
  onSelect: (userId: string) => Promise<void>;
}

export function UserSearch({ onSelect }: UserSearchProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchUsers = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Kullanıcı arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (value: string) => {
    setSearchQuery(value);
    searchUsers(value);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {searchQuery ? searchQuery : "Kullanıcı ara..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onValueChange={handleValueChange}
          />
          <CommandEmpty>
            {loading ? 'Aranıyor...' : 'Kullanıcı bulunamadı.'}
          </CommandEmpty>
          <CommandGroup>
            {users.map((user) => (
              <CommandItem
                key={user.id}
                value={user.email}
                onSelect={async () => {
                  await onSelect(user.id);
                  setOpen(false);
                  setSearchQuery('');
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    searchQuery === user.email ? "opacity-100" : "opacity-0"
                  )}
                />
                <div>
                  <div className="font-medium">{user.name || 'İsimsiz Kullanıcı'}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 