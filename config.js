'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://user1:password1@ds125872.mlab.com:25872/blog-posts';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/blog-app';
exports.PORT = process.env.PORT || 8080;