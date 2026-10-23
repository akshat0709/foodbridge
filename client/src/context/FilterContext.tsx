import React, { createContext, useContext, useState } from 'react';

export interface GlobalFilterState {
  startDate: string;
  endDate: string;
  messId: string;
  ngoId: string;
  mealType: string;
  foodCategory: string;
}

interface FilterContextType {
  filters: GlobalFilterState;
  setFilter: (key: keyof GlobalFilterState, value: string) => void;
  resetFilters: () => void;
  queryString: string;
}

const defaultFilters: GlobalFilterState = {
  startDate: '2025-01-01',
  endDate: '2026-10-23',
  messId: 'ALL',
  ngoId: 'ALL',
  mealType: 'ALL',
  foodCategory: 'ALL',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<GlobalFilterState>(defaultFilters);

  const setFilter = (key: keyof GlobalFilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  const queryParams = new URLSearchParams();
  if (filters.startDate) queryParams.set('startDate', filters.startDate);
  if (filters.endDate) queryParams.set('endDate', filters.endDate);
  if (filters.messId !== 'ALL') queryParams.set('messId', filters.messId);
  if (filters.ngoId !== 'ALL') queryParams.set('ngoId', filters.ngoId);
  if (filters.mealType !== 'ALL') queryParams.set('mealType', filters.mealType);
  if (filters.foodCategory !== 'ALL') queryParams.set('foodCategory', filters.foodCategory);

  const queryString = queryParams.toString();

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters, queryString }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used within FilterProvider');
  return context;
};
