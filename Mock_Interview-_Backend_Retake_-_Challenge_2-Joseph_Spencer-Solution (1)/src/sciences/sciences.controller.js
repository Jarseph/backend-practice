const list = (req, res) => {
       const knex = req.app.get("db");
       return knex
         .from("sciences")
         .then(sciences => sciences ? res.json(sciences)
                         : res.sendStatus(404))
         .catch(err => res.sendStatus(500)) 
   };


const listScientists = (req, res) => {
  const { scienceId } = req.params;
  const knex = req.app.get("db");
  
  return knex
    .from("scientists")
    .where({science: scienceId})
    .then(scientists => scientists ? res.json(scientists)
                         : res.sendStatus(404))
         .catch(err => res.sendStatus(500)) 
};

const bodyHasNameProperty = (req, res, next) => {
  const { name } = req.body;
  
  if(name) {
    return next();
  } 
  next({
    status: 400,
    message: "A 'name' property is required"
  });
}

const bodyHasDescriptionProperty = (req, res, next) => {
  const { description } = req.body;
  
  if(description) {
    return next();
  } 
  next({
    status: 400,
    message: "A 'description' property is required"
  });
}


const scienceExists = (req, res, next) => {
  const { scienceId } = req.params;
  const knex = req.app.get("db");
  knex
    .table("sciences")
    .where({id: scienceId})
    .first()
    .then(science => {
    if(science) {
      res.locals.science = science;
      return next();
    }
    next({
        status: 404,
        message: `Science id not found: ${scienceId}`
      });
  })          
}

const create = (req, res) => {
  const newScience = {
    name: req.body.name,
    description: req.body.description,
  }
  res.status(201).json([newScience]);
}

const update = (req, res) => {
  const { scienceId } = req.params;
  const knex = req.app.get("db");
  const { name } = req.body;
  
  knex
    .table("sciences")
    .update({ name }, ['id', 'name', 'description'])
    .where({id: scienceId})
    .then((data) => res.json(data))
    .catch(err => res.sendStatus(500));
  
};

const read = (req, res) => {
  const { science } = res.locals;
  res.json(science);
}


module.exports = {
  create: [bodyHasNameProperty, bodyHasDescriptionProperty, create],
  read: [scienceExists, read],
  list,
  listScientists: [scienceExists, listScientists],
  update: [scienceExists, bodyHasNameProperty, update]
};