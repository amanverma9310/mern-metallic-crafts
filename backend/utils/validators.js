import mongoose from "mongoose";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) =>
  typeof email === "string" && EMAIL_REGEX.test(email.trim());

export const isValidPassword = (password) =>
  typeof password === "string" && password.length >= 6;

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;
