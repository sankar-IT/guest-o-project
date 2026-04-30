import menuRepository from "../repositories/menuRepository.js";

// 1. Get all menu items with optional query filters
export const getMenus = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category) {
      if (category === "veg" || category === "non-veg") {
        query.foodType = category;
      } else {
        query.category = category;
      }
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const menuItems = await menuRepository.findAll(query);

    res.status(200).json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching menu items",
      error: error.message,
    });
  }
};

// 2. Get a single menu item by ID
export const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await menuRepository.findById(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching menu item",
      error: error.message,
    });
  }
};

// 3. Create a new menu item
export const createMenu = async (req, res) => {
  try {
    const newMenu = await menuRepository.create(req.body);
    res.status(201).json({
      success: true,
      data: newMenu,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating menu item",
      error: error.message,
    });
  }
};

// 4. Update a menu item
export const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMenu = await menuRepository.update(id, req.body);

    if (!updatedMenu) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedMenu,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating menu item",
      error: error.message,
    });
  }
};

// 5. Delete a menu item
export const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMenu = await menuRepository.delete(id);

    if (!deletedMenu) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting menu item",
      error: error.message,
    });
  }
};
