const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  syncRemindersForUser,
  listRemindersForUser,
  dismissReminder,
} = require("./reminder.service");

const listReminders = asyncHandler(async (req, res) => {
  await syncRemindersForUser(req.user.id, req.user.role);
  const items = await listRemindersForUser(req.user.id);
  sendSuccess(res, { items }, "Reminders retrieved");
});

const dismissReminderHandler = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid reminder id", 400, "INVALID_ID"));
    return;
  }

  const reminder = await dismissReminder(req.user.id, id);
  if (!reminder) {
    next(new AppError("Reminder not found", 404, "NOT_FOUND"));
    return;
  }

  sendSuccess(res, { reminder }, "Reminder dismissed");
});

module.exports = { listReminders, dismissReminderHandler };
