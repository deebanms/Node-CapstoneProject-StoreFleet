import ProductModel from "./product.schema.js";

export const addNewProductRepo = async (product) => {
  return await new ProductModel(product).save();
};

export const getAllProductsRepo = async (
  filters = {},
  page = 1,
  limit = 10,
  sort = "-createdAt"
) => {
  page = Math.max(Number(page), 1);
  limit = Math.max(Number(limit), 1);

  // Dynamic filter object
  const filter = {};

  // 1. Keyword search (indexed search on "name" and "description")
  if (filters.keyword) {
    const regex = new RegExp(filters.keyword, "i"); // case-insensitive regex
    filter.$or = [{ name: regex }, { description: regex }];
  }

  // 2. Category filter
  if (filters.category) {
    filter.category = filters.category;
  }

  // 3. Price range filter
  if (filters.price) {
    filter.price = {};
    if (filters.price.gte) filter.price.$gte = Number(filters.price.gte);
    if (filters.price.lte) filter.price.$lte = Number(filters.price.lte);
  }

  // 4. Rating filter
  if (filters.rating) {
    filter.rating = {};
    if (filters.rating.gte) filter.rating.$gte = Number(filters.rating.gte);
    if (filters.rating.lte) filter.rating.$lte = Number(filters.rating.lte);
  }

  // 5. Pagination logic
  const skip = (page - 1) * limit;

  const [result] = await ProductModel.aggregate([
    { $match: filter },
    {
      $facet: {
        products: [
          { $sort: { [sort]: 1 } }, // Dynamic sorting
          { $skip: skip }, // Pagination skip
          { $limit: limit }, // Pagination limit
        ],
        totalProducts: [{ $count: "total" }], // Total count of matching products
      },
    },
  ]);

  const products = result.products || [];
  const totalProducts = result.totalProducts[0]?.total || 0;
  const totalPages = Math.ceil(totalProducts / limit);

  return {
    products,
    totalProducts,
    totalPages,
    currentPage: page,
  };
};

export const updateProductRepo = async (_id, updatedData) => {
  return await ProductModel.findByIdAndUpdate(_id, updatedData, {
    new: true,
    runValidators: true,
    useFindAndModify: true,
  });
};

export const deleProductRepo = async (_id) => {
  return await ProductModel.findByIdAndDelete(_id);
};

export const getProductDetailsRepo = async (_id) => {
  return await ProductModel.findById(_id);
};

export const getTotalCountsOfProduct = async () => {
  return await ProductModel.countDocuments();
};

export const findProductRepo = async (productId) => {
  return await ProductModel.findById(productId);
};
