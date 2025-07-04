class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search() {
        let keyword = this.queryStr.keyword
            ? {
                  name: {
                      $regex: this.queryStr.keyword,
                      $options: 'i'
                  }
              }
            : {};

        this.query = this.query.find({ ...keyword });
        return this;
    }

    filter() {
        const queryStrCopy = { ...this.queryStr };
        const removeFields = ['keyword', 'limit', 'page'];
        removeFields.forEach(field => delete queryStrCopy[field]);

        const mongoQuery = {};
        for (let key in queryStrCopy) {
            if (key.includes('_gte')) {
                const field = key.split('_gte')[0];
                if (!mongoQuery[field]) mongoQuery[field] = {};
                mongoQuery[field]['$gte'] = Number(queryStrCopy[key]);
            } else if (key.includes('_lte')) {
                const field = key.split('_lte')[0];
                if (!mongoQuery[field]) mongoQuery[field] = {};
                mongoQuery[field]['$lte'] = Number(queryStrCopy[key]);
            } else {
                mongoQuery[key] = queryStrCopy[key];
            }
        }

        this.query = this.query.find(mongoQuery);
        return this;
    }

    paginate(resPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resPerPage * (currentPage - 1);
        this.query = this.query.limit(resPerPage).skip(skip);
        return this;
    }
}

module.exports = APIFeatures;
