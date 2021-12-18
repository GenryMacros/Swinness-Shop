const express = require('express');
const multer = require('multer');
const uuid = require('uuid').v4;
const mysql = require('mysql')
const Web3 = require('web3');
let contract_address = "0x9Ee35220f81B2cBC81C221F484910587158870cE"
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
        let id = req.query.id;
        if (id === undefined) {
            console.log("Wrong params");
        } else if(await contract.methods.exists(id).call()) {
            const { originalname } = file;
            console.log(req.body);
            let file_name = `${uuid()}-${originalname}`
            let tokenID = 0
            cb(null, file_name);
            let query = 'INSERT INTO Games(File, TokenID) VALUES (\'' + `${file_name}` + '\',' + tokenID + ')';
            connection.connect();
            connection.query(query, function(err, rows, fields) {
                if (err) {
                    console.log(err);
                }
            });
            connection.end();
        } else {
            console.log("No token with given id");
        }
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
    let tokenID = req.query.id;
    let query = 'SELECT File FROM Games WHERE TokenID=' + tokenID;
    let fileName = await (new Promise((resolve,reject) => {
        connection.query(query, function (err, rows, fields) {
            resolve(rows[0].File);
        });
    }))
    return res.json({ status: 'OK', fileName: fileName });
})

app.listen(3002, () => console.log('Server listening'));