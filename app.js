import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import bcrypt from "bcryptjs";
import Event from "./models/eventModel.js";
import User from "./models/userModel.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  "/graphql",
  graphqlHTTP({
    schema: buildSchema(`
        type Event {
          _id: ID!
          title: String!
          description: String!
          price: Float!
          date: String!
          creator: User!
        }
        type User {
          _id: ID!
          email: String!
          password: String,
          createdEvents: [Event!]
        }
        type RootQuery {
            events: [Event!]!
        } 
        input EventInput {
          title: String!
          description: String!
          price: Float!
          date: String!
        }
        input UserInput {
          email: String!
          password: String!
        }
        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        } 
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
      events: (args) => {
        return Event.find({})
          .then((events) => {
            return events.map((event) => {
              return { ...event._doc };
            });
          })
          .catch((err) => {
            console.log(err);
            throw err;
          });
      },
      createEvent: (args) => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
        });
        return event
          .save()
          .then((res) => {
            return { ...res._doc };
          })
          .catch((err) => {
            console.log(err);
            throw err;
          });
      },
      createUser: (args) => {
        return User.findOne({ email: args.userInput.email })
          .then((user) => {
            if (user) {
              throw new Error("Email is already in use");
            }
            return bcrypt.hash(args.userInput.password, 12);
          })

          .then((hashedPassword) => {
            const user = new User({
              email: args.userInput.email,
              password: hashedPassword,
            });
            return user.save();
          })
          .then((res) => {
            return { ...res._doc, password: undefined };
          })
          .catch((err) => {
            throw err;
            console.log(err);
          });
      },
    },
    graphiql: true,
  })
);

export default app;
