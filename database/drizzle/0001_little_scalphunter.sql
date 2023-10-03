CREATE TABLE `team_role` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text(255) CHECK( type in ('OWNER', 'MEMBER', 'INVITED') ) NOT NULL,
	`description` text(255) NOT NULL
);
INSERT INTO team_role VALUES(1, 'OWNER', 'Owner of the team');
INSERT INTO team_role VALUES(2, 'MEMBER', 'Member of the team');
INSERT INTO team_role VALUES(3, 'INVITED', 'Invited to the team');