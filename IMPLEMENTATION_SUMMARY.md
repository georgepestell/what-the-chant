# React Query + IndexedDB + Infinite Scroll + Server-Side Search

## Overview
Successfully integrated `@tanstack/react-query` with IndexedDB persistence, infinite scroll for browsing, and **server-side search** for optimal performance at scale.

## Key Features Implemented

### 1. **IndexedDB Storage** (`src/lib/indexedDbStorage.ts`)
- Custom async storage adapter using the `idb` library
- Persistent caching in browser's IndexedDB
- Stores query cache across sessions
- Reduces data transfer by caching locally

### 2. **React Query Setup** (`src/lib/queryClient.ts`)
- Configured QueryClient with 24-hour garbage collection
- 5-minute stale time for optimal UX
- Integrated `createSyncStoragePersister` with IndexedDB
- Automatic persistence of all queries

### 3. **Smart Query Hook with Search** (`src/features/chantList/hooks/useChantQueries.ts`)
- **Dual Mode Operation:**
  - **Browsing Mode**: Paginated infinite scroll (50 chants per page)
  - **Search Mode**: Server-side full-text search across ALL chants
- Query key includes search term and category filters for proper cache isolation
- Server-side filtering by categories using Supabase `.in()` queries
- Uses PostgreSQL's `.ilike()` for case-insensitive text search
- Real-time subscription invalidates all query variants

### 4. **Intersection Observer Hook** (`src/hooks/useIntersectionObserver.ts`)
- Reusable hook for detecting when user scrolls near bottom
- Configurable threshold and root margin
- Triggers `fetchNextPage()` automatically
- Disabled during search (all results already loaded)

### 5. **Updated ChantList Component**
- Passes `searchTerm` and `selectedCategories` to `useChants()` hook
- No client-side filtering needed - all done server-side
- Infinite scroll only active when browsing (not searching)
- Loading indicator shows state appropriately

## Performance Benefits

### Search Implementation

#### ❌ Client-Side Search (Previous)
- Load all chants into memory
- Filter in JavaScript
- Still limited to loaded pages in infinite scroll
- Can't find results beyond loaded data

#### ✅ Server-Side Search (Current)
- **Searches entire database** regardless of loaded pages
- **Single optimized query** with `.ilike()` for text matching
- **Applies category filters** at database level
- **Returns only matching results** - minimal data transfer
- **Cached per search term** - instant repeated searches

### Browsing vs Searching

| Feature | Browsing (No Search) | Searching |
|---------|---------------------|-----------|
| **Data Loading** | Paginated (50/page) | All matching results |
| **Initial Load** | Fast (50 chants) | Fast (only matches) |
| **Infinite Scroll** | ✅ Enabled | ❌ Disabled (all loaded) |
| **Network Requests** | Multiple pages | Single request |
| **Results Scope** | All chants | Filtered by search + categories |

### Overall Benefits
- ✅ **Search across entire database** - not just loaded chants
- ✅ **Efficient data transfer** - only get what you need
- ✅ **Fast initial load** - 50 chants or search results only
- ✅ **IndexedDB caching** - instant loading on repeat visits
- ✅ **Smart query keys** - separate caches for different searches
- ✅ **Server-side filtering** - leverage database indexes

## How It Works

### Browsing Flow (No Search)
1. Load first 50 chants from database
2. User scrolls down
3. Intersection observer triggers when near bottom
4. Fetch next 50 chants
5. Repeat until all chants loaded

### Search Flow (Active Search)
1. User types search term
2. Query key changes → new query triggered
3. **Server-side**: `.ilike('text', '%search%')` on entire table
4. **Apply category filter** if selected
5. Return all matching results in single response
6. Cache results by search term + categories
7. Infinite scroll disabled (all results already loaded)

### Category Filter Flow
1. User selects categories
2. **Server-side**: First get `chant_id`s from `chant_categories` table
3. Filter chants using `.in('id', allowedChantIds)`
4. Works with both browsing (paginated) and search modes
5. Cached separately per category combination

## API Queries

### Browsing Query
```typescript
supabase
  .from('chants')
  .select('*')
  .order('updated_at', { ascending: false })
  .range(from, to) // Pagination
  .in('id', categoryFilteredIds) // If categories selected
```

### Search Query  
```typescript
supabase
  .from('chants')
  .select('*')
  .ilike('text', `%${searchTerm}%`) // Full-text search
  .order('updated_at', { ascending: false })
  // Category filter applied to results
```

## Configuration Options

### Adjust Page Size
```typescript
// In useChantQueries.ts
const PAGE_SIZE = 50 // Increase for fewer requests, decrease for faster initial load
```

### Adjust Pre-fetch Distance
```typescript
// In ChantList.tsx - loadMoreRef call
rootMargin: '200px' // Load earlier for smoother UX
```

### Adjust Cache Duration
```typescript
// In queryClient.ts
gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days instead of 24 hours
```

## Testing Recommendations

1. **Test search with large dataset** - should find chants you haven't scrolled to yet
2. **Test category + search combo** - should filter by both
3. **Monitor Network tab** - see difference between pagination and search queries
4. **Check IndexedDB** in DevTools → should see separate caches per search
5. **Test real-time updates** - should invalidate all query variants
6. **Test repeated searches** - should be instant from cache

## Future Optimizations

- Full-text search with PostgreSQL `tsquery` for better ranking
- Debounce search input to reduce API calls
- Search result highlighting
- Virtual scrolling with react-window for massive result sets
- Prefetch next page while user reads current content
- Service worker for offline-first experience
