// Uncomment the following to see STDERR of the server
process.env.NODE_ENV = "dev";

/*
This file and its output is hidden and can be used to
test edge cases, random tests and other such requirements
*/

const request = require("supertest");
const {createServer} = require("../src/server");
const controller = require("../src/sciences/sciences.controller.js")

describe("server", () => {
  let knex;
  let server;
  let app;
  
  beforeAll(() => {
    knex = require("knex")({
      client: "pg",
      connection: "postgresql://postgres@localhost",
    });
  });
  beforeEach(done => {
    server = createServer(knex);
    app = server.app;
    knex
      .schema
      .dropTableIfExists("scientists")
      .dropTableIfExists("sciences")
      .then(() => 
        knex.schema.createTable("sciences", table => {
          table.increments("id");
          table.string("name");
          table.string("description");
        })
      )
      .then(() => knex("sciences").insert([{
        name: "Chemistry",
        description: "The study of properties and behaviours of substances"
      }, {
        name: "Biology",
        description: "The study of life"
      },
      {
        name: "Archeology",
        description: "The study of human material remains"
      },
      {
        name: "Mathematics",
        description: "The study of magnitude, number, and forms"
      },
      {
        name: "Computer Science",
        description: "The study of processes that interact with data"
      }]))
    .then(() => knex
         .schema
         .createTable("scientists", table => {
      table.increments("id");
      table.string("first_name");
      table.string("last_name");
      table.integer("born");
      table.integer("died");
      table.integer("science");
      table.foreign('science').references('id').inTable('sciences');
    }))
    .then(() => knex("scientists")
         .insert([{
           first_name:"Dorothy",
           last_name:"Bate",
           born: 1878,
           died: 1951,
           science: 3
         },
         {
           first_name:"Alice",
           last_name:"Ball",
           born: 1892,
           died: 1916,
           science: 1
         },
         {
           first_name:"Michoyo",
           last_name:"Tsujimura",
           born: 1888,
           died: 1969,
           science: 1
         },
         {
           first_name:"Grace",
           last_name:"Hopper",
           born: 1906,
           died: 1992,
           science: 5
         }]))
      .then(() => done())
      .catch(err => done(err));
  });
  afterEach(done => server.close(done));
  afterAll(() => knex.destroy());
  
  it("should get science 'Chemistry'", done => {
    request(app)
      .get("/sciences/1")
      .then(response => {
        expect(response.status).toEqual(200);
        expect(response.body).toBeInstanceOf(Object);
        expect(response.body.name).toEqual("Chemistry");
        done();
      })
      .catch(err => done(err));
  });
  
  it("should get 404 if given scienceId  does not exist", done => {
    request(app)
      .get("/sciences/100")
      .then(response => {
        expect(response.status).toEqual(404);
        expect(response.body).toBeInstanceOf(Object);
        expect(response.body.error).toEqual("Science id not found: 100");
        done();
      })
      .catch(err => done(err));
  });
  
  it("should get a list of sciences", done => {
    request(app)
      .get("/sciences")
      .then(response => {
          expect(response.status).toEqual(200);
          expect(response.body).toBeInstanceOf(Array);
          expect(response.body.length).toBeGreaterThan(0);
          done();
      })
      .catch(err => done(err))
  }) 
  
    it("should get a list of scientists for a given science", done => {
    request(app)
      .get("/sciences/1/scientists")
      .then(response => {
          expect(response.status).toEqual(200);
          expect(response.body).toBeInstanceOf(Array);
          expect(response.body.length).toBeGreaterThan(0);
          done();
      })
      .catch(err => done(err))
  })
  
  it("should get 404 if given scienceId  does not exist when requesting scientists", done => {
    request(app)
      .get("/sciences/100/scientists")
      .then(response => {
        expect(response.status).toEqual(404);
        expect(response.body).toBeInstanceOf(Object);
        expect(response.body.error).toEqual("Science id not found: 100");
        done();
      })
      .catch(err => done(err));
  });
  
  it("should update an existing science name", done => {
    request(app)
      .patch("/sciences/1")
      .send({name: "Bio Chemistry"})
      .then(response => {
        expect(response.status).toEqual(200);
        expect(response.body).toBeInstanceOf(Array);
        const [updated, _] = response.body;
        expect(updated.name).toEqual("Bio Chemistry");
        expect(updated.description).toEqual("The study of properties and behaviours of substances");
      done();
      })
      .catch(err => done(err));
  })
  
  it("should respond with 400 if name is not provided to update", done => {
    request(app)
      .patch("/sciences/1")
      .send({Not_name: "Bio Chemistry"})
      .then(response => {
        expect(response.status).toEqual(400);
        expect(response.body.error).toEqual("A 'name' property is required");
        done();
      })
      .catch(err => done(err));
  })
  
  it("should get 404 if given scienceId  does not exist when updating", done => {
    request(app)
      .patch("/sciences/100")
      .send({Not_name: "Bio Chemistry"})
      .then(response => {
        expect(response.status).toEqual(404);
        expect(response.body).toBeInstanceOf(Object);
        expect(response.body.error).toEqual("Science id not found: 100");
        done();
      })
      .catch(err => done(err));
  });
  
  it("should add a new science to the database", done => {
    request(app)
      .post("/sciences")
      .send({name: "Rocket Science", description: "It actually is rocket science"})
      .then(response => {
        expect(response.status).toEqual(201);
        expect(response.body).toBeInstanceOf(Object);
        const [science, _] = response.body;
        expect(science.name).toEqual("Rocket Science");
        expect(science.description).toEqual("It actually is rocket science");
      done();
      })
      .catch(err => done(err));
  })
  
  it("should respond with 400 if name is not provided to create", done => {
    request(app)
      .post("/sciences")
      .send({Not_name: "Rocket Science", description: "It actually is rocket science"})
      .then(response => {
        expect(response.status).toEqual(400);
        expect(response.body.error).toEqual("A 'name' property is required");
        done();
      })
      .catch(err => done(err));
  })
  
    it("should respond with 400 if description is not provided to create", done => {
    request(app)
      .post("/sciences")
      .send({name: "Rocket Science", not_description: "It actually is rocket science"})
      .then(response => {
        expect(response.status).toEqual(400);
        expect(response.body.error).toEqual("A 'description' property is required");
        done();
      })
      .catch(err => done(err));
  })
});

describe("controller", () => {
   it("should have update function", () => {
     expect(controller.update).toBeDefined();
   })
  it("should have list function", () => {
     expect(controller.list).toBeDefined();
   })
  it("should have read function", () => {
     expect(controller.read).toBeDefined();
   })
  it("should have create function", () => {
     expect(controller.create).toBeDefined();
   })
    it("should have listScientists function", () => {
     expect(controller.listScientists).toBeDefined();
   })
})