import {
  call,
  put,
  select,
  takeLatest,
} from 'redux-saga/effects'
import queryString from 'query-string'

import { makeFetchCall } from 'state/utils'
import { formatRawSymbols } from 'state/symbols/utils'
import { updateErrorStatus, updateSuccessStatus } from 'state/status/actions'
import { selectAuth } from 'state/auth/selectors'
import { getTargetSymbols as getFCreditSymbols } from 'state/fundingCreditHistory/selectors'
import { getTargetSymbols as getFLoanSymbols } from 'state/fundingLoanHistory/selectors'
import { getTargetSymbols as getFOfferSymbols } from 'state/fundingOfferHistory/selectors'
import { getTargetSymbols as getFPaymentSymbols } from 'state/fundingPayment/selectors'
import { getTargetSymbols as getLedgersSymbols } from 'state/ledgers/selectors'
import { getTargetSymbols as getMovementsSymbols } from 'state/movements/selectors'
import { getTargetPairs as getOrdersPairs } from 'state/orders/selectors'
import { getTargetPairs as getTickersPairs } from 'state/tickers/selectors'
import { getTargetPairs as getTradesPairs } from 'state/trades/selectors'
import { getTimezone, getDateFormat, getShowMilliseconds } from 'state/base/selectors'
import { getTargetSymbol as getPublicTradesSymbol } from 'state/publicFunding/selectors'
import { getTargetPair as getPublicTradesPair } from 'state/publicTrades/selectors'
import { getTargetPairs as getPositionsPairs } from 'state/positions/selectors'
import { getTargetPairs as getActivePositionsPairs } from 'state/positionsActive/selectors'
import { getTimestamp } from 'state/wallets/selectors'
import { getTargetIds as getPositionsIds } from 'state/audit/selectors'

import {
  getEmail,
  getQuery,
  getTargetQueryLimit,
  getTimeFrame,
} from './selectors'
import actions from './actions'
import types from './constants'

const {
  MENU_FCREDIT,
  MENU_FLOAN,
  MENU_FOFFER,
  MENU_FPAYMENT,
  MENU_LEDGERS,
  MENU_ORDERS,
  MENU_TICKERS,
  MENU_TRADES,
  MENU_DEPOSITS,
  MENU_POSITIONS,
  MENU_POSITIONS_ACTIVE,
  MENU_POSITIONS_AUDIT,
  MENU_PUBLIC_FUNDING,
  MENU_PUBLIC_TRADES,
  MENU_WALLETS,
  MENU_WITHDRAWALS,
} = types

/**
 {
  "auth": {
      "apiKey": "fake",
      "apiSecret": "fake"
  },
  "method": "getMultipleCsv",
  "params": {
      "email": "fake@email.fake",
      "multiExport": [
          {
              "method": "getTradesCsv",
              "symbol": "tBTCUSD",
              "end": 1546765168000
          },
          {
              "method": "getLedgersCsv",
              "symbol": "BTC",
              "end": 1546765168000,
              "timezone": "America/Los_Angeles"
          }
      ]
  }
}
*/
function getMultipleCsv(auth, params) {
  return makeFetchCall('getMultipleCsv', auth, params)
}

function getSelector(target) {
  switch (target) {
    case MENU_FCREDIT:
      return getFCreditSymbols
    case MENU_FLOAN:
      return getFLoanSymbols
    case MENU_FOFFER:
      return getFOfferSymbols
    case MENU_FPAYMENT:
      return getFPaymentSymbols
    case MENU_LEDGERS:
      return getLedgersSymbols
    case MENU_ORDERS:
      return getOrdersPairs
    case MENU_WITHDRAWALS:
    case MENU_DEPOSITS:
      return getMovementsSymbols
    case MENU_TICKERS:
      return getTickersPairs
    case MENU_TRADES:
      return getTradesPairs
    case MENU_POSITIONS:
      return getPositionsPairs
    case MENU_POSITIONS_ACTIVE:
      return getActivePositionsPairs
    case MENU_POSITIONS_AUDIT:
      return getPositionsIds
    case MENU_PUBLIC_FUNDING:
      return getPublicTradesSymbol
    case MENU_PUBLIC_TRADES:
      return getPublicTradesPair
    case MENU_WALLETS:
      return getTimestamp
    default:
      return ''
  }
}

function formatSymbol(target, sign) {
  // return directly if no sign
  if (!sign) {
    return ''
  }
  switch (target) {
    case MENU_LEDGERS:
    case MENU_WITHDRAWALS:
    case MENU_DEPOSITS:
    case MENU_FPAYMENT:
      return sign
    case MENU_PUBLIC_FUNDING:
      return `f${sign.toUpperCase()}`
    case MENU_ORDERS:
    case MENU_TICKERS:
    case MENU_TRADES:
    case MENU_POSITIONS:
    case MENU_POSITIONS_ACTIVE:
    case MENU_PUBLIC_TRADES:
    case MENU_FCREDIT:
    case MENU_FLOAN:
    case MENU_FOFFER:
      return formatRawSymbols(sign)
    default:
      return ''
  }
}

function* exportCSV({ payload: targets }) {
  try {
    const auth = yield select(selectAuth)
    const query = yield select(getQuery)
    const multiExport = []
    // eslint-disable-next-line no-restricted-syntax
    for (const target of targets) {
      const options = getTimeFrame(query, target)
      if (target !== MENU_WALLETS) {
        const getQueryLimit = yield select(getTargetQueryLimit)
        options.limit = getQueryLimit(target)
      }
      options.timezone = yield select(getTimezone)
      options.dateFormat = yield select(getDateFormat)
      options.milliseconds = yield select(getShowMilliseconds)
      const selector = getSelector(target)
      const sign = selector ? yield select(selector) : ''
      switch (target) {
        case MENU_WALLETS:
          options.end = sign || undefined
          break
        case MENU_POSITIONS_AUDIT:
          options.id = sign || undefined
          break
        default: {
          const symbol = formatSymbol(target, sign)
          if ((Array.isArray(symbol) && symbol.length > 0)
            || (typeof symbol === 'string' && symbol !== '')) {
            options.symbol = symbol
          }
          break
        }
      }
      switch (target) {
        case MENU_FCREDIT:
          options.method = 'getFundingCreditHistoryCsv'
          break
        case MENU_FLOAN:
          options.method = 'getFundingLoanHistoryCsv'
          break
        case MENU_FOFFER:
          options.method = 'getFundingOfferHistoryCsv'
          break
        case MENU_FPAYMENT:
          options.method = 'getLedgersCsv'
          options.isMarginFundingPayment = true
          break
        case MENU_ORDERS:
          options.method = 'getOrdersCsv'
          break
        case MENU_TICKERS:
          options.method = 'getTickersHistoryCsv'
          break
        case MENU_TRADES:
          options.method = 'getTradesCsv'
          break
        case MENU_WITHDRAWALS:
          options.method = 'getMovementsCsv'
          options.isWithdrawals = true
          break
        case MENU_DEPOSITS:
          options.method = 'getMovementsCsv'
          options.isDeposits = true
          break
        case MENU_POSITIONS:
          options.method = 'getPositionsHistoryCsv'
          break
        case MENU_POSITIONS_ACTIVE:
          options.method = 'getActivePositionsCsv'
          break
        case MENU_POSITIONS_AUDIT:
          options.method = 'getPositionsAuditCsv'
          break
        case MENU_PUBLIC_FUNDING:
          options.method = 'getPublicTradesCsv'
          break
        case MENU_PUBLIC_TRADES:
          options.method = 'getPublicTradesCsv'
          break
        case MENU_WALLETS:
          options.method = 'getWalletsCsv'
          break
        case MENU_LEDGERS:
        default:
          options.method = 'getLedgersCsv'
          break
      }
      multiExport.push(options)
    }

    const params = {
      multiExport,
    }
    if (query.exportEmail) {
      params.email = query.exportEmail
    }
    const { result, error } = yield call(getMultipleCsv, auth, params)
    if (result) {
      if (result.isSendEmail) {
        yield put(updateSuccessStatus({
          id: 'download.status.email',
          topic: 'download.export',
        }))
      } else if (result.isSaveLocaly) {
        yield put(updateSuccessStatus({
          id: 'download.status.local',
          topic: 'download.export',
        }))
      }
    }

    if (error) {
      yield put(updateErrorStatus({
        id: 'status.fail',
        topic: 'download.export',
        detail: JSON.stringify(error),
      }))
    }
  } catch (fail) {
    yield put(updateErrorStatus({
      id: 'status.request.error',
      topic: 'download.export',
      detail: JSON.stringify(fail),
    }))
  }
}

function* prepareExport() {
  try {
    // owner email now get while first auth-check
    const result = yield select(getEmail)
    // export email
    const { reportEmail } = queryString.parse(window.location.search)
    // send email get from the URL when possible
    if (reportEmail && result) {
      yield put(actions.setExportEmail(reportEmail))
    } else {
      yield put(actions.setExportEmail(result))
    }
  } catch (fail) {
    yield put(actions.setExportEmail(false))
    yield put(updateErrorStatus({
      id: 'status.request.error',
      topic: 'download.query',
      detail: JSON.stringify(fail),
    }))
  }
}

export default function* tradesSaga() {
  yield takeLatest(types.PREPARE_EXPORT, prepareExport)
  yield takeLatest(types.EXPORT_CSV, exportCSV)
}
