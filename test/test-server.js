const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_DATABASE_URL } = require('../config');
const { runServer, app, closeServer } = require('../server');


//for every test we want to:
//  1: start test server
//  2: seed databases
//  3: do the testing
//  4: drop database
//  5: repeat until tests are all done
//  6: close server

