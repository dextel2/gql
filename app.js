const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const Event = require('./models/events');

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

		  input EventInput {
		  	  title : String!
			  description : String!
			  price : Float!
			  date : String!
		  }

		  type RootQuery {
			  events: [Event!]!
		  }
  
		  type RootMutation {
			  createEvent(eventInput : EventInput!): Event
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
			}
		},
		graphiql: true,
		pretty: true
	})
);


