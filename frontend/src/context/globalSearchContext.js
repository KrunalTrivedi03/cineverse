import { createContext, useContext } from "react";

export const SearchContext = createContext(null);

export function useGlobalSearch() {
  return useContext(SearchContext);
}
