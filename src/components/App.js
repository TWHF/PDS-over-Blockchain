import Asset from '../artifacts/Asset.json'
import React, { Component } from 'react';
import Navbar from './Navbar'
import Form from './Form'
import Main from './Main'
import Web3 from 'web3'
import './App.css';

class App extends Component {

  async componentWillMount() {
    await this.detectAsset()
    await this.loadWeb3()
    await this.loadBlockchainData()
    localStorage.clear();
  }

  async detectAsset() {
    const urlParams = new URLSearchParams(window.location.search)
    const address = urlParams.get('address')
    this.setState({ contractAddress: address });
    // localStorage.setItem('contractAddress',address);
  }

  async loadWeb3() {
  let web3 = new Web3();
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      try {
        window.ethereum.enable().then(function() {
        });
      } catch (e) {
        // User has denied account access to DApp...
      }
    }
    // Legacy DApp Browsers
    else if (window.web3) {
      web3 = new Web3(web3.currentProvider);
    }
    // Non-DApp Browsers
    else {
      alert("You have to install MetaMask !");
    }
    window.ethereum.enable();
    console.log(" typoe of = ", typeof web3);
    let web3Provider;
    if (typeof web3 != "undefined") {
       web3Provider = web3.currentProvider;
      window.ethereum.enable();
    } else {
        web3Provider = new Web3.providers.HttpProvider(
        "HTTP://127.0.0.1:7545"
      );
      window.ethereum.enable();
    }
    this.setState({web3});
  }

  async loadBlockchainData() {
    await this.loadWeb3()
    // console.log(this.state.web3);
    const accounts = await this.state.web3.eth.getAccounts();
    console.log(accounts)
    this.setState({ account1:accounts[0], account2:'0x22F901A41c12925cd47e1f34322563F7fc791d0B' })
    if(this.state.contractAddress) {
      await this.loadAsset()
    }
    this.setState({ loading: false })
  }

  constructor(props) {
    super(props)
    this.state = {
      web3:null,
      account1: '',
      account2: '',
      contractAddress: null,
      contract: {},
      name: '',
      custodian: '',
      actions: [],
      loading: true
    }
  }

  async loadAsset() {
    // const web3 = await this.loadWeb3()
    const contract = new this.state.web3.eth.Contract(Asset.abi, this.state.contractAddress)
    const name = await contract.methods.name().call()
    const status = await contract.methods.status().call()
    const custodian = await contract.methods.custodian().call()
    const actions = await contract.getPastEvents('Action', { fromBlock: 0, toBlock: 'latest' } )

    this.setState({
      contract,
      name,
      status,
      custodian,
      actions
    })
  }

  createAsset = async (name) => {
    this.setState({ loading: true })
    // const web3 = await this.loadWeb3()
    const contract = new this.state.web3.eth.Contract(Asset.abi)
    contract.deploy({
      data: Asset.bytecode,
      arguments: [name]
    })
    .send({
      from: this.state.account1
    }).once('receipt', async (receipt) => {
      this.setState({ contractAddress: receipt.contractAddress })
      localStorage.setItem('contractAddress',receipt.contractAddress);
      await this.loadAsset()
      this.setState({ loading: false })
    })
  }

  sendAsset = async (to) => {
    this.setState({ loading: true })
    this.state.contract.methods.send(to).send({
      from: this.state.account1
    }).once('receipt', async (receipt) => {
      await this.loadAsset()
      this.setState({ loading: false })
    })
  }

  receiveAsset = async () => {
    const from = '0xBe39332a6d3c17B412B2A231Ae0eAe695Ea4020F';
    this.setState({ loading: true })
    this.state.contract.methods.receive(from).send({
      from: this.state.account2
    }).once('receipt', async (receipt) => {
      await this.loadAsset()
      this.setState({ loading: false })
    })
  }

  renderContent() {
    if(this.state.loading) {
      return(
        <div id='loader' className='text-center'>
          <p className='text-center'>Loading...</p>
        </div>
      )
    }
    const contractAddress = localStorage.getItem('contractAddress');
    console.log(contractAddress);
    // const name =
    if(this.state.contractAddress) {
      return(
        <Main
          name={this.state.name}
          custodian={this.state.custodian}
          status={this.state.status}
          contractAddress={contractAddress}
          actions={this.state.actions}
          receiveAsset={this.receiveAsset}
          sendAsset={this.sendAsset}
        />
      )
    } else {
      return(
        <Form
          createAsset={this.createAsset}
        />
      ) 
    }
  }

  render() {
    return (
      <div className="text-monospace">
        <Navbar account={this.state.account} />
        <div className='container-fluid mt-5'>
          <div className='row'>
            <main role='main' className="col-lg-12 ml-auto mr-auto">
              {this.renderContent()}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;