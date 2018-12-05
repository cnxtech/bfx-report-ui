import { getQueryLimit, getPageSize } from 'state/query/utils'

/* init states */
export const paginateState = {
  offset: 0, // end of current offset
  pageOffset: 0, // start of current page, is used by jumpPage
}

export const baseState = {
  ...paginateState,
  dataReceived: false,
  entries: [],
  currentEntriesSize: 0,
  pageLoading: false,
  smallestMts: 0,
  nextPage: false,
}

export const basePairState = {
  ...baseState,
  existingPairs: [],
  targetPairs: [],
}

export const baseSymbolState = {
  ...baseState,
  existingCoins: [],
  targetSymbols: [],
}

/* pagination */
export function fetchNext(type, state) {
  const LIMIT = getQueryLimit(type)
  return (state.entries.length - LIMIT >= state.offset)
    ? {
      ...state,
      offset: state.offset + state.currentEntriesSize,
      pageOffset: 0,
    } : {
      ...state,
      pageLoading: true,
    }
}

export function fetchPrev(type, state) {
  const LIMIT = getQueryLimit(type)
  return {
    ...state,
    offset: state.offset >= LIMIT ? state.offset - LIMIT : 0,
    pageOffset: 0,
  }
}

export function jumpPage(type, state, page) {
  const LIMIT = getQueryLimit(type)
  const PAGE_SIZE = getPageSize(type)
  const totalOffset = (page - 1) * PAGE_SIZE
  const currentOffset = Math.floor(totalOffset / LIMIT) * LIMIT
  if (totalOffset < LIMIT) {
    const baseOffset = Math.ceil(page / LIMIT * PAGE_SIZE) * LIMIT
    return {
      ...state,
      offset: state.offset < baseOffset ? state.offset : baseOffset,
      pageOffset: totalOffset - currentOffset,
    }
  }
  return {
    ...state,
    offset: currentOffset + LIMIT,
    pageOffset: totalOffset - currentOffset,
  }
}


export default {
  basePairState,
  baseSymbolState,
  fetchNext,
  fetchPrev,
  jumpPage,
  paginateState,
}