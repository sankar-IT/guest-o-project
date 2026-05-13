import menuRepository from '../repositories/menuRepository.js';
import menuService from "../services/menuService.js";

// 1. Create a new menu item
export const createMenu = async (req, res) => {
  try {
    const menu = await menuService.createMenu(req.body);
    res.status(201).json({
      success: true,
      data: menu
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: "Error creating menu item",
      error: error.message 
    });
  }
};

// 2. Get all menu items with optional query filters
export const getMenus = async (req, res) => {
  try {
    const { category, page, limit, all, search } = req.query;

    if (all === 'true') {
      const menus = await menuService.getAllMenus();
      return res.status(200).json({
        success: true,
        data: menus
      });
    }

    let filter = {};
    if (category && category !== 'all') {
      if (category === "veg" || category === "non-veg") {
        filter.foodType = category;
      } else {
        filter.category = category;
      }
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const menus = await menuRepository.getAll(filter, skip, parseInt(limit));
      return res.status(200).json({
        success: true,
        data: menus
      });
    }

    const menus = await menuRepository.getAll(filter);
    res.status(200).json({
      success: true,
      data: menus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching menu items",
      error: error.message,
    });
  }
};

// 3. Get a single menu item by ID
export const getMenuById = async (req, res) => {
  try {
    const menu = await menuRepository.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ 
        success: false,
        message: 'Menu item not found' 
      });
    }
    res.status(200).json({
      success: true,
      data: menu
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching menu item",
      error: error.message 
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
