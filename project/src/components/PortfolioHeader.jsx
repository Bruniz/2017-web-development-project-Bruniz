import React from 'react';
import {Button} from 'react-bootstrap';

/**
 * Component for the portfolios header
 */
export default function PortfolioHeader(props) {

    const {
        portfolio,
        onActionButtonClick,
        onUpdatePortfolioClick,
        disableUpdate,
        currentCurrency,
        euroRate,
        isUpdating,
        handleCurrencyChange
    } = props;

    return (

        <div className="portfolio-header">
            <div>
                <span className="name">{portfolio.name}</span>
                {/* Update buttons clickhandler is removed if portfolio is updating and disabled if another portfolio is updating*/}
                <Button onClick={isUpdating ? null : onUpdatePortfolioClick}
                        disabled={portfolio.symbols.length < 1 || disableUpdate}
                >
                    {isUpdating ? <i className="fa fa-refresh fa-spin"/> : <i className="fa fa-refresh"/>}
                </Button>
            </div>
            <div>
                {/*The euro button is disabled if the rate has not been fetched from the API*/}
                <Button id="€" bsStyle={currentCurrency.symbol === '€' ? 'primary' : 'default'}
                        onClick={handleCurrencyChange} disabled={!euroRate}
                        title={euroRate ? 'Convert to euro' : 'Exchange rate not available'}
                >
                    €
                </Button>
                <Button id="$" bsStyle={currentCurrency.symbol === '$' ? 'primary' : 'default'}
                        onClick={handleCurrencyChange}>
                    $
                </Button>
                {/* The delete portfolio button is disabled if the porfolio is updating stocks*/}
                <Button bsStyle="danger" className="delete-portfolio-btn" disabled={isUpdating}
                        onClick={() => onActionButtonClick('showDeletePortfolioDialog', portfolio)}
                >
                    Delete
                </Button>
            </div>
        </div>

    )
}