import React, { PureComponent, Fragment } from 'react'
import { injectIntl } from 'react-intl'
import {
  Button,
  Card,
  Elevation,
  Intent,
  MenuItem,
} from '@blueprintjs/core'
import {
  Cell,
  Column,
  Table,
  TruncatedFormat,
} from '@blueprintjs/table'
import { Select } from '@blueprintjs/select'

import Loading from 'components/Loading'
import NoData from 'components/NoData'
import Pagination from 'components/Pagination'
import TimeRange from 'components/TimeRange'
import queryConstants from 'state/query/constants'
import {
  checkFetch,
  formatTime,
  getCurrentEntries,
} from 'state/utils'

import { propTypes, defaultProps } from './Ledgers.props'

const COLUMN_WIDTHS = [500, 120, 120, 120, 150]
const LIMIT = queryConstants.DEFAULT_LEDGERS_QUERY_LIMIT
const PAGE_SIZE = queryConstants.DEFAULT_LEDGERS_PAGE_SIZE
const ALL = 'ALL'
const WILD_CARD = ['', ALL]

class Ledgers extends PureComponent {
  constructor(props) {
    super(props)
    this.handlers = {}
    this.handleClick = this.handleClick.bind(this)
    this.fetchPrev = this.fetchPrev.bind(this)
    this.fetchNext = this.fetchNext.bind(this)
  }

  componentDidMount() {
    const { loading, fetchLedgers } = this.props
    if (loading) {
      fetchLedgers()
    }
  }

  componentDidUpdate(prevProps) {
    checkFetch(prevProps, this.props, 'ledgers')
  }

  handleClick(symbol) {
    if (!this.handlers[symbol]) {
      this.handlers[symbol] = () => {
        // eslint-disable-next-line react/destructuring-assignment
        this.props.setCurrentSymbol(symbol === ALL ? '' : symbol)
      }
    }
    return this.handlers[symbol]
  }

  fetchPrev() {
    // eslint-disable-next-line react/destructuring-assignment
    this.props.fetchPrevLedgers()
  }

  fetchNext() {
    // eslint-disable-next-line react/destructuring-assignment
    this.props.fetchNextLedgers()
  }

  render() {
    const {
      coins,
      offset,
      pageOffset,
      pageLoading,
      currencies,
      currentSymbol,
      entries,
      handleClickExport,
      intl,
      jumpPage,
      loading,
    } = this.props
    const filteredData = getCurrentEntries(entries, offset, LIMIT, pageOffset, PAGE_SIZE)
    const currencyList = coins ? [ALL, ...coins] : [ALL, ...currencies]
    // eslint-disable-next-line react/destructuring-assignment
    const currentCurrency = currentSymbol || ALL
    const numRows = filteredData.length

    const descriptionCellRenderer = (rowIndex) => {
      const { description } = filteredData[rowIndex]
      return (
        <Cell tooltip={description}>
          {description}
        </Cell>
      )
    }

    const mtsCellRenderer = (rowIndex) => {
      const mts = formatTime(filteredData[rowIndex].mts)
      return (
        <Cell tooltip={mts}>
          <TruncatedFormat>
            {mts}
          </TruncatedFormat>
        </Cell>
      )
    }

    const creditCellRenderer = (rowIndex) => {
      const { amount, currency } = filteredData[rowIndex]
      const show = parseFloat(amount) > 0
      const showAmount = show ? amount : ''
      // eslint-disable-next-line react/destructuring-assignment
      const showCurrency = show && WILD_CARD.includes(currentSymbol) ? (
        <Fragment>
          &nbsp;
          <span className='bitfinex-show-soft'>
            {currency}
          </span>
        </Fragment>
      ) : ''
      const tooltip = show ? `${amount} ${currency}` : undefined
      return (
        <Cell
          className='bitfinex-green-text bitfinex-text-align-right'
          tooltip={tooltip}
        >
          {showAmount}
          {showCurrency}
        </Cell>
      )
    }

    const debitCellRenderer = (rowIndex) => {
      const { amount, currency } = filteredData[rowIndex]
      const show = parseFloat(amount) < 0
      const showAmount = show ? Math.abs(amount) : ''
      // eslint-disable-next-line react/destructuring-assignment
      const showCurrency = show && WILD_CARD.includes(currentSymbol) ? (
        <Fragment>
          &nbsp;
          <span className='bitfinex-show-soft'>
            {currency}
          </span>
        </Fragment>
      ) : ''
      const tooltip = show ? `${Math.abs(amount)} ${currency}` : undefined
      return (
        <Cell
          className='bitfinex-red-text bitfinex-text-align-right'
          tooltip={tooltip}
        >
          {showAmount}
          {showCurrency}
        </Cell>
      )
    }

    const balanceCellRenderer = (rowIndex) => {
      const { balance, currency } = filteredData[rowIndex]
      const tooltip = `${balance} ${currency}`
      return (
        <Cell
          className='bitfinex-text-align-right'
          tooltip={tooltip}
        >
          {balance}
        </Cell>
      )
    }

    const renderSymbol = (symbol, { modifiers }) => {
      if (!modifiers.matchesPredicate) {
        return null
      }
      const isCurrent = currentCurrency === symbol
      const className = (WILD_CARD.includes(symbol) || currencies.includes(symbol)) && !isCurrent
        ? 'bitfinex-queried-symbol' : ''

      return (
        <MenuItem
          className={className}
          active={modifiers.active}
          intent={isCurrent ? Intent.PRIMARY : Intent.NONE}
          disabled={modifiers.disabled}
          key={symbol}
          onClick={this.handleClick(symbol)}
          text={symbol}
        />
      )
    }

    const filterSymbol = (query, coin) => coin.toLowerCase().indexOf(query.toLowerCase()) >= 0

    const renderSymbolSelector = (
      <Fragment>
          &nbsp;
        <Select
          disabled={coins.length === 0}
          items={currencyList}
          itemRenderer={renderSymbol}
          itemPredicate={filterSymbol}
          onItemSelect={this.handleClick}
        >
          <Button
            text={currentCurrency}
            rightIcon='caret-down'
            disabled={coins.length === 0}
          />
        </Select>
      </Fragment>
    )

    const renderPagination = (
      <Pagination
        type='ledgers'
        dataLen={entries.length}
        loading={pageLoading}
        offset={offset}
        jumpPage={jumpPage}
        nextClick={this.fetchNext}
        prevClick={this.fetchPrev}
        pageOffset={pageOffset}
      />
    )

    let showContent
    if (loading) {
      showContent = (
        <Loading title='ledgers.title' />
      )
    } else if (numRows === 0) {
      showContent = (
        <Fragment>
          <h4>
            {intl.formatMessage({ id: 'ledgers.title' })}
            &nbsp;
            <TimeRange />
            {renderSymbolSelector}
          </h4>
          <NoData />
        </Fragment>
      )
    } else {
      showContent = (
        <Fragment>
          <h4>
            {intl.formatMessage({ id: 'ledgers.title' })}
            &nbsp;
            <TimeRange />
            {renderSymbolSelector}
            &nbsp;
            <Button icon='cloud-download' onClick={handleClickExport}>
              {intl.formatMessage({ id: 'timeframe.download' })}
            </Button>
          </h4>
          {renderPagination}
          <Table
            className='bitfinex-table'
            numRows={numRows}
            enableRowHeader={false}
            columnWidths={COLUMN_WIDTHS}
          >
            <Column
              id='description'
              name={intl.formatMessage({ id: 'ledgers.column.description' })}
              cellRenderer={descriptionCellRenderer}
            />
            <Column
              id='credit'
              name={intl.formatMessage({ id: 'ledgers.column.credit' })}
              cellRenderer={creditCellRenderer}
            />
            <Column
              id='debit'
              name={intl.formatMessage({ id: 'ledgers.column.debit' })}
              cellRenderer={debitCellRenderer}
            />
            <Column
              id='balance'
              name={intl.formatMessage({ id: 'ledgers.column.balance' })}
              cellRenderer={balanceCellRenderer}
            />
            <Column
              id='mts'
              name={intl.formatMessage({ id: 'ledgers.column.time' })}
              cellRenderer={mtsCellRenderer}
            />
          </Table>
          {renderPagination}
        </Fragment>
      )
    }
    return (
      <Card interactive elevation={Elevation.ZERO} className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
        {showContent}
      </Card>
    )
  }
}

Ledgers.propTypes = propTypes
Ledgers.defaultProps = defaultProps

export default injectIntl(Ledgers)
