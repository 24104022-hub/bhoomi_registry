import { User } from "../models/User.js";

export async function getUsers(req, res) {
  const { role, search } = req.query;
  const filter = {};

  if (role && role !== "all") {
    filter.role = role;
  }

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { id: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filter).select("-password").sort({ createdAt: -1 });

  res.json({
    success: true,
    count: users.length,
    data: users,
  });
}

export async function getUserById(req, res) {
  const { id } = req.params;
  const user = await User.findOne({ id }).select("-password");

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  res.json({ success: true, data: user });
}

export async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role, isActive } = req.body;

  const update = {};
  if (role) update.role = role;
  if (isActive !== undefined) update.isActive = isActive;

  const user = await User.findOneAndUpdate({ id }, update, { new: true }).select("-password");

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  res.json({
    success: true,
    message: "User updated successfully.",
    data: user,
  });
}

export async function deleteUser(req, res) {
  const { id } = req.params;

  // Prevent deleting primary admin
  if (id === "U-5001" || (req.user && req.user.id === id)) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete the primary system administrator or your own account.",
    });
  }

  const user = await User.findOneAndDelete({ id });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  res.json({
    success: true,
    message: "User account deleted successfully.",
    data: { id },
  });
}
