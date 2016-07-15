import {
  Address,
  Item,
  ItemBatch,
  ItemCategory,
  ItemDepartment,
  ItemStoreJoin,
  MasterList,
  MasterListItem,
  MasterListNameJoin,
  Name,
  NameStoreJoin,
  Requisition,
  RequisitionItem,
  Setting,
  Stocktake,
  StocktakeBatch,
  StocktakeItem,
  SyncOut,
  Transaction,
  TransactionBatch,
  TransactionCategory,
  TransactionItem,
  User,
} from './DataTypes';

Address.schema = {
  name: 'Address',
  primaryKey: 'id',
  properties: {
    id: 'string',
    line1: { type: 'string', optional: true },
    line2: { type: 'string', optional: true },
    line3: { type: 'string', optional: true },
    line4: { type: 'string', optional: true },
    zipCode: { type: 'string', optional: true },
  },
};

ItemCategory.schema = {
  name: 'ItemCategory',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    parentCategory: { type: 'ItemCategory', optional: true },
  },
};

ItemDepartment.schema = {
  name: 'ItemDepartment',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    parentDepartment: { type: 'ItemDepartment', optional: true },
  },
};

Setting.schema = {
  name: 'Setting',
  primaryKey: 'key',
  properties: {
    key: 'string', // Includes the user's UUID if it is per-user
    value: 'string',
    user: { type: 'User', optional: true },
  },
};

SyncOut.schema = {
  name: 'SyncOut',
  primaryKey: 'id',
  properties: {
    id: 'string',
    changeTime: 'int', // In seconds since the epoch
    changeType: 'string', // create, update, or delete
    recordType: 'string', // i.e. Table name
    recordId: 'string',
  },
};


TransactionCategory.schema = {
  name: 'TransactionCategory',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    code: 'string',
    type: 'string',
    parentCategory: { type: 'TransactionCategory', optional: true },
  },
};

User.schema = {
  name: 'User',
  primaryKey: 'id',
  properties: {
    id: 'string',
    username: 'string',
    lastLogin: { type: 'date', optional: true },
    firstName: { type: 'string', optional: true },
    lastName: { type: 'string', optional: true },
    email: { type: 'string', optional: true },
    passwordHash: 'string',
    salt: { type: 'string', optional: true },
  },
};

export const schema =
  {
    schema: [
      Address,
      Item,
      ItemBatch,
      ItemDepartment,
      ItemCategory,
      ItemStoreJoin,
      Transaction,
      TransactionItem,
      TransactionBatch,
      TransactionCategory,
      MasterList,
      MasterListItem,
      MasterListNameJoin,
      Name,
      NameStoreJoin,
      Requisition,
      RequisitionItem,
      Setting,
      SyncOut,
      Stocktake,
      StocktakeItem,
      StocktakeBatch,
      User,
    ],
    schemaVersion: 1,
  };
