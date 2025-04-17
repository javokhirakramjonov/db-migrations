import {Sequelize} from 'sequelize';
import {SequelizeStorage, Umzug} from 'umzug';
import fs from 'fs/promises';

let migrationsPath = process.env.MIGRATIONS_PATH;

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

const MIGRATION_EXTENSIONS = {
    UP: '-up.sql',
    DOWN: '-down.sql',
};

const readFileContent = async (filePath) => {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file: ${filePath}`, error);
        throw error;
    }
};

const executeQuery = async (query, name) => {
    try {
        await sequelize.query(query);
        console.log(`Successfully executed migration: ${name}`);
    } catch (error) {
        console.error(`Error executing migration: ${name}`, error);
        throw error;
    }
};

export const umzug = new Umzug({
    migrations: {
        glob: `${migrationsPath}/*${MIGRATION_EXTENSIONS.UP}`,
        resolve: ({name, path: upPath}) => {
            const downPath = upPath.replace(MIGRATION_EXTENSIONS.UP, MIGRATION_EXTENSIONS.DOWN);

            return {
                name,
                up: async () => {
                    const sql = await readFileContent(upPath);
                    await executeQuery(sql, name);
                },
                down: async () => {
                    const sql = await readFileContent(downPath);
                    await executeQuery(sql, name);
                },
            };
        },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({sequelize}),
    logger: console,
});