const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Event = require('./models/events');
const User = require('./models/user');
const app = express();

app.use(bodyParser.json());

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.mkaewnx.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority&appName=Cluster0`)
	.then(() => {
		app.listen(1337);
	})
	.catch((err) => {
		console.log(err);
	});



app.use(
	'/graphql',
	graphqlHTTP({
		schema: buildSchema(`
		  type Event {
			  _id :ID!
			  title : String!
			  description : String!
			  price : Float!
			  date : String!
		  }

		  type User {
			_id : ID!
			email : String!
			password : String
		  }

		  input EventInput {
		  	  title : String!
			  description : String!
			  price : Float!
			  date : String!
		  }
		
		  input UserInput {
		  	email : String!
			password : String!
		  }

		  type RootQuery {
			  events: [Event!]!
		  }
  
		  type RootMutation {
			  createEvent(eventInput : EventInput!): Event
			  createUser(userInput : UserInput!): User
		  }
  
		  schema {
			  query: RootQuery
			  mutation: RootMutation
		  }
	  `),
		rootValue: {
			events: async () => {
				try {
					const events = await Event
						.find();
					return events.map(e => {
						return { ...e.toObject() };
					});
				} catch (err) {
					console.log(err);
					throw new Error(err);
				}
			},
			createEvent: async (args) => {
				const event = new Event({
					title: args.eventInput.title,
					description: args.eventInput.description,
					price: +args.eventInput.price,
					date: new Date(args.eventInput.date)
				});
				try {
					const res = await event.save();
					return {
						...res._doc
					};
				} catch (err) {
					console.log(err);
					throw new Error(err);
				}
			},
			createUser: args => {
				return bcrypt.hash(args.userInput.password, 12).then((hashedPassword) => {
					const user = new User({
						email: args.userInput.email,
						password: hashedPassword
					});

					const res = user.save();
					return res;
				})
					.then((result) => {
						return {
							...result._doc,
							id: result.id
						};
					})
					.catch((err) => {
						throw err;
					});
			}
		},
		graphiql: true,
		pretty: true
	})
);


