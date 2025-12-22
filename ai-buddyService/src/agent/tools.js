const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const axios = require("axios");

const searchProduct = tool(
  async ({ query, token }) => {
    try {
      console.log("🔍 Searching for:", query);

      const response = await axios.get(
        `http://localhost:3001/api/product?q=${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let rawData = [];
      if (Array.isArray(response.data)) {
        rawData = response.data;
      } else if (response.data && Array.isArray(response.data.products)) {
        rawData = response.data.products;
      } else if (response.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      }

      const products = rawData.slice(0, 3).map((p) => ({
        id: p.id || p._id,
        name: p.name,
        price: p.price,
        description: p.description ? p.description.substring(0, 50) : "",
      }));

      if (products.length === 0) {
        console.log("Empty results from API for:", query);
        return "No products found.";
      }

      return JSON.stringify(products);
    } catch (error) {
      console.error("Search Tool Error:", error.message);
      return "Error searching products.";
    }
  },
  {
    name: "searchProduct",
    description:
      "Search for products by name or category. Use this when the user asks for items.",
    schema: z.object({
      query: z.string().describe("The search query for products"),
    }),
  }
);

const addProductToCart = tool(
  async ({ productId, quantity = 1, token }) => {
    try {
      // Yahan quantity check karein
      console.log("🛒 Adding to cart:", { productId, quantity });

      const response = await axios.post(
        `http://localhost:3002/api/cart/items`,
        {
          productId: productId,
          quantity: quantity, // Dono fields backend ke mutabiq
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return `Success: Added ${quantity} units of product ID ${productId} to your cart.`;
    } catch (error) {
      const errorDetail = error.response?.data || error.message;
      console.error("Cart Tool Error Detail:", errorDetail);
      return `Failed to add product to cart.`;
    }
  },
  {
    name: "addProductToCart",
    description:
      "Add a specific product to the user's shopping cart using productId and quantity.",
    schema: z.object({
      productId: z.string().describe("The unique ID of the product"),
      quantity: z.number().describe("The number of items to add").default(1),
    }),
  }
);

module.exports = { searchProduct, addProductToCart };
