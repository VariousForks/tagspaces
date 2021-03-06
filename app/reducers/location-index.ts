/**
 * TagSpaces - universal file and folder organizer
 * Copyright (C) 2017-present TagSpaces UG (haftungsbeschraenkt)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License (version 3) as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { Location, getLocation, getLocations, locationType } from './locations';
import { createDirectoryIndex } from '../services/utils-io';
import { Pro } from '../pro';
import {
  extractFileExtension,
  extractFileName,
  extractTagsAsObjects
  // getThumbFileLocationForFile
} from '../utils/paths';
import Search, { SearchQuery } from '../services/search';
import { actions as AppActions } from './app';
import AppConfig from '../config';
import i18n from '../services/i18n';
// import PlatformIO from '../services/platform-io';
import { Tag } from './taglibrary';
import GlobalSearch from '../services/search-index';

export const types = {
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  INDEX_DIRECTORY: 'INDEX_DIRECTORY',
  INDEX_DIRECTORY_CLEAR: 'INDEX_DIRECTORY_CLEAR',
  INDEX_DIRECTORY_START: 'INDEX_DIRECTORY_START',
  INDEX_DIRECTORY_CANCEL: 'INDEX_DIRECTORY_CANCEL',
  INDEX_DIRECTORY_SUCCESS: 'INDEX_DIRECTORY_SUCCESS',
  INDEX_DIRECTORY_FAILURE: 'INDEX_DIRECTORY_FAILURE',
  INDEX_DIRECTORY_SEARCH: 'INDEX_DIRECTORY_SEARCH',
  REFLECT_DELETE_ENTRY: 'INDEX/REFLECT_DELETE_ENTRY',
  REFLECT_CREATE_ENTRY: 'INDEX/REFLECT_CREATE_ENTRY',
  REFLECT_RENAME_ENTRY: 'INDEX/REFLECT_RENAME_ENTRY',
  REFLECT_UPDATE_SIDECARTAGS: 'INDEX/REFLECT_UPDATE_SIDECARTAGS',
  REFLECT_UPDATE_SIDECARMETA: 'INDEX/REFLECT_UPDATE_SIDECARMETA'
};

export const initialState = {
  isIndexing: false,
  searchQuery: {}
};

export default (state: any = initialState, action: any) => {
  switch (action.type) {
    case types.SET_SEARCH_QUERY: {
      return { ...state, searchQuery: action.searchQuery };
    }
    case types.INDEX_DIRECTORY_START: {
      return {
        ...state,
        isIndexing: true
      };
    }
    case types.INDEX_DIRECTORY_CLEAR: {
      // GlobalSearch.index.length = 0;
      GlobalSearch.index.splice(0, GlobalSearch.index.length);
      return {
        ...state,
        isIndexing: false
      };
    }
    case types.INDEX_DIRECTORY_CANCEL: {
      window.walkCanceled = true;
      return { ...state, isIndexing: false };
    }
    case types.INDEX_DIRECTORY_SUCCESS: {
      return {
        ...state,
        isIndexing: false
      };
    }
    case types.INDEX_DIRECTORY_FAILURE: {
      // GlobalSearch.index.length = 0;
      return {
        ...state,
        lastError: action.error,
        isIndexing: false
      };
    }
    case types.REFLECT_DELETE_ENTRY: {
      for (let i = 0; i < GlobalSearch.index.length; i += 1) {
        if (GlobalSearch.index[i].path === action.path) {
          GlobalSearch.index.splice(i, 1);
          i -= 1;
        }
      }
      return state;
    }
    case types.REFLECT_CREATE_ENTRY: {
      let entryFound = false;
      for (let i = 0; i < GlobalSearch.index.length; i += 1) {
        if (GlobalSearch.index[i].path === action.path) {
          entryFound = true;
        }
      }
      if (entryFound) {
        return state;
      }
      GlobalSearch.index.push(action.newEntry);
      return state;
    }
    case types.REFLECT_RENAME_ENTRY: {
      for (let i = 0; i < GlobalSearch.index.length; i += 1) {
        if (GlobalSearch.index[i].path === action.path) {
          GlobalSearch.index[i].path = action.newPath;
          // thumbPath: getThumbFileLocationForFile(action.newPath), // disabled due performance concerns
          GlobalSearch.index[i].name = extractFileName(action.newPath);
          GlobalSearch.index[i].extension = extractFileExtension(
            action.newPath
          );
          GlobalSearch.index[i].tags = [
            ...GlobalSearch.index[i].tags.filter(tag => tag.type === 'sidecar'), // add only sidecar tags
            ...extractTagsAsObjects(action.newPath) // , getTagDelimiter(state))
          ];
        }
      }
      return state;
      /* const indexForRenamingInIndex = state.currentDirectoryIndex.findIndex((entry) => entry.path === action.path);
    if (indexForRenamingInIndex >= 0) {
      const updateEntry = {
        ...state.currentDirectoryIndex[indexForRenamingInIndex],
        path: action.newPath,
        // thumbPath: getThumbFileLocationForFile(action.newPath), // disabled due performance concerns
        name: extractFileName(action.newPath),
        extension: extractFileExtension(action.newPath),
        tags: [
          ...state.currentDirectoryIndex[indexForRenamingInIndex].tags.filter(tag => tag.type === 'sidecar'), // add only sidecar tags
          ...extractTagsAsObjects(action.newPath) // , getTagDelimiter(state))
        ]
      };
      return {
        ...state,
        currentDirectoryIndex: [
          ...state.currentDirectoryIndex.slice(0, indexForRenamingInIndex),
          updateEntry,
          ...state.currentDirectoryIndex.slice(indexForRenamingInIndex + 1)
        ]
      };
    }
    return state; */
    }
    case types.REFLECT_UPDATE_SIDECARTAGS: {
      for (let i = 0; i < GlobalSearch.index.length; i += 1) {
        if (GlobalSearch.index[i].path === action.path) {
          GlobalSearch.index[i].tags = [
            ...GlobalSearch.index[i].tags.filter(tag => tag.type === 'plain'),
            ...action.tags
          ];
        }
      }
      return state;
      /* const indexForUpdatingInIndex = state.currentDirectoryIndex.findIndex((entry) => entry.path === action.path);
    if (indexForUpdatingInIndex >= 0) {
      const updateEntry = {
        ...state.currentDirectoryIndex[indexForUpdatingInIndex],
        tags: [
          ...state.currentDirectoryIndex[indexForUpdatingInIndex].tags.filter(tag => tag.type === 'plain'),
          ...action.tags
        ]
      };
      return {
        ...state,
        currentDirectoryIndex: [
          ...state.currentDirectoryIndex.slice(0, indexForUpdatingInIndex),
          updateEntry,
          ...state.currentDirectoryIndex.slice(indexForUpdatingInIndex + 1)
        ]
      };
    }
    return state; */
    }
    case types.REFLECT_UPDATE_SIDECARMETA: {
      for (let i = 0; i < GlobalSearch.index.length; i += 1) {
        if (GlobalSearch.index[i].path === action.path) {
          GlobalSearch.index[i] = {
            ...GlobalSearch.index[i],
            ...action.entryMeta
          };
        }
      }
      return state;
      /* const indexForUpdatingInIndex = state.currentDirectoryIndex.findIndex((entry) => entry.path === action.path);
    if (indexForUpdatingInIndex >= 0) {
      const updateEntry = {
        ...state.currentDirectoryIndex[indexForUpdatingInIndex],
        ...action.entryMeta
      };
      return {
        ...state,
        currentDirectoryIndex: [
          ...state.currentDirectoryIndex.slice(0, indexForUpdatingInIndex),
          updateEntry,
          ...state.currentDirectoryIndex.slice(indexForUpdatingInIndex + 1)
        ]
      };
    }
    return state; */
    }
    default: {
      return state;
    }
  }
};

export const actions = {
  setSearchQuery: (searchQuery: SearchQuery) => ({
    type: types.SET_SEARCH_QUERY,
    searchQuery
  }),
  startDirectoryIndexing: () => ({ type: types.INDEX_DIRECTORY_START }),
  cancelDirectoryIndexing: () => ({ type: types.INDEX_DIRECTORY_CANCEL }),
  createDirectoryIndex: (
    directoryPath: string,
    extractText: boolean,
    isCurrentLocation: boolean = true
  ) => (dispatch: (actions: Object) => void, getState: () => any) => {
    const state = getState();
    const currentLocation: Location = getLocation(
      state,
      state.app.currentLocationId
    );
    dispatch(actions.startDirectoryIndexing());
    createDirectoryIndex(directoryPath, extractText)
      .then(directoryIndex => {
        if (isCurrentLocation) {
          // Load index only if current location
          GlobalSearch.index = directoryIndex;
        }
        dispatch(actions.indexDirectorySuccess());
        if (Pro && Pro.Indexer) {
          // && (currentLocation.persistIndex || PlatformIO.haveObjectStoreSupport())) { // always persist on s3 stores
          Pro.Indexer.persistIndex(
            directoryPath,
            directoryIndex,
            currentLocation.type === locationType.TYPE_CLOUD
              ? '/'
              : AppConfig.dirSeparator
          );
        }
        return true;
      })
      .catch(err => {
        dispatch(actions.indexDirectoryFailure(err));
      });
  },
  createLocationsIndexes: (extractText: boolean = true) => (
    dispatch: (actions: Object) => void,
    getState: () => any
  ) => {
    const state = getState();
    const currentLocation: Location = getLocation(
      state,
      state.app.currentLocationId
    );
    dispatch(actions.startDirectoryIndexing());
    const allLocations = getLocations(state);
    const locationPaths = [];
    allLocations.forEach(location => {
      locationPaths.push(location.paths[0]);
    });
    const result = locationPaths.reduce(
      (accumulatorPromise, nextPath) =>
        accumulatorPromise.then(() =>
          createDirectoryIndex(nextPath, extractText)
            .then(directoryIndex => {
              if (Pro && Pro.Indexer) {
                Pro.Indexer.persistIndex(
                  nextPath,
                  directoryIndex,
                  currentLocation.type === locationType.TYPE_CLOUD
                    ? '/'
                    : AppConfig.dirSeparator
                );
              }
              return true;
            })
            .catch(err => {
              dispatch(actions.indexDirectoryFailure(err));
            })
        ),
      Promise.resolve()
    );

    result
      .then(e => {
        dispatch(actions.indexDirectorySuccess());
        console.log('Resolution is complete!', e);
        return true;
      })
      .catch(e => {
        console.warn('Resolution is faled!', e);
      });
  },
  loadDirectoryIndex: (
    directoryPath: string,
    isCurrentLocation: boolean = true
  ) => (dispatch: (actions: Object) => void, getState: () => any) => {
    const state = getState();
    const currentLocation: Location = getLocation(
      state,
      state.app.currentLocationId
    );
    dispatch(actions.startDirectoryIndexing());
    dispatch(
      AppActions.showNotification(i18n.t('core:loadingIndex'), 'default', true)
    );
    if (Pro && Pro.Indexer.loadIndex) {
      Pro.Indexer.loadIndex(
        directoryPath,
        currentLocation.type === locationType.TYPE_CLOUD
          ? '/'
          : AppConfig.dirSeparator
      )
        .then(directoryIndex => {
          if (isCurrentLocation) {
            // Load index only if current location
            GlobalSearch.index = directoryIndex;
          }
          dispatch(actions.indexDirectorySuccess());
          return true;
        })
        .catch(err => {
          dispatch(actions.indexDirectoryFailure(err));
          dispatch(
            AppActions.showNotification(
              i18n.t('core:loadingIndexFailed'),
              'warning',
              true
            )
          );
        });
    }
  },
  clearDirectoryIndex: () => ({
    type: types.INDEX_DIRECTORY_CLEAR
  }),
  searchLocationIndex: (searchQuery: SearchQuery) => (
    dispatch: (actions: Object) => void
  ) => {
    dispatch(
      AppActions.showNotification(i18n.t('core:searching'), 'default', false)
    );
    dispatch(actions.setSearchQuery(searchQuery));
    setTimeout(() => {
      // Workaround used to show the start search notification
      Search.searchLocationIndex(GlobalSearch.index, searchQuery)
        .then(searchResults => {
          dispatch(AppActions.setSearchResults(searchResults));
          dispatch(AppActions.hideNotifications());
          return true;
        })
        .catch(() => {
          dispatch(AppActions.setSearchResults([]));
          dispatch(AppActions.hideNotifications());
          dispatch(
            AppActions.showNotification(
              i18n.t('core:searchingFailed'),
              'warning',
              true
            )
          );
        });
    }, 50);
  },
  searchAllLocations: (searchQuery: SearchQuery) => (
    dispatch: (actions: Object) => void,
    getState: () => any
  ) => {
    const state = getState();
    const currentLocation: Location = getLocation(
      state,
      state.app.currentLocationId
    );
    console.time('globalSearch');
    dispatch(
      AppActions.showNotification(i18n.t('core:searching'), 'default', false)
    );
    dispatch(AppActions.setSearchResults([]));
    const allLocations = getLocations(state);
    const result = allLocations.reduce(
      (accumulatorPromise, location) =>
        accumulatorPromise.then(async () => {
          const nextPath = location.paths[0];
          let directoryIndex = [];
          let hasIndex = false;
          const dirSeparator =
            currentLocation.type === locationType.TYPE_CLOUD
              ? '/'
              : AppConfig.dirSeparator;
          console.log('Searching in: ' + nextPath);
          dispatch(
            AppActions.showNotification(
              i18n.t('core:searching') + nextPath,
              'default',
              true
            )
          );
          if (Pro && Pro.Indexer && Pro.Indexer.hasIndex) {
            hasIndex = await Pro.Indexer.hasIndex(nextPath);
          }
          if (searchQuery.forceIndexing || !hasIndex) {
            console.log('Creating index for : ' + nextPath);
            directoryIndex = await createDirectoryIndex(
              nextPath,
              location.fullTextIndex
            );
            if (Pro && Pro.Indexer && Pro.Indexer.persistIndex) {
              Pro.Indexer.persistIndex(nextPath, directoryIndex, dirSeparator);
            }
          } else if (Pro && Pro.Indexer && Pro.Indexer.loadIndex) {
            console.log('Loading index for : ' + nextPath);
            directoryIndex = await Pro.Indexer.loadIndex(
              nextPath,
              dirSeparator
            );
          }
          return Search.searchLocationIndex(directoryIndex, searchQuery)
            .then(searchResults => {
              dispatch(AppActions.appendSearchResults(searchResults));
              dispatch(AppActions.hideNotifications());
              return true;
            })
            .catch(() => {
              dispatch(AppActions.setSearchResults([]));
              dispatch(AppActions.hideNotifications());
              dispatch(
                AppActions.showNotification(
                  i18n.t('core:searchingFailed'),
                  'warning',
                  true
                )
              );
            });
        }),
      Promise.resolve()
    );

    result
      .then(() => {
        console.timeEnd('globalSearch');
        dispatch(
          AppActions.showNotification(
            i18n.t('Global search completed'),
            'default',
            true
          )
        );
        console.log('Global search completed!');
        return true;
      })
      .catch(e => {
        console.timeEnd('globalSearch');
        console.warn('Global search faled!', e);
      });
  },
  indexDirectorySuccess: () => ({
    type: types.INDEX_DIRECTORY_SUCCESS
  }),
  indexDirectoryFailure: (error: string) => ({
    type: types.INDEX_DIRECTORY_FAILURE,
    error
  }),
  reflectDeleteEntry: (path: string) => ({
    type: types.REFLECT_DELETE_ENTRY,
    path
  }),
  reflectCreateEntry: (newEntry: Object) => ({
    type: types.REFLECT_CREATE_ENTRY,
    newEntry
  }),
  reflectRenameEntry: (path: string, newPath: string) => ({
    type: types.REFLECT_RENAME_ENTRY,
    path,
    newPath
  }),
  reflectUpdateSidecarTags: (path: string, tags: Array<Tag>) => ({
    type: types.REFLECT_UPDATE_SIDECARTAGS,
    path,
    tags
  }),
  reflectUpdateSidecarMeta: (path: string, entryMeta: Object) => ({
    type: types.REFLECT_UPDATE_SIDECARMETA,
    path,
    entryMeta
  })
};

// Selectors
export const getIndexedEntriesCount = (state: any) => GlobalSearch.index.length;
export const isIndexing = (state: any) => state.locationIndex.isIndexing;
export const getSearchQuery = (state: any) => state.locationIndex.searchQuery;
