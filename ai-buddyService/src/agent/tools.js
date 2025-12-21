const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const axios = require("axios");

// searchProduct tool created
const searchProduct = tool(
  async ({ query, token }) => {
    const response = await axios.get(
      `http://localhost:3001/api/product?q=${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return JSON.stringify(response.data);
  },
  {
    name: "searchProduct",
    description: "Search for Products based on Query",
    schema: z.object({
      query: z.string().describe("The Search Query for Products"),
    }),
  }
);

// addProductToCart tool created
const addProductToCart = tool(
  async ({ productId, qty = 1, token }) => {
    const response = await axios.post(
      `http://localhost:3002/api/cart/items`,
      {
        productId,
        qty,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return `Added Product with id ${productId}  (qty:${qty}) to cart`;
  },
  {
    name: "addProductToCart",
    description: "Add a product to Shoping Cart",
    schema: z.object({
      productId: z
        .string()
        .describe("The id of the Products to add to the cart"),
      qty: z
        .number()
        .describe("The quantity of the Product to add to the cart")
        .default(1),
    }),
  }
);

module.exports = { searchProduct, addProductToCart };
