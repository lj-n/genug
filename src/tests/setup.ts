import { execSync } from 'child_process';
import { unlinkSync } from 'fs';

let teardown = false;

export default async function () {
	execSync('sqlite3 database/test.db < database/0000_curved_jack_flag.sql');
	execSync('sqlite3 database/test.db < database/9999_testing_data.sql');

	return async () => {
		if (teardown) throw new Error('teardown called twice');
		teardown = true;

		unlinkSync('database/test.db');
	};
}
