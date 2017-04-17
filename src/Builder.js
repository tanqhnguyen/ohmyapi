const Route = require('./Route'),
      _ = require('lodash'),
      fs = require('fs'),
      engines = require('./engines'),
      validators = require('./validators');

class Builder {
  constructor(routes) {
    if (!routes) throw new Error('Missing path to load routes');

    if (!fs.lstatSync(routes).isDirectory()) throw new Error(`${routes} is not a directory`);

    this.pathToLoadRoutes = routes;
    this.routes = []; // this will be populated later
  }

  /**
   * engine('express', {}) -> set the engine to express
   * engine(function(routes) {}) -> custom function to build the engine
   */
  engine(name, options = {}) {
    if (_.isFunction(name)) {
      this._engine = () => {
        return name.call(null, this.routes, options);
      };
    } else if (_.isString(name)) {
      const engine = engines[name];
      if (!engine) throw new Error(`Engine ${name} is not found`);

      this._engine = () => {
        return engine.call(null, this.routes, options);
      };
    }

    return this;
  }

  /**
   * validator('default', {}) -> set the validator to default
   * validator(function(values, args, options) {}) -> custom validator
   */
  validator(name, options = {}) {
    if (_.isFunction(name)) {
      this._validator = name;
    } else if (_.isString(name)) {
      const validator = validators[name];

      if (!validator) throw new Error(`Validator ${name} is not found`);

      this._validator = validator;
    }

    return this;
  }

  init() {
    if (!this._engine) {
      this.engine('express', {
        prefix: '/api'
      });
    }

    if (!this._validator) {
      this.validator('default');
    }

    this.routes = Route.loadRoutes(this.pathToLoadRoutes, {
      validate: this._validator
    });

    return this._engine();
  }
}

module.exports = Builder;