'use client';

import { useState, useEffect, useCallback } from 'react';
import WardrobeGrid from './components/WardrobeGrid';
import UploadItem from './components/UploadItem';
import StyleChat from './components/StyleChat';
import { WardrobeItem } from '@/lib/supabase';

type Tab = 'wardrobe' | 'upload' | 'style';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('wardrobe');
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/wardrobe');
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
    } catch {
      // silently fail
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleItemAdded = (item: WardrobeItem) => {
    setItems((prev) => [item, ...prev]);
    setActiveTab('wardrobe');
  };

  const handleItemDeleted = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'wardrobe',
      label: 'Wardrobe',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'upload',
      label: 'Add Item',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      id: 'style',
      label: 'Get Styled',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Wardrobe AI</h1>
            <p className="text-xs text-slate-400">{items.length} items in your closet</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">W</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-5 pb-24">
        {activeTab === 'wardrobe' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">My Wardrobe</h2>
              <button
                onClick={() => setActiveTab('upload')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add item
              </button>
            </div>
            <WardrobeGrid items={items} loading={loadingItems} onDelete={handleItemDeleted} />
          </>
        )}

        {activeTab === 'upload' && (
          <>
            <h2 className="font-semibold text-slate-800 mb-4">Add Clothing Item</h2>
            <UploadItem onItemAdded={handleItemAdded} />
          </>
        )}

        {activeTab === 'style' && (
          <>
            <h2 className="font-semibold text-slate-800 mb-4">AI Stylist</h2>
            <StyleChat />
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-10">
        <div className="max-w-md mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.id === 'upload' ? (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.icon}
                </div>
              ) : (
                tab.icon
              )}
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
