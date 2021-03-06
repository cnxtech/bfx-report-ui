import {
  call,
  select,
  takeLatest,
} from 'redux-saga/effects'
import { delay } from 'redux-saga'

import i18n, { LANGUAGES } from 'locales/i18n'

import types from './constants'
import { getLocale, getTheme } from './selectors'

function* updateTheme() {
  const theme = yield select(getTheme)
  // .replace is the temp fix for the wrong default value
  // could be removed later
  document.body.className = theme.replace('_', '-')
}

const WAIT_INTERVAL = 500

function* updateLang() {
  yield call(delay, WAIT_INTERVAL)
  const locale = yield select(getLocale)
  i18n.changeLanguage(LANGUAGES[locale])
}

export default function* baseSaga() {
  yield takeLatest(types.SET_THEME, updateTheme)
  yield takeLatest(types.UPDATE_THEME, updateTheme)
  yield takeLatest(types.SET_LANG, updateLang)
}
