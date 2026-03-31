const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
  // Force Node.js to accept self-signed certs (required for Aiven on Render)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
      connectTimeout: 60000, // 60 second connection timeout
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,  // 60s to acquire a connection
      idle: 10000,
    },
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        connectTimeout: 60000,
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000,
      },
    }
  );
}

module.exports = sequelize;
