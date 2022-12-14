//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-carlos:F5GVZgq8iQbeMcBa@cluster0.lawucto.mongodb.net/todolistDB", { useNewUrlParser: true });

// Create new Schema

const itemsSchema = {
  name: String
};


// Create new Mongoose model based on the Schema
// Mongoose models are awlways capitalized (Item), the first parameter is the singular name of the things in the collection as a string ("Item") , then the Shchema.

const Item = mongoose.model("Item", itemsSchema);

// Create new documents for the database

const milk = new Item({
  name: "Buy milk"
});

const dog = new Item({
  name: "Walk the dog"
});

const clean = new Item({
  name: "Clean the toilet"
});

//Insert the new Items into an array

const defaultItems = [milk, dog, clean];

// Create new Schema for the cuto web addresses and pages

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

// Find items in the DB and render them 

app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {

      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added to the database.");
        }
      });

      res.redirect("/");

    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }

  });

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function (req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully removed from the database");
        res.redirect("/");
      }
    });
  } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if (!err) {
          res.redirect("/" + listName);
        }
      });
  }

});

// Create custom addresses and pages for each address

app.get("/:customListName", function (req, res) {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();

      res.redirect("/" + customListName);

    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
    }
  });

});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started successfully");
});
