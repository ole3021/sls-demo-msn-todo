"use strict";
const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.PG_CONNECT_STRING,
});

/**
 * 初始化数据ku
 */
const initDB = async () => {
  const isConnected = client && client._connected;

  if (!isConnected) {
    await client.connect();

    await client.query(`
    CREATE TABLE IF NOT EXISTS todo (
      ID              SERIAL          NOT NULL,
      TITLE           VARCHAR         NOT NULL,
      NOTE            TEXT,
      IS_COMPLETE     BOOLEAN         DEFAULT FALSE
    );`);
  }
};

/**
 * 获取所有Todo事项
 */
exports.all = async (event, context) => {
  await initDB();

  const { rows } = await client.query({ text: "SELECT * FROM todo" });

  return {
    message: "Tencent SCF execute successful!",
    data: rows,
  };
};

/**
 * 添加新的Todo事项
 */
exports.add = async (event, context) => {
  const { title, note } = JSON.parse(event.body);
  if (!title) {
    return {
      statusCode: 400,
      message: "Missing Todo Title",
    };
  }

  await initDB();
  const { rowCount } = await client.query({
    text: "INSERT INTO todo (title, note) VALUES($1, $2)",
    values: [title, note],
  });

  return rowCount === 1
    ? {
        statusCode: 201,
        message: "Todo added success.",
      }
    : {
        statusCode: 400,
        message: "Todo added failed.",
      };
};

/**
 * 完成指定Todo事项
 */
exports.comp = async (event, context) => {
  const todoId = event.pathParameters.id;

  if (!todoId && !isNaN(todoId)) {
    return {
      statusCode: 400,
      message: "Missing Todo Id",
    };
  }

  await initDB();
  const { rowCount } = await client.query({
    text: "UPDATE todo SET is_complete = true WHERE id=$1",
    values: [todoId],
  });

  return rowCount === 1
    ? {
        statusCode: 200,
        message: "Todo Complete success.",
      }
    : {
        statusCode: 400,
        message: "Todo Complete failed.",
      };
};
