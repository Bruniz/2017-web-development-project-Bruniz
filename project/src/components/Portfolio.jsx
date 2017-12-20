import React, {Component} from 'react';
import {Table} from 'react-bootstrap';
import '../css/spms.css';
import {VelocityTransitionGroup} from 'velocity-react';

import PortfolioFooter from './PortfolioFooter';
import PortfolioHeader from './PortfolioHeader';
import StockGraph from './StockGraph';

/**
 * Component for a single portfolio. Has small state of its own to
 */
export default class Portfolio extends Component {

    // Set the default starting state of the component
    constructor(props) {
        super(props);

        this.state = {
            currentCurrency: {symbol: '$', rate: 1}, // The currently selected currency
            isUpdating: false, // Is the portfolio updating,
            showGraph: false // Should graph be shown
        };
        // Bind this to methods so this is defined
        this.handleCurrencyChange = this.handleCurrencyChange.bind(this);
        this.onUpdatePortfolioClick = this.onUpdatePortfolioClick.bind(this);
        this.handleGraphButtonClick = this.handleGraphButtonClick.bind(this);
    }

    // Click handler for handling currency changes
    handleCurrencyChange(event) {
        switch (event.target.id) {
            case '€':
                this.setState({currentCurrency: {symbol: '€', rate: this.props.euroRate}});
                break;

            case '$':
                this.setState({currentCurrency: {symbol: '$', rate: 1}});
                break;

            default:
                console.log('Unknown event target id', event.target)
                break;
        }
    }

    // Middleware click handler for update portfolio button
    onUpdatePortfolioClick() {

        // Set the state to updating so buttons are deactivated
        this.setState({isUpdating: !this.state.isUpdating});
        // Call the update handler that updates the stocks, pass the current portfolio then wait for promise to return and the flip state again
        this.props.onUpdatePortfolioClick(this.props.portfolio)
            .then(() => this.setState({isUpdating: !this.state.isUpdating}))
            .catch(err => {
                console.log(err);
                alert('Error when updating portfolio');
            });

    }

    // Click handler for the graph button makes the graph appear
    handleGraphButtonClick() {
        this.setState({showGraph: !this.state.showGraph});
    }

    // Render method of the portfolio component
    render() {
        const {portfolio, euroRate, disableUpdate} = this.props;
        const {currentCurrency, isUpdating, showGraph} = this.state;
        let totalValue = 0;
        let checkCount = 0;

        return (
            <div className="portfolio">
                {/*Header of the portfolio*/}
                <PortfolioHeader
                    currentCurrency={currentCurrency}
                    isUpdating={isUpdating}
                    disableUpdate={disableUpdate}
                    euroRate={euroRate}
                    portfolio={portfolio}
                    onActionButtonClick={this.props.onActionButtonClick}
                    onUpdatePortfolioClick={this.onUpdatePortfolioClick}
                    handleCurrencyChange={this.handleCurrencyChange}
                />
                {/* Body of the portfolio*/}
                <div className="portfolio-body">
                    <div className="table-container">
                        {/* If there are stocks in the portfolio then create a table for them*/}
                        {portfolio.symbols.length > 0 ?
                            <Table striped bordered condensed hover className="stock-table">
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Value</th>
                                    <th>Quantity</th>
                                    <th>Total value</th>
                                    <th><i className="fa fa-check"/></th>
                                </tr>
                                </thead>
                                <VelocityTransitionGroup component="tbody"
                                                         enter={{animation: "slideDown", display: 'table-row'}}
                                                         leave={{animation: "slideUp", display: 'table-row'}}
                                >
                                    {/* Map through all the symbols and create table rows in the table body */}
                                    {portfolio.symbols.map(symbol => {
                                        // Update the total value of the portfolio when looping through it
                                        totalValue += symbol.totalValue;
                                        // Also count the number of checked stocks
                                        checkCount = symbol.selected === true ? checkCount + 1 : checkCount;
                                        {/* Return the table row*/
                                        }
                                        return (
                                            <tr key={symbol.name}>
                                                <td>{symbol.name}</td>
                                                {/* Apply the current currency rate and add the symbol */}
                                                <td>{(symbol.value * currentCurrency.rate).toFixed(2)} {currentCurrency.symbol}</td>
                                                <td>{symbol.quantity}</td>
                                                {/* Apply the current currency rate and add the symbol */}
                                                <td>{(symbol.totalValue * currentCurrency.rate).toFixed(2)} {currentCurrency.symbol}</td>
                                                {/* Checkbox with change handler for selecting table rows */}
                                                <td><input type="checkbox" checked={symbol.selected}
                                                           onChange={() => this.props.onStockCheck(portfolio.id, symbol.id)}/>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </VelocityTransitionGroup>
                            </Table>
                            : <span>No stocks added yet</span>}
                        {/* No stocks add the text above instead of the table */}
                    </div>
                </div>
                {/* Footer of the portfolio */}
                <PortfolioFooter
                    currentCurrency={currentCurrency}
                    disableUpdate={disableUpdate}
                    portfolio={portfolio}
                    totalValue={totalValue}
                    checkCount={checkCount}
                    onActionButtonClick={this.props.onActionButtonClick}
                    onStockDelete={this.props.onStockDelete}
                    onGraphButtonClick={this.handleGraphButtonClick}

                />

                <VelocityTransitionGroup enter={{animation: "slideDown"}} leave={{animation: "slideUp"}}>
                    {showGraph ?
                        <StockGraph
                            portfolio={portfolio}
                            currency={currentCurrency}
                            onGraphButtonClick={this.handleGraphButtonClick}

                        />
                        : null}
                </VelocityTransitionGroup>
            </div>
        );
    }
}

