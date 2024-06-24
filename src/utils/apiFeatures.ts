// eslint-disable-next-line import/prefer-default-export
export class APIFeatures {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryString: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(query: any, queryString: any) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(): APIFeatures {
    const queryObj: { [key: string]: unknown } = {
      ...(this.queryString as object),
    };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((field) => delete queryObj[field]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort(): APIFeatures {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields(): APIFeatures {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination(): APIFeatures {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
