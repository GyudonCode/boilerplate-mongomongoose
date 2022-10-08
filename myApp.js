require('dotenv').config();
let mongoose = require('mongoose');

//connection to mongoDB
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

//variable Schema to make the code cleaner, othercase we would use
//mongoose.Schema.* all the time, that's ugly.
const Schema = mongoose.Schema;

//-----------------------------------------------------

//declaration of our schema, this define the object we're gonna use
//to store our data
//It's simple, it's a person with an string as name that's required and a bunch of other data that's optional.
//[String] means it's an array of strings
const personSchema = new Schema({
  name: { type: String, required: true },
  age: Number,
  favoriteFoods: [String]
});

//this creates a model using our schema as reference
//a model is what we're gonna use as interface (class) to make changes
//This has a 1 to 1 relation with each registry (documents in mongo env)
let Person = mongoose.model("Person", personSchema);


const createAndSavePerson = (done) => {
  //just a constructor using the model we created before
  //load it with your data and is ready to be send
  let john = new Person({
    name: "John G",
    age: 30, 
    favoriteFoods: ["pasta", "fries", "burgers"]
  });

  //this does the insert, it takes as argument a function to define
  //how to handle errors and what to do when the insert is OK
  john.save(function(err, data) {
    //if there's any error log the error in the console
    if (err) return console.error(err);
    done(null, data)
    //done is a callback that signal we can proceed after any CRUD operation
    //It's the green light after any asynchronous task like the save
  });
};

//---------------------------------------------------

//creating an array of object as test data
//IRL i guess this comes from a json or a file
let arrayOfPeople = [
  {name: "jimmy", age: 30, favoriteFoods: ["burgers"]},
  {name: "john", age: 24, favoriteFoods: ["fries"]},
  {name: "jay", age: 28, favoriteFoods: ["avocado eww"]}
];

//This is the handler takes our array and a callback
const createManyPeople = (arrayOfPeople, done) => {
  //Person is our model
  //create() takes the array to insert and a function to
  //handle if the insert went ok or not
  Person.create(arrayOfPeople, function(err, data) {
    if (err) return console.error(err);
    done(null, data);
  });
};

//----------------------------------------------------

//pass a name and it will find it in the cluster
const findPeopleByName = (personName, done) => {
  //model.find requires a json object with the stuff to
  //search for and a function to handle the result of the
  //asynchronous task
  //In this example, mongo will return an array with the
  //documents he find using the name we passed, it's in
  //the variable data
  Person.find({name: personName}, function(err, data){
    if(err) return console.error(err);
    done(null, data);  
  });
};

//----------------------------------------------------

//findOne does the same than find but instead returning an array of all the 
//results matching the query it will only return one single document.
//Useful when searching for fields that are unique, like email or id
const findOneByFood = (food, done) => {
  Person.findOne({favoriteFoods: food}, function(err, data){
    if(err) return console.error(err);
    done(null, data);
  });
};

//----------------------------------------------------------

//MongoDB automatically creates and manage id's for your documents(registries)
//since it's common to search by id, it has it's own method to do so
//no need to use json objects or nothing, just slap the id and mongo will do magic
const findPersonById = (personId, done) => {
  Person.findById(personId, function(err, data){
    if(err) return console.error(err);
    done(null, data);
  });
};

//------------------------------------------------------------

//we updating a document here, but instead of using model.update()
// we're gonna find edit and save the document.
//The reason, because we don't use mongoose update is because it doesn't
//send back the document, only an status message and that makes harder to
//validate our data.
const findEditThenSave = (personId, done) => {
  const foodToAdd = "hamburger";

  //finding the document using id and instead doing done(null, data)
  //this time we modify data (our person) and save it, note we using data
  // the same one we found in db.
  //then we just manage the errors and produce updatedData, the same registry
  //but with the edits we did
  Person.findById(personId, function(err, data){
    if(err) return console.error(err);
    //done(null, data);

    data.favoriteFoods.push(foodToAdd);
    
    data.save(function(err, updatedData){
      if(err) return console.error(err);
      done(null, updatedData);
    });
  });
};

//----------------------------------------------------------------

//This is very similar to the previous one
//find by name then update and save, so find and update stuff
const findAndUpdate = (personName, done) => {
  const ageToSet = 20;

  //feed a json object to findOne so it finds the document with the right name
  Person.findOne({name: personName}, function(err, data){
    if (err) return console.error(err);

    //once we got the data, we edit the part we need to
    data.age = ageToSet;

    //and then store the data in db with the changes
    //handling errors and success as always
    data.save(function(err, updatedData){
      if (err) return console.error(err);
      done(null, updatedData);
    });
  });
};

//------------------------------------------------------------------

//simple, find a document and remove it from DB
const removeById = (personId, done) => {
  //alternatively you could use findOneAndRemove, up to you
  //Person.findOneAndRemove({ id: personId }, function(err, data){
  Person.findByIdAndRemove(personId, function(err, data){
    if(err) return console.error(err);
    done(null, data);
  });
};

//-------------------------------------------------------------------

const removeManyPeople = (done) => {
  const nameToRemove = "Mary";

  Person.remove({ name: nameToRemove }, function(err, data){
    if (err) return console.error(err);
    done(null, data);
  });
};

//-------------------------------------------------------------------

//We can limit, sort and narrow a search, after we do any find, we can filter
//the data using query helpers
const queryChain = (done) => {
  const foodToSearch = "burrito";

//Normally we would do this:
//Person.find({ favoriteFoods: foodToSearch }, function(err, data)){
//But doing that our query will be executed at the moment, giving no time to
//filter our data, instead, we can use exec() later, to execute the query, after
//we have the filters we need. Remember to not put function(err, data) when
//using exec() or it will not work.
  Person.find({ favoriteFoods: foodToSearch })
    .sort({ name: 1 })  //1 is ascendant order, -1 descendant order
    .limit(2)           //any integer as row limiter  
    .select({ age: 0 }) //a field with a 0 means that field is hidden
    .exec(function(err, data) {
      if(err) return console.error(err);
      done(null, data);
  });
};
//.sort .limit .select are query helpers, there's many of these.
//sort dictates if the data is presented in ascendent or descent order.
//limit says how many documents(rows) we show when displaying the data.
//select let's you choose which fields are shown and which ones are hidden.

//exec triggers the query, it's like sending it to db, after that handle errors
//like any other call we did before

//------------------------------------------------------------------

/** **Well Done !!**
/* You completed these challenges, let's go celebrate !
 */

//----- **DO NOT EDIT BELOW THIS LINE** ----------------------------------

exports.PersonModel = Person;
exports.createAndSavePerson = createAndSavePerson;
exports.findPeopleByName = findPeopleByName;
exports.findOneByFood = findOneByFood;
exports.findPersonById = findPersonById;
exports.findEditThenSave = findEditThenSave;
exports.findAndUpdate = findAndUpdate;
exports.createManyPeople = createManyPeople;
exports.removeById = removeById;
exports.removeManyPeople = removeManyPeople;
exports.queryChain = queryChain;
