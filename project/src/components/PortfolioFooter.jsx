import React from 'react';
import {Button} from 'react-bootstrap';

/**
 * Component for the portfolios footer
 */
export default function PortfolioFooter(props) {

    const {
        portfolio,
        onActionButtonClick,
        onGraphButtonClick,
        disableUpdate,
        currentCurrency,
        checkCount,
        onStockDelete,
        totalValue
    } = props;

    return (
        <div className="portfolio-footer">
            <div className="footer-total-value-row">
                {/* If there are stocks in the portfolio the show the total value of the stocks in selected currency */}
                {portfolio.symbols.length > 0 &&
                <span>Total value of {portfolio.name}: <b>{(totalValue * currentCurrency.rate).toFixed(2)}</b> {currentCurrency.symbol}</span>}
            </div>
            <div className="footer-btn-row">
                        <span>
                            {/* The add stock button which is disabled if the maximum of 50 stock symbols are added */}
                            <Button bsStyle="primary"
                                    onClick={() => onActionButtonClick('showAddStockDialog', portfolio)}
                                    disabled={portfolio.symbols.length >= 50}
                                    title={portfolio.symbols.length < 50 ? 'Add stock symbol' : 'Maximum of 50 symbols allowed in a portfolio'}
                            >
                                Add stock
                            </Button>
                            {/* The graph button, which is disabled if there are no stocks in the portfolio */}
                            <Button bsStyle="primary"
                                    onClick={onGraphButtonClick}
                                    disabled={portfolio.symbols.length < 1}
                            >
                                Graph
                            </Button>
                        </span>
                {/* The remove selected stock button which shows the number of selected stocks and is disabled
                            if portfolio is updating */}
                <Button bsStyle="danger"
                        onClick={() => onStockDelete(portfolio.id)}
                        disabled={checkCount === 0 || disableUpdate}
                >
                    Remove selected {checkCount > 0 && '(' + checkCount + ')'}
                </Button>
            </div>
            {/* Show the time of the last update that happened in the portfolio */}
            {portfolio.symbols.length > 0 && <span>Stock last update: {portfolio.lastRefresh}</span>}
        </div>
    )
}