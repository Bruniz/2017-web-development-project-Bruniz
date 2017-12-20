import React, {Component} from 'react';
import _ from 'lodash';
import Promise from 'bluebird';
import {LineChart, Line, ResponsiveContainer, XAxis, YAxis, Legend, Tooltip, Brush} from 'recharts';
import {VelocityTransitionGroup} from 'velocity-react';

import Modal from './Modal';
import '../css/spms.css';

const API_KEY = 'QFAXDFMALANF9ZMB';

/**
 * Component for a single portfolio. Has small state of its own to
 */
export default class StockGraph extends Component {

    // Set the default starting state of the component
    constructor(props) {
        super(props);

        this.state = {
            graphData: [],
            linesToDisplay: this.props.portfolio.symbols.map(s => s.name),
            stockSymbols: this.props.portfolio.symbols.map(s => s.name)
        };

        // Bind this to methods so it is not undefined
        this.fetchGraphData = this.fetchGraphData.bind(this);
        this.handleLegendClick = this.handleLegendClick.bind(this);
        this.generateColor = this.generateColor.bind(this);
    }

    // When the component mounts the start loading the chart data
    componentDidMount() {
        this.fetchGraphData().catch(err => console.log(err));
    }

    /**
     * Method for fetching the chart data. Is asynchronous as all the data as to be fetched before it is saved to state.
     *
     */
    async fetchGraphData() {

        // Variable to store hraphData in
        let graphData = [];

        let promise = await Promise.each(this.props.portfolio.symbols, symbol => {
            // Call the API using fetch
            return fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol.name}&outputSize=full&apikey=${API_KEY}`)
                .then(result => {
                    // Convert to JSON
                    return result.json();
                })
                .then(data => {
                    // If there is no error then process the data
                    if (data['Time Series (Daily)']) {
                        // Index to travers along the graphData array variable
                        let index = 0;
                        // Traverse over all objects in the time series
                        for (let prop in data['Time Series (Daily)']) {

                            // If this array postition is not null or an object yet then set it to empty object
                            if (graphData[index] !== null && typeof graphData[index] !== 'object')
                                graphData[index] = {};

                            // Get the close value of this day. Convert to selected currency and parse to float with two decimals
                            graphData[index][symbol.name] = parseFloat((parseFloat(data['Time Series (Daily)'][prop]['4. close']) * this.props.currency.rate).toFixed(2));
                            // Get the data of the data point
                            graphData[index]['date'] = prop;
                            // Increment index
                            index++;
                        }
                        // Return Promise to the Promise.each
                        return Promise.resolve(index);

                    } else {
                        console.log('Error when fetching graph data');
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        });
        // When all requests are done then set the graph data to state
        Promise.all(promise).then(() => this.setState({graphData: graphData.reverse()}))
            .catch(err => console.log(err));
    }

    /**
     * Method for handling user clicking on the legend checkboxes to show/hide the lines
     * @param symbol
     */
    handleLegendClick(symbol) {

        // Get the lines that should be displayed
        let lines = this.state.linesToDisplay;
        // If the array inludes the symbol name, then remove it, else add it
        lines.includes(symbol) ?
            this.setState({linesToDisplay: _.pull(lines, symbol)}) :
            this.setState({linesToDisplay: [...lines, symbol]});

    }

    /**
     * Method for generating a random color. Needed as there can be up to 50 chart lines
     */
    generateColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // Render method of the portfolio component
    render() {
        const {portfolio, onGraphButtonClick, currency} = this.props;
        const {graphData, stockSymbols, linesToDisplay} = this.state;

        return (
            <Modal
                buttonOKText="Close"
                size="large"
                id="stockGraph"
                title={"Stock performance for " + portfolio.name}
                actionButtonClick={onGraphButtonClick}
                disableSave={graphData.length < 1}
            >
                {/* Animate the graph entering */}
                <VelocityTransitionGroup enter={{animation: "slideDown", display: 'flex'}}
                                         leave={{animation: "slideUp", display: 'flex'}} className="chart-container">
                    {graphData.length > 0 ?
                        <ResponsiveContainer width="100%" height={400}>
                            {/* Chart canvas */}
                            <LineChart data={graphData} margin={{top: 20, right: 30, left: 0, bottom: 0}}>
                                <XAxis dataKey="date"/>
                                <YAxis/>
                                <Tooltip/>
                                <Brush/>
                                {/* Map through all the symbols to draw individual lines */}
                                {stockSymbols.map(name => {
                                    return linesToDisplay.includes(name) ?
                                        <Line type="monotone" key={name} dataKey={name} dot={false}
                                              strokeWidth={2} unit={currency.symbol} stroke={this.generateColor()}/> : null
                                })}

                            </LineChart>
                        </ResponsiveContainer>
                        : <span className="center-content"><i className="fa fa-circle-o-notch fa-spin fa-3x"/>Loading graph data</span>}

                    {/* If there is graph data then show the legend checkboxes*/}
                    {graphData.length > 0 && <div className={"space-between-content"}>
                        {stockSymbols.map(name => <div key={name}>
                                <input type="checkbox" id={name} onChange={() => this.handleLegendClick(name)}
                                       checked={linesToDisplay.includes(name)} value={name}/>
                                <label htmlFor={name}>{name}</label>
                            </div>
                        )}
                    </div>}

                </VelocityTransitionGroup>
            </Modal>
        );
    }
}

