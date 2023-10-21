import * as relations from './relations';
import * as tables from './tables';

const schema = { ...relations, ...tables };

export { schema };
