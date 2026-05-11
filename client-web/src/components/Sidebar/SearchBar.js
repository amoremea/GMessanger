import React, { useState } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { Avatar } from '../Common/Avatar';

export const SearchBar = ({ onOpenProfile }) => {
  const { searchQuery, setSearchQuery, searchResults, loading } = useSearch();
  const [isFocused, setIsFocused] = useState(false);

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="search-wrapper">
      <i className="bi bi-search search-icon"></i>
      <input
        type="text"
        className="search-input"
        placeholder="Поиск людей..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
      />
      {searchQuery && (
        <button className="search-clear" onClick={clearSearch}>
          <i className="bi bi-x-lg"></i>
        </button>
      )}

      {searchQuery && isFocused && (
        <div className="search-results-dropdown">
          {loading ? (
            <div className="text-center p-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map(u => (
              <div
                key={u._id}
                className="search-result-item"
                onClick={() => onOpenProfile(u)}
              >
                <Avatar user={u} size={40} />
                <div className="search-result-info">
                  <div className="search-result-name">{u.displayName || u.username}</div>
                  <div className="search-result-username">@{u.username}</div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </div>
            ))
          ) : (
            <div className="text-center p-3 text-muted">
              <i className="bi bi-emoji-frown me-1"></i>
              Ничего не найдено
            </div>
          )}
        </div>
      )}
    </div>
  );
};