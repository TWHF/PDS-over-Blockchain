const Asset = artifacts.require('./Asset.sol')

module.exports = async function(callback) {
  try {
    console.log(Asset.abi, Asset.bytecode)
    const assetContract = new web3.eth.Contract(Asset.abi)
    assetContract.deploy({
      data: Asset.bytecode,
      arguments: ['My Product']
    })
    .send({
      from: '0x0F755452998Ea46ba9B364Ae5076c5cb4e88D7Fa'
    }).on('receipt', (receipt) => {
      console.log(receipt.contractAddress) // contains the new contract address
    })
  }
  catch(error) {
    console.log(error)
  }

  callback()
}