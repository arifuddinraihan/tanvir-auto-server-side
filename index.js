const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// middle Ware
app.use(cors());
app.use(express.json());

require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tsvgbta.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const serviceCollection = client.db('tanvirAutosDB').collection('services')
        const orderCollection = client.db('tanvirAutosDB').collection('orders')
        app.get( '/services' , async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })

        app.get( '/services/:id' , async (req , res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })

        app.get( '/orders' , async (req, res) => {
            let query = {}
            if(req.query.email){
                // make an email filter via-query 
                query = {
                    email : req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const order = await cursor.toArray()
            res.send(order)
        })

        app.post('/orders' , async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })

    }
    finally{

    }
}

run().catch(err => console.error(err))


app.get('/' , (req, res) => {
    res.send('Tanvir Autos Server Running')
})

app.listen( port, () => {
    console.log(`Tanvir Auto server running on port: ${port}`)
})