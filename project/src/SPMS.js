import React, {Component} from 'react';
import './css/spms.css';
import './css/font-awesome-4.7.0/css/font-awesome.min.css';
import {Button} from 'react-bootstrap';
import uuidv4 from 'uuid/v4';
import _ from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';
import {VelocityTransitionGroup} from 'velocity-react';

import Portfolio from './components/Portfolio';
import Modal from './components/Modal';

const API_KEY = 'QFAXDFMALANF9ZMB';
const dateFormat = 'HH:mm:ss - MMM Do YYYY'

/**
 * Main application component. Holds most of the application state. Responsible for communicating with the API.
 */
export default class SPMS extends Component {

    // Set the default starting state and bind this to all functions so this is defined.
    constructor(props) {
        super(props);

        this.state = {
            portfolios: [],
            loading: false,
            disableUpdate: false,
            euroRate: '',
            showNewPortfolioDialog: false,
            showDeletePortfolioDialog: false,
            showAddStockDialog: false,
            newStockName: '',
            newStockQuantity: '',
            newPortfolioName: '',
            currentTarget: '',

        };

        this.getPortfolios = this.getPortfolios.bind(this);
        this.setPortfolios = this.setPortfolios.bind(this);
        this.addPortfolio = this.addPortfolio.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
        this.handleCloseButtonClick = this.handleCloseButtonClick.bind(this);
        this.handleActionButtonClick = this.handleActionButtonClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.fetchSymbolData = this.fetchSymbolData.bind(this);
        this.handleStockCheck = this.handleStockCheck.bind(this);
        this.handleStockDelete = this.handleStockDelete.bind(this);
        this.getExchangeRates = this.getExchangeRates.bind(this);
        this.updatePortfolio = this.updatePortfolio.bind(this);
    }

    /**
     * When component mounts then get the saved portfolios from the local storage.
     * Get the latest EUR exchange rate from the API.
     */
    componentDidMount() {
        this.getPortfolios();
        this.getExchangeRates();
    }

    /**
     * Method for getting the portfolios from the local storage and saving them in the app state
     */
    getPortfolios() {
        // Get portfolios from the local storage and convert to JSON (can only save strings in localstorage)
        const portfolios = JSON.parse(localStorage.getItem('portfolios'));
        // If there were portfolios saved set the to the app state.
        if (portfolios) {
            this.setState({portfolios});
        }
    }

    /**
     * Method for saving the portfolios to the localstorage. This method is called after a state change that modifies
     * the portfolios is done. For instance add/remove stock.
     */
    setPortfolios() {
        // Parse the portfolios in app state to a string. Only strings can be saved in local storage
        const portfolios = JSON.stringify(this.state.portfolios);
        // Set the item in local storage
        localStorage.setItem('portfolios', portfolios);
    }

    /**
     * Method for fetching the latest exchange rate for $->€. Sets the rate to app state
     */
    getExchangeRates() {

        // Use fetch to call the API
        fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey=${API_KEY}`)
            .then(result => {
                // Convert result to JSON
                return result.json();
            })
            .then(data => {

                // If the exchange rate object is set then process it
                if (data['Realtime Currency Exchange Rate'] !== undefined) {
                    // Parse the rate to a float
                    const euroRate = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
                    // Set the rate to app state
                    this.setState({euroRate});

                }// Else let the user know the the euro rate could not be fetched
                else {
                    alert('Could not fetch exchange rate for EUR. Refresh page if you want to try again');
                }
            })
            .catch(err => {
                alert('Could not fetch exchange rate for EUR. API errro');
                console.log(err);
            });
    }

    /**
     * Method for adding a new portfolio to the portfolio catalog. Adds the new portfolio to the app state then calls
     * setPortfolios method to store changes in local storage. Also resets the state variable newPortfolioName so
     * the text field is empty the next time a portfolio is created.
     */
    addPortfolio(portfolio) {
        // Get the array of portfolios (might be empty or contain portfolios)
        let portfolios = this.state.portfolios;
        // Add the new portfolio
        portfolios.push(portfolio);
        // Set the new app state
        this.setState({portfolios, newPortfolioName: ''});
        // Save changes to local storage
        this.setPortfolios();
    }

    /**
     * Method used for fetching data for a new symbol when it is added to a portfolio
     * @param symbol The symbol name that is to be added. For example 'GOOG'
     */
    fetchSymbolData(symbol) {
        // Change the state so the loading spinner appears
        this.setState({loading: !this.state.loading});
        // Use fetch to send the request to the API
        fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${API_KEY}`)
            .then(result => {
                // Convert result to JSON
                return result.json();
            })
            .then(data => {

                // If a valid request, process it
                if (data['Meta Data'] !== undefined) {

                    // The field required to find the freshest data
                    const lastRefresh = data['Meta Data']['3. Last Refreshed'];
                    // Get the latest price from the data and parse it to a float with two decimals
                    let latestPrice = parseFloat(data['Time Series (1min)'][lastRefresh]['4. close']).toFixed(2);

                    // Create a new stock object using the data
                    const stock = {
                        name: this.state.newStockName,
                        value: latestPrice,
                        quantity: this.state.newStockQuantity,
                        totalValue: latestPrice * this.state.newStockQuantity,
                        selected: false, // By default not selected
                        id: uuidv4() // Unique id to identify stocks and use as key in react
                    };

                    // Get the portfolios from app state
                    let portfolios = this.state.portfolios;
                    // Find the index of the portfolio to where the stock belongs
                    const index = _.findIndex(portfolios, {id: this.state.currentTarget});
                    // Add the stock to the list in the portfolio
                    portfolios[index].symbols.push(stock);
                    // Add the time when the data was fetched. Format with moment
                    portfolios[index].lastRefresh = moment().format(dateFormat);
                    // Save the changes to the app state
                    this.setState({portfolios: portfolios});
                    // Save the changes to local storage
                    this.setPortfolios();
                    // Hide the add stock dialog
                    this.toggleModal('showAddStockDialog');
                }
                else { // Else let the user know there was a problem
                    alert('Somthing went wrong! Symbol not found');
                    this.setState({loading: !this.state.loading});
                }
            })
            .catch(err => {
                console.log(err);
            });
    }

    /**
     * Method for toggling the visibility of the modals. Clickhandler for the new portfolio, delete and add stock buttons
     */
    toggleModal(id) {

        switch (id) {
            case 'showNewPortfolioDialog':
                this.setState({showNewPortfolioDialog: !this.state.showNewPortfolioDialog});
                break;
            case 'showDeletePortfolioDialog':
                this.setState({showDeletePortfolioDialog: !this.state.showDeletePortfolioDialog});
                break;
            case 'showAddStockDialog':
                this.setState({
                    showAddStockDialog: !this.state.showAddStockDialog,
                    newStockName: '',
                    newStockQuantity: '',
                    loading: false
                });
                break;
            default:
                console.log('Unknown id', id);
                break;
        }

    }

    /**
     * Clickhandler for the close button in modals.
     * @param id Identifies which modal should be closed
     */
    handleCloseButtonClick(id) {
        switch (id) {
            case 'showNewPortfolioDialog':
                this.toggleModal(id);
                break;
            case 'showDeletePortfolioDialog':
                this.toggleModal(id);
                break;
            case 'deletePortfolio':
                this.toggleModal('showDeletePortfolioDialog');
                break;
            case 'addStock':
                this.toggleModal('showAddStockDialog');
                break;
            default:
                console.log('Unknown id', id);
                break;
        }

    }

    /**
     * Clickhandler for the Save/Add button in modals.
     * @param id Identifies which modal should be closed and saves data
     */
    handleActionButtonClick(id, data) {
        switch (id) {

            case 'showNewPortfolioDialog':
                this.toggleModal(id);
                // Create new portfolio and add it to the list
                this.addPortfolio({
                    id: uuidv4(),
                    lastRefresh: '',
                    name: this.state.newPortfolioName,
                    totalValue: 0,
                    symbols: []
                });
                break;

            case 'showDeletePortfolioDialog':
                // Save to where the change should go by putting it in state. Delete button pressed, save which portfolio
                this.setState({currentTarget: data});
                this.toggleModal(id);
                break;

            case 'deletePortfolio':
                this.toggleModal('showDeletePortfolioDialog');
                // Use the target from above and remove the target when user clicks ok in delete dialog
                // Save changes to local storage in callback to ensure the state has change
                this.setState({
                    portfolios: _.reject(this.state.portfolios, {id: this.state.currentTarget.id}),
                    currentTarget: {}
                }, () => this.setPortfolios());



                break;

            case 'showAddStockDialog':
                // Save to which portfolio to add stock to
                this.setState({currentTarget: data.id});
                this.toggleModal('showAddStockDialog');
                break;

            case 'addStock':
                // Find the portfolio to add stock to
                const portfolio = this.state.portfolios.filter(p => p.id === this.state.currentTarget)[0];
                // Check that there are no duplicate stock symbols in portfolio
                const checkDuplicate = _.findIndex(portfolio.symbols, {name: this.state.newStockName});
                // If no duplicates then fetch symbol data from API
                if (checkDuplicate === -1) {
                    this.fetchSymbolData(this.state.newStockName);
                }
                // Else alert of duplication
                else {
                    alert('Stock ' + this.state.newStockName + ' already in portfolio');
                }

                break;

            default:
                console.log('Unknown id', id);
                break;
        }

    }

    /**
     * Change event handler for binding input field values to state to create controlled components.
     * @param event
     */
    handleChange(event) {

        // Indentify to where the change should be out
        switch (event.target.id) {

            case 'newPortfolioName':
                this.setState({newPortfolioName: event.target.value});
                break;

            case 'newStockName':
                this.setState({newStockName: event.target.value.toUpperCase()});
                break;

            case 'newStockQuantity':
                // Only allow digits in the quantity field in add stock dialog
                if (event.target.value.match(new RegExp(/^[0-9]+$/)))
                    this.setState({newStockQuantity: parseInt(event.target.value, 10)});
                else
                    this.setState({newStockQuantity: ''});

                break;

            default:
                console.log('Unknown id', event.target.id);
                break;
        }

    }

    /**
     * Method for handling the selecting and de-selecting of stocks
     * @param pID Portfolio id
     * @param sID Stock id
     */
    handleStockCheck(pID, sID) {

        // Get the portfolios from state
        let portfolios = this.state.portfolios;
        // Find the portfolio the stock was in
        const pIndex = _.findIndex(portfolios, {id: pID});
        let portfolio = portfolios[pIndex];
        // Find the stock that was selected / de-selected
        const sIndex = _.findIndex(portfolio.symbols, {id: sID});
        // Flip the checkbox value
        portfolio.symbols[sIndex].selected = !portfolio.symbols[sIndex].selected;
        // Update list of portfolios with the changes
        portfolios[pIndex] = portfolio;
        // Save in app state
        this.setState({portfolios});

    }

    /**
     * Method for handling deletion of selected stocks
     * @param pID Portfolio id
     * @param sID Stock id
     */
    handleStockDelete(pID) {

        // Get the portfolios from the app state
        let portfolios = this.state.portfolios;
        // Get the index of portfolio that has the id pID
        let pIndex = _.findIndex(portfolios, {id: pID});
        // Get the portfolio
        let portfolio = portfolios[pIndex];
        // Remove all stocks that have been selected
        portfolio.symbols = _.reject(portfolio.symbols, {selected: true});
        // Replace the portfolio in the portfolios
        portfolios[pIndex] = portfolio;
        // Save changes to app state
        this.setState({portfolios});
        // Save changes to local storage
        this.setPortfolios();

    }

    /**
     * Method for updating all stocks in a portfolio. Loops through all stocks in the portfolio and fetches updates
     * from the API. Method async keyword as the method is promise based and the promise needs to return after all
     * stocks have been updated. Uses bluebird Promise.each to loop through all stocks.
     * @param portfolio The portfolio object to loop through and update
     * @returns {Promise<*>} The promise of a the update
     */
    async updatePortfolio(portfolio) {

        // Set the the app state to prevent the update button on another portfolio to be clicked while the update is running
        this.setState({disableUpdate: true});

        // Loop through all the stocks and update the values. Use async await to return the promise when everything is done
        let promise = await Promise.each(portfolio.symbols, symbol => {
            // Return the promise of the fetch request
            return fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol.name}&interval=1min&apikey=${API_KEY}`)
                .then(result => {
                    // Convert to JSON
                    return result.json();
                })
                .then(data => {

                    // If the stock was found
                    if (data['Meta Data'] !== undefined) {

                        // Get the latest data point
                        const lastRefresh = data['Meta Data']['3. Last Refreshed'];
                        // Get the latest price from the latest data point
                        let latestPrice = parseFloat(data['Time Series (1min)'][lastRefresh]['4. close']).toFixed(2);
                        // Update the value of the stock
                        symbol.value = latestPrice;
                        // Get the portfolios
                        let portfolios = this.state.portfolios;
                        // Find the index of the portfolio in question
                        const pIndex = _.findIndex(portfolios, {id: portfolio.id});
                        // Use the pIndex to find the index of the stock symbol
                        let sIndex = _.findIndex(portfolios[pIndex].symbols, {id: symbol.id});
                        // Replace symbol with new data
                        portfolios[pIndex].symbols[sIndex] = symbol;
                        // Add the last refresh time to the
                        portfolios[pIndex].lastRefresh = moment().format(dateFormat);
                        // Save changes to app state
                        this.setState({portfolios: portfolios});

                        // Return a promise resolution to the loop
                        return Promise.resolve(symbol.name);
                    }// Else somthing failed
                    else {
                        console.log(data);
                        return Promise.reject(new Error('Api error'));
                    }
                })
                .catch(err => {
                    console.log(err);
                    return Promise.reject(err);
                });
        });
        // Enable all the buttons again
        this.setState({disableUpdate: false});
        // Save changes to local storage
        this.setPortfolios();
        // Rturn the promise to the caller
        return promise;

    }

    // Render method of the main app component
    render() {
        // State variable re-declaration for easier access
        const {
            portfolios,
            loading,
            disableUpdate,
            euroRate,
            showNewPortfolioDialog,
            showDeletePortfolioDialog,
            newPortfolioName,
            currentTarget,
            showAddStockDialog,
            newStockName,
            newStockQuantity
        } = this.state;

        // The modal dialog to show when a new portfolio is to be created
        const newPortfolioDialog = <Modal
            buttonOKText="Save"
            buttonCancelText="Cancel"
            id="showNewPortfolioDialog"
            title="Create new portfolio"
            closeButtonClick={this.handleCloseButtonClick} // Button handler
            actionButtonClick={this.handleActionButtonClick} // Button handler
            disableSave={!newPortfolioName} // Should not be able to save if name is empty
        >
            New portfolio name <br/>
            <input type="text" id="newPortfolioName"
                   value={newPortfolioName} // Controlled component
                   onChange={this.handleChange} // Change handler which changes value of newPortfolioName above
                   placeholder="My Portfolio"
                   className="full-width"
            />
        </Modal>;

        // The modal dialog to show when a portfolio is to be deleted
        const deletePortfolioDialog = <Modal
            buttonOKText="OK"
            buttonCancelText="Cancel"
            id="deletePortfolio"
            title="Delete portfolio?"
            closeButtonClick={this.handleCloseButtonClick}
            actionButtonClick={this.handleActionButtonClick}
            disableSave={false}
        >
            Really delete <b>{currentTarget ? currentTarget.name : null}</b>?
        </Modal>;

        // The modal dialog to show when a new stock is to be added
        const addStockDialog = <Modal
            buttonOKText="Add"
            buttonCancelText="Cancel"
            id="addStock"
            title="Add new stock symbol"
            closeButtonClick={this.handleCloseButtonClick}
            actionButtonClick={this.handleActionButtonClick}
            disableSave={!(newStockName && newStockQuantity && !loading)} // Both inputs need to be set and api call not ongoing
        >
            Input symbol and quantity<br/>
            <input type="text" id="newStockName" placeholder="NOK" value={newStockName} // Controlled input component
                   onChange={this.handleChange}/>
            <br/>
            <input type="text" id="newStockQuantity" placeholder="100"
                   value={newStockQuantity}  // Controlled input component
                   onChange={this.handleChange}/>
            <br/><br/>{loading ? <span><i className="fa fa-3x fa-circle-o-notch fa-spin"/>Loading symbol data</span> : null}

        </Modal>;

        // The render method will return this rendered
        return (
            <div className="container">
                <VelocityTransitionGroup enter={{animation: "slideDown"}} leave={{animation: "slideUp"}}>
                    {showNewPortfolioDialog && newPortfolioDialog}
                    {showDeletePortfolioDialog && deletePortfolioDialog}
                    {showAddStockDialog && addStockDialog}
                </VelocityTransitionGroup>

                <div className="row">
                    {/* The add portfolio button which is disabled if there maximum limit of portfolios is reached */}
                    <Button bsStyle="primary" disabled={portfolios.length >= 10}
                            title={portfolios.length < 10 ? 'Create new portfolio' : 'Maximum of 10 portfolios allowed'}
                            onClick={() => this.toggleModal('showNewPortfolioDialog')}
                    >
                        Add new portfolio
                    </Button>
                </div>

                <VelocityTransitionGroup enter={{animation: "slideDown"}} leave={{animation: "slideUp"}}
                                         className="portfolios">
                    {/* Map through all the portfolios and create portfolio components */}
                    {portfolios && portfolios.map(portfolio =>
                        <Portfolio portfolio={portfolio}
                                   key={portfolio.id}
                                   euroRate={euroRate}
                                   onCloseButtonClick={this.handleCloseButtonClick}
                                   onActionButtonClick={this.handleActionButtonClick}
                                   onButtonClick={this.toggleModal}
                                   onStockCheck={this.handleStockCheck}
                                   onStockDelete={this.handleStockDelete}
                                   onUpdatePortfolioClick={this.updatePortfolio}
                                   disableUpdate={disableUpdate}
                        />
                    )}
                </VelocityTransitionGroup>
            </div>
        );
    }

}
