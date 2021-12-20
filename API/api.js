const express = require('express');
const multer = require('multer');
const uuid = require('uuid').v4;
const mysql = require('mysql')
const Web3 = require('web3');
let contract_address = "0x1EdFdEe1953Ac359419f276463762d00faA3EB03"
let abi = require("./abi.json");

var web3 = new Web3('http://localhost:8545'); // ganache address
let contract = new web3.eth.Contract(abi, contract_address)

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root1234',
    database: 'Shop'
});

connection.connect();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },        
    filename: async (req, file, cb) => {
        let price = 100;
        const mint_price = await contract.methods.mint_price().call()

        try {
            await contract.methods.mint(price).send({from:'0x07a7f563107F275BF15a8C2Dab55A804A1D644ba',value:mint_price,gas:300000})
        } catch(err) {
            console.log(err)
            return;
        }

        let tokenID = await contract.methods.totalSupply().call() - 1
        const { originalname } = file;
        let file_name = `${uuid()}-${originalname}`
        cb(null, file_name);
        let query = 'INSERT INTO Games(File, TokenID) VALUES (\'' + `${file_name}` + '\',' + tokenID + ')';
        connection.query(query, function(err, rows, fields) {
            if (err) {
                 console.log(err);
            }
        });
    }
})
const upload = multer({ storage });

const app = express();
app.use(express.static('public'));
app.use(express.json());

app.post('/upload', upload.single('image'), (req, res) => {
   
    return res.json({ status: 'OK' });
})

app.get('/image', async (req, res) => {
    var tokenID = req.query.id;
    var query = 'SELECT File FROM Games WHERE TokenID=' + tokenID;
    var fileName = await (new Promise((resolve,reject) => {
        connection.query(query, function (err, rows, fields) {
            resolve(rows[0].File);
        });
    }))
    return res.json({ status: 'OK', fileName: fileName });
})

app.post('/buy', async (req, res) => {
    const tokenID = parseInt(req.query.id);
    const tokenPrice = parseInt(await contract.methods.get_token_price(tokenID).call())

    try {
        await contract.methods.buy(tokenID).send({from:'0x07a7f563107F275BF15a8C2Dab55A804A1D644ba',value:tokenPrice,gas:300000})
    } catch(err) {
        console.log(err)
        return res.json({ status: 'ERROR'});
    }
    return res.json({ status: 'OK'});
})

app.get('/bought', async (req, res) => {
    const bought = await contract.methods.getBought().call({from:'0x07a7f563107F275BF15a8C2Dab55A804A1D644ba'})
    console.log(bought)
    return res.json({ status: 'OK', bought: bought });
})

app.get('/minted', async (req, res) => {
    const minted = await contract.methods.getMinted().call({from:'0x07a7f563107F275BF15a8C2Dab55A804A1D644ba'})
    console.log(minted)
    return res.json({ status: 'OK', minted: minted });
})

app.listen(3002, () => console.log('Server listening'));