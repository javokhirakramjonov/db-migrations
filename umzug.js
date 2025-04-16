const {Client} = require('pg');

const client = new Client({
    database: 'test_db',
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    port: 5432,
});

async function getClient() {
    await client.connect();
    return client;
}

module.exports = {
    storage: 'sequelize', // Or 'json'
    storageOptions: {
        sequelize: {
            dialect: 'postgres',
            modelName: 'SequelizeMeta',
            define: {
                timestamps: true,
                freezeTableName: true,
            },
            dialectOptions: {
                connection: client,
            },
        },
        tableName: 'SequelizeMeta',
        columnName: 'name',
        timestamps: true,
        logging: false,
    },
    migrations: {
        glob: 'migrations/*.sql',
        resolve: ({name, path, context}) => {
            return {
                name,
                path,
                up: async () => {
                    try {
                        const client = await getClient();
                        await client.query(require('fs').readFileSync(path, 'utf8'));
                        await client.release();
                        console.log(`Executed migration: ${name}`);
                    } catch (error) {
                        console.error(`Error executing migration ${name}:`, error);
                        throw error;
                    }
                },
                down: async () => {
                    console.warn(`Rollback not implemented for SQL migration: ${name}`);
                },
            };
        },
    },
    context: {
        query: async (sql) => {
            const client = await getClient();
            const result = await client.query(sql);
            await client.release();
            return [result.rows, result];
        },
    },
    logger: console,
};