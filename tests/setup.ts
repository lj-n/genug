import { execSync } from 'child_process';
import { unlinkSync } from 'fs';

let teardownHappened = false;

export default function () {
	execSync('sqlite3 database/test.db < database/0000_light_orphan.sql');
	execSync('sqlite3 database/test.db < database/9999_mock_data.sql');

	return () => {
		if (teardownHappened) throw new Error('teardown called twice');
		teardownHappened = true;
		unlinkSync('database/test.db');
	};
}
