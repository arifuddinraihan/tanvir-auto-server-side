const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')

const app = express();
const port = process.env.PORT || 5000;

// middle Ware
app.use(cors());
app.use(express.json());

require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tsvgbta.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    // received information from client side
    console.log("Inside orders API with authoraization from Client", req.headers.authoraization)
    const authHeader = req.headers.authoraization
    if (!authHeader) {
        res.status(401).send({ message: "unauthorized access" })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            res.status(401).send({ message: "unauthorized access" })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const serviceCollection = client.db('tanvirAutosDB').collection('services')
        const orderCollection = client.db('tanvirAutosDB').collection('orders')

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
            res.send({ token })
        })

        app.get('/services', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.skip(page * size).limit(size).toArray();
            const count = await serviceCollection.estimatedDocumentCount()
            res.send({ count, services })
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })

        app.get('/orders', verifyJWT, async (req, res) => {
            // received decoded from verifyJWT function
            const decoded = req.decoded;
            console.log("Inside orders API with decoded from req headers", decoded)
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: "unauthorized access" })
            }
            // steps above this line need to be wirte after creating verifyJWT function

            let query = {}
            if (req.query.email) {
                // make an email filter via-query 
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const order = await cursor.toArray()
            res.send(order)
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })

        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: ObjectId(id) };
            // Updated value to set under this variable with value
            const updateDoc = {
                $set: {
                    status: status
                },
            };
            // Need to send quey along with updated doc value to receive via client patch method
            const result = await orderCollection.updateOne(query, updateDoc);
            res.send(result)
        })

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })

    }
    finally {

    }
}

run().catch(err => console.error(err))


app.get('/', (req, res) => {
    res.send('Tanvir Autos Server Running')
})

app.listen(port, () => {
    console.log(`Tanvir Auto server running on port: ${port}`)
})