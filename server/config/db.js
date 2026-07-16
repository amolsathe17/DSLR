const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isMockMode = false;
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dslr-photography';
  try {
    mongoose.set('strictQuery', false);
    const timeout = process.env.NODE_ENV === 'production' ? 15000 : 2000;
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: timeout
    });
    console.log('MongoDB connected successfully');
    isMockMode = false;
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to local JSON database mode:', error.message);
    isMockMode = true;
  }
};

const getMockModel = (modelName, schema) => {
  const filePath = path.join(DATA_DIR, `${modelName.toLowerCase()}s.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }

  const readData = () => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      return [];
    }
  };

  const writeData = (data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  };

  const matchFilter = (item, filter) => {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const key in filter) {
      const filterVal = filter[key];
      const itemVal = item[key];

      if (key === '$or') {
        if (!Array.isArray(filterVal)) return false;
        return filterVal.some(f => matchFilter(item, f));
      }

      if (filterVal && typeof filterVal === 'object') {
        if ('$in' in filterVal) {
          if (!Array.isArray(filterVal.$in)) return false;
          if (!filterVal.$in.includes(itemVal)) return false;
        } else if ('$gte' in filterVal) {
          if (!(itemVal >= filterVal.$gte)) return false;
        } else if ('$lte' in filterVal) {
          if (!(itemVal <= filterVal.$lte)) return false;
        } else if ('$regex' in filterVal) {
          const flags = filterVal.$options || 'i';
          const reg = new RegExp(filterVal.$regex, flags);
          if (!reg.test(itemVal || '')) return false;
        } else if ('$ne' in filterVal) {
          if (itemVal === filterVal.$ne) return false;
        }
      } else {
        if (itemVal !== filterVal) return false;
      }
    }
    return true;
  };

  class MockModel {
    constructor(data) {
      Object.assign(this, data);
      if (!this._id) {
        this._id = Math.random().toString(36).substring(2, 11) + Date.now().toString().slice(-4);
      }
      if (!this.createdAt) {
        this.createdAt = new Date().toISOString();
      }
      this.updatedAt = new Date().toISOString();
    }

    async save() {
      const items = readData();
      const index = items.findIndex(i => i._id === this._id);
      this.updatedAt = new Date().toISOString();
      
      const plainObj = JSON.parse(JSON.stringify(this));

      if (index >= 0) {
        items[index] = plainObj;
      } else {
        items.push(plainObj);
      }
      writeData(items);
      return this;
    }

    static find(filter = {}) {
      const items = readData();
      let filtered = items.filter(i => matchFilter(i, filter));
      
      const chain = {
        sort: (sortObj) => {
          filtered.sort((a, b) => {
            for (const key in sortObj) {
              const order = sortObj[key];
              const valA = a[key];
              const valB = b[key];
              if (valA < valB) return order === 1 ? -1 : 1;
              if (valA > valB) return order === 1 ? 1 : -1;
            }
            return 0;
          });
          return chain;
        },
        limit: (n) => {
          filtered = filtered.slice(0, n);
          return chain;
        },
        skip: (n) => {
          filtered = filtered.slice(n);
          return chain;
        },
        exec: async () => filtered.map(i => new MockModel(i)),
        then: function(onresolve, onreject) {
          return Promise.resolve(filtered.map(i => new MockModel(i))).then(onresolve, onreject);
        }
      };
      return chain;
    }

    static async findOne(filter = {}) {
      const items = readData();
      const found = items.find(i => matchFilter(i, filter));
      return found ? new MockModel(found) : null;
    }

    static async findById(id) {
      return this.findOne({ _id: id });
    }

    static async create(data) {
      const doc = new MockModel(data);
      await doc.save();
      return doc;
    }

    static async findByIdAndUpdate(id, update, options = { new: true }) {
      const items = readData();
      const index = items.findIndex(i => i._id === id);
      if (index === -1) return null;
      
      let updatedData = { ...items[index] };
      if (update.$set) {
        updatedData = { ...updatedData, ...update.$set };
      } else if (update.$push) {
        for (const key in update.$push) {
          if (!updatedData[key]) updatedData[key] = [];
          updatedData[key].push(update.$push[key]);
        }
      } else {
        updatedData = { ...updatedData, ...update };
      }
      
      updatedData.updatedAt = new Date().toISOString();
      items[index] = updatedData;
      writeData(items);
      return new MockModel(updatedData);
    }

    static async updateOne(filter, update) {
      const items = readData();
      const index = items.findIndex(i => matchFilter(i, filter));
      if (index === -1) return { nModified: 0 };
      
      let updatedData = { ...items[index] };
      if (update.$set) {
        updatedData = { ...updatedData, ...update.$set };
      } else {
        updatedData = { ...updatedData, ...update };
      }
      updatedData.updatedAt = new Date().toISOString();
      items[index] = updatedData;
      writeData(items);
      return { nModified: 1 };
    }

    static async deleteOne(filter) {
      const items = readData();
      const index = items.findIndex(i => matchFilter(i, filter));
      if (index === -1) return { deletedCount: 0 };
      items.splice(index, 1);
      writeData(items);
      return { deletedCount: 1 };
    }

    static async deleteMany(filter) {
      const items = readData();
      const initialCount = items.length;
      const remaining = items.filter(i => !matchFilter(i, filter));
      writeData(remaining);
      return { deletedCount: initialCount - remaining.length };
    }

    static async countDocuments(filter = {}) {
      const items = readData();
      return items.filter(i => matchFilter(i, filter)).length;
    }
  }

  return MockModel;
};

// Dynamic proxy model selector
const getModel = (modelName, schema) => {
  let cachedMongooseModel = null;
  let cachedMockModel = null;

  const getTargetModel = () => {
    if (isMockMode) {
      if (!cachedMockModel) {
        cachedMockModel = getMockModel(modelName, schema);
      }
      return cachedMockModel;
    } else {
      if (!cachedMongooseModel) {
        try {
          cachedMongooseModel = mongoose.model(modelName);
        } catch (e) {
          cachedMongooseModel = mongoose.model(modelName, schema);
        }
      }
      return cachedMongooseModel;
    }
  };

  return new Proxy(function() {}, {
    construct(target, argumentsList) {
      const Target = getTargetModel();
      return new Target(...argumentsList);
    },
    get(target, prop) {
      const Target = getTargetModel();
      const value = Target[prop];
      if (typeof value === 'function') {
        return value.bind(Target);
      }
      return value;
    },
    set(target, prop, value) {
      const Target = getTargetModel();
      Target[prop] = value;
      return true;
    }
  });
};

module.exports = {
  connectDB,
  getModel,
  checkMockMode: () => isMockMode
};
