const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const jwt=require('jsonwebtoken');
const e = require('express');
const port = process.env.PORT || 5000
app.use(cors())
app.use(express.json())
require('dotenv').config()
app.get('/', (req, res) => {
  res.send('Doctor on the way..')
})

// VerifyJwt
const VerifyJwt=(req,res,next)=>{
  const Authorization=req.headers.authorization 
  if(!Authorization){
    return res.status(401).send({error:true,message:'unauthorized access'})
  }
  const token=Authorization.split(' ')[1]
  jwt.verify(token,process.env.VITE_JWT,(error,decoded)=>{
    if(error){
      return res.status(401).send({error:true,message:'unauthorized access'})
    }
    req.decoded=decoded
    next()
  })
}


const uri = `mongodb+srv://${process.env.VITE_USER}:${process.env.VITE_PASS}@cluster0.ctx1etf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const Doctor = client.db('TEETH-DOCTOR').collection('doctor')
    const services = client.db('TEETH-DOCTOR').collection('services')
    const reviews = client.db('TEETH-DOCTOR').collection('reviews')
    const appointment = client.db('TEETH-DOCTOR').collection('appointment')
    const user = client.db('TEETH-DOCTOR').collection('user')
    // Send a ping to confirm a successful connection

    // getting doctor data
    app.get('/doctor', async (req, res) => {
      const result = await Doctor.find().toArray()
      res.send(result)
    })
    // getting services data
    app.get('/services', async (req, res) => {
      const result = await services.find().toArray()
      res.send(result)
    })
    // create jwt 
    app.post('/jwt',async(req,res)=>{
      const user=req.body
      const token= jwt.sign(user,process.env.VITE_JWT,{expiresIn:'1d'})
      res.send(token)
    })
    //get reviews data
    app.get('/reviews', async (req, res) => {
      const result = await reviews.find().toArray()
      res.send(result)
    })

    // added appointment 
    app.post('/Patients', async (req, res) => {
      const data = req.body
      const result = await appointment.insertOne(data)
      res.send(result)
    })

    app.post('/user', async (req, res) => {
      const data = req.body
      const result = await user.insertOne(data)
      res.send(result)
    })
    //get all user
    app.get('/users',VerifyJwt, async (req, res) => {
      const result = await user.find().toArray()
      res.send(result)
    })
    // get a single user by email
    app.get('/user/:email',async(req,res)=>{
      const email=req.params.email 
      const query={email:email}
      const result=await user.findOne(query)
      res.send(result)
    })

    // make user to admin
    app.patch('/user/admin/:id',async(req,res)=>{
      const id=req.params.id 
      const filter={_id:new ObjectId(id)}
      const update={
        $set:{
          role:'admin'
        }
      }
      const result =await user.updateOne(filter,update)
      res.send(result)
    })

    // get admin user
    app.get('/user/admin/:email', VerifyJwt,async(req,res)=>{
      const email=req.params.email
      if(req.decoded.email!==email){
         res.send({admin:false})
      }
      const query={email:email}
      const user=await user.findOne(query)
      const result={admin:user?.role==='admin'}
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port)


