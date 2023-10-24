-- create test user (password: "user")
INSERT INTO user VALUES('pjruqhtcfxxbaqu','test@user.de',1,'Test User');
INSERT INTO user_key VALUES('email:test@user.de','pjruqhtcfxxbaqu','s2:c9zg1t3roobtins6:be1acf3b1765e7211ed041ae3fe82f3f25da8bf50d3187f66d64b25493661ec3c840159d089d27a5bdf1894d403df73583571d1831dd73052762152495704415');

-- create test team
INSERT INTO team VALUES(1, 'Test Team', 'Test Team Description', CURRENT_DATE);
INSERT INTO team_user VALUES('pjruqhtcfxxbaqu', 1, 'OWNER');

-- create test user account
INSERT INTO user_account VALUES(1, 'pjruqhtcfxxbaqu', 'Test Account', 'Test Account Description', 200, 0, 200, CURRENT_DATE);
INSERT INTO user_account VALUES(2, 'pjruqhtcfxxbaqu', 'Test Secondary Account', 'Test Secondary Account Description', 0, 0, 0, CURRENT_DATE);

-- create test user category
INSERT INTO user_category VALUES(1, 'pjruqhtcfxxbaqu', 'Test Category', 'Test Category Description', CURRENT_DATE, null, 0);
INSERT INTO user_category VALUES(2, 'pjruqhtcfxxbaqu', 'Test Secondary Category', 'Test Secondary Category Description', CURRENT_DATE, null, 0);

-- create test user transaction
INSERT INTO user_transaction VALUES(1, 'pjruqhtcfxxbaqu', null, 1, 'Test Transaction Description', CURRENT_DATE, CURRENT_TIMESTAMP, 1000, 1);
INSERT INTO user_transaction VALUES(2, 'pjruqhtcfxxbaqu', 1, 1, 'Test Transaction2 Description', CURRENT_DATE, CURRENT_TIMESTAMP, -800, 1);