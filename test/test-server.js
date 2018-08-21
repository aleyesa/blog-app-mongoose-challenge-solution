const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { BlogPost } = require('../models');
const { TEST_DATABASE_URL } = require('../config');
const { runServer, app, closeServer } = require('../server');

const expect = chai.expect;

chai.use(chaiHttp);

function seedBlogPostData() {
  console.info('seeding blog post data');
  const seedData = [];

  for(let i=1; i<=10; i ++) {
    seedData.push(generateBlogPostData());
  }
  return BlogPost.insertMany(seedData);
}

function  generateTitle() {
  const title = [
    'Test1', 'Test2', 'Test3', 'Test4', 'Test5', 'Test6'
  ];

  return title[Math.floor(Math.random() * title.length)];
}

function generateBlogPostData() {
  return {
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    },
    title: generateTitle(),
    content: faker.lorem.text(),
    created: faker.date.recent()
  }
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('Blog Posts API resource', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogPostData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function() {
    it('should return all existing blog posts', function() {
      let res;
      return chai.request(app)
      .get('/posts')
      .then(function(_res) {
        res = _res;
        expect(res).to.have.status(200);
        expect(res.body.blogposts).to.have.lengthOf.at.least(1);
        return BlogPost.count();
      })
      .then(function(count) {
        expect(res.body.blogposts).to.have.lengthOf(count);
      });
    });

    it('should return blog posts with right fields', function() {
      let resBlogPosts;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.blogposts).to.be.a('array');
          expect(res.body.blogposts).to.have.lengthOf.at.least(1);

          res.body.blogposts.forEach(function(blogpost) {
            expect(blogpost).to.be.a('object');
            expect(blogpost).to.include.keys(
              'id', 'author', 'content', 'title', 'created');
          });
          resBlogPosts = res.body.blogposts[0];
          return BlogPost.findById(resBlogPosts.id);
        })
        .then(function(blogpost) {
          expect(resBlogPosts.id).to.equal(blogpost.id);
          expect(resBlogPosts.author).to.equal(blogpost.author.firstName + ' ' + blogpost.author.lastName);
          expect(resBlogPosts.content).to.equal(blogpost.content);
          expect(resBlogPosts.title).to.equal(blogpost.title);
        });
      });

      it('should return a blog post by id', function() {
        let blogpost;

        return BlogPost
          .findOne()
          .then(function(_blogpost) {
            blogpost = _blogpost;
            return chai.request(app).get(`/posts/${blogpost.id}`);
          })
          .then(function(res) {
            expect(res).to.have.status(200);
          });
      });
    });

  describe('POST endpoint', function() {
    it('should create a blog post', function() {
      const newBlogPost = generateBlogPostData();
      let mostRecentGrade;

      return chai.request(app)
        .post('/posts')
        .send(newBlogPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'author', 'content', 'title', 'created');
          expect(res.body.author).to.equal(newBlogPost.author.firstName + ' ' + newBlogPost.author.lastName);
          // cause Mongo should have created id on insertion
          expect(res.body.id).to.not.be.null;
          expect(res.body.content).to.equal(newBlogPost.content);
          expect(res.body.title).to.equal(newBlogPost.title);

          return BlogPost.findById(res.body.id);
        })
        .then(function(blogpost) {

          expect(blogpost.authorName).to.equal(newBlogPost.author.firstName + ' ' + newBlogPost.author.lastName);
          expect(blogpost.content).to.equal(newBlogPost.content);
          expect(blogpost.title).to.equal(newBlogPost.title);
        });
    });
  });

  describe('PUT endpoint', function() {
    it('should update a blog posts by id', function() {
      const updateData = {
        title: 'Da Best Title',
        content: 'The best ever title because...'
      };

      return BlogPost
        .findOne()
        .then(function(blogpost) {
          updateData.id = blogpost.id;

          return chai.request(app)
            .put(`/posts/${blogpost.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return BlogPost.findById(updateData.id);
        })
        .then(function(blogpost) {
          expect(blogpost.title).to.equal(updateData.title);
          expect(blogpost.content).to.equal(updateData.content);
        });
    });
  });

  describe('DELETE endpoint', function() {
    it('should remove a blog posts by id', function() {
      let blogpost;

      return BlogPost
        .findOne()
        .then(function(_blogpost) {
          blogpost = _blogpost;
          return chai.request(app).delete(`/posts/${blogpost.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(blogpost.id);
        })
        .then(function(_blogpost) {
          expect(_blogpost).to.be.null;
        });
    });
  });
});