const app = require('express')();
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const {ObjectId} = require('mongodb');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const formidable = require('formidable');
const cloudinary = require('cloudinary').v2;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('server running')
})

const uri = `mongodb+srv://${process.env.MONGOUSER}:${process.env.MONGOPASS}@cluster0.bgcjjxf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
    const db = client.db("doctorsportal");
    const servicesCollection = db.collection("services");
    const alluser = db.collection("alluser");
    const appointments = db.collection("appointments");
    const bookings = db.collection("bookings");


    app.post('/addnewservices', (req, res) => {
        const serv = req.body.service;
        const _id = uuidv4();
      servicesCollection.find({service: serv})
      .toArray((err,document) => {
        if (document.length > 0) {
            res.send('Already exists');
        }else{
            servicesCollection.insertOne({_id,serv})
            .then(mres => {
                res.send(mres.acknowledged);
            })
        }
      })
    })
    
    // Fetch services
    app.get('/services',(req,res) => {
        servicesCollection.find({})
        .toArray((err,documents) => {
            if (!err && documents.length > 0) {
                res.send(documents);
            }else{
                res.send('No services found');
            }
        })
    })

    // Googlge login user store
    app.post('/googleloginstoreuser',(req,res) => {
        const user = req.body;
        const userObj = {
            _id : user.uid,
            role : 'user',
            email : user.email,
            password : '',
            name : user.displayName,
            avatar : user.photoURL,
        }
        alluser.find({email: user.email})
        .toArray((err,documents) => {
            if (documents.length > 0) {
                res.send(documents);
            }else{
                alluser.insertOne(userObj)
                .then(insertRes => {
                    if (insertRes.acknowledged) {
                        alluser.find({email: user.email})
                        .toArray((uploaderr,uploadedDocuments) => {
                            if (!err) {
                                res.send(uploadedDocuments)
                            }else{
                                console.log(uploaderr)
                            }
                        })
                    }else{
                        console.log('user insert failed');
                    }
                })
                .catch(err => res.send(err));
            }
        })
    })

    //Create Custom user
    app.post('/createuser',(req,res) => {
        const form = formidable({ multiples: true });

        form.parse(req, (err, fields, files) => {
          if (err) {
            next(err);
            return;
          }
          const config = {
            cloud_name: "mdashik",
            api_key: '696353722392268',
            api_secret: '-G95X5cg0BZ0n85OpVbw-85TOxo',
            secure: true
          }
          
          alluser.find({email : fields.email})
          .toArray((err,documents) => {
            if (documents?.length > 0) {
                res.send(`Already exists ${fields.email} email`);
            }else{
                if (files.image) {
                  cloudinary.uploader.upload(files.image.filepath,config,)
                  .then(cloudinaryres => {
                      const profileURl = cloudinaryres.url;
                      if (profileURl) {
                          const userObj = {
                              _id : uuidv4(),
                              role : 'user',
                              email : fields.email,
                              password : fields.password,
                              name : fields.name,
                              services:'',
                              avatar : profileURl,
                          }
                          alluser.insertOne(userObj)
                          .then(userCreatedres => {
                              if (userCreatedres.acknowledged) {
                                  alluser.find({email: fields.email})
                                  .toArray((err,findDocuments) => {
                                      if (!err) {
                                          res.send(findDocuments);
                                      }else{
                                          console.log(err);
                                      }
                                  })
                              }
                          })
                          .catch(err => res.send(err.message))
                      }
                  })
                  .catch(err => console.log(err));
      
                }else{
                  const userObj = {
                      _id : uuidv4(),
                      role : 'user',
                      email : fields.email,
                      password : fields.password,
                      name : fields.name,
                      services:'',
                      avatar : 'https://cdn2.iconfinder.com/data/icons/avatars-99/62/avatar-370-456322-512.png',
                  }
                      alluser.insertOne(userObj)
                      .then(userCreatedres => {
                          if (userCreatedres.acknowledged) {
                              alluser.find({email: fields.email})
                              .toArray((err,findDocuments) => {
                                  if (!err) {
                                      res.send(findDocuments);
                                  }else{
                                      console.log(err);
                                  }
                              })
                          }
                      })
                      .catch(err => res.send(err.message))
                }
            }
          })
        });

    })

    //Update user
    app.post('/updateuser',(req,res) => {
        const form = formidable({ multiples: true });

        form.parse(req, (err, fields, files) => {
          if (err) {
            next(err);
            return;
          }
          const config = {
            cloud_name: "mdashik",
            api_key: '696353722392268',
            api_secret: '-G95X5cg0BZ0n85OpVbw-85TOxo',
            secure: true
          }
          
          if (files.image) {
            cloudinary.uploader.upload(files.image.filepath,config,)
            .then(cloudinaryres => {
                const profileURl = cloudinaryres.url;
                if (profileURl) {
                    alluser.updateOne({email : fields.email, password : fields.password},{$set : {email : fields.email, password : fields.password,name : fields.name,avatar: profileURl}})
                    .then(ures => {
                        if (ures.acknowledged === true) {
                            alluser.find({email : fields.email})
                            .toArray((err,documents) => {
                                if (!err) {
                                    res.send(documents);
                                }else{
                                    console.log(err);
                                }
                            })
                        }else{
                            console.log(ures);
                        }
                    })
                    .catch(err => res.send(err.message))
                }
            })
            .catch(err => console.log(err));

          }else{

              alluser.updateOne({email : fields.email, password : fields.password},{$set : {email : fields.email, password : fields.password,name : fields.name,avatar: profileURl}})
              then(ures => {
                if (ures.acknowledged === true) {
                    alluser.find({email : fields.email})
                    .toArray((err,documents) => {
                        if (!err) {
                            res.send(documents);
                        }else{
                            console.log(err);
                        }
                    })
                }else{
                    console.log(ures);
                }
              })
              .catch(err => res.send(err.message))
          }

        });

    })

    //Login user
    app.post('/loginuser',(req,res) => {
        alluser.find({email : req.body.email , password : req.body.password})
        .toArray((err,documents) => {
            if(documents?.length > 0){
                res.send(documents);
            }else{
                res.send('invalid email or password!');
            }
        })
    })

    //Get all users
    app.get('/getallusers',(req,res) => {
        alluser.find({})
        .toArray((err,documents) => {
            if (!err) {
                res.send(documents);
            }
        })
    })

    //Get all doctors
    app.get('/getalldoctors',(req,res) => {
        alluser.find({role : 'doctor'})
        .toArray((err,documents) => {
            if (!err) {
                res.send(documents);
            }
        })
    })

    //Change Role
    app.post('/changerole',(req,res) => {
        alluser.updateOne({_id:req.body.id},{$set: {role: req.body.role}})
        .then(ures => {
            res.send('Updated successfully');
        })
        .catch(err => res.send(err.message));

    })

    //Role Update Request
    app.post('/roleupdaterequest',(req,res) => {
        const role = req.body.getrole;
        const id = req.body.usrId
        
        alluser.updateOne({_id:id},{$set: {role: role}})
        .then(ures => {
            res.send(ures.acknowledged);
        })
        .catch(err => res.send(err.message));
    })

    //All services
    app.get('/allservices',(req,res) => {
        servicesCollection.find({})
        .toArray((err,documents) => {
            if(!err){
                res.send(documents);
            }else{
                res.send(err.message);
            }
        })
    })

    //Udate Speciality
    app.post('/updatespeciality',(req,res) => {
        alluser.updateOne({_id:req.body.id , name:req.body.name},{ $set: {services: req.body.specialist,role:'doctor'}})
        .then(ures => {
            res.send(ures.acknowledged)
        })
        .catch(err => res.send(err.message));
    })

    //Add New Appointment
    app.post('/addnewappointment',(req,res) => {
        appointments.insertOne(req.body)
        .then(ures => {
            res.send(ures.acknowledged)
        })
        .catch(err => res.send(err.message));
    })

    //currenusertAppointments
    app.post('/currenusertappointments',(req,res) => {
        appointments.find({user:req.body.user})
        .toArray((err,documents) => {
            if (!err) {
                res.send(documents);
            }else{
                res.send(err.message);
            }
        })
    });

    //Fetch Appointments
    app.get('/appointments/:ctName',(req,res) => {
        appointments.find({Speciality : req.params.ctName})
        .toArray((err,documents) => {
            if (!err) {
                res.send(documents);
            }else{
                res.send(err)
            }
        })
    })

    //Find User With id
    app.post('/finduserbyId',(req,res) => {
        alluser.find({_id : req.body.id})
        .toArray((err,documents) => {
            if (!err) {
                res.send(documents)
            }else{
                console.log(err)
            }
        })
    })

    //Delete Appointment By Id
    app.post('/deleteAppointmentById',(req,res) => {
        const id = req.body.id;
        appointments.deleteOne({_id:ObjectId(id)})
        .then(dres => {
            res.send(dres.acknowledged);
        })
        .catch(err => res.send(err.message))
    })

    //Add Appointment
    app.post('/addAppointment',(req,res) => {
        console.log(req.body)
        
        bookings.find({user:req.body.user,speciality : req.body.speciality,datefrom:req.body.datefrom,dateto : req.body.dateto})
        .toArray((err,documents) => {
            if (documents?.length > 0) {
                res.send('Already booked this appointment');
            }else{
                bookings.insertOne(req.body)
                .then(ares => {
                    res.send(ares.acknowledged)
                })
                .catch(err => res.send(err.message))
            }
        })
    })

    //Get Current User Bookings
    app.get('/getcurrentUserBookings/:userId',(req,res) => {
        const userId = req.params.userId;
        bookings.find({user:userId})
        .toArray((err,documents) => {
            if (!err) {
                res.send(documents)
            }else{
                res.send(err.message)
            }
        })
    })

    //Get Current User Bookings
    app.post('/getcurrentuserbookings',(req,res) => {
        const userId = req.body.id;
        bookings.find({doctor:`${userId}`})
        .toArray((err,documents) => {
            if (!err) {
                res.send(documents)
            }else{
                res.send(err.message)
            }
        })
    })

    console.log('mongodb connected');
});


app.listen(3001,() => {
    console.log('server listening on port 3001');
})
