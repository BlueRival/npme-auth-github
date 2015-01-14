var Lab = require('lab'),
  AuthenticateGithub = require('../authenticator.js'),
  nock = require('nock'),
  fs = require('fs');

Lab.experiment('getAuthorizationToken', function() {
  Lab.it("returns authorization token if username and password are valid", function(done) {
    var authenticateGithub = new AuthenticateGithub({
      githubHost: 'https://github.example.com',
      timestamp: function() {
        return 0;
      }
    });

    var packageApi = nock('https://github.example.com', {
        // we should populate the auth headers with appropriate
        // username and password.
        reqheaders: {
          'authorization': 'Basic YmNvZS10ZXN0OmZvb2Jhcg=='
        }
      })
      .post('/api/v3/authorizations', {
        scopes: ["user","public_repo","repo","repo:status","gist"],
        note: 'npm on premises solution (0)',
        note_url: 'https://www.npmjs.org'
      })
      .reply(200, fs.readFileSync('./test/fixtures/authenticate-success.json'));

    authenticateGithub.getAuthorizationToken('bcoe-test', 'foobar').done(function(token) {
      Lab.expect(token).to.eql('cc84252fd8061b232beb5e345f33b13d120c236c');
      packageApi.done();
      done();
    });
  });

  Lab.it("uses port parsed from githubHost", function(done) {
    var authenticateGithub = new AuthenticateGithub({
      githubHost: 'https://github.example.com:4444',
      timestamp: function() {
        return 0;
      }
    });

    var packageApi = nock('https://github.example.com:4444', {
        // we should populate the auth headers with appropriate
        // username and password.
        reqheaders: {
          'authorization': 'Basic YmNvZS10ZXN0OmZvb2Jhcg=='
        }
      })
      .post('/api/v3/authorizations', {
        scopes: ["user","public_repo","repo","repo:status","gist"],
        note: 'npm on premises solution (0)',
        note_url: 'https://www.npmjs.org'
      })
      .reply(200, fs.readFileSync('./test/fixtures/authenticate-success.json'));

    authenticateGithub.getAuthorizationToken('bcoe-test', 'foobar').done(function(token) {
      Lab.expect(token).to.eql('cc84252fd8061b232beb5e345f33b13d120c236c');
      packageApi.done();
      done();
    });
  });

  Lab.it("raises an exception if 401 is returned", function(done) {
    var authenticateGithub = new AuthenticateGithub({
      githubHost: 'https://github.example.com',
      timestamp: function() {
        return 0;
      }
    });

    var packageApi = nock('https://github.example.com')
      .post('/api/v3/authorizations')
      .reply(401);

    authenticateGithub.getAuthorizationToken('bcoe-test', 'foobar').catch(function(err) {
      Lab.expect(err.code).to.eql(401);
      packageApi.done();
      done();
    }).done();
  });

  Lab.it("raises an exception if 500 is returned", function(done) {
    var authenticateGithub = new AuthenticateGithub({
      githubHost: 'https://github.example.com',
      timestamp: function() {
        return 0;
      }
    });

    var packageApi = nock('https://github.example.com')
      .post('/api/v3/authorizations')
      .reply(500);

    authenticateGithub.getAuthorizationToken('bcoe-test', 'foobar').catch(function(err) {
      Lab.expect(err.code).to.eql(500);
      done();
    }).done();
  });
});

Lab.experiment('authenticate', function() {
  Lab.it('executes callback with token, if successful', function(done) {
    var authenticateGithub = new AuthenticateGithub({
      githubHost: 'https://github.example.com',
      timestamp: function() {
        return 0;
      }
    });

    var packageApi = nock('https://github.example.com', {
        // we should populate the auth headers with appropriate
        // username and password.
        reqheaders: {
          'authorization': 'Basic YmNvZS10ZXN0OmZvb2Jhcg=='
        }
      })
      .post('/api/v3/authorizations', {
        scopes: ["user","public_repo","repo","repo:status","gist"],
        note: 'npm on premises solution (0)',
        note_url: 'https://www.npmjs.org'
      })
      .reply(200, fs.readFileSync('./test/fixtures/authenticate-success.json'));

    authenticateGithub.authenticate({
      body: {
        name: 'bcoe-test',
        password: 'foobar'
      }
    }, function(err, res) {
      Lab.expect(res.token).to.eql('cc84252fd8061b232beb5e345f33b13d120c236c');
      Lab.expect(res.user.name).to.eql('bcoe-test');
      // email should have a sane default, if we fail to look it up.
      Lab.expect(res.user.email).to.eql('npme@example.com');
      done();
    });
  });

  Lab.it('executes callback with error if GHE API fails to generate token', function(done) {
    var authenticateGithub = new AuthenticateGithub({
      githubHost: 'https://github.example.com',
      timestamp: function() {
        return 0;
      }
    });

    var packageApi = nock('https://github.example.com')
      .post('/api/v3/authorizations')
      .reply(401);

    authenticateGithub.authenticate({
      body: {
        name: 'bcoe-test',
        password: 'foobar'
      }
    }, function(err, resp) {
      Lab.expect(resp.message).to.eql('unauthorized');
      packageApi.done();
      done();
    });
  });

  Lab.it('executes callback with error if password is missing', function(done) {
    var authenticateGithub = new AuthenticateGithub({
      githubHost: 'https://github.example.com',
      timestamp: function() {
        return 0;
      }
    });

    authenticateGithub.authenticate({
      body: {
        name: 'bcoe-test',
      }
    }, function(err) {
      Lab.expect(err.message).to.eql('invalid credentials format');
      done();
    });
  });

  Lab.it('executes callback with error credentials are missing', function(done) {
    var authenticateGithub = new AuthenticateGithub({
      githubHost: 'https://github.example.com',
      timestamp: function() {
        return 0;
      }
    });

    authenticateGithub.authenticate(null, function(err) {
      Lab.expect(err.message).to.eql('invalid credentials format');
      done();
    });
  });

});
